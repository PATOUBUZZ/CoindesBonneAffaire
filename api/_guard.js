/* Garde-fou commun aux fonctions /api (le préfixe "_" => jamais exposé comme route).
   - accepte uniquement POST
   - n'accepte que les requêtes venant d'un navigateur sur VOTRE site
     (en-tête Origin/Referer = même domaine, ou domaines listés dans ALLOWED_ORIGINS)
   Limite : un script qui falsifie l'en-tête Origin passe ce contrôle. Il bloque
   l'usage depuis d'autres sites web, pas un attaquant déterminé : activez en plus
   le "Rate Limiting" du Firewall Vercel (voir le guide). */
function hostOf(value) {
  try { return new URL(value).host.toLowerCase(); } catch (e) { return ''; }
}

function allowedHosts(req) {
  var hosts = [String(req.headers.host || '').toLowerCase()];
  String(process.env.ALLOWED_ORIGINS || '').split(',').forEach(function (o) {
    var h = hostOf(o.trim()) || o.trim().toLowerCase();
    if (h) hosts.push(h);
  });
  return hosts.filter(Boolean);
}

function guard(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
    return false;
  }
  var origin = hostOf(req.headers.origin) || hostOf(req.headers.referer);
  if (!origin || allowedHosts(req).indexOf(origin) === -1) {
    res.status(403).json({ ok: false, error: 'Origine non autorisée' });
    return false;
  }
  return true;
}

function clip(v, max) {
  return String(v == null ? '' : v).slice(0, max);
}

module.exports = { guard: guard, clip: clip };
