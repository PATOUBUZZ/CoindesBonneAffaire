/* ============================================================
   SW.JS — Service worker (à placer À LA RACINE du site, à côté d'index.html)
   Rôle UNIQUE : afficher les notifications push et ouvrir le bon lien au
   clic. Il n'intercepte aucune requête réseau (pas de cache) : il ne peut
   donc rien changer au fonctionnement actuel du site.
   Si vous avez déjà un sw.js, copiez-y les deux écouteurs ci-dessous
   ("push" et "notificationclick") au lieu de remplacer votre fichier.
   ============================================================ */

var DEFAULT_ICON = '/img/launchericon-192x192.png';  // logo du site : image affichée dans la notification
<<<<<<< HEAD
var DEFAULT_BADGE = '/img/img/launchericon-96x96.png';             // petit symbole de la barre d'état Android (silhouette blanche sur fond transparent)
=======
var DEFAULT_BADGE = '/img/badge-96.png';             // petit symbole de la barre d'état Android (silhouette blanche sur fond transparent)
>>>>>>> 4845f1e674cf7406c90cb34522de236d66406e97
var DEFAULT_URL = '/';

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) { event.waitUntil(self.clients.claim()); });

// ---- Réception d'une notification ----
self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (e) { data = { title: 'Nya-Market', body: event.data ? event.data.text() : '' }; }

  var title = data.title || 'Nya-Market';
  var options = {
    body: data.body || '',
    icon: data.icon || DEFAULT_ICON,          // petite image d'illustration (style Alibaba)
    badge: data.badge || DEFAULT_BADGE,
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
