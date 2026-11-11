/* POST /api/send-push — envoie une notification push à tous les abonnés ciblés.
   Appelée automatiquement par un "Database Webhook" Supabase (INSERT sur la table
   push_notifications), ou à la main avec curl. Protégée par un secret.

   Variables d'environnement Vercel (toutes SECRÈTES, jamais dans le navigateur) :
     VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (ex. mailto:vous@email.com)
     SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
     PUSH_WEBHOOK_SECRET  (mot de passe long de votre choix) */
var crypto = require('crypto');
var webpush = require('web-push');

// Lit une variable Vercel en retirant les espaces / retours à la ligne et les guillemets souvent collés par erreur
// (une clé VAPID entourée de guillemets ou suivie d'un espace casse silencieusement l'envoi).
function env(name) { return String(process.env[name] || '').trim().replace(/^["']+|["']+$/g, '').trim(); }

function safeEqual(a, b) {
  var x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Reconstruit la clé PUBLIQUE à partir de la clé PRIVÉE (même courbe P-256 que Web Push).
// Sert à détecter une paire VAPID incohérente (ex. clé publique d'une génération, clé privée d'une autre) :
// dans ce cas Chrome/Firefox refusent TOUS les envois (erreur 403) alors que l'abonnement s'enregistre normalement.
function b64urlToBuf(b) {
  var s = String(b || '').trim().replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}
function bufToB64url(b) {
  return Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function vapidDiagnostic() {
  var pub = env('VAPID_PUBLIC_KEY'), priv = env('VAPID_PRIVATE_KEY');
  try {
    var ecdh = crypto.createECDH('prime256v1');
    ecdh.setPrivateKey(b64urlToBuf(priv));
    var derived = bufToB64url(ecdh.getPublicKey());
    return { ok: derived === pub, derived: derived, message: derived === pub ? '' :
      'VAPID_PUBLIC_KEY ne correspond pas à VAPID_PRIVATE_KEY : régénérez la paire (npx web-push generate-vapid-keys) et mettez À JOUR LES DEUX dans Vercel, plus la clé publique dans config.js.' };
  } catch (e) {
    return { ok: false, derived: '', message: 'VAPID_PRIVATE_KEY illisible (copiée avec un espace, des guillemets ou incomplète ?).' };
  }
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
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false });
  }

  // 1) Authentification par secret
  var rawAuth = String(req.headers.authorization || '');
  var auth = rawAuth.replace(/^Bearer\s+/i, '').trim();
  var secret = env('PUSH_WEBHOOK_SECRET');
  if (!secret || !safeEqual(auth, secret)) {
    // Indice de diagnostic (aucune information sensible) : permet de distinguer « secret différent » de
    // « en-tête perdu » (cas typique d'une redirection de domaine : l'en-tête Authorization est retiré).
    var hint = !secret ? 'PUSH_WEBHOOK_SECRET absent dans Vercel (ou projet non redéployé après son ajout)'
      : (!rawAuth ? 'en-tête Authorization absent (redirection de domaine ? utilisez l\'adresse finale du site)'
      : 'le secret envoyé est différent de PUSH_WEBHOOK_SECRET');
    console.error('[send-push] 401 : ' + hint);
    return res.status(401).json({ ok: false, error: 'Non autorisé', hint: hint });
  }

  // Contrôle de santé (GET + secret) : vérifie la paire VAPID et compte les abonnés, sans rien envoyer.
  if (req.method === 'GET') {
    var diag = vapidDiagnostic();
    var out = { ok: diag.ok, vapid_ok: diag.ok, vapid_public_key: diag.derived, message: diag.message || 'Configuration VAPID cohérente.' };
    try {
      var rows = await sb('push_subscriptions?select=role&limit=10000');
      out.abonnes = { total: rows.length, user: rows.filter(function (r) { return r.role === 'user'; }).length, vendor: rows.filter(function (r) { return r.role === 'vendor'; }).length };
    } catch (e) { out.abonnes = 'lecture impossible : ' + String(e.message || e); }
    return res.status(200).json(out);
  }

  if (!env('VAPID_PUBLIC_KEY') || !env('VAPID_PRIVATE_KEY') || !env('SUPABASE_URL') || !env('SUPABASE_SERVICE_ROLE_KEY')) {
    return res.status(500).json({ ok: false, error: 'Variables d\'environnement manquantes' });
  }
  var vd = vapidDiagnostic();
  if (!vd.ok) {
    console.error('[send-push] ' + vd.message);
    return res.status(500).json({ ok: false, error: vd.message });
  }
  // (env() retire déjà espaces, retours à la ligne et guillemets : ils suffisent à faire échouer la signature)
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
      title: String(n.title || 'Nya-Market').slice(0, 120),
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
    var sent = 0, failed = 0, dead = [], errSample = {};
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
          // Garde un exemple d'erreur par code (visible dans la réponse et dans les logs Vercel)
          var key = String(code || 'réseau');
          if (!errSample[key]) errSample[key] = String((r.reason && (r.reason.body || r.reason.message)) || '').slice(0, 200);
        }
      });
    }

    // 6) Nettoyage des abonnements expirés + compte rendu
    for (var d = 0; d < dead.length; d += 100) {
      await sb('push_subscriptions?id=in.(' + dead.slice(d, d + 100).join(',') + ')', { method: 'DELETE' });
    }
    // Si RIEN n'est parti alors qu'il y avait des abonnés visés, on « libère » la notification
    // (sent_at remis à vide) pour pouvoir la renvoyer après correction, au lieu de la bloquer à jamais.
    var nothingSent = sent === 0 && failed > 0;
    await sb('push_notifications?id=eq.' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nothingSent ? { sent_at: null, sent_count: 0, failed_count: failed }
                                       : { sent_count: sent, failed_count: failed })
    });
    if (failed) console.error('[send-push] échecs : ' + JSON.stringify(errSample));

    return res.status(200).json({ ok: true, sent: sent, failed: failed, removed: dead.length,
      subscribers: subs.length, errors: failed ? errSample : undefined,
      released: nothingSent ? 'aucun envoi réussi : notification libérée, renvoyable' : undefined });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e && e.message || e) });
  }
};
