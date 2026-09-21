/* ============================================================
   PLATFORM.JS — Cœur multi-vendeurs (à ne pas modifier au quotidien)
   - enregistre les vendeurs (fichiers vendors/*.js)
   - vérifie leurs données (un vendeur défectueux est ignoré, pas le site)
   - génère les cartes produits avec EXACTEMENT le même HTML qu'avant
   - fournit à index.js : numéro WhatsApp du vendeur, regroupement du panier
   ============================================================ */
(function (global) {
  'use strict';

  var cfg = global.PLATFORM_CONFIG || {};
  var MAX_SLOTS = cfg.maxSlotsPerVendor || 6;

  var vendors = [];        // dans l'ordre d'enregistrement
  var vendorById = {};
  var productIndex = {};   // id produit -> { product, vendor }
  var houseVendor = null;

  // ---------- Utilitaires ----------
  function warn() {
    if (global.console) console.warn.apply(console, ['[Platform]'].concat([].slice.call(arguments)));
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function toPhone(num) {                       // "+229 01 90 00 00 00" -> "+2290190000000"
    var d = String(num == null ? '' : num).replace(/\D/g, '');
    return d ? '+' + d : '';
  }
  function fmt(n) { return Number(n).toLocaleString('fr-FR'); }
  function cap(s) { s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }
  var SAFE_ID = /^[a-z0-9][a-z0-9_-]*$/i;

  // ---------- Enregistrement d'un vendeur ----------
  function registerVendor(v) {
    if (!v || !v.id || !v.name) { warn('Vendeur ignoré : "id" et "name" sont obligatoires.', v); return false; }
    if (!SAFE_ID.test(v.id)) { warn('Vendeur ignoré : id invalide (lettres, chiffres, - et _ uniquement) :', v.id); return false; }
    if (vendorById[v.id]) { warn('Vendeur ignoré : id déjà utilisé :', v.id); return false; }

    var phone = toPhone(v.whatsapp);
    if (!phone) { warn('Vendeur ignoré (' + v.id + ') : numéro WhatsApp manquant.'); return false; }

    // Validation des produits
    var valid = [];
    (Array.isArray(v.products) ? v.products : []).forEach(function (p, i) {
      var where = v.id + ' / produit #' + (i + 1);
      if (!p || !p.id || !p.name || !p.category) { warn(where + ' ignoré : id, name et category obligatoires.'); return; }
      if (!SAFE_ID.test(p.id)) { warn(where + ' ignoré : id invalide :', p.id); return; }
      if (!SAFE_ID.test(p.category)) { warn(where + ' ignoré : category invalide :', p.category); return; }
      if (productIndex[p.id]) { warn(where + ' ignoré : id produit déjà utilisé :', p.id); return; }
      if (!isFinite(p.price) || Number(p.price) < 0) { warn(where + ' ignoré : prix invalide.'); return; }
      if (!Array.isArray(p.images) || !p.images.length) { warn(where + ' ignoré : au moins une image est requise.'); return; }
      valid.push(p);
    });

    // Limite d'emplacements (sauf boutique principale)
    var limit = v.house ? Infinity : MAX_SLOTS;
    if (valid.length > limit) {
      warn(v.id + ' : ' + valid.length + ' produits fournis, seuls les ' + limit + ' premiers sont affichés.');
      valid = valid.slice(0, limit);
    }

    var vendor = {
      id: v.id,
      name: v.name,
      phone: phone,
      house: !!v.house,
      active: v.active !== false,
      products: valid
    };
    valid.forEach(function (p) { productIndex[p.id] = { product: p, vendor: vendor }; });
    vendors.push(vendor);
    vendorById[vendor.id] = vendor;
    if (vendor.house && !houseVendor) houseVendor = vendor;
    return true;
  }

  // ---------- Accès aux données ----------
  function getVendor(id) { return vendorById[id] || null; }
  function vendorOfProduct(productId) { return productIndex[productId] ? productIndex[productId].vendor : null; }
  function phoneOf(vendorId) {                 // repli : boutique principale
    var v = vendorById[vendorId] || houseVendor || vendors[0];
    return v ? v.phone : '';
  }

  // Panier [{id,name,price,qty}] -> [{ vendor, items, total }] (un groupe par vendeur)
  function groupCartByVendor(cart) {
    var groups = [], pos = {};
    cart.forEach(function (item) {
      var v = vendorOfProduct(item.id) || houseVendor || vendors[0] || { id: '', name: 'Boutique' };
      if (pos[v.id] === undefined) { pos[v.id] = groups.length; groups.push({ vendor: v, items: [], total: 0 }); }
      var g = groups[pos[v.id]];
      g.items.push(item);
      g.total += item.price * item.qty;
    });
    return groups;
  }

  // ---------- Rendu du catalogue ----------
  function cardHtml(p, v, eager) {
    var title = p.title || p.name;
    var price = Number(p.price);
    var fid = 'feat-' + p.id;

    var thumbs = '';
    if (p.images.length > 1) {
      thumbs = '<div class="thumbnails-container">' + p.images.map(function (src, i) {
        return '<img src="' + esc(src) + '" class="thumb' + (i === 0 ? ' active' : '') + '" alt="Vue ' + (i + 1) + '"' +
               ((i === 0 && eager) ? '' : ' loading="lazy"') + '>';
      }).join('') + '</div>';
    }

    var feats = '';
    if (p.features && p.features.length) {
      feats =
        '<button class="features-toggle" data-target="' + esc(fid) + '"><i class="fas fa-chevron-down"></i> Caractéristiques</button>' +
        '<div class="features-panel" id="' + esc(fid) + '"><ul class="features-list">' +
        p.features.map(function (f) { return '<li><i class="fas fa-check-circle"></i> ' + esc(f) + '</li>'; }).join('') +
        '</ul></div>';
    }

    var tag = (!v.house || cfg.showHouseTag)
      ? '<div class="vendor-tag"><i class="fas fa-store"></i> Vendu par <strong>' + esc(v.name) + '</strong></div>'
      : '';

    var waMsg = p.waMsg || (p.name + ' ' + price + 'F');

    return '' +
      '<div class="product-card" data-id="' + esc(p.id) + '" data-name="' + esc(p.name) + '" data-price="' + price + '" data-vendor="' + esc(v.id) + '">' +
        '<div class="product-gallery">' +
          '<div class="main-image-container">' +
            '<img src="' + esc(p.images[0]) + '" alt="' + esc(p.alt || p.name) + '" class="main-img"' + (eager ? '' : ' loading="lazy"') + '>' +
          '</div>' + thumbs +
        '</div>' +
        tag +
        '<div class="product-title">' + esc(title) + ' <span class="price">' + fmt(price) + ' FCFA</span></div>' +
        '<div class="description">' + esc(p.description || '') + '</div>' +
        feats +
        '<div class="action-buttons">' +
          '<button class="btn btn-primary add-to-cart-btn"><i class="fas fa-cart-plus"></i> Commander Maintenant</button>' +
          '<div class="secondary-actions">' +
            '<a href="#" class="btn btn-subtle wa-link" data-msg="' + esc(waMsg) + '"><i class="fab fa-whatsapp"></i> WhatsApp</a>' +
            '<a href="#" class="btn btn-subtle call-link"><i class="fas fa-phone-alt"></i> Appel</a>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function render() {
    var nav = document.getElementById('category-nav');
    var mount = document.getElementById('catalogue');
    if (!nav || !mount) { warn('Zones #category-nav / #catalogue introuvables dans la page.'); return; }

    // Produits des vendeurs actifs, groupés par catégorie
    var byCat = {};
    vendors.forEach(function (v) {
      if (!v.active) return;
      v.products.forEach(function (p) { (byCat[p.category] = byCat[p.category] || []).push({ p: p, v: v }); });
    });

    // Ordre des catégories : config d'abord, puis catégories inconnues créées à la volée
    var cats = (cfg.categories || []).slice();
    Object.keys(byCat).forEach(function (id) {
      if (!cats.some(function (c) { return c.id === id; })) cats.push({ id: id, label: cap(id), icon: 'fas fa-tag' });
    });
    cats = cats.filter(function (c) { return byCat[c.id] && byCat[c.id].length; });

    if (!cats.length) {
      nav.innerHTML = '';
      mount.innerHTML = '<p style="text-align:center;color:#64748b;font-size:0.85rem;padding:20px 0;">Aucun produit disponible pour le moment.</p>';
      return;
    }

    nav.innerHTML = cats.map(function (c, i) {
      return '<button class="cat-btn' + (i === 0 ? ' active' : '') + '" data-category="' + esc(c.id) + '">' +
             '<i class="' + esc(c.icon || 'fas fa-tag') + '"></i> ' + esc(c.label) + '</button>';
    }).join('');

    mount.innerHTML = cats.map(function (c, i) {
      var items = byCat[c.id];
      if (cfg.shuffleProducts) items = shuffle(items.slice());
      return '<div class="category-section' + (i === 0 ? ' active' : '') + '" id="cat-' + esc(c.id) + '">' +
             items.map(function (it, j) { return cardHtml(it.p, it.v, i === 0 && j === 0); }).join('') +
             '</div>';
    }).join('');
  }

  // ---------- Écran "commande multi-vendeurs" ----------
  // entries : [{ vendorName, count, total, url }]
  function showSplitOrder(entries) {
    var old = document.getElementById('split-order-modal');
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var ov = document.createElement('div');
    ov.id = 'split-order-modal';
    ov.className = 'modal-overlay split-overlay';
    ov.style.display = 'flex';
    ov.innerHTML =
      '<div class="modal-content">' +
        '<span class="close-btn" data-close="1">&times;</span>' +
        '<h3 class="modal-title"><i class="fas fa-check-circle"></i> Dernière étape</h3>' +
        '<p class="split-note">Votre commande concerne <strong>' + entries.length + ' vendeurs</strong>. ' +
        'Envoyez chaque partie sur WhatsApp pour qu\'elle soit traitée :</p>' +
        '<div class="split-list">' +
        entries.map(function (e) {
          return '<div class="split-item">' +
                   '<div class="split-info"><strong>' + esc(e.vendorName) + '</strong>' +
                   '<span>' + e.count + ' article(s) · ' + fmt(e.total) + ' FCFA</span></div>' +
                   '<a class="btn-split-wa" href="' + esc(e.url) + '" target="_blank" rel="noopener">' +
                   '<i class="fab fa-whatsapp"></i> Envoyer</a>' +
                 '</div>';
        }).join('') +
        '</div>' +
      '</div>';

    ov.addEventListener('click', function (ev) {
      var t = ev.target;
      if (t === ov || (t.getAttribute && t.getAttribute('data-close'))) {
        ov.parentNode && ov.parentNode.removeChild(ov);
        return;
      }
      var link = t.closest ? t.closest('.btn-split-wa') : null;
      if (link) {
        link.classList.add('sent');
        link.innerHTML = '<i class="fas fa-check"></i> Envoyé';
      }
    });
    document.body.appendChild(ov);
  }

  global.Platform = {
    registerVendor: registerVendor,
    render: render,
    getVendor: getVendor,
    vendorOfProduct: vendorOfProduct,
    phoneOf: phoneOf,
    groupCartByVendor: groupCartByVendor,
    showSplitOrder: showSplitOrder,
    vendors: function () { return vendors.slice(); }
  };
})(window);
