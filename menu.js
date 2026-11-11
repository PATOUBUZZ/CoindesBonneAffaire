/* ============================================================
   MENU.JS — Menu coulissant de l'en-tête (à gauche de la cloche 🔔 et du panier 🛒)
   - Le bouton est dans index.html (#menu-toggle-btn). Ce fichier construit le panneau et gère :
     ouverture/fermeture animées, clic sur le fond, touche Échap, balayage vers la droite (mobile),
     blocage du défilement derrière, piège du focus clavier (accessibilité).
   - Totalement ISOLÉ : si quelque chose échoue, le reste du site n'est pas touché.
   - Il PILOTE les boutons existants (panier, boutiques, cloche) sans les remplacer.

   COMMENT MODIFIER LES LIENS : éditez uniquement la liste ITEMS ci-dessous.
     { type:'link',   icon:'fas fa-xxx', label:'…', hint:'…', href:'page.html' }   -> ouvre une page
     { type:'action', icon:'fas fa-xxx', label:'…', action:'cart' }               -> déclenche une fonction du site
     { type:'sep' }                                                               -> trait de séparation
   Numéro WhatsApp du support : config.js > menu: { whatsapp: '22961196907' } (sinon la valeur par défaut ci-dessous).
   ============================================================ */
(function () {
  'use strict';

  var toggle = document.getElementById('menu-toggle-btn');
  if (!toggle) return;

  var cfg = (window.PLATFORM_CONFIG && window.PLATFORM_CONFIG.menu) || {};
  var WHATSAPP = String(cfg.whatsapp || '22961196907').replace(/[^\d]/g, '');
  var WA_TEXT = cfg.whatsappText || 'Bonjour Nya-Market, j\'ai une question.';

  // ---------- CONTENU DU MENU (à adapter) ----------
  var CTA = {            // grand bouton orange en haut du menu
    icon: 'fas fa-store', title: 'Enregistrer votre boutique', hint: 'Vendez sur Nya-Market, c\'est gratuit', href: 'vendeur.html'
  };
  var ITEMS = [
    { type: 'action', icon: 'fas fa-home',        label: 'Accueil',                action: 'home' },
    { type: 'action', icon: 'fas fa-th-list',     label: 'Toutes les boutiques',   action: 'shops' },
    { type: 'action', icon: 'fas fa-shopping-basket', label: 'Mon panier',         action: 'cart', badge: true },
    { type: 'action', icon: 'fas fa-bell',        label: 'Activer les notifications', action: 'bell', color: 'orange' },
    { type: 'sep' },
    { type: 'link',   icon: 'fas fa-user-circle', label: 'Espace vendeur',         hint: 'Se connecter / gérer mes produits', href: 'vendeur.html' },
    { type: 'link',   icon: 'fab fa-whatsapp',    label: 'Contactez-nous',         hint: 'Support WhatsApp 7j/7', href: 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(WA_TEXT), color: 'green', external: true },
    { type: 'action', icon: 'fas fa-question-circle', label: 'Questions fréquentes', action: 'faq' },
    { type: 'action', icon: 'fas fa-share-alt',   label: 'Partager le site',       action: 'share' }
  ];
  // Liens supplémentaires facultatifs (config.js > menu.extraLinks : [{label, href, icon}])
  (cfg.extraLinks || []).forEach(function (l) {
    if (l && l.label && l.href) ITEMS.push({ type: 'link', icon: l.icon || 'fas fa-link', label: l.label, href: l.href, external: /^https?:\/\//i.test(l.href) });
  });

  // ---------- Construction du panneau ----------
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // Seuls http(s), liens relatifs, ancres et tel:/mailto: sont acceptés (jamais javascript:)
  function safeHref(u) { u = String(u || '').trim(); return /^(https?:\/\/|tel:|mailto:|\/|\?|#|[a-z0-9][a-z0-9._\/-]*(\?[^\s]*)?(#[^\s]*)?$)/i.test(u) && !/^(javascript|data|vbscript):/i.test(u) ? u : '#'; }

  var backdrop = el('div', 'nmm-backdrop');
  var panel = el('aside', 'nmm-panel');
  panel.id = 'nmm-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Menu');
  panel.setAttribute('aria-hidden', 'true');

  var head = el('div', 'nmm-head',
    '<div class="nmm-title"><i class="fas fa-store-alt" aria-hidden="true"></i> Nya-Market</div>' +
    '<button type="button" class="nmm-close" aria-label="Fermer le menu"><i class="fas fa-times" aria-hidden="true"></i></button>');
  var body = el('div', 'nmm-body');

  body.appendChild(el('a', 'nmm-cta',
    '<span class="nmm-cta-ico"><i class="' + esc(CTA.icon) + '" aria-hidden="true"></i></span>' +
    '<span><strong>' + esc(CTA.title) + '</strong><small>' + esc(CTA.hint) + '</small></span>'));
  body.firstChild.setAttribute('href', safeHref(CTA.href));

  var list = el('ul', 'nmm-list');
  var cartBadge = null, bellItem = null;
  ITEMS.forEach(function (it) {
    var li = el('li');
    if (it.type === 'sep') { li.className = 'nmm-sep'; li.setAttribute('role', 'separator'); list.appendChild(li); return; }
    var node;
    var inner =
      '<span class="nmm-item-ico' + (it.color ? ' nmm-' + it.color : '') + '"><i class="' + esc(it.icon) + '" aria-hidden="true"></i></span>' +
      '<span class="nmm-item-label">' + esc(it.label) + (it.hint ? '<small>' + esc(it.hint) + '</small>' : '') + '</span>' +
      (it.badge ? '<span class="nmm-count" hidden>0</span>' : '') +
      '<i class="fas fa-chevron-right nmm-chev" aria-hidden="true"></i>';
    if (it.type === 'link') {
      node = el('a', 'nmm-item', inner);
      node.setAttribute('href', safeHref(it.href));
      if (it.external || /^https?:\/\//i.test(it.href)) { node.target = '_blank'; node.rel = 'noopener noreferrer'; }
    } else {
      node = el('button', 'nmm-item', inner);
      node.type = 'button';
      node.setAttribute('data-nmm-action', it.action);
    }
    if (it.badge) cartBadge = node.querySelector('.nmm-count');
    if (it.action === 'bell') bellItem = li;
    li.appendChild(node);
    list.appendChild(li);
  });
  body.appendChild(list);

  var foot = el('div', 'nmm-foot', '<i class="fas fa-truck-loading" aria-hidden="true"></i> Paiement à la livraison · Support 7j/7');
  panel.appendChild(head); panel.appendChild(body); panel.appendChild(foot);
  document.body.appendChild(backdrop);
  document.body.appendChild(panel);

  var closeBtn = head.querySelector('.nmm-close');
  var icon = toggle.querySelector('i');

  // ---------- Synchronisation avec les boutons existants ----------
  function syncState() {
    // Compteur du panier (lu dans le badge du header, mis à jour par index.js)
    var c = document.getElementById('cart-count');
    var n = c ? parseInt(c.textContent, 10) || 0 : 0;
    if (cartBadge) { cartBadge.textContent = n; cartBadge.hidden = n < 1; }
    // Cloche : visible seulement si push.js l'a affichée ; libellé selon l'état
    var bell = document.getElementById('push-toggle-btn');
    if (bellItem) {
      var visible = !!bell && bell.style.display !== 'none';
      bellItem.hidden = !visible;
      if (visible) {
        var on = bell.classList.contains('is-on');
        bellItem.querySelector('.nmm-item-label').textContent = on ? 'Notifications activées (désactiver)' : 'Activer les notifications';
        bellItem.querySelector('.nmm-item-ico i').className = on ? 'fas fa-bell' : 'far fa-bell';
      }
    }
  }
  try {
    var cc = document.getElementById('cart-count');
    if (cc && window.MutationObserver) new MutationObserver(syncState).observe(cc, { childList: true, characterData: true, subtree: true });
  } catch (e) { /* non bloquant */ }

  // ---------- Ouverture / fermeture ----------
  var isOpen = false, lastFocus = null;
  var root = document.documentElement;

  function open() {
    if (isOpen) return;
    isOpen = true;
    syncState();
    lastFocus = document.activeElement;
    panel.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Fermer le menu');
    if (icon) icon.className = 'fas fa-times';
    root.classList.add('nmm-open', 'nmm-lock');
    document.body.classList.add('nmm-open');
    setTimeout(function () { closeBtn.focus(); }, 60);      // focus dans le panneau (lecteurs d'écran / clavier)
  }
  function close(opts) {
    if (!isOpen) return;
    isOpen = false;
    panel.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Ouvrir le menu');
    if (icon) icon.className = 'fas fa-bars';
    root.classList.remove('nmm-open', 'nmm-lock');
    document.body.classList.remove('nmm-open');
    panel.style.transform = '';
    if (!(opts && opts.noFocus) && lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }

  toggle.setAttribute('aria-controls', 'nmm-panel');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-haspopup', 'dialog');
  toggle.addEventListener('click', function () { isOpen ? close() : open(); });
  closeBtn.addEventListener('click', function () { close(); });
  backdrop.addEventListener('click', function () { close(); });

  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') {                                   // le focus reste dans le panneau
      var f = Array.prototype.filter.call(panel.querySelectorAll('a[href], button:not([disabled])'), function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Balayage vers la droite pour fermer (mobile)
  var sx = null, sy = null, dx = 0;
  panel.addEventListener('touchstart', function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; dx = 0; }, { passive: true });
  panel.addEventListener('touchmove', function (e) {
    if (sx === null) return;
    var t = e.touches[0]; dx = t.clientX - sx;
    if (Math.abs(t.clientY - sy) > Math.abs(dx)) return;     // défilement vertical : on ignore
    if (dx > 0) { panel.classList.add('nmm-dragging'); panel.style.transform = 'translateX(' + dx + 'px)'; }
  }, { passive: true });
  panel.addEventListener('touchend', function () {
    if (sx === null) return;
    panel.classList.remove('nmm-dragging');
    var shouldClose = dx > 70;
    sx = null;
    if (shouldClose) close(); else panel.style.transform = '';
  });

  // Si la fenêtre est redimensionnée / l'écran pivoté, rien à recalculer (CSS pur) ; Échap et fond suffisent.

  // ---------- Actions : elles déclenchent les boutons / fonctions DÉJÀ présents sur le site ----------
  function clickLater(id) {
    close({ noFocus: true });
    setTimeout(function () { var b = document.getElementById(id); if (b) b.click(); }, 180);
  }
  var ACTIONS = {
    home: function () { close(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    shops: function () { clickLater('boutiques-list-btn'); },
    cart: function () { clickLater('cart-toggle-btn'); },
    bell: function () { clickLater('push-toggle-btn'); },
    faq: function () {
      close({ noFocus: true });
      setTimeout(function () { var f = document.getElementById('faq'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 180);
    },
    share: function () {
      var url = window.location.origin + window.location.pathname;
      var text = 'Découvrez Nya-Market : boutiques vérifiées, paiement à la livraison 🛍️';
      close({ noFocus: true });
      if (navigator.share) { navigator.share({ title: 'Nya-Market', text: text, url: url }).catch(function () {}); return; }
      var done = function () { if (typeof window.showShareToast === 'function') window.showShareToast('Lien du site copié !'); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done).catch(function () {});
      else window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener');
    }
  };
  list.addEventListener('click', function (e) {
    var a = e.target.closest('[data-nmm-action]');
    if (a) { var fn = ACTIONS[a.getAttribute('data-nmm-action')]; if (fn) fn(); return; }
    if (e.target.closest('a.nmm-item')) close({ noFocus: true });    // un lien de page : on ferme (nouvel onglet ou navigation)
  });
  body.firstChild.addEventListener('click', function () { close({ noFocus: true }); });

  syncState();
  // La cloche est affichée plus tard par push.js : on resynchronise un peu après le chargement
  setTimeout(syncState, 1500);
})();
