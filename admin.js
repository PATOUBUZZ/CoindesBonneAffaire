/* ============================================================
   ADMIN.JS — Page d'administration Nya-Market
   ------------------------------------------------------------
   Connexion Google, puis seules les adresses listées dans la table
   admin_users peuvent agir. Toute la sécurité est dans la base (fonctions
   admin_* du script SQL 4) : même en modifiant cette page, personne d'autre
   ne peut approuver quoi que ce soit.
   Le texte venant des vendeurs est affiché avec textContent (pas de HTML injecté).
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.PLATFORM_CONFIG || {};
  var SBC = CFG.supabase || {};
  var $ = function (id) { return document.getElementById(id); };

  var BUCKET_DOCS = 'vendeur-docs';
  var SLUG_RE = /^[a-z0-9][a-z0-9-]{1,23}$/;
  var CAT_RE = /^[a-z0-9][a-z0-9_-]*$/i;

  if (!window.supabase || !SBC.url || !SBC.anonKey) {
    document.body.textContent = 'Configuration manquante (config.js ou connexion Supabase).';
    return;
  }
  var sb = window.supabase.createClient(SBC.url, SBC.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  var state = { tab: 'produits', pFilter: 'en_examen', vFilter: 'en_attente', categories: [], busy: false, ready: false, globalLimit: 10 };

  /* ---------- outils ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function show(id) {
    ['view-login', 'view-denied', 'view-app'].forEach(function (v) { $(v).hidden = (v !== id); });
  }
  var toastTimer;
  function toast(msg, isErr) {
    var t = $('toast');
    t.textContent = msg;
    t.className = 'adm-toast' + (isErr ? ' err' : '');
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, isErr ? 7000 : 4500);
  }
  function fcfa(n) { return Math.round(Number(n) || 0).toLocaleString('fr-FR').replace(/[  ]/g, ' ') + ' FCFA'; }
  function dateFr(s) {
    try { return new Date(s).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return ''; }
  }
  function httpsOnly(u) { return typeof u === 'string' && /^https:\/\//i.test(u) ? u : ''; }
  function waLink(raw) {
    var d = String(raw || '').replace(/\D+/g, '');
    if (d.length === 8) d = '229' + d;
    return d.length >= 10 && d.length <= 15 ? 'https://wa.me/' + d : '';
  }
  function badge(text, cls) { return el('span', 'adm-badge ' + cls, text); }

  // Appel d'une fonction admin : renvoie les données ou lève une erreur lisible
  function rpc(name, args) {
    return sb.rpc(name, args || {}).then(function (r) {
      if (r.error) throw new Error(r.error.message || 'Erreur');
      return r.data;
    });
  }
  // Exécute une action, bloque les doubles clics, rafraîchit ensuite
  function act(btn, fn, okMsg) {
    if (state.busy) return;
    state.busy = true;
    var old = btn.textContent;
    btn.disabled = true;
    fn().then(function (res) {
      toast(typeof res === 'string' && res ? res : okMsg);
      return refreshAll();
    }).catch(function (e) {
      toast(e.message, true);
    }).then(function () {
      state.busy = false;
      if (btn.isConnected) { btn.disabled = false; btn.textContent = old; }
    });
  }

  /* ---------- connexion ---------- */
  $('btn-login').addEventListener('click', function () {
    $('login-error').hidden = true;
    sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname, queryParams: { prompt: 'select_account' } }
    }).then(function (r) {
      if (r.error) { $('login-error').textContent = 'Connexion impossible : ' + r.error.message; $('login-error').hidden = false; }
    });
  });
  function logout() { sb.auth.signOut().then(function () { state.ready = false; show('view-login'); }); }
  $('btn-logout').addEventListener('click', logout);
  $('btn-denied-logout').addEventListener('click', logout);

  function handleSession(session) {
    if (!session) { state.ready = false; show('view-login'); return; }
    var email = (session.user && session.user.email) || '';
    rpc('is_admin').then(function (ok) {
      if (!ok) { $('denied-email').textContent = email; show('view-denied'); return; }
      $('who-email').textContent = email;
      show('view-app');
      state.ready = true;
      return rpc('admin_categories').then(function (c) { state.categories = c || []; })
        .catch(function () { state.categories = []; })
        .then(loadSettings)
        .then(refreshAll);
    }).catch(function (e) {
      $('denied-email').textContent = email + ' (' + e.message + ')';
      show('view-denied');
    });
  }
  // (déclenché hors du callback pour éviter un blocage connu de supabase-js)
  sb.auth.onAuthStateChange(function (event, session) {
    setTimeout(function () { handleSession(session); }, 0);
  });

  /* ---------- onglets et filtre ---------- */
  var FILTERS = {
    produits: [['en_examen', 'À examiner'], ['publie', 'En ligne'], ['refuse', 'Refusés'], ['tous', 'Tous']],
    vendeurs: [['en_attente', 'À vérifier'], ['valide', 'Validés'], ['refuse', 'Suspendus'], ['tous', 'Tous']]
  };
  function buildFilter() {
    var sel = $('filter');
    sel.textContent = '';
    FILTERS[state.tab].forEach(function (f) {
      var o = el('option', null, f[1]); o.value = f[0]; sel.appendChild(o);
    });
    sel.value = state.tab === 'produits' ? state.pFilter : state.vFilter;
  }
  document.querySelectorAll('.adm-tab').forEach(function (b) {
    b.addEventListener('click', function () {
      state.tab = b.getAttribute('data-tab');
      document.querySelectorAll('.adm-tab').forEach(function (x) { x.classList.toggle('is-active', x === b); });
      buildFilter();
      refreshAll();
    });
  });
  $('filter').addEventListener('change', function () {
    if (state.tab === 'produits') state.pFilter = this.value; else state.vFilter = this.value;
    refreshAll();
  });
  $('btn-refresh').addEventListener('click', function () { refreshAll(); });

  /* ---------- zoom image ---------- */
  function openLightbox(url) {
    $('lightbox-img').src = url;
    $('lightbox').hidden = false;
  }
  $('lightbox').addEventListener('click', function () { this.hidden = true; $('lightbox-img').removeAttribute('src'); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!$('lightbox').hidden) $('lightbox').hidden = true; else $('compare').hidden = true;
    }
  });
  $('compare-close').addEventListener('click', function () { $('compare').hidden = true; });
  $('compare-doc').addEventListener('click', function () { if (this.src) openLightbox(this.src); });
  $('compare-selfie').addEventListener('click', function () { if (this.src) openLightbox(this.src); });

  // Ouvre pièce d'identité + selfie côte à côte (adresses temporaires de 5 min, bucket privé)
  function signed(path) {
    return sb.storage.from(BUCKET_DOCS).createSignedUrl(path, 300).then(function (r) {
      if (r.error || !r.data) throw new Error(r.error ? r.error.message : 'Fichier introuvable');
      return r.data.signedUrl;
    });
  }
  function openCompare(v, btn) {
    btn.disabled = true;
    Promise.all([signed(v.doc_path), signed(v.selfie_path)]).then(function (urls) {
      if (/\.pdf(\?|$)/i.test(v.doc_path)) { window.open(urls[0], '_blank', 'noopener'); $('compare-doc').removeAttribute('src'); }
      else $('compare-doc').src = urls[0];
      $('compare-selfie').src = urls[1];
      $('compare-title').textContent = v.nom_prenom + ' — ' + v.boutique;
      $('compare').hidden = false;
    }).catch(function (e) { toast('Impossible d\'ouvrir les images : ' + e.message, true); })
      .then(function () { btn.disabled = false; });
  }

  /* ---------- limite globale ---------- */
  function loadSettings() {
    return rpc('admin_reglages').then(function (r) {
      state.globalLimit = Number(r && r.max_produits_global) || 10;
      $('global-limit').value = state.globalLimit;
    }).catch(function () { /* script 5 non lancé : la barre reste masquée */ state.noSettings = true; });
  }
  $('btn-global-limit').addEventListener('click', function () {
    var n = parseInt($('global-limit').value, 10);
    if (!isFinite(n) || n < 1 || n > 100) { toast('Entrez un nombre entre 1 et 100.', true); return; }
    if (!confirm('Autoriser ' + n + ' produits maximum à TOUS les vendeurs sans limite propre ?')) return;
    act(this, function () {
      return rpc('admin_definir_limite_globale', { p_valeur: n }).then(function (m) { state.globalLimit = n; return m; });
    }, 'Limite globale enregistrée.');
  });

  /* ---------- chargement ---------- */
  function setCount(id, n) {
    var c = $(id); c.textContent = String(n); c.classList.toggle('has', n > 0);
  }
  function refreshAll() {
    if (!state.ready) return Promise.resolve();
    var list = $('list');
    $('settings-bar').hidden = !(state.tab === 'vendeurs' && !state.noSettings);
    return rpc('admin_compteurs').then(function (c) {
      setCount('count-produits', c.produits_en_examen || 0);
      setCount('count-vendeurs', c.vendeurs_en_attente || 0);
    }).catch(function () { /* non bloquant */ }).then(function () {
      if (state.tab === 'produits') {
        return rpc('admin_produits', { p_statut: state.pFilter }).then(renderProducts);
      }
      return rpc('admin_vendeurs', { p_statut: state.vFilter }).then(renderVendors);
    }).catch(function (e) {
      list.textContent = '';
      toast(e.message, true);
    });
  }

  function empty(msg) {
    var d = el('div', 'adm-empty');
    var i = el('i', 'fas fa-check-circle'); d.appendChild(i);
    d.appendChild(document.createTextNode(msg));
    return d;
  }

  /* ---------- produits ---------- */
  function renderProducts(items) {
    var list = $('list');
    list.textContent = '';
    if (!items || !items.length) { list.appendChild(empty('Aucun produit dans cette liste.')); return; }
    items.forEach(function (p) { list.appendChild(productCard(p)); });
  }

  function productCard(p) {
    var card = el('article', 'adm-card');

    var top = el('div', 'adm-card-top');
    top.appendChild(el('h3', null, p.nom));
    top.appendChild(el('div', 'adm-price', fcfa(p.prix)));
    card.appendChild(top);

    var badges = el('div', 'adm-badges');
    badges.appendChild(p.statut === 'publie' ? badge('En ligne', 'b-ok')
      : p.statut === 'refuse' ? badge('Refusé', 'b-red') : badge('À examiner', 'b-wait'));
    badges.appendChild(p.statut_vendeur === 'valide' ? badge('Vendeur validé', 'b-ok')
      : p.statut_vendeur === 'refuse' ? badge('Vendeur suspendu', 'b-red') : badge('Vendeur NON validé', 'b-wait'));
    if (p.live_product_id) badges.appendChild(badge('id : ' + p.live_product_id, 'b-blue'));
    card.appendChild(badges);

    var meta = el('p', 'adm-meta');
    meta.appendChild(document.createTextNode('Boutique « ' + p.boutique + ' » — ' + p.nom_prenom + ' — '));
    var wa = waLink(p.whatsapp);
    if (wa) { var a = el('a', null, p.whatsapp); a.href = wa; a.target = '_blank'; a.rel = 'noopener noreferrer'; meta.appendChild(a); }
    else meta.appendChild(document.createTextNode(p.whatsapp || ''));
    meta.appendChild(document.createTextNode(' — ' + p.email + ' — soumis le ' + dateFr(p.created_at)));
    card.appendChild(meta);

    var photos = el('div', 'adm-photos');
    (p.images || []).forEach(function (u) {
      var url = httpsOnly(u); if (!url) return;
      var b = el('button', 'adm-photo'); b.type = 'button'; b.setAttribute('aria-label', 'Agrandir la photo');
      var im = document.createElement('img'); im.src = url; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async';
      b.appendChild(im);
      b.addEventListener('click', function () { openLightbox(url); });
      photos.appendChild(b);
    });
    card.appendChild(photos);

    card.appendChild(el('div', 'adm-label', 'Description'));
    card.appendChild(el('p', 'adm-text', p.description));
    if (p.caracteristiques) {
      card.appendChild(el('div', 'adm-label', 'Caractéristiques'));
      card.appendChild(el('p', 'adm-text', p.caracteristiques));
    }
    if (p.statut === 'refuse' && p.motif_refus) {
      card.appendChild(el('p', 'adm-warn', 'Motif du refus : ' + p.motif_refus));
    }

    card.appendChild(productActions(p));
    return card;
  }

  function productActions(p) {
    var box = el('div', 'adm-actions');

    // Produit en ligne : seule action = retirer
    if (p.statut === 'publie') {
      var rm = el('button', 'adm-btn adm-btn-red', 'Retirer du site'); rm.type = 'button';
      rm.addEventListener('click', function () {
        if (!confirm('Retirer « ' + p.nom + ' » du site ?')) return;
        act(rm, function () { return rpc('admin_retirer_produit', { p_id: p.id }); }, 'Produit retiré du site.');
      });
      box.appendChild(rm);
      return box;
    }

    // Vendeur pas encore validé : il faut d'abord le valider
    if (p.statut_vendeur !== 'valide') {
      box.appendChild(el('p', 'adm-warn', 'La boutique « ' + p.boutique + ' » n\'est pas validée. Vérifiez sa pièce d\'identité (onglet Vendeurs) avant d\'autoriser ses produits.'));
      var vb = el('button', 'adm-btn adm-btn-blue', 'Valider ce vendeur'); vb.type = 'button';
      vb.addEventListener('click', function () {
        if (!confirm('Valider le vendeur « ' + p.boutique + ' » ? (Vous avez vérifié sa pièce d\'identité.)')) return;
        act(vb, function () { return rpc('admin_valider_vendeur', { p_email: p.email }); }, 'Vendeur validé.');
      });
      box.appendChild(vb);
      return box;
    }

    // Catégorie
    var fcat = el('div', 'adm-field');
    var lcat = el('label', null, 'Catégorie sur le site'); lcat.setAttribute('for', 'cat-' + p.id);
    var cat = el('input', 'adm-input'); cat.id = 'cat-' + p.id; cat.type = 'text'; cat.setAttribute('list', 'cats-' + p.id);
    cat.placeholder = 'ex : vetement'; cat.autocomplete = 'off'; cat.autocapitalize = 'none';
    var dl = document.createElement('datalist'); dl.id = 'cats-' + p.id;
    state.categories.forEach(function (c) { var o = document.createElement('option'); o.value = c; dl.appendChild(o); });
    fcat.appendChild(lcat); fcat.appendChild(cat); fcat.appendChild(dl);
    fcat.appendChild(el('small', null, 'Choisissez une catégorie existante ou tapez-en une nouvelle (lettres, chiffres, - et _).'));
    box.appendChild(fcat);

    // Lien court de la boutique (seulement à la 1re approbation)
    var slug = null;
    if (!p.live_vendor_id) {
      var fs = el('div', 'adm-field');
      var ls = el('label', null, 'Lien court de la boutique (facultatif)'); ls.setAttribute('for', 'slug-' + p.id);
      slug = el('input', 'adm-input'); slug.id = 'slug-' + p.id; slug.type = 'text';
      slug.placeholder = 'ex : patoushop'; slug.autocomplete = 'off'; slug.autocapitalize = 'none'; slug.maxLength = 24;
      fs.appendChild(ls); fs.appendChild(slug);
      fs.appendChild(el('small', null, 'Donne  votre-site/?vendor=<lien>. Vide = fabriqué à partir du nom (20 caractères max). Fixé à la 1re approbation.'));
      box.appendChild(fs);
    }

    var row = el('div', 'adm-row');
    var ok = el('button', 'adm-btn adm-btn-ok', 'Approuver et mettre en ligne'); ok.type = 'button';
    ok.addEventListener('click', function () {
      var c = cat.value.trim();
      if (!CAT_RE.test(c)) { toast('Catégorie invalide : lettres, chiffres, - et _ uniquement.', true); cat.focus(); return; }
      var s = slug ? slug.value.trim().toLowerCase() : '';
      if (s && !SLUG_RE.test(s)) { toast('Lien court invalide : 2 à 24 caractères (minuscules, chiffres, -).', true); slug.focus(); return; }
      if (!confirm('Mettre « ' + p.nom + ' » en ligne dans la catégorie « ' + c + ' » ?')) return;
      act(ok, function () {
        return rpc('admin_approuver_produit', { p_id: p.id, p_categorie: c, p_slug: s || null });
      }, 'Produit mis en ligne.');
    });
    var no = el('button', 'adm-btn adm-btn-ghost', 'Refuser…'); no.type = 'button';
    row.appendChild(ok); row.appendChild(no);
    box.appendChild(row);

    // Refus avec motif
    var rbox = el('div', 'adm-refuse-box'); rbox.hidden = true;
    var motif = el('input', 'adm-input'); motif.type = 'text'; motif.maxLength = 200;
    motif.placeholder = 'Motif (vu par le vendeur), ex : photos non conformes';
    motif.setAttribute('aria-label', 'Motif du refus');
    var rok = el('button', 'adm-btn adm-btn-red', 'Confirmer le refus'); rok.type = 'button';
    rok.addEventListener('click', function () {
      act(rok, function () { return rpc('admin_refuser_produit', { p_id: p.id, p_motif: motif.value.trim() || null }); }, 'Produit refusé.');
    });
    rbox.appendChild(motif); rbox.appendChild(rok);
    no.addEventListener('click', function () { rbox.hidden = !rbox.hidden; if (!rbox.hidden) motif.focus(); });
    box.appendChild(rbox);
    return box;
  }

  /* ---------- vendeurs ---------- */
  function renderVendors(items) {
    var list = $('list');
    list.textContent = '';
    if (!items || !items.length) { list.appendChild(empty('Aucun vendeur dans cette liste.')); return; }
    items.forEach(function (v) { list.appendChild(vendorCard(v)); });
  }

  function vendorCard(v) {
    var card = el('article', 'adm-card');
    var top = el('div', 'adm-card-top');
    top.appendChild(el('h3', null, v.boutique));
    top.appendChild(v.statut === 'valide' ? badge('Validé', 'b-ok') : v.statut === 'refuse' ? badge('Suspendu', 'b-red') : badge('À vérifier', 'b-wait'));
    card.appendChild(top);

    var meta = el('p', 'adm-meta');
    meta.appendChild(document.createTextNode(v.nom_prenom + ' — '));
    var wa = waLink(v.whatsapp);
    if (wa) { var a = el('a', null, v.whatsapp); a.href = wa; a.target = '_blank'; a.rel = 'noopener noreferrer'; meta.appendChild(a); }
    else meta.appendChild(document.createTextNode(v.whatsapp || ''));
    meta.appendChild(document.createTextNode(' — ' + v.email));
    card.appendChild(meta);
    var limTxt = v.limite != null ? ' / ' + v.limite + ' autorisés' + (v.max_produits != null ? ' (limite propre)' : ' (limite globale)') : '';
    card.appendChild(el('p', 'adm-meta', 'Inscrit le ' + dateFr(v.created_at) + ' — ' + v.nb_produits + ' produit(s) soumis' + limTxt +
      (v.live_vendor_id ? ' — lien : ?vendor=' + v.live_vendor_id : '')));

    var box = el('div', 'adm-actions');
    var row = el('div', 'adm-row');

    if (v.selfie_path) {
      var cmp = el('button', 'adm-btn adm-btn-blue', 'Comparer pièce + selfie'); cmp.type = 'button';
      cmp.addEventListener('click', function () { openCompare(v, cmp); });
      row.appendChild(cmp);
    } else {
      box.appendChild(el('p', 'adm-warn', 'Ancien dossier : pas de selfie. Vous pouvez demander au vendeur de refaire sa vérification, ou valider sur la seule pièce d\'identité.'));
    }
    var doc = el('button', 'adm-btn adm-btn-ghost', 'Voir la pièce seule'); doc.type = 'button';
    doc.addEventListener('click', function () {
      doc.disabled = true;
      signed(v.doc_path).then(function (url) {
        if (/\.pdf(\?|$)/i.test(v.doc_path)) window.open(url, '_blank', 'noopener');
        else openLightbox(url);
      }).catch(function (e) { toast('Pièce introuvable : ' + e.message, true); })
        .then(function () { doc.disabled = false; });
    });
    row.appendChild(doc);

    if (v.statut !== 'valide') {
      var ok = el('button', 'adm-btn adm-btn-ok', 'Valider le vendeur'); ok.type = 'button';
      ok.addEventListener('click', function () {
        if (!confirm('Valider « ' + v.boutique + ' » ? Vous avez vérifié sa pièce d\'identité. (Aucun produit n\'est publié pour autant.)')) return;
        act(ok, function () { return rpc('admin_valider_vendeur', { p_email: v.email }); }, 'Vendeur validé.');
      });
      row.appendChild(ok);
    }
    if (v.statut !== 'refuse') {
      var sp = el('button', 'adm-btn adm-btn-red', 'Suspendre'); sp.type = 'button';
      sp.addEventListener('click', function () {
        if (!confirm('Suspendre « ' + v.boutique + ' » ? Sa boutique sera masquée du site.')) return;
        act(sp, function () { return rpc('admin_suspendre_vendeur', { p_email: v.email }); }, 'Vendeur suspendu.');
      });
      row.appendChild(sp);
    }
    box.appendChild(row);

    // Limite de produits propre à ce vendeur
    if (!state.noSettings) {
      var lb = el('div', 'adm-limit-box');
      var ll = el('label', null, 'Limite de produits de CE vendeur'); ll.setAttribute('for', 'lim-' + v.user_id);
      var lrow = el('div', 'adm-row adm-row-tight');
      var li = el('input', 'adm-input adm-num'); li.id = 'lim-' + v.user_id; li.type = 'number'; li.min = '1'; li.max = '100'; li.step = '1';
      li.inputMode = 'numeric'; li.placeholder = String(state.globalLimit);
      if (v.max_produits != null) li.value = String(v.max_produits);
      var lsave = el('button', 'adm-btn adm-btn-blue adm-btn-sm', 'Enregistrer'); lsave.type = 'button';
      lsave.addEventListener('click', function () {
        var n = parseInt(li.value, 10);
        if (!isFinite(n) || n < 1 || n > 100) { toast('Entrez un nombre entre 1 et 100.', true); li.focus(); return; }
        act(lsave, function () { return rpc('admin_definir_limite_vendeur', { p_email: v.email, p_valeur: n }); }, 'Limite enregistrée.');
      });
      lrow.appendChild(li); lrow.appendChild(lsave);
      if (v.max_produits != null) {
        var lreset = el('button', 'adm-btn adm-btn-ghost adm-btn-sm', 'Revenir à la limite globale'); lreset.type = 'button';
        lreset.addEventListener('click', function () {
          act(lreset, function () { return rpc('admin_definir_limite_vendeur', { p_email: v.email, p_valeur: null }); }, 'Limite globale appliquée.');
        });
        lrow.appendChild(lreset);
      }
      lb.appendChild(ll); lb.appendChild(lrow);
      lb.appendChild(el('small', 'adm-hint', 'Vide = limite globale (' + state.globalLimit + '). Ne supprime aucun produit déjà soumis.'));
      box.appendChild(lb);
    }
    card.appendChild(box);
    return card;
  }

  /* ---------- démarrage ---------- */
  buildFilter();
  show('view-login');   // remplacé dès que la session est lue (onAuthStateChange)
})();
