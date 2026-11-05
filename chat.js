/* ============================================================
   CHAT.JS — Fenêtre de l'assistant Nya-Market (côté navigateur)
   ------------------------------------------------------------
   Additif : n'utilise aucun id/classe/variable existant (tout est préfixé
   "nmc-"), ne modifie ni le panier ni le catalogue. Il parle uniquement à
   /api/chat (voir api/chat.js). Désactivable : config.js > chat.enabled = false.
   Le texte de l'IA est inséré avec textContent (jamais innerHTML) : aucune
   injection HTML possible.
   ============================================================ */
(function () {
  'use strict';

  var cfg = window.PLATFORM_CONFIG || {};
  var chatCfg = cfg.chat || {};
  if (chatCfg.enabled === false) return;

  var ENDPOINT = chatCfg.endpoint || '/api/chat';
  var BRAND = (cfg.brand && cfg.brand.name) || 'Nya-Market';
  var STORE_KEY = 'nmc_history_v1';
  var MAX_LEN = 500;

  var SUGGESTIONS = [
    'Comment commander ?',
    'Comment se passe la livraison ?',
    'Est-ce sécurisé ?',
    'Je cherche un produit'
  ];
  var WELCOME = 'Bonjour 👋 Je suis l\'assistant ' + BRAND + '. Je peux répondre à vos questions ' +
                'et vous aider à retrouver un produit. Que cherchez-vous ?';

  var history = [];      // [{role, content}] envoyé à l'API (6 derniers messages gardés côté serveur)
  var busy = false;
  var els = {};

  /* ---------- petits outils ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function safeHttps(u) { return typeof u === 'string' && /^https:\/\//i.test(u) ? u : ''; }
  function safeWa(u) { return typeof u === 'string' && /^https:\/\/wa\.me\/\d{8,15}(\?|$)/.test(u) ? u : ''; }

  function loadHistory() {
    try {
      var raw = sessionStorage.getItem(STORE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) history = arr.filter(function (m) {
        return m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string';
      }).slice(-12);
    } catch (e) { history = []; }
  }
  function saveHistory() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-12))); } catch (e) { /* non bloquant */ }
  }

  /* ---------- construction de l'interface ---------- */
  function build() {
    var launcher = el('button', 'nmc-launcher');
    launcher.type = 'button';
    launcher.id = 'nmc-launcher';
    launcher.setAttribute('aria-label', 'Ouvrir l\'assistant ' + BRAND);
    launcher.setAttribute('aria-expanded', 'false');
    launcher.innerHTML = '<i class="fas fa-comment-dots" aria-hidden="true"></i><span class="nmc-launcher-label">Aide</span>';

    var panel = el('section', 'nmc-panel');
    panel.id = 'nmc-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Assistant ' + BRAND);
    panel.hidden = true;

    var head = el('header', 'nmc-head');
    var title = el('div', 'nmc-title');
    title.appendChild(el('span', 'nmc-avatar', '🛍️'));
    var tbox = el('div');
    tbox.appendChild(el('strong', null, 'Assistant ' + BRAND));
    tbox.appendChild(el('small', null, 'Réponses instantanées'));
    title.appendChild(tbox);
    var close = el('button', 'nmc-close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Fermer l\'assistant');
    close.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
    head.appendChild(title); head.appendChild(close);

    var log = el('div', 'nmc-log');
    log.setAttribute('role', 'log');
    log.setAttribute('aria-live', 'polite');

    var chips = el('div', 'nmc-chips');

    var form = el('form', 'nmc-form');
    form.autocomplete = 'off';
    var input = el('input', 'nmc-input');
    input.type = 'text';
    input.maxLength = MAX_LEN;
    input.placeholder = 'Écrivez votre question…';
    input.setAttribute('aria-label', 'Votre message');
    var send = el('button', 'nmc-send');
    send.type = 'submit';
    send.setAttribute('aria-label', 'Envoyer');
    send.innerHTML = '<i class="fas fa-paper-plane" aria-hidden="true"></i>';
    form.appendChild(input); form.appendChild(send);

    panel.appendChild(head); panel.appendChild(log); panel.appendChild(chips); panel.appendChild(form);
    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    els = { launcher: launcher, panel: panel, close: close, log: log, chips: chips, form: form, input: input, send: send };

    SUGGESTIONS.forEach(function (s) {
      var b = el('button', 'nmc-chip', s);
      b.type = 'button';
      b.addEventListener('click', function () { submit(s); });
      chips.appendChild(b);
    });

    launcher.addEventListener('click', function () { toggle(); });
    close.addEventListener('click', function () { toggle(false); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submit(input.value);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) toggle(false);
    });
  }

  function toggle(force) {
    var open = typeof force === 'boolean' ? force : els.panel.hidden;
    els.panel.hidden = !open;
    els.launcher.setAttribute('aria-expanded', String(open));
    els.launcher.classList.toggle('nmc-hidden-mobile', open);
    if (open) {
      if (!els.log.childNodes.length) restoreOrWelcome();
      scrollDown();
      setTimeout(function () { try { els.input.focus(); } catch (e) {} }, 50);
    }
  }

  function restoreOrWelcome() {
    if (history.length) {
      history.forEach(function (m) { addBubble(m.role === 'user' ? 'user' : 'bot', m.content); });
      els.chips.style.display = 'none';
    } else {
      addBubble('bot', WELCOME);
    }
  }

  function scrollDown() { els.log.scrollTop = els.log.scrollHeight; }

  function addBubble(who, text) {
    var b = el('div', 'nmc-msg nmc-' + who);
    b.textContent = text;            // jamais innerHTML
    els.log.appendChild(b);
    scrollDown();
    return b;
  }

  function addProducts(products) {
    if (!products || !products.length) return;
    var wrap = el('div', 'nmc-products');
    products.slice(0, 6).forEach(function (p) {
      var card = el('article', 'nmc-card');
      var img = safeHttps(p.image);
      if (img) {
        var im = document.createElement('img');
        im.src = img; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async';
        im.className = 'nmc-card-img';
        im.onerror = function () { im.style.visibility = 'hidden'; };
        card.appendChild(im);
      } else {
        card.appendChild(el('div', 'nmc-card-img'));
      }
      var body = el('div', 'nmc-card-body');
      body.appendChild(el('strong', 'nmc-card-name', String(p.name || '')));
      var priceRow = el('div', 'nmc-card-price', String(p.price_label || ''));
      if (p.old_price_label) priceRow.appendChild(el('s', null, String(p.old_price_label)));
      body.appendChild(priceRow);
      if (p.boutique) body.appendChild(el('small', 'nmc-card-shop', 'Boutique : ' + p.boutique));
      var wa = safeWa(p.order_url);
      if (wa) {
        var a = el('a', 'nmc-wa');
        a.href = wa; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.innerHTML = '<i class="fab fa-whatsapp" aria-hidden="true"></i> Commander sur WhatsApp';
        body.appendChild(a);
      }
      card.appendChild(body);
      wrap.appendChild(card);
    });
    els.log.appendChild(wrap);
    scrollDown();
  }

  function setBusy(v) {
    busy = v;
    els.send.disabled = v;
    els.input.disabled = v;
    els.panel.classList.toggle('nmc-busy', v);
    if (!v) { try { els.input.focus(); } catch (e) {} }
  }

  /* ---------- envoi ---------- */
  function submit(raw) {
    var text = String(raw || '').trim().slice(0, MAX_LEN);
    if (!text || busy) return;
    els.input.value = '';
    els.chips.style.display = 'none';
    addBubble('user', text);

    var typing = el('div', 'nmc-msg nmc-bot nmc-typing');
    typing.innerHTML = '<span></span><span></span><span></span>';
    typing.setAttribute('aria-label', 'L\'assistant écrit');
    els.log.appendChild(typing);
    scrollDown();
    setBusy(true);

    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, 30000);

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: history.slice(-6) }),
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      return res.json().then(function (data) { return { ok: res.ok, data: data }; });
    }).then(function (r) {
      if (typing.parentNode) typing.parentNode.removeChild(typing);
      if (!r.ok || !r.data || typeof r.data.reply !== 'string') {
        var msg = (r.data && r.data.error) || 'Une erreur est survenue. Réessayez dans un instant.';
        addBubble('bot', msg);
        return;
      }
      history.push({ role: 'user', content: text });
      history.push({ role: 'assistant', content: r.data.reply });
      saveHistory();
      addBubble('bot', r.data.reply);
      addProducts(r.data.products);
    }).catch(function () {
      if (typing.parentNode) typing.parentNode.removeChild(typing);
      addBubble('bot', 'Connexion impossible pour le moment. Vérifiez votre réseau et réessayez.');
    }).then(function () {
      clearTimeout(timer);
      setBusy(false);
    });
  }

  /* ---------- démarrage ---------- */
  function init() {
    if (document.getElementById('nmc-launcher')) return;   // déjà installé
    loadHistory();
    build();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
