/* POST /api/send-push — envoie une notification push à tous les abonnés ciblés.
   Appelée automatiquement par un "Database Webhook" Supabase (INSERT sur la table
   push_notifications), ou à la main avec curl. Protégée par un secret.

   Variables d'environnement Vercel (toutes SECRÈTES, jamais dans le navigateur) :
     VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (ex. mailto:vous@email.com)
     SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
     PUSH_WEBHOOK_SECRET  (mot de passe long de votre choix) */
var crypto = require('crypto');
var webpush = require('web-push');

function env(name) { return process.env[name] || ''; }

function safeEqual(a, b) {
  var x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function cleanUrl(u) {
  var s = String(u == null ? '' : u).trim();
  return /^(https?:\/\/|\/)/i.test(s) ? s : '/';
}
function cleanImg(u) {
  var s = String(u == null ? '' : u).trim();
  return /^https:\/\//i.test(s) ? s : undefined;     // les images doivent être en HTTPS
}

async function sb(path, opts) {
  var base = env('SUPABASE_URL').replace(/\/+$/, '');
  var key = env('SUPABASE_SERVICE_ROLE_KEY');
  var headers = Object.assign({ apikey: key, Authorization: 'Bearer ' + key }, (opts && opts.headers) || {});
  var r = await fetch(base + '/rest/v1/' + path, Object.assign({}, opts, { headers: headers }));
  if (!r.ok) throw new Error('Supabase ' + r.status + ' sur ' + path.split('?')[0]);
  var t = await r.text();
  return t ? JSON.parse(t) : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  // 1) Authentification par secret
  var auth = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  var secret = env('PUSH_WEBHOOK_SECRET');
  if (!secret || !safeEqual(auth, secret)) return res.status(401).json({ ok: false, error: 'Non autorisé' });

  if (!env('VAPID_PUBLIC_KEY') || !env('VAPID_PRIVATE_KEY') || !env('SUPABASE_URL') || !env('SUPABASE_SERVICE_ROLE_KEY')) {
    return res.status(500).json({ ok: false, error: 'Variables d\'environnement manquantes' });
  }
  webpush.setVapidDetails(env('VAPID_SUBJECT') || 'mailto:admin@example.com', env('VAPID_PUBLIC_KEY'), env('VAPID_PRIVATE_KEY'));

  try {
    // 2) Quelle notification ? (format webhook Supabase { record: {...} } ou { id })
    var body = req.body || {};
    var id = String((body.record && body.record.id) || body.id || '');
    if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ ok: false, error: 'id invalide' });

    // 3) "Réserve" la notification (évite un double envoi si le webhook est rejoué)
    var claimed = await sb('push_notifications?id=eq.' + id + '&sent_at=is.null&select=*', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ sent_at: new Date().toISOString() })
    });
    if (!claimed || !claimed.length) return res.status(200).json({ ok: true, skipped: 'déjà envoyée ou introuvable' });
    var n = claimed[0];

    var payload = JSON.stringify({
      title: String(n.title || 'Le Coin des Bonnes Affaires').slice(0, 120),
      body: String(n.body || '').slice(0, 300),
      icon: cleanImg(n.image_url),        // petite image (style Alibaba)
      image: cleanImg(n.banner_url),      // grande bannière (facultatif)
      url: cleanUrl(n.link),              // page ouverte au clic
      tag: 'n-' + id
    });

    // 4) Abonnés ciblés (all / users / vendors), par pages de 1000
    var roleFilter = n.target === 'vendors' ? '&role=eq.vendor' : (n.target === 'users' ? '&role=eq.user' : '');
    var subs = [], offset = 0, page;
    do {
      page = await sb('push_subscriptions?select=id,endpoint,p256dh,auth' + roleFilter + '&order=id.asc&limit=1000&offset=' + offset);
      subs = subs.concat(page || []);
      offset += 1000;
    } while (page && page.length === 1000);

    // 5) Envoi par lots de 50
    var sent = 0, failed = 0, dead = [];
    for (var i = 0; i < subs.length; i += 50) {
      var batch = subs.slice(i, i + 50);
      var results = await Promise.allSettled(batch.map(function (s) {
        return webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { TTL: 60 * 60 * 24 }
        );
      }));
      results.forEach(function (r, k) {
        if (r.status === 'fulfilled') sent++;
        else {
          failed++;
          var code = r.reason && r.reason.statusCode;
          if (code === 404 || code === 410) dead.push(batch[k].id);   // abonnement expiré
        }
      });
    }

    // 6) Nettoyage des abonnements expirés + compte rendu
    for (var d = 0; d < dead.length; d += 100) {
      await sb('push_subscriptions?id=in.(' + dead.slice(d, d + 100).join(',') + ')', { method: 'DELETE' });
    }
    await sb('push_notifications?id=eq.' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sent_count: sent, failed_count: failed })
    });

    return res.status(200).json({ ok: true, sent: sent, failed: failed, removed: dead.length });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e && e.message || e) });
  }
};
