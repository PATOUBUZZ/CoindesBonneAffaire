/* ============================================================
   SW.JS — Service worker (à placer À LA RACINE du site, à côté d'index.html)
   Rôle UNIQUE : afficher les notifications push et ouvrir le bon lien au
   clic. Il n'intercepte aucune requête réseau (pas de cache) : il ne peut
   donc rien changer au fonctionnement actuel du site.
   Si vous avez déjà un sw.js, copiez-y les deux écouteurs ci-dessous
   ("push" et "notificationclick") au lieu de remplacer votre fichier.
   ============================================================ */

var DEFAULT_ICON = '/img/launchericon-192x192.png';   // adaptez au nom réel de votre icône (facultatif)
var DEFAULT_URL = '/';

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) { event.waitUntil(self.clients.claim()); });

// ---- Réception d'une notification ----
self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (e) { data = { title: 'Le Coin des Bonnes Affaires', body: event.data ? event.data.text() : '' }; }

  var title = data.title || 'Le Coin des Bonnes Affaires';
  var options = {
    body: data.body || '',
    icon: data.icon || DEFAULT_ICON,          // petite image d'illustration (style Alibaba)
    badge: data.badge || DEFAULT_ICON,
    tag: data.tag || undefined,
    data: { url: data.url || DEFAULT_URL }
  };
  if (data.image) options.image = data.image; // grande bannière (Android/Chrome), facultative

  event.waitUntil(self.registration.showNotification(title, options));
});

// ---- Clic sur la notification : redirection vers le lien défini en base ----
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  var target = (event.notification.data && event.notification.data.url) || DEFAULT_URL;
  var absolute;
  try { absolute = new URL(target, self.location.origin).href; }
  catch (e) { absolute = self.location.origin + '/'; }
  // Sécurité : uniquement http(s)
  if (!/^https?:/i.test(absolute)) absolute = self.location.origin + '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      var sameOrigin = absolute.indexOf(self.location.origin) === 0;
      if (sameOrigin) {
        // Réutilise une fenêtre déjà ouverte du site (et la dirige vers le lien)
        for (var i = 0; i < list.length; i++) {
          var c = list[i];
          if (c.url.indexOf(self.location.origin) === 0 && 'navigate' in c) {
            return c.navigate(absolute).then(function (w) { return w && w.focus(); })
              .catch(function () { return self.clients.openWindow(absolute); });
          }
        }
      }
      return self.clients.openWindow(absolute);
    })
  );
});
