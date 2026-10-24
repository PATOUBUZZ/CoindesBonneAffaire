/* ============================================================
   ANNOUNCEMENTS.JS — Bandeau d'annonces / actualités (header fixe)
   Lit la table Supabase "announcements" (lecture publique des lignes
   is_active = true) et affiche les messages en défilement continu.
   - Chaque message est cliquable si la colonne "link" est renseignée.
   - Désactivation : PLATFORM_CONFIG.announcements.enabled = false (général)
                     ou is_active = false sur une ligne (message par message).
   - Totalement isolé : en cas d'erreur / table absente / aucun message,
     RIEN n'est affiché et le reste du site n'est pas affecté.
   ============================================================ */
(function () {
  'use strict';

  var cfg = window.PLATFORM_CONFIG || {};
  var ann = cfg.announcements || {};
  var sb = cfg.supabase || {};

  if (ann.enabled === false) return;               // interrupteur général
  if (!sb.url || !sb.anonKey) return;              // Supabase non configuré

  var TABLE = ann.table || 'announcements';

  // N'accepte que des liens http(s), relatifs, ancres (#produit) ou ?vendor=…
  // (bloque notamment "javascript:").
  function safeLink(href) {
    var h = String(href == null ? '' : href).trim();
    if (!h) return '';
    if (/^(https?:\/\/|\/|#|\?)/i.test(h)) return h;
    return '';
  }

  function isInWindow(row) {
    var now = Date.now();
    if (row.starts_at && new Date(row.starts_at).getTime() > now) return false;
    if (row.ends_at && new Date(row.ends_at).getTime() < now) return false;
    return true;
  }

  function fetchAnnouncements() {
    var endpoint = sb.url.replace(/\/+$/, '') + '/rest/v1/' + encodeURIComponent(TABLE) +
      '?select=id,message,link,sort_order,starts_at,ends_at,created_at' +
      '&is_active=eq.true&order=sort_order.asc,created_at.desc&limit=10';
    return fetch(endpoint, {
      headers: { apikey: sb.anonKey, Authorization: 'Bearer ' + sb.anonKey }
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  function buildItem(row) {
    var link = safeLink(row.link);
    var el = document.createElement(link ? 'a' : 'span');
    el.className = 'announce-item';
    if (link) {
      el.href = link;
      if (/^https?:\/\//i.test(link) && link.indexOf(window.location.origin) !== 0) {
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
      }
    }
    el.textContent = row.message;                  // textContent : aucun HTML interprété
    if (link) {
      var arrow = document.createElement('i');
      arrow.className = 'fas fa-chevron-right announce-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      el.appendChild(arrow);
    }
    return el;
  }

  function render(rows) {
    var slot = document.getElementById('announce-slot');
    if (!slot) return;
    slot.innerHTML = '';
    var list = (Array.isArray(rows) ? rows : []).filter(function (r) {
      return r && typeof r.message === 'string' && r.message.trim() && isInWindow(r);
    });
    if (!list.length) return;                      // rien à montrer : aucun espace vide

    var bar = document.createElement('div');
    bar.className = 'announce-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Annonces');

    var icon = document.createElement('span');
    icon.className = 'announce-icon';
    icon.innerHTML = '<i class="fas fa-bullhorn" aria-hidden="true"></i>';
    bar.appendChild(icon);

    var viewport = document.createElement('div');
    viewport.className = 'announce-viewport';
    var track = document.createElement('div');
    track.className = 'announce-track';

    // Deux séries identiques côte à côte : l'animation décale la piste de
    // -50 %, ce qui crée une boucle sans à-coup.
    for (var copy = 0; copy < 2; copy++) {
      var group = document.createElement('div');
      group.className = 'announce-group';
      if (copy === 1) group.setAttribute('aria-hidden', 'true');
      list.forEach(function (row) {
        group.appendChild(buildItem(row));
        var sep = document.createElement('span');
        sep.className = 'announce-sep';
        sep.textContent = '•';
        sep.setAttribute('aria-hidden', 'true');
        group.appendChild(sep);
      });
      track.appendChild(group);
    }
    viewport.appendChild(track);
    bar.appendChild(viewport);
    slot.appendChild(bar);

    // Vitesse constante (~45 px/s) quelle que soit la longueur du texte.
    requestAnimationFrame(function () {
      var group = track.firstChild;
      var width = group ? group.offsetWidth : 0;
      var seconds = Math.max(12, Math.round(width / 45));
      track.style.animationDuration = seconds + 's';
      // Si tout tient dans la largeur visible, inutile de faire défiler.
      if (width && width <= viewport.clientWidth) bar.classList.add('is-static');
    });
  }

  function start() {
    fetchAnnouncements().then(render).catch(function (err) {
      if (window.console) console.info('[Annonces] non affichées :', err.message);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
