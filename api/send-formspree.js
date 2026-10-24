/* POST /api/send-formspree   body: { statut, nom, telephone, adresse, vendeurs, produits, total }
   Variable d'environnement Vercel : FORMSPREE_URL  (ex. https://formspree.io/f/xxxxxxxx) */
var g = require('./_guard');

var FIELDS = { statut: 200, nom: 200, telephone: 60, adresse: 500, vendeurs: 500, produits: 4000, total: 60 };

module.exports = async function handler(req, res) {
  if (!g.guard(req, res)) return;

  var url = process.env.FORMSPREE_URL;
  if (!url) return res.status(500).json({ ok: false, error: 'Formspree non configuré côté serveur' });

  var body = req.body || {};
  var clean = {};
  Object.keys(FIELDS).forEach(function (k) { clean[k] = g.clip(body[k], FIELDS[k]); });   // champs connus uniquement
  if (!clean.nom && !clean.telephone) return res.status(400).json({ ok: false, error: 'Données manquantes' });

  try {
    var r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(clean)
    });
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
  } catch (e) {
    return res.status(502).json({ ok: false });
  }
};
