/* ============================================================
   BRAND.JS — Logo configurable (index.html + vendeur.html)
   ------------------------------------------------------------
   Lit window.PLATFORM_CONFIG.brand (voir config.js) :
     logo    : chemin ou URL de votre logo. "" = on garde l'icône de boutique.
     logoAlt : texte alternatif.
     favicon : true = le logo sert aussi d'icône d'onglet.

   Le logo remplace l'icône située à gauche du nom dans le header : tout
   élément portant l'attribut  data-brand-logo  est remplacé.
   Si l'image est introuvable, l'icône d'origine est conservée (rien ne casse).
   Aucun identifiant, aucune classe JS existante n'est modifié.
   ============================================================ */
(function () {
  'use strict';

  var brand = (window.PLATFORM_CONFIG && window.PLATFORM_CONFIG.brand) || {};
  var src = String(brand.logo || '').trim();
  if (!src) return;                                   // pas de logo : on ne change rien
  if (/^\s*(javascript|vbscript):/i.test(src)) return; // sécurité : jamais de schéma exécutable

  // Style du logo (injecté ici pour ne dépendre d'aucune feuille de style)
  var style = document.createElement('style');
  style.textContent =
    '.brand-logo-img{height:34px;width:auto;max-width:120px;object-fit:contain;' +
    'border-radius:8px;flex:0 0 auto;display:block}' +
    '@media (min-width:700px){.brand-logo-img{height:40px;max-width:150px}}';
  document.head.appendChild(style);

  function apply() {
    var slots = document.querySelectorAll('[data-brand-logo]');
    Array.prototype.forEach.call(slots, function (icon) {
      var img = document.createElement('img');
      img.className = 'brand-logo-img';
      img.alt = String(brand.logoAlt || brand.name || 'Logo');
      img.decoding = 'async';
      img.onload = function () { icon.style.display = 'none'; };   // logo chargé : on masque l'icône
      img.onerror = function () {                                  // logo introuvable : on garde l'icône
        if (img.parentNode) img.parentNode.removeChild(img);
      };
      img.src = src;
      icon.parentNode.insertBefore(img, icon);
    });

    // Icône d'onglet du navigateur
    if (brand.favicon !== false) {
      var link = document.querySelector('link[rel~="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = src;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
