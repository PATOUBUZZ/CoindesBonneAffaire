/* ============================================================
   PUSH.JS — Notifications push (côté navigateur / application installée)
   - enregistre le service worker /sw.js
   - affiche une cloche dans le header (si les notifications sont possibles)
   - au clic : demande l'autorisation, crée l'abonnement Push et l'enregistre
     dans la table Supabase "push_subscriptions"
   L'ENVOI des notifications se fait côté serveur (api/send-push.js), depuis
   une ligne ajoutée dans la table Supabase "push_notifications".
   Totalement isolé : si quelque chose échoue, le site continue normalement.
   ============================================================ */
(function () {
  'use strict';

  var cfg = window.PLATFORM_CONFIG || {};
  var sb = cfg.supabase || {};
  var vapid = (cfg.push && cfg.push.vapidPublicKey) || '';
  if (!vapid || !sb.url || !sb.anonKey) return;      // non configuré : rien ne change

  var ROLE_KEY = 'push_role';

  // Un vendeur ouvre le site une fois via  https://votre-site/?role=vendor
  // -> ses notifications pourront être ciblées « vendeurs » (rôle mémorisé).
  try {
    var qs = new URLSearchParams(window.location.search);
    var r = qs.get('role');
    if (r === 'vendor' || r === 'user') localStorage.setItem(ROLE_KEY, r);
  } catch (e) { /* non bloquant */ }

  function getRole() {
    try { return localStorage.getItem(ROLE_KEY) === 'vendor' ? 'vendor' : 'user'; }
    catch (e) { return 'user'; }
  }

  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var isStandalone = (window.navigator.standalone === true) ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  var supported = ('serviceWorker' in navigator) && ('PushManager' in window) && ('Notification' in window);
  // Sur iPhone, le push n'existe que pour le site AJOUTÉ à l'écran d'accueil.
  var iosNeedsInstall = isIOS && !isStandalone;
  if (!supported && !iosNeedsInstall) return;

  function toast(msg) {
    if (typeof window.showShareToast === 'function') window.showShareToast(msg);
    else window.alert(msg);
  }

  function urlBase64ToUint8Array(b64) {
    var padding = '='.repeat((4 - (b64.length % 4)) % 4);
    var base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    var raw = window.atob(base64);
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  function saveSubscription(sub) {
    var j = sub.toJSON();
    if (!j || !j.endpoint || !j.keys) return Promise.resolve();
    // "ignore-duplicates" : si l'appareil est déjà enregistré, rien ne se passe.
    return fetch(sb.url.replace(/\/+$/, '') + '/rest/v1/push_subscriptions?on_conflict=endpoint', {
      method: 'POST',
      headers: {
        apikey: sb.anonKey,
        Authorization: 'Bearer ' + sb.anonKey,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal'
      },
      body: JSON.stringify({
        endpoint: j.endpoint,
        p256dh: j.keys.p256dh,
        auth: j.keys.auth,
        role: getRole()
      })
    }).then(function (res) {
      if (!res.ok) throw new Error('enregistrement HTTP ' + res.status);
    });
  }

  var btn = document.getElementById('push-toggle-btn');

  function setState(on) {
    if (!btn) return;
    btn.style.display = '';
    btn.classList.toggle('is-on', !!on);
    btn.setAttribute('aria-label', on ? 'Notifications activées' : 'Activer les notifications');
    btn.title = on ? 'Notifications activées' : 'Activer les notifications';
    var i = btn.querySelector('i');
    if (i) i.className = on ? 'fas fa-bell' : 'far fa-bell';
  }

  function getRegistration() {
    return navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(function () { return navigator.serviceWorker.ready; });
  }

  function subscribe() {
    return getRegistration().then(function (reg) {
      return reg.pushManager.getSubscription().then(function (existing) {
        return existing || reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid)
        });
      });
    }).then(function (sub) {
      return saveSubscription(sub).then(function () { return sub; });
    });
  }

  function onClick() {
    if (iosNeedsInstall) {
      toast('Sur iPhone : Partager → « Sur l\'écran d\'accueil », puis rouvrez l\'application.');
      return;
    }
    if (Notification.permission === 'denied') {
      toast('Notifications bloquées : autorisez-les dans les réglages du navigateur.');
      return;
    }
    // Déjà actif : le bouton permet de se désabonner.
    if (btn && btn.classList.contains('is-on')) {
      getRegistration().then(function (reg) {
        return reg.pushManager.getSubscription();
      }).then(function (sub) {
        return sub ? sub.unsubscribe() : null;
      }).then(function () {
        setState(false);
        toast('Notifications désactivées');
      }).catch(function () { /* non bloquant */ });
      return;
    }
    Notification.requestPermission().then(function (perm) {
      if (perm !== 'granted') {
        toast('Notifications non autorisées');
        return;
      }
      return subscribe().then(function () {
        setState(true);
        toast('🔔 Notifications activées !');
      });
    }).catch(function (err) {
      if (window.console) console.warn('[Push] échec :', err && err.message);
      toast('Impossible d\'activer les notifications pour le moment.');
    });
  }

  function init() {
    if (!btn) return;
    btn.addEventListener('click', onClick);
    if (iosNeedsInstall) { setState(false); return; }
    if (Notification.permission === 'denied') return;     // on ne harcèle pas
    if (Notification.permission === 'granted') {
      // Déjà autorisé : on (ré)enregistre l'abonnement en silence (renouvellement).
      subscribe().then(function () { setState(true); })
        .catch(function () { setState(false); });
    } else {
      setState(false);
      getRegistration().catch(function () { /* non bloquant */ });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
