/* ============================================================
   VENDEUR.JS — Logique de l'espace vendeur (Nya-Market)
   ------------------------------------------------------------
   Dépend de : config.js (window.PLATFORM_CONFIG.supabase) et du SDK
   @supabase/supabase-js v2 (window.supabase).

   Tables      : vendeurs_attente, produits_soumis   (voir supabase-vendeur.sql)
   Storage     : vendeur-docs (PRIVÉ), produits-vendeurs (public)
   Flux        : Google OAuth -> profil absent ? modale profil -> tableau de bord
   Sécurité    : la limite de 10 produits, le statut "en_examen" et l'accès aux
                 pièces d'identité sont imposés CÔTÉ BASE (RLS + trigger) ;
                 ce fichier ne fait que l'interface.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. Réglages ---------- */
  var CFG = window.PLATFORM_CONFIG || {};
  var SB = CFG.supabase || {};

  var MAX_PRODUITS = 10;                    // valeur par défaut ; remplacée par VOTRE limite réelle (globale ou propre à ce vendeur) via ma_limite_produits()
  var MAX_PHOTOS = 4;
  var ADMIN_WA = '22961196907';              // WhatsApp de l'administrateur (sans +)
  var BUCKET_DOCS = 'vendeur-docs';
  var BUCKET_PHOTOS = 'produits-vendeurs';
  var MAX_DOC_BYTES = 5 * 1024 * 1024;       // 5 Mo
  var MAX_RAW_PHOTO_BYTES = 15 * 1024 * 1024; // photo brute avant compression

  // Compression : réglable dans config.js > uploads (valeurs bornées pour éviter
  // les réglages absurdes). Sans réglage, on retombe sur le mode "Équilibré".
  var UP = CFG.uploads || {};
  function num(v, def, min, max) {
    var n = Number(v);
    if (!isFinite(n)) n = def;
    return Math.min(max, Math.max(min, n));
  }
  var PHOTO_MAX_SIDE = num(UP.photoMaxSide, 1000, 400, 3000);
  var PHOTO_QUALITY = num(UP.photoQuality, 0.8, 0.4, 0.95);
  // Poids visé par photo (0 = désactivé -> plafond de sécurité 1,9 Mo = limite du bucket)
  var PHOTO_TARGET_BYTES = num(UP.photoTargetKB, 60, 0, 1900) * 1024 || 1900 * 1024;
  var DOC_MAX_SIDE = num(UP.docMaxSide, 1600, 800, 3000);
  var DOC_QUALITY = num(UP.docQuality, 0.82, 0.5, 0.95);
  var DOC_TARGET_BYTES = 4.5 * 1024 * 1024;   // sous la limite de 5 Mo

  /* ---------- 2. Helpers DOM ---------- */
  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  function showError(id, msg) {
    var el = $(id);
    el.textContent = msg || '';
    el.classList.toggle('hidden', !msg);
  }

  function openModal(id) {
    $(id).classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(id) {
    $(id).classList.add('hidden');
    document.body.style.overflow = '';
  }

  function hideLoader() {
    var l = $('app-loader');
    if (l && l.parentNode) l.parentNode.removeChild(l);
  }

  function setBusy(btn, busy, labelBusy) {
    if (!btn) return;
    if (busy) {
      btn.dataset.label = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>' + (labelBusy || 'Patientez…');
    } else {
      btn.disabled = false;
      if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
    }
  }

  /* ---------- 3. Client Supabase ---------- */
  if (!SB.url || !SB.anonKey || !window.supabase) {
    hideLoader();
    document.querySelector('main').innerHTML =
      '<p class="form-error">Configuration Supabase manquante (config.js) ou SDK non chargé.</p>';
    return;
  }
  var sb = window.supabase.createClient(SB.url, SB.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  /* ---------- 4. État ---------- */
  var state = {
    uid: null,
    email: '',
    profile: null,     // ligne vendeurs_attente
    products: [],      // lignes produits_soumis
    messages: [],      // messages de l'administrateur (fonction mes_messages)
    showReadMessages: false,
    lastRefresh: 0,
    editing: null,     // { id|null, photos: [{url?, file?, preview?}] }
    loadedFor: null    // uid pour lequel le chargement a déjà été fait
  };

  /* ---------- 5. Vues ---------- */
  function showView(name) {
    $('view-landing').classList.toggle('hidden', name !== 'landing');
    $('view-dashboard').classList.toggle('hidden', name !== 'dashboard');
    var lo = $('btn-logout');
    lo.classList.toggle('hidden', name === 'landing');
    lo.classList.toggle('inline-flex', name !== 'landing');
    updateContactLinks();
  }

  /* ---------- 6. Boutons fixes (WhatsApp pré-remplis) ---------- */
  function waLink(text) {
    return 'https://wa.me/' + ADMIN_WA + '?text=' + encodeURIComponent(text);
  }
  function updateContactLinks() {
    var p = state.profile;
    var notify, contact;
    if (p) {
      notify = '🔔 *NOUVEAU VENDEUR EN ATTENTE — Nya-Market*\n\n' +
        '🏪 Boutique : ' + p.boutique + '\n' +
        '👤 Vendeur : ' + p.nom_prenom + '\n' +
        '📧 Gmail : ' + p.email + '\n' +
        '📞 WhatsApp : ' + p.whatsapp + '\n' +
        (p.ville ? '📍 Ville : ' + p.ville + '\n' : '') +
        '📦 Produits soumis : ' + state.products.length + '/' + MAX_PRODUITS + '\n\n' +
        'Merci de vérifier mon dossier.';
      contact = 'Bonjour Nya-Market, je suis le vendeur de la boutique « ' + p.boutique + ' ». J\'aimerais avoir une information.';
    } else {
      notify = '🔔 Bonjour Nya-Market, je souhaite enregistrer ma boutique et je voudrais que vous soyez notifiés de ma demande.';
      contact = 'Bonjour Nya-Market, j\'ai une question sur l\'espace vendeur.';
    }
    $('btn-notify').href = waLink(notify);
    $('btn-contact').href = waLink(contact);
  }

  /* ---------- 7. Authentification ---------- */
  $('btn-google').addEventListener('click', function () {
    var btn = this;
    setBusy(btn, true, 'Redirection vers Google…');
    sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname }
    }).then(function (res) {
      if (res.error) { setBusy(btn, false); toast('Connexion impossible : ' + res.error.message); }
    });
  });

  $('btn-logout').addEventListener('click', function () {
    sb.auth.signOut().then(function () { window.location.reload(); });
  });

  // IMPORTANT : on ne fait aucun appel Supabase directement dans ce callback
  // (risque de blocage) ; on le reporte avec setTimeout.
  sb.auth.onAuthStateChange(function (_event, session) {
    setTimeout(function () { handleSession(session); }, 0);
  });

  function handleSession(session) {
    if (!session || !session.user) {
      state.uid = null; state.profile = null; state.products = []; state.messages = []; state.loadedFor = null;
      showView('landing');
      hideLoader();
      return;
    }
    // Évite de tout recharger à chaque renouvellement de jeton
    if (state.loadedFor === session.user.id) return;
    state.uid = session.user.id;
    state.email = session.user.email || '';
    state.loadedFor = session.user.id;
    loadProfile();
  }

  /* ---------- 8. Profil vendeur ---------- */
  function loadProfile() {
    return sb.from('vendeurs_attente').select('*').eq('user_id', state.uid).maybeSingle()
      .then(function (res) {
        hideLoader();
        if (res.error) { toast('Erreur de chargement du profil.'); showView('landing'); return; }
        if (!res.data) {                       // 1re connexion : pas de profil
          state.profile = null;
          showView('dashboard');
          $('p-email').value = state.email;
          openModal('modal-profile');
          return;
        }
        state.profile = res.data;
        return Promise.all([loadProducts(), loadLimit(), loadMessages()]).then(function () { showView('dashboard'); renderDashboard(); });
      });
  }

  // Limite de produits de CE vendeur (réglée par l'administrateur : globale ou spécifique).
  // Si la fonction n'existe pas encore (script SQL 5 non lancé), on garde 10.
  function loadLimit() {
    return sb.rpc('ma_limite_produits').then(function (r) {
      var n = r && !r.error ? Number(r.data) : NaN;
      if (isFinite(n) && n >= 1) MAX_PRODUITS = Math.floor(n);
    }).catch(function () { /* non bloquant */ });
  }

  /* ---------- Selfie de vérification (appareil photo en direct) ---------- */
  var selfie = { blob: null, previewUrl: null };
  var camStream = null;

  function setSelfie(blob) {
    selfie.blob = blob;
    if (selfie.previewUrl) URL.revokeObjectURL(selfie.previewUrl);
    selfie.previewUrl = blob ? URL.createObjectURL(blob) : null;
    var img = $('selfie-preview');
    if (blob) { img.src = selfie.previewUrl; img.classList.remove('hidden'); } else { img.removeAttribute('src'); img.classList.add('hidden'); }
    if (blob) showError('profile-error', '');
    $('btn-selfie').classList.toggle('is-done', !!blob);
    $('btn-selfie-label').textContent = blob ? 'Reprendre le selfie' : 'Prendre mon selfie';
    $('selfie-status').textContent = blob
      ? 'Selfie enregistré ✓ (vous pouvez le reprendre).'
      : 'Visage de face, bien éclairé, sans lunettes de soleil ni masque. Nous comparerons avec la photo du document.';
  }

  function stopCamera() {
    if (camStream) { camStream.getTracks().forEach(function (t) { t.stop(); }); camStream = null; }
    var v = $('cam-video'); try { v.pause(); } catch (e) {} v.srcObject = null;
  }
  function closeCamera() { stopCamera(); $('modal-camera').classList.add('hidden'); }

  function openCamera() {
    showError('cam-error', '');
    // Appareil photo non disponible dans ce navigateur : on ouvre l'appareil photo avant du téléphone (champ de secours)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { $('p-selfie-file').click(); return; }
    $('btn-cam-shoot').disabled = true;
    $('modal-camera').classList.remove('hidden');
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false
    }).then(function (stream) {
      camStream = stream;
      var v = $('cam-video');
      v.srcObject = stream;
      var pl = v.play(); if (pl && pl.catch) pl.catch(function () {});
      $('btn-cam-shoot').disabled = false;
    }).catch(function (err) {
      var denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      showError('cam-error', denied
        ? 'Accès à l\'appareil photo refusé. Autorisez la caméra pour ce site dans les réglages du navigateur, puis réessayez.'
        : 'Appareil photo introuvable ou déjà utilisé par une autre application.');
    });
  }

  function shootSelfie() {
    var v = $('cam-video');
    if (!v.videoWidth) { showError('cam-error', 'La caméra n\'est pas prête, patientez une seconde.'); return; }
    var scale = Math.min(1, 1000 / Math.max(v.videoWidth, v.videoHeight));
    var c = document.createElement('canvas');
    c.width = Math.round(v.videoWidth * scale);
    c.height = Math.round(v.videoHeight * scale);
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);     // image NON inversée
    c.toBlob(function (webp) {
      if (webp && webp.type === 'image/webp') { setSelfie(webp); closeCamera(); return; }
      c.toBlob(function (jpg) {
        if (!jpg) { showError('cam-error', 'Capture impossible, réessayez.'); return; }
        setSelfie(jpg); closeCamera();
      }, 'image/jpeg', 0.85);
    }, 'image/webp', 0.85);
  }

  $('btn-selfie').addEventListener('click', openCamera);
  $('btn-cam-cancel').addEventListener('click', closeCamera);
  $('btn-cam-shoot').addEventListener('click', shootSelfie);
  window.addEventListener('pagehide', stopCamera);
  $('p-selfie-file').addEventListener('change', function () {
    var f = this.files && this.files[0];
    this.value = '';
    if (!f) return;
    if (f.type.indexOf('image/') !== 0) { toast('Le selfie doit être une image.'); return; }
    compressImage(f, 1000, 0.85, 400 * 1024).then(function (r) { setSelfie(r.blob); })
      .catch(function () { toast('Selfie illisible, réessayez.'); });
  });

  function validWhatsapp(v) {
    var digits = String(v).replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15;
  }

  // Compression + envoi du document d'identité (bucket PRIVÉ)
  function prepareDoc(file) {
    if (file.type === 'application/pdf') {
      if (file.size > MAX_DOC_BYTES) return Promise.reject(new Error('PDF trop lourd (5 Mo max).'));
      return Promise.resolve({ blob: file, ext: 'pdf', type: 'application/pdf' });
    }
    if (file.type.indexOf('image/') !== 0) return Promise.reject(new Error('Format non accepté (image ou PDF).'));
    return compressImage(file, DOC_MAX_SIDE, DOC_QUALITY, DOC_TARGET_BYTES).then(function (r) {
      if (r.blob.size > MAX_DOC_BYTES) throw new Error('Image trop lourde (5 Mo max).');
      return r;
    });
  }

  $('form-profile').addEventListener('submit', function (e) {
    e.preventDefault();
    showError('profile-error', '');

    var boutique = $('p-boutique').value.trim();
    var nom = $('p-nom').value.trim();
    var wa = $('p-whatsapp').value.trim();
    var file = $('p-doc').files[0];
    var ville = $('p-ville').value.trim();
    var loc = $('p-loc').value.trim();

    if (boutique.length < 2) return showError('profile-error', 'Indiquez le nom de votre boutique.');
    if (nom.length < 3) return showError('profile-error', 'Indiquez votre nom et prénom.');
    if (!validWhatsapp(wa)) return showError('profile-error', 'Numéro WhatsApp invalide.');
    if (ville && (ville.length < 2 || ville.length > 60)) return showError('profile-error', 'La ville doit faire entre 2 et 60 caractères (ou laissez vide).');
    if (loc && (loc.length < 2 || loc.length > 120)) return showError('profile-error', 'La localisation doit faire entre 2 et 120 caractères (ou laissez vide).');
    if (!file) return showError('profile-error', 'Ajoutez la photo de votre document d\'identité.');
    if (!selfie.blob) return showError('profile-error', 'Prenez votre selfie 🤳 avec l\'appareil photo.');
    if (!$('p-cgu').checked) return showError('profile-error', 'Vous devez accepter les conditions.');

    var btn = $('btn-profile-submit');
    setBusy(btn, true, 'Envoi en cours…');
    var uploadedPath = null;
    var selfiePath = null;

    prepareDoc(file).then(function (doc) {
      uploadedPath = state.uid + '/identite-' + Date.now() + '.' + doc.ext;
      return sb.storage.from(BUCKET_DOCS).upload(uploadedPath, doc.blob, { contentType: doc.type, upsert: false });
    }).then(function (up) {
      if (up.error) throw up.error;
      var sType = selfie.blob.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
      selfiePath = state.uid + '/selfie-' + Date.now() + '.' + (sType === 'image/webp' ? 'webp' : 'jpg');
      return sb.storage.from(BUCKET_DOCS).upload(selfiePath, selfie.blob, { contentType: sType, upsert: false });
    }).then(function (up2) {
      if (up2.error) throw up2.error;
      var row = {
        user_id: state.uid,
        boutique: boutique,
        nom_prenom: nom,
        whatsapp: wa,
        email: state.email,
        doc_path: uploadedPath,
        selfie_path: selfiePath,
        cgu_acceptees_le: new Date().toISOString()
      };
      // Ville / localisation : facultatives, envoyées seulement si remplies
      if (ville) row.ville = ville;
      if (loc) row.localisation = loc;
      return sb.from('vendeurs_attente').insert(row).select().single();
    }).then(function (res) {
      if (res.error) throw res.error;
      state.profile = res.data;
      state.products = [];
      closeModal('modal-profile');
      $('form-profile').reset();
      setSelfie(null);
      return Promise.all([loadLimit(), loadMessages()]).then(function () {
        renderDashboard();
        updateContactLinks();
        toast('Demande envoyée ✓');
      });
    }).catch(function (err) {
      // Nettoie le fichier si l'enregistrement du profil a échoué
      var toRemove = [uploadedPath, selfiePath].filter(Boolean);
      if (toRemove.length) sb.storage.from(BUCKET_DOCS).remove(toRemove);
      showError('profile-error', 'Échec : ' + (err && err.message ? err.message : 'réessayez.'));
    }).then(function () { setBusy(btn, false); });
  });

  /* ---------- 8 bis. Boutique en ligne : bouton, lien, partage ---------- */
  // Lien public de la boutique = page d'accueil + ?vendor=<identifiant> (même format que le bouton « Partager la boutique » du site)
  function shopUrl(id) {
    var base = window.location.origin + window.location.pathname.replace(/[^\/]*$/, '');
    return base + '?vendor=' + encodeURIComponent(id);
  }
  function shopLive() {
    var p = state.profile;
    return !!(p && p.statut === 'valide' && p.live_vendor_id);
  }
  function renderShopLinks() {
    var p = state.profile;
    var live = shopLive();
    var btn = $('btn-view-shop');
    btn.classList.toggle('hidden', !live);
    btn.classList.toggle('flex', live);
    $('shop-share').classList.toggle('hidden', !live);
    $('note-lien-48h').classList.toggle('hidden', live);       // le lien est déjà là : la phrase d'attente n'a plus lieu d'être
    var hint = $('shop-link-hint');
    if (live) {
      var url = shopUrl(p.live_vendor_id);
      btn.href = url;
      $('shop-link-input').value = url;
      hint.classList.add('hidden');
    } else {
      btn.removeAttribute('href');
      hint.classList.remove('hidden');
      hint.textContent = (p && p.statut === 'refuse')
        ? 'Votre boutique est actuellement suspendue : elle n\'est pas visible sur Nya-Market.'
        : 'Le bouton « Voir ma boutique » et le lien à partager apparaîtront ici dès que votre boutique sera approuvée et en ligne.';
    }
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {      // secours (anciens navigateurs / page non sécurisée)
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('copie impossible'));
    });
  }

  var copyTimer = null;
  $('btn-copy-link').addEventListener('click', function () {
    if (!shopLive()) return;
    var url = shopUrl(state.profile.live_vendor_id);
    copyText(url).then(function () {
      var l = $('btn-copy-label');
      l.textContent = 'Lien copié ✓';
      clearTimeout(copyTimer);
      copyTimer = setTimeout(function () { l.textContent = 'Copier le lien'; }, 2200);
      toast('Lien copié ✓');
    }).catch(function () {
      var inp = $('shop-link-input'); inp.focus(); inp.select();
      toast('Copie automatique impossible : le lien est sélectionné, copiez-le à la main.');
    });
  });

  $('btn-share-link').addEventListener('click', function () {
    if (!shopLive()) return;
    var p = state.profile;
    var url = shopUrl(p.live_vendor_id);
    var text = 'Découvrez ma boutique « ' + p.boutique + ' » sur Nya-Market 🛍️';
    if (navigator.share) {                                  // partage natif du téléphone
      navigator.share({ title: p.boutique + ' — Nya-Market', text: text, url: url }).catch(function () { /* annulé */ });
      return;
    }
    // Pas de partage natif (ordinateur) : on ouvre WhatsApp avec le message prêt
    window.open('https://wa.me/?text=' + encodeURIComponent(text + '\n' + url), '_blank', 'noopener');
  });

  /* ---------- 8 ter. Ville / localisation (facultatives) ---------- */
  function renderLocation() {
    var p = state.profile;
    if (!p) return;
    var parts = [p.ville, p.localisation].filter(Boolean);
    $('shop-location').textContent = parts.length ? parts.join(' — ') : 'Ville non renseignée';
    $('btn-edit-loc').textContent = parts.length ? 'Modifier' : 'Ajouter ma ville';
  }
  $('btn-edit-loc').addEventListener('click', function () {
    var p = state.profile || {};
    $('l-ville').value = p.ville || '';
    $('l-loc').value = p.localisation || '';
    showError('loc-error', '');
    openModal('modal-loc');
  });
  $('btn-loc-close').addEventListener('click', function () { closeModal('modal-loc'); });
  $('form-loc').addEventListener('submit', function (e) {
    e.preventDefault();
    showError('loc-error', '');
    var ville = $('l-ville').value.trim();
    var loc = $('l-loc').value.trim();
    if (ville && (ville.length < 2 || ville.length > 60)) return showError('loc-error', 'La ville doit faire entre 2 et 60 caractères (ou laissez vide).');
    if (loc && (loc.length < 2 || loc.length > 120)) return showError('loc-error', 'La localisation doit faire entre 2 et 120 caractères (ou laissez vide).');
    var btn = $('btn-loc-submit');
    setBusy(btn, true, 'Enregistrement…');
    sb.rpc('maj_ma_localisation', { p_ville: ville || null, p_localisation: loc || null }).then(function (r) {
      if (r.error) throw r.error;
      return sb.from('vendeurs_attente').select('*').eq('user_id', state.uid).maybeSingle();
    }).then(function (res) {
      if (res.data) state.profile = res.data;
      renderLocation();
      closeModal('modal-loc');
      toast('Localisation enregistrée ✓');
    }).catch(function (err) {
      showError('loc-error', 'Échec : ' + (err && err.message ? err.message : 'réessayez.'));
    }).then(function () { setBusy(btn, false); });
  });

  /* ---------- 8 quater. Messages de l'administrateur ---------- */
  // Si le script SQL 6 n'est pas encore lancé, l'appel échoue : on n'affiche simplement rien.
  function loadMessages() {
    return sb.rpc('mes_messages').then(function (r) {
      state.messages = (r && !r.error && Array.isArray(r.data)) ? r.data : [];
    }).catch(function () { state.messages = []; });
  }
  // Lien autorisé : http(s), relatif, ancre ou ?… (jamais javascript:)
  function safeLink(u) {
    u = String(u || '').trim();
    return /^(https?:\/\/|\/|\?|#)/i.test(u) ? u : '';
  }
  var MSG_STYLE = {
    info:   { box: 'bg-blue-50 border-blue-200 border-l-brand text-blue-900',     icon: 'fa-info-circle' },
    alerte: { box: 'bg-orange-50 border-orange-200 border-l-deal text-orange-900', icon: 'fa-exclamation-triangle' },
    succes: { box: 'bg-emerald-50 border-emerald-200 border-l-ok text-emerald-900', icon: 'fa-check-circle' }
  };
  function renderMessages() {
    var box = $('messages-box'), list = $('messages-list'), hist = $('btn-messages-history');
    var all = state.messages || [];
    var unread = all.filter(function (m) { return !m.lu; });
    var read = all.length - unread.length;
    var shown = state.showReadMessages ? all : unread;
    list.textContent = '';
    box.classList.toggle('hidden', !all.length);
    if (!all.length) return;

    hist.classList.toggle('hidden', !read);
    hist.textContent = state.showReadMessages ? 'Masquer les messages lus' : 'Voir les messages lus (' + read + ')';

    if (!shown.length) {
      var none = document.createElement('p');
      none.className = 'text-xs text-slate-500';
      none.textContent = 'Aucun nouveau message.';
      list.appendChild(none);
      return;
    }
    shown.forEach(function (m) {
      var st = MSG_STYLE[m.niveau] || MSG_STYLE.info;
      var card = document.createElement('article');
      card.className = 'rounded-2xl border border-l-4 p-3 text-sm leading-relaxed ' + st.box + (m.lu ? ' opacity-70' : '');
      card.dataset.id = m.id;

      var head = document.createElement('div');
      head.className = 'flex items-start justify-between gap-2';
      var t = document.createElement('p');
      t.className = 'font-extrabold';
      var ic = document.createElement('i'); ic.className = 'fas ' + st.icon + ' mr-1';
      t.appendChild(ic); t.appendChild(document.createTextNode(m.titre || ''));
      head.appendChild(t);
      var d = document.createElement('span');
      d.className = 'text-[11px] opacity-70 shrink-0';
      try { d.textContent = new Date(m.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }); } catch (e) {}
      head.appendChild(d);
      card.appendChild(head);

      var body = document.createElement('p');
      body.className = 'mt-1 whitespace-pre-line break-words';
      body.textContent = m.message || '';           // texte brut : aucun HTML interprété
      card.appendChild(body);

      var actions = document.createElement('div');
      actions.className = 'mt-2 flex flex-wrap items-center gap-2';
      var link = safeLink(m.lien);
      if (link) {
        var a = document.createElement('a');
        a.href = link;
        if (/^https?:\/\//i.test(link)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        a.className = 'inline-flex items-center gap-1 rounded-full bg-white/80 border border-current px-3 min-h-[36px] text-xs font-bold';
        a.textContent = m.libelle_lien || 'En savoir plus';
        actions.appendChild(a);
      }
      if (!m.lu) {
        var b = document.createElement('button');
        b.type = 'button'; b.dataset.action = 'msg-read';
        b.className = 'inline-flex items-center gap-1 rounded-full bg-white/80 border border-current px-3 min-h-[36px] text-xs font-bold';
        b.textContent = 'J\'ai lu';
        actions.appendChild(b);
      }
      if (actions.childNodes.length) card.appendChild(actions);
      list.appendChild(card);
    });
  }
  $('messages-list').addEventListener('click', function (e) {
    var b = e.target.closest('[data-action="msg-read"]');
    if (!b) return;
    var id = b.closest('article').dataset.id;
    var m = state.messages.find(function (x) { return x.id === id; });
    if (!m) return;
    m.lu = true;                                   // on masque tout de suite ; la base est mise à jour derrière
    renderMessages();
    sb.rpc('marquer_message_lu', { p_id: id }).then(function (r) {
      if (r && r.error) { m.lu = false; renderMessages(); toast('Impossible d\'enregistrer. Réessayez.'); }
    });
  });
  $('btn-messages-history').addEventListener('click', function () {
    state.showReadMessages = !state.showReadMessages;
    renderMessages();
  });

  // Au retour sur l'onglet (ex. après avoir lu un message WhatsApp), on actualise discrètement
  // le profil, les produits et les messages (max. 1 fois toutes les 30 s).
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' || !state.uid || !state.profile) return;
    if (Date.now() - state.lastRefresh < 30000) return;
    state.lastRefresh = Date.now();
    sb.from('vendeurs_attente').select('*').eq('user_id', state.uid).maybeSingle().then(function (res) {
      if (res && res.data) state.profile = res.data;
      return Promise.all([loadProducts(), loadMessages()]);
    }).then(function () { renderDashboard(); }).catch(function () { /* silencieux */ });
  });

  /* ---------- 9. Produits : chargement + affichage ---------- */
  function loadProducts() {
    return sb.from('produits_soumis').select('*').eq('vendeur_id', state.uid)
      .order('created_at', { ascending: false })
      .then(function (res) {
        if (res.error) { toast('Erreur de chargement des produits.'); return; }
        state.products = res.data || [];
      });
  }

  function fcfa(n) { return Number(n || 0).toLocaleString('fr-FR') + ' FCFA'; }

  function renderDashboard() {
    var p = state.profile;
    if (!p) return;
    $('shop-name').textContent = p.boutique;
    $('shop-account-status').innerHTML = p.statut === 'valide'
      ? '<span class="badge badge-publie"><i class="fas fa-check-circle"></i> Boutique validée</span>'
      : '<span class="badge badge-pending"><i class="fas fa-hourglass-half"></i> Dossier en vérification</span>';

    renderLocation();
    renderShopLinks();
    renderMessages();

    var n = state.products.length;
    $('count-current').textContent = n;
    $('count-max').textContent = MAX_PRODUITS;
    $('count-bar').style.width = Math.min(100, (n / MAX_PRODUITS) * 100) + '%';

    var full = n >= MAX_PRODUITS;
    $('btn-add-product').disabled = full;
    $('btn-add-label').textContent = full ? 'Limite de ' + MAX_PRODUITS + ' produits atteinte' : 'Ajouter un produit';

    var list = $('products-list');
    if (!n) {
      list.innerHTML =
        '<div class="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">' +
        '<i class="fas fa-box-open text-3xl text-slate-300 mb-2"></i>' +
        '<p class="font-bold text-slate-700">Aucun produit pour le moment</p>' +
        '<p class="text-sm mt-1">Ajoutez votre premier produit pour lancer votre boutique.</p></div>';
      return;
    }

    list.innerHTML = state.products.map(function (pr) {
      var img = (pr.images && pr.images[0]) || '';
      var badge = pr.statut === 'publie'
        ? '<span class="badge badge-publie"><i class="fas fa-check"></i> Publié</span>'
        : pr.statut === 'refuse'
          ? '<span class="badge badge-refuse"><i class="fas fa-ban"></i> Refusé</span>'
          : '<span class="badge badge-review"><i class="fas fa-clock"></i> En examen</span>';
      var motif = (pr.statut === 'refuse' && pr.motif_refus)
        ? '<p class="text-xs text-red-600 mt-1">Motif : ' + esc(pr.motif_refus) + '</p>' : '';
      return '' +
        '<article class="prod-card" data-id="' + esc(pr.id) + '">' +
          (img ? '<img class="prod-thumb" src="' + esc(img) + '" alt="" loading="lazy">' : '<div class="prod-thumb"></div>') +
          '<div class="min-w-0 flex-1">' +
            '<div class="flex items-start justify-between gap-2">' +
              '<h4 class="font-extrabold text-slate-900 leading-tight truncate">' + esc(pr.nom) + '</h4>' + badge +
            '</div>' +
            '<p class="font-extrabold text-deal mt-1">' + esc(fcfa(pr.prix)) + '</p>' + motif +
            '<div class="flex gap-2 mt-2">' +
              '<button type="button" class="prod-act prod-edit" data-action="edit"><i class="fas fa-pen"></i> Modifier</button>' +
              '<button type="button" class="prod-act prod-del" data-action="delete"><i class="fas fa-trash"></i> Supprimer</button>' +
            '</div>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  $('products-list').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var card = btn.closest('.prod-card');
    var prod = state.products.find(function (p) { return p.id === card.dataset.id; });
    if (!prod) return;
    if (btn.dataset.action === 'edit') openProductModal(prod);
    if (btn.dataset.action === 'delete') deleteProduct(prod);
  });

  /* ---------- 10. Images : compression WebP côté navigateur ---------- */
  // compressImage(fichier, côté max (px), qualité de départ, poids visé en octets)
  // Encode en WebP (JPEG si le navigateur ne sait pas). Si le résultat dépasse le
  // poids visé : on baisse d'abord la qualité (par paliers de 0,1 jusqu'à 0,4),
  // puis on réduit la taille de 15 % et on recommence — au mieux 14 essais.
  function compressImage(file, maxSide, quality, targetBytes) {
    var MIN_Q = 0.4, MIN_SIDE = 480, MAX_TRIES = 14;

    return createImageBitmap(file, { imageOrientation: 'from-image' }).then(function (bmp) {
      var srcMax = Math.max(bmp.width, bmp.height);
      var side = Math.min(maxSide, srcMax);
      var q = quality;
      var canvas = render(side);

      function render(sd) {
        var scale = Math.min(1, sd / srcMax);
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(bmp.width * scale));
        c.height = Math.max(1, Math.round(bmp.height * scale));
        c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
        return c;
      }

      function encode(c, quality01) {
        return new Promise(function (resolve, reject) {
          c.toBlob(function (blob) {
            if (!blob) return reject(new Error('Image illisible.'));
            if (blob.type === 'image/webp') return resolve({ blob: blob, ext: 'webp', type: 'image/webp' });
            // Safari ancien : pas d'encodage WebP (renvoie du PNG) -> repli JPEG
            c.toBlob(function (jpg) {
              if (!jpg) return reject(new Error('Image illisible.'));
              resolve({ blob: jpg, ext: 'jpg', type: 'image/jpeg' });
            }, 'image/jpeg', quality01);
          }, 'image/webp', quality01);
        });
      }

      function attempt(n) {
        return encode(canvas, q).then(function (r) {
          if (!targetBytes || r.blob.size <= targetBytes || n >= MAX_TRIES) return r;
          if (q - 0.1 >= MIN_Q - 0.001) {
            q = Math.round((q - 0.1) * 100) / 100;                 // 1) qualité plus basse
          } else if (side * 0.85 >= MIN_SIDE) {
            side = Math.round(side * 0.85);                         // 2) image plus petite
            q = Math.max(MIN_Q, Math.round((quality - 0.2) * 100) / 100);
            canvas = render(side);
          } else {
            return r;                                               // limite atteinte : meilleur résultat possible
          }
          return attempt(n + 1);
        });
      }

      return attempt(1).then(function (r) {
        if (bmp.close) bmp.close();
        return r;
      }, function (err) {
        if (bmp.close) bmp.close();
        throw err;
      });
    });
  }

  function pathFromPublicUrl(url) {
    var parts = String(url).split('/' + BUCKET_PHOTOS + '/');
    return parts[1] ? decodeURIComponent(parts[1].split('?')[0]) : null;
  }

  function randomName() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  /* ---------- 11. Modale produit (ajout / modification) ---------- */
  function renderPhotoGrid() {
    var photos = state.editing.photos;
    $('photo-count').textContent = '(' + photos.length + '/' + MAX_PHOTOS + ')';
    var html = '';
    for (var i = 0; i < MAX_PHOTOS; i++) {
      var ph = photos[i];
      if (ph) {
        html += '<div class="photo-slot filled"><img src="' + esc(ph.preview || ph.url) + '" alt="Photo ' + (i + 1) + '">' +
                '<button type="button" class="photo-remove" data-remove="' + i + '" aria-label="Retirer la photo"><i class="fas fa-times"></i></button></div>';
      } else {
        html += '<label for="f-photos" class="photo-slot" aria-label="Ajouter une photo"><i class="fas fa-plus"></i></label>';
      }
    }
    $('photo-grid').innerHTML = html;
  }

  function openProductModal(prod) {
    if (!prod && state.products.length >= MAX_PRODUITS) {
      toast('Limite de ' + MAX_PRODUITS + ' produits atteinte.');
      return;
    }
    state.editing = {
      id: prod ? prod.id : null,
      originalUrls: prod ? (prod.images || []).slice() : [],
      photos: prod ? (prod.images || []).map(function (u) { return { url: u }; }) : []
    };
    $('product-title').textContent = prod ? 'Modifier le produit' : 'Ajouter un produit';
    $('btn-product-label').textContent = prod ? 'Enregistrer les modifications' : 'Soumettre pour examen';
    $('f-nom').value = prod ? prod.nom : '';
    $('f-prix').value = prod ? prod.prix : '';
    $('f-desc').value = prod ? (prod.description || '') : '';
    $('f-carac').value = prod ? (prod.caracteristiques || '') : '';
    $('f-photos').value = '';
    showError('product-error', '');

    var warn = $('product-warning');
    if (prod && prod.statut === 'publie') {
      warn.textContent = '⚠️ Ce produit est publié. Toute modification sera soumise à une nouvelle vérification : la version actuelle reste en ligne jusqu\'à son autorisation.';
      warn.classList.remove('hidden');
    } else {
      warn.classList.add('hidden');
    }
    renderPhotoGrid();
    openModal('modal-product');
  }

  function releasePreviews() {
    if (!state.editing) return;
    state.editing.photos.forEach(function (p) { if (p.preview) URL.revokeObjectURL(p.preview); });
  }
  function closeProductModal() {
    releasePreviews();
    state.editing = null;
    closeModal('modal-product');
  }

  $('btn-add-product').addEventListener('click', function () { openProductModal(null); });
  $('btn-product-close').addEventListener('click', closeProductModal);
  $('modal-product').addEventListener('click', function (e) { if (e.target === this) closeProductModal(); });

  $('f-photos').addEventListener('change', function () {
    var ed = state.editing;
    if (!ed) return;
    var files = Array.prototype.slice.call(this.files || []);
    files.forEach(function (f) {
      if (ed.photos.length >= MAX_PHOTOS) return;
      if (f.type.indexOf('image/') !== 0) { toast('Une photo n\'est pas une image.'); return; }
      if (f.size > MAX_RAW_PHOTO_BYTES) { toast('Photo trop lourde (15 Mo max).'); return; }
      ed.photos.push({ file: f, preview: URL.createObjectURL(f) });
    });
    this.value = '';
    renderPhotoGrid();
  });

  $('photo-grid').addEventListener('click', function (e) {
    var rm = e.target.closest('[data-remove]');
    if (!rm || !state.editing) return;
    var removed = state.editing.photos.splice(parseInt(rm.dataset.remove, 10), 1)[0];
    if (removed && removed.preview) URL.revokeObjectURL(removed.preview);
    renderPhotoGrid();
  });

  $('form-product').addEventListener('submit', function (e) {
    e.preventDefault();
    var ed = state.editing;
    if (!ed) return;
    showError('product-error', '');

    var nom = $('f-nom').value.trim();
    var prix = parseInt($('f-prix').value, 10);
    var desc = $('f-desc').value.trim();
    var carac = $('f-carac').value.trim();

    if (nom.length < 2) return showError('product-error', 'Indiquez le nom du produit.');
    if (!isFinite(prix) || prix < 1) return showError('product-error', 'Indiquez un prix valide en FCFA.');
    if (desc.length < 5) return showError('product-error', 'Ajoutez une description.');
    if (!ed.photos.length) return showError('product-error', 'Ajoutez au moins une photo.');
    if (!ed.id && state.products.length >= MAX_PRODUITS) return showError('product-error', 'Limite de produits atteinte.');

    var btn = $('btn-product-submit');
    setBusy(btn, true, 'Envoi des photos…');
    var uploadedNow = [];   // chemins envoyés pendant cette sauvegarde (pour nettoyage en cas d'échec)

    // 1) Envoi des nouvelles photos (compressées) ; les anciennes gardent leur URL
    Promise.all(ed.photos.map(function (ph) {
      if (ph.url) return Promise.resolve(ph.url);
      return compressImage(ph.file, PHOTO_MAX_SIDE, PHOTO_QUALITY, PHOTO_TARGET_BYTES).then(function (r) {
        var path = state.uid + '/' + randomName() + '.' + r.ext;
        return sb.storage.from(BUCKET_PHOTOS).upload(path, r.blob, {
          contentType: r.type, cacheControl: '31536000', upsert: false
        }).then(function (up) {
          if (up.error) throw up.error;
          uploadedNow.push(path);
          return sb.storage.from(BUCKET_PHOTOS).getPublicUrl(path).data.publicUrl;
        });
      });
    })).then(function (urls) {
      // 2) Enregistrement (le statut est toujours "en_examen" : imposé aussi par la base)
      var row = { nom: nom, prix: prix, description: desc, caracteristiques: carac, images: urls, statut: 'en_examen' };
      if (ed.id) {
        return sb.from('produits_soumis').update(row).eq('id', ed.id).select().single()
          .then(function (res) { return { res: res, urls: urls }; });
      }
      row.vendeur_id = state.uid;
      return sb.from('produits_soumis').insert(row).select().single()
        .then(function (res) { return { res: res, urls: urls }; });
    }).then(function (out) {
      if (out.res.error) throw out.res.error;
      // 3) Supprime du stockage les photos retirées pendant la modification
      var gone = ed.originalUrls.filter(function (u) { return out.urls.indexOf(u) === -1; })
        .map(pathFromPublicUrl).filter(Boolean);
      if (gone.length) sb.storage.from(BUCKET_PHOTOS).remove(gone);

      var wasEdit = !!ed.id;
      closeProductModal();
      return loadProducts().then(function () {
        renderDashboard();
        updateContactLinks();
        toast(wasEdit ? 'Produit modifié — en examen ✓' : 'Produit soumis — en examen ✓');
      });
    }).catch(function (err) {
      if (uploadedNow.length) sb.storage.from(BUCKET_PHOTOS).remove(uploadedNow);
      var m = (err && err.message) || 'réessayez.';
      if (/limite/i.test(m)) m = 'Limite de ' + MAX_PRODUITS + ' produits atteinte.';
      showError('product-error', 'Échec : ' + m);
    }).then(function () { setBusy(btn, false); });
  });

  /* ---------- 12. Suppression ---------- */
  function deleteProduct(prod) {
    if (!window.confirm('Supprimer « ' + prod.nom + ' » ? Cette action est définitive.')) return;
    sb.from('produits_soumis').delete().eq('id', prod.id).then(function (res) {
      if (res.error) { toast('Suppression impossible.'); return; }
      var paths = (prod.images || []).map(pathFromPublicUrl).filter(Boolean);
      if (paths.length) sb.storage.from(BUCKET_PHOTOS).remove(paths);
      return loadProducts().then(function () {
        renderDashboard();
        updateContactLinks();
        toast('Produit supprimé');
      });
    });
  }

  /* ---------- 13. Démarrage ---------- */
  updateContactLinks();
  // Filet de sécurité : le loader ne reste jamais plus de 8 s
  setTimeout(hideLoader, 8000);
  // (l'état initial est déclenché par onAuthStateChange -> INITIAL_SESSION)
})();
