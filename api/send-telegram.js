/* POST /api/send-telegram   body: { "text": "..." }
   Variables d'environnement Vercel : TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID */
var g = require('./_guard');

module.exports = async function handler(req, res) {
  if (!g.guard(req, res)) return;

  var token = process.env.TELEGRAM_BOT_TOKEN;
  var chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(500).json({ ok: false, error: 'Telegram non configuré côté serveur' });
  }

  var body = req.body || {};
  var text = g.clip(body.text, 3800).trim();     // limite Telegram : 4096 caractères
  if (!text) return res.status(400).json({ ok: false, error: 'Message vide' });

  async function send(withMarkdown) {
    var payload = { chat_id: chatId, text: text };
    if (withMarkdown) payload.parse_mode = 'Markdown';
    return fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  try {
    var r = await send(true);
    // Markdown mal formé (ex. caractère spécial dans un nom) : on renvoie en texte brut
    if (r.status === 400) r = await send(false);
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
  } catch (e) {
    return res.status(502).json({ ok: false });
  }
};
