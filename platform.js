/* ============================================================
   PLATFORM.JS — Cœur multi-vendeurs (à ne pas modifier au quotidien)
   - charge et vérifie vendors.json (un vendeur défectueux est ignoré,
     pas le site ; une erreur de syntaxe JSON est signalée clairement
     dans la console, avec le numéro de ligne si possible)
   - génère le header : bouton "Tous" (grille 2x2, tous vendeurs
     mélangés) + un onglet par boutique (galerie complète, comme avant)
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
  function info() {
    if (global.console) console.info.apply(console, ['[Platform]'].concat([].slice.call(arguments)));
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
      // Galerie photo : 4 emplacements maximum (au-delà, coupé et signalé).
      if (p.images.length > 4) {
        warn(where + ' : ' + p.images.length + ' photos fournies, seules les 4 premières sont affichées.');
        p.images = p.images.slice(0, 4);
      }
      // Conseil (non bloquant) : encourager les vendeurs à fournir les 4 photos.
      if (!v.house && p.images.length < 4) {
        info(where + ' : ' + p.images.length + '/4 photo(s). Ajoutez-en pour une fiche plus détaillée.');
      }
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
        '</div>' +
      '</div>';
  }

  // [TOUS] Texte MOQ + Stock pour la grille compacte. Ces deux champs sont
  // FACULTATIFS dans vendors.json : "moq" (quantité minimum) et "stock"
  // (quantité disponible). Absents -> valeurs par défaut neutres, rien ne casse.
  function moqStockHtml(p) {
    var moq = (p.moq && Number(p.moq) > 0) ? Number(p.moq) : 1;
    var hasStock = p.stock !== undefined && p.stock !== null && p.stock !== '';
    var stockNum = hasStock ? Number(p.stock) : null;
    var stockTxt, stockClass;
    if (!hasStock) { stockTxt = 'Disponible'; stockClass = ''; }
    else if (stockNum <= 0) { stockTxt = 'Rupture'; stockClass = ' class="tous-stock-out"'; }
    else { stockTxt = 'Stock : ' + stockNum; stockClass = ''; }
    return '<span>MOQ : ' + moq + '</span><span' + stockClass + '>' + stockTxt + '</span>';
  }

  // [TOUS] Carte compacte de la grille globale : Nom, Prix, MOQ, Stock.
  // Volontairement PAS de galerie ni de bouton "Commander" ici — un clic
  // renvoie vers la fiche complète du vendeur (voir index.js, mécanisme
  // de lien de partage #id, déjà existant, réutilisé tel quel).
  function tousCardHtml(p, v, eager) {
    var title = p.title || p.name;
    var price = Number(p.price);
    return '' +
      '<div class="tous-card" data-id="' + esc(p.id) + '" data-vendor="' + esc(v.id) + '">' +
        '<div class="tous-card-img">' +
          '<img src="' + esc(p.images[0]) + '" alt="' + esc(p.alt || p.name) + '"' + (eager ? '' : ' loading="lazy"') + '>' +
        '</div>' +
        '<div class="tous-card-body">' +
          '<div class="tous-card-name">' + esc(title) + '</div>' +
          '<div class="tous-card-price">' + fmt(price) + ' FCFA</div>' +
          '<div class="tous-card-meta">' + moqStockHtml(p) + '</div>' +
          '<div class="tous-card-vendor"><i class="fas fa-store"></i> ' + esc(v.name) + '</div>' +
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

    // [BOUTIQUES] Vendeurs actifs ayant au moins un produit affichable.
    var actives = vendors.filter(function (v) { return v.active && v.products.length; });

    if (!actives.length) {
      nav.innerHTML = '';
      mount.innerHTML = '<p style="text-align:center;color:#64748b;font-size:0.85rem;padding:20px 0;">Aucun produit disponible pour le moment.</p>';
      return;
    }

    // [ÉQUITÉ] Ordre des boutiques dans le header : ALÉATOIRE à chaque
    // chargement du site par défaut, pour que chaque vendeur ait sa chance
    // d'être vu en premier. POUR BLOQUER CET ALÉATOIRE (ordre stable, dans
    // l'ordre du fichier vendors.json) : mettre shuffleVendorNav: false
    // dans config.js.
    var ordered = (cfg.shuffleVendorNav === false) ? actives.slice() : shuffle(actives.slice());

    // Bouton "Tous" TOUJOURS en premier au chargement de la page. Une fois
    // qu'un visiteur clique sur une boutique, index.js déplace ce bouton
    // juste à côté d'elle (voir "Navigation entre les boutiques" dans
    // index.js) — c'est un simple déplacement du même bouton, pas un
    // nouveau rendu, donc rien ici à changer pour ce comportement.
    nav.innerHTML =
      '<button class="cat-btn tous-btn active" data-category="tous">' +
        '<i class="fas fa-th-large"></i> Tous</button>' +
      ordered.map(function (v) {
        return '<button class="cat-btn" data-category="' + esc(v.id) + '">' +
               '<i class="fas fa-store"></i> ' + esc(v.name) + '</button>';
      }).join('');

    // [TOUS] Grille 2x2 : TOUS les produits de TOUS les vendeurs actifs
    // (boutique principale comprise), mélangés. Ce mélange est INCONDITIONNEL
    // (indépendant de shuffleProducts) car la demande est explicite : la
    // grille "Tous" doit toujours être équitable, à chaque chargement.
    var allItems = [];
    actives.forEach(function (v) {
      v.products.forEach(function (p) { allItems.push({ p: p, v: v }); });
    });
    allItems = shuffle(allItems.slice());

    var tousHtml =
      '<div class="category-section tous-grid active" id="cat-tous">' +
      allItems.map(function (it, i) { return tousCardHtml(it.p, it.v, i === 0); }).join('') +
      '</div>';

    // Une section par boutique : fiche complète (galerie, caractéristiques,
    // bouton Commander), EXACTEMENT comme avant — seul le regroupement
    // change (par vendeur au lieu de par catégorie produit).
    var boutiquesHtml = ordered.map(function (v) {
      var items = v.products.map(function (p) { return { p: p, v: v }; });
      if (cfg.shuffleProducts) items = shuffle(items.slice());
      return '<div class="category-section" id="cat-' + esc(v.id) + '">' +
             items.map(function (it) { return cardHtml(it.p, it.v, false); }).join('') +
             '</div>';
    }).join('');

    mount.innerHTML = tousHtml + boutiquesHtml;

    // Clic sur une carte compacte "Tous" -> ouvre la fiche complète dans la
    // boutique du vendeur. Réutilise le mécanisme de lien de partage #id
    // déjà existant dans index.js (activateProductFromHash) : on change
    // juste le hash de l'URL, exactement comme un lien partagé.
    mount.querySelectorAll('.tous-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var id = card.dataset.id;
        if (window.location.hash === '#' + id) {
          // Hash déjà sur ce produit (rare) : on force quand même l'ouverture.
          window.dispatchEvent(new Event('hashchange'));
        } else {
          window.location.hash = id;
        }
      });
    });
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

  // ---------- Chargement de vendors.json ----------
  // Repère la ligne/colonne d'une erreur de syntaxe JSON quand c'est possible,
  // pour un message d'erreur que l'on peut suivre sans être développeur.
  function locateJsonError(text, message) {
    var m = /position (\d+)/.exec(message);           // Chrome / Edge
    if (m) {
      var pos = parseInt(m[1], 10);
      var before = text.slice(0, pos);
      var line = before.split('\n').length;
      var col = pos - before.lastIndexOf('\n');
      return ' (ligne ' + line + ', colonne ' + col + ')';
    }
    m = /line (\d+) column (\d+)/i.exec(message);      // Firefox
    if (m) return ' (ligne ' + m[1] + ', colonne ' + m[2] + ')';
    return '';
  }

  function parseVendorsJson(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      warn('vendors.json contient une erreur de syntaxe' + locateJsonError(text, e.message) +
           '. Vérifiez surtout les virgules et les guillemets autour de cet endroit. Détail : ' + e.message);
      return null;
    }
  }

  // ---------- [SUPABASE] Chargement depuis Supabase (base + photos) ----------
  // Actif uniquement si config.js renseigne cfg.supabase.url ET cfg.supabase.anonKey.
  // Sinon, comportement 100% inchangé : lecture de vendors.json comme avant.

  // Transforme la réponse Supabase (vendeurs -> produits -> images, imbriqués
  // par PostgREST) vers EXACTEMENT le format attendu par registerVendor —
  // le même format que vendors.json. Le reste du site ne voit aucune différence.
  function fromSupabaseRows(rows) {
    return (rows || []).map(function (v) {
      var produits = Array.isArray(v.produits) ? v.produits : [];
      return {
        id: v.id,
        name: v.name,
        whatsapp: v.whatsapp,
        house: !!v.house,
        active: v.active !== false,
        products: produits.map(function (p) {
          var imgs = (Array.isArray(p.images) ? p.images.slice() : [])
            .sort(function (a, b) { return (a.position || 1) - (b.position || 1); })
            .map(function (im) { return im.image_url; })
            .filter(Boolean);
          var prod = {
            id: p.id,
            category: p.category,
            name: p.name,
            price: p.price,
            description: p.description || '',
            images: imgs
          };
          if (p.title) prod.title = p.title;
          if (p.alt) prod.alt = p.alt;
          if (Array.isArray(p.features) && p.features.length) prod.features = p.features;
          if (p.moq) prod.moq = p.moq;
          if (p.stock !== null && p.stock !== undefined) prod.stock = p.stock;
          return prod;
        })
      };
    });
  }

  // Une seule requête PostgREST : vendeurs + leurs produits + les images de
  // chaque produit, imbriqués en un seul aller-retour réseau (embedding
  // Supabase basé sur les clés étrangères déclarées dans le script SQL).
  function fetchFromSupabase(sb) {
    var base = String(sb.url || '').replace(/\/+$/, '');
    var endpoint = base + '/rest/v1/vendeurs?select=*,produits(*,images(*))&order=id.asc';
    return fetch(endpoint, {
      headers: {
        apikey: sb.anonKey,
        Authorization: 'Bearer ' + sb.anonKey
      },
      cache: 'no-store'
    }).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return null; }).then(function (body) {
          var detail = body && body.message ? body.message : ('HTTP ' + res.status);
          throw new Error(detail);
        });
      }
      return res.json();
    }).then(function (rows) {
      fromSupabaseRows(rows).forEach(registerVendor);
    });
  }

  // Charge les vendeurs (Supabase si configuré, sinon vendors.json), les
  // enregistre, puis affiche le catalogue. Ne bloque jamais le site : en cas
  // de souci, une page vide avec message s'affiche et le détail est dans la
  // console (F12).
  function init(url) {
    var sb = cfg.supabase;
    var useSupabase = !!(sb && sb.url && sb.anonKey);

    var loadData = useSupabase
      ? fetchFromSupabase(sb).catch(function (err) {
          warn('Impossible de charger les données depuis Supabase : ' + err.message +
               '. Vérifiez l\'URL et la clé "anon public" dans config.js, et que le script ' +
               'SQL (tables + policies de lecture) a bien été exécuté dans Supabase.');
        })
      : fetch(url || 'vendors.json', { cache: 'no-store' })
          .then(function (res) {
            if (!res.ok) throw new Error('fichier introuvable (HTTP ' + res.status + ')');
            return res.text();
          })
          .then(function (text) {
            var data = parseVendorsJson(text);
            var list = data && Array.isArray(data.vendeurs) ? data.vendeurs : [];
            if (data && !Array.isArray(data.vendeurs)) {
              warn('vendors.json : la clé "vendeurs" est absente ou n\'est pas une liste.');
            }
            list.forEach(registerVendor);
          })
          .catch(function (err) {
            warn('Impossible de charger vendors.json : ' + err.message +
                 '. Sur mobile ou en ouvrant le fichier directement (double-clic), ' +
                 'le navigateur bloque ce chargement : utilisez Live Server ou le site en ligne.');
          });

    return loadData.then(function () {
      render();                                          // toujours afficher, même en cas d'échec
      document.dispatchEvent(new CustomEvent('platform:ready'));
    });
  }

  global.Platform = {
    init: init,
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
