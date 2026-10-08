/* ============================================================
   INDEX.JS — Comportement de la page (panier, galerie, recherche...)
   [MULTI-VENDEURS] Ce fichier est chargé APRÈS que Platform.init() a fini
   de charger vendors.json et d'afficher le catalogue (voir index.html).
   Les cartes produit existent donc déjà quand le code ci-dessous s'exécute.
   ============================================================ */

// [BANNIÈRE PROMO] Interrupteur unique : true = bannière affichée,
// false = bannière ET son espace vertical totalement absents du DOM
// (rien n'est créé, donc rien ne peut laisser un espace vide).
const AFFICHER_BANNIERE_PROMO = true;

// [BANNIÈRE PROMO] Les 3 diapositives (photo + texte), une par bloc.
// Modifiez uniquement ceci pour changer le contenu — rien d'autre à toucher.
//   image     : chemin vers votre photo (ex: "promo-banner/1.jpg" — créez ce
//               dossier et déposez-y vos photos, comme pour vos produits).
//   titre     : le texte principal.
//   surligner : (facultatif) la portion EXACTE de "titre" à mettre en
//               orange — recopiez-la telle quelle, elle sera automatiquement
//               stylée. Laissez "" pour ne rien surligner.
//   texte     : (facultatif) la petite phrase sous le titre.
const SLIDES_BANNIERE_PROMO = [
  {
    image: 'BANNIERE/Og-image.webp',
    titre: 'Offres Électroniques & Lunettes Anti-Lumière Bleue',
    surligner: 'Lunettes Anti-Lumière Bleue',
    texte: 'Économisez dès maintenant !'
  },
  {
    image: 'BANNIERE/1555526558_compressed.webp',
    titre: 'Livraison rapide sur Cotonou et environs',
    surligner: 'Livraison rapide',
    texte: 'Commandez, on s\'occupe du reste'
  },
  {
    image: 'BANNIERE/1767399301442_compressed.webp',
    titre: 'Nouveaux produits chaque semaine',
    surligner: 'Nouveaux produits',
    texte: 'Revenez régulièrement pour ne rien manquer'
  }
];

// [MULTI-VENDEURS] Fonction PARTAGÉE entre plusieurs blocs du fichier
// (navigation par clic ET ouverture via lien #id) : replace le bouton
// "Tous" juste à côté de la boutique actuellement active, pour qu'un
// visiteur arrivé directement chez un vendeur retrouve la vue globale
// en un tap. Volontairement en dehors des blocs (function(){...})()
// ci-dessous car ceux-ci sont des portées séparées.
function repositionTousButton(activeBtn) {
  const tousBtn = document.querySelector('.cat-btn.tous-btn');
  if (tousBtn && activeBtn && activeBtn !== tousBtn && activeBtn.parentNode) {
    activeBtn.parentNode.insertBefore(tousBtn, activeBtn);
  }
}

// [PARTAGE] Également PARTAGÉES entre plusieurs blocs : utilisées à la fois
// pour le bouton "Partager" sur chaque carte ET pour les liens produit dans
// les messages de commande (WhatsApp/Telegram) — un seul endroit à tenir à
// jour si jamais l'adresse du site change.
function buildProductUrl(productId) {
  return window.location.origin + window.location.pathname + '#' + productId;
}

function showShareToast(message) {
  let toast = document.getElementById('share-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'share-toast';
    toast.className = 'share-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._hideTimeout);
  toast._hideTimeout = setTimeout(function() {
    toast.classList.remove('show');
  }, 2200);
}

function shareProduct(productId, productName) {
  const url = buildProductUrl(productId);
  const shareData = {
    title: 'Le Coin des Bonnes Affaires',
    text: productName,
    url: url
  };

  if (navigator.share) {
    navigator.share(shareData).catch(function() {
      /* utilisateur a annulé, on ne fait rien */
    });
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function() {
      showShareToast('Lien copié dans le presse-papiers !');
    }).catch(function() {
      window.prompt('Copiez ce lien :', url);
    });
  } else {
    window.prompt('Copiez ce lien :', url);
  }
}

// [PERF — RENDU DIFFÉRÉ] Injecte le bouton "Partager" sur les cartes
// produit DANS LE PÉRIMÈTRE DONNÉ (document entier par défaut, ou une
// boutique précise). Nécessaire car les boutiques ne sont désormais
// construites qu'à la demande (voir Platform.ensureBoutiqueRendered) :
// un passage unique au chargement de la page ne suffit plus, cette
// fonction doit être rappelée chaque fois qu'une boutique vient d'être
// remplie. Le marqueur data-share-injected évite de doubler le bouton
// si elle est appelée plusieurs fois sur les mêmes cartes.
function injectShareButtons(scope) {
  const root = scope || document;
  root.querySelectorAll('.product-card').forEach(function(card) {
    if (card.dataset.shareInjected) return;
    const actionButtons = card.querySelector('.action-buttons');
    if (!actionButtons) return;
    const addToCartBtn = actionButtons.querySelector('.add-to-cart-btn');
    if (!addToCartBtn) return;

    const productId = card.dataset.id || '';
    const productName = card.dataset.name || 'ce produit';

    const primaryRow = document.createElement('div');
    primaryRow.className = 'primary-row';

    const shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'btn btn-share-product';
    shareBtn.setAttribute('aria-label', 'Partager ' + productName);
    shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
    shareBtn.addEventListener('click', function() {
      shareProduct(productId, productName);
    });

    addToCartBtn.parentNode.insertBefore(primaryRow, addToCartBtn);
    primaryRow.appendChild(addToCartBtn);
    primaryRow.appendChild(shareBtn);

    card.dataset.shareInjected = '1';
  });
}

// [BANNIÈRE PROMO] Échappement minimal (titre/texte viennent de constantes
// que VOUS écrivez dans ce fichier, pas de données visiteur — cette
// fonction est juste une protection de bon sens, pas une nécessité de
// sécurité ici).
function escHtmlBanner(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// [BANNIÈRE PROMO] Insère le carrousel (photo + texte) juste en dessous des
// badges de confiance ("Paiement à la livraison..."), au-dessus du
// catalogue, puis démarre la rotation automatique entre les diapositives.
// Si AFFICHER_BANNIERE_PROMO est à false, cette fonction ne crée RIEN :
// aucun élément, donc aucun espace vide possible dans la page.
function insertPromoBanner() {
  if (!AFFICHER_BANNIERE_PROMO || !SLIDES_BANNIERE_PROMO.length) return;
  const trustBar = document.querySelector('.trust-badges-bar');
  const catalogue = document.getElementById('catalogue');
  if (!trustBar || !trustBar.parentNode || !catalogue) return;

  const banner = document.createElement('div');
  banner.className = 'promo-banner';
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-label', 'Offres du moment');

  // Une diapositive = une "carte" pleine largeur (fond dégradé, texte à
  // gauche, photo à droite). Le "track" contient les 3 côte à côte ; on le
  // déplace horizontalement pour faire défiler (comme la galerie photo,
  // même principe que translateX).
  const track = document.createElement('div');
  track.className = 'promo-slides-track';
  track.innerHTML = SLIDES_BANNIERE_PROMO.map(function (slide) {
    var titreHtml = escHtmlBanner(slide.titre || '');
    if (slide.surligner) {
      var part = escHtmlBanner(slide.surligner);
      titreHtml = titreHtml.replace(part, '<span class="promo-highlight">' + part + '</span>');
    }
    return '' +
      '<div class="promo-slide">' +
        '<div class="promo-slide-text">' +
          '<div class="promo-slide-title">' + titreHtml + '</div>' +
          (slide.texte ? '<div class="promo-slide-subtitle">' + escHtmlBanner(slide.texte) + '</div>' : '') +
        '</div>' +
        (slide.image ? '<div class="promo-slide-imgwrap"><img src="' + escHtmlBanner(slide.image) + '" alt="" loading="lazy"></div>' : '') +
      '</div>';
  }).join('');
  banner.appendChild(track);

  // Points de pagination (petit repère visuel, pas indispensable au
  // fonctionnement) — un point par diapositive, le point actif en blanc plein.
  var dotsEl = null;
  if (SLIDES_BANNIERE_PROMO.length > 1) {
    dotsEl = document.createElement('div');
    dotsEl.className = 'promo-banner-dots';
    dotsEl.innerHTML = SLIDES_BANNIERE_PROMO.map(function (_s, i) {
      return '<span class="promo-banner-dot' + (i === 0 ? ' active' : '') + '"></span>';
    }).join('');
    banner.appendChild(dotsEl);
  }

  // Juste après la barre de badges, juste avant le catalogue.
  trustBar.parentNode.insertBefore(banner, catalogue);

  // Rotation automatique toutes les 4 secondes, boucle infinie (revient à
  // la 1re diapositive après la 3e). S'arrête proprement s'il n'y a qu'une
  // seule diapositive (rien à faire tourner).
  if (SLIDES_BANNIERE_PROMO.length > 1) {
    var index = 0;
    setInterval(function () {
      index = (index + 1) % SLIDES_BANNIERE_PROMO.length;
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      if (dotsEl) {
        dotsEl.querySelectorAll('.promo-banner-dot').forEach(function (d, i) {
          d.classList.toggle('active', i === index);
        });
      }
    }, 4000);
  }
}
insertPromoBanner();

/* ============================================================
   [UX BOUTIQUES] AJOUT — Mode "Galerie Focus", barre "Repasser en grille
   2×2", bouton "Partager la boutique" et lien direct ?vendor=ID.
   Fonctions globales (même principe que repositionTousButton) car
   utilisées par plusieurs blocs plus bas. Aucune fonction existante
   n'est retirée.
   ============================================================ */
let lastFocusedProductId = null; // dernier produit ouvert en vue Focus

// Hauteur réelle du header fixe -> variable CSS (position du bouton sticky)
function updateHeaderOffset() {
  const header = document.querySelector('.fixed-header');
  if (header) {
    document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
  }
}
updateHeaderOffset();
window.addEventListener('resize', updateHeaderOffset);
window.addEventListener('load', updateHeaderOffset);
if ('ResizeObserver' in window) {
  const headerEl = document.querySelector('.fixed-header');
  if (headerEl) new ResizeObserver(updateHeaderOffset).observe(headerEl);
}

// Lien direct vers une boutique entière
function buildBoutiqueUrl(vendorId) {
  return window.location.origin + window.location.pathname + '?vendor=' + encodeURIComponent(vendorId);
}

// Même logique de repli que shareProduct (partage natif > copie > prompt)
function shareBoutique(vendorId, vendorName) {
  const url = buildBoutiqueUrl(vendorId);
  const shareData = {
    title: 'Le Coin des Bonnes Affaires',
    text: 'Découvrez la boutique ' + (vendorName || ''),
    url: url
  };
  if (navigator.share) {
    navigator.share(shareData).catch(function() { /* annulé */ });
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function() {
      showShareToast('Lien de la boutique copié !');
    }).catch(function() {
      window.prompt('Copiez ce lien :', url);
    });
  } else {
    window.prompt('Copiez ce lien :', url);
  }
}

let boutiqueBarEl = null;
let boutiqueNameEl = null;
let boutiqueShareBtn = null;
let focusBarEl = null;

function ensureBoutiqueBars() {
  if (boutiqueBarEl) return;
  const catalogue = document.getElementById('catalogue');
  if (!catalogue || !catalogue.parentNode) return;

  // Barre "nom de la boutique + Partager la boutique"
  boutiqueBarEl = document.createElement('div');
  boutiqueBarEl.className = 'boutique-bar';
  boutiqueNameEl = document.createElement('div');
  boutiqueNameEl.className = 'boutique-bar-name';
  boutiqueShareBtn = document.createElement('button');
  boutiqueShareBtn.type = 'button';
  boutiqueShareBtn.className = 'btn-share-boutique';
  boutiqueShareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Partager la boutique';
  boutiqueShareBtn.addEventListener('click', function() {
    const btn = currentVendorButton();
    if (btn) shareBoutique(btn.dataset.category, btn.textContent.trim());
  });
  boutiqueBarEl.appendChild(boutiqueNameEl);
  boutiqueBarEl.appendChild(boutiqueShareBtn);

  // Bouton sticky "Repasser en grille 2×2"
  focusBarEl = document.createElement('div');
  focusBarEl.className = 'focus-bar';
  const focusBtn = document.createElement('button');
  focusBtn.type = 'button';
  focusBtn.className = 'focus-bar-btn';
  focusBtn.innerHTML = '<i class="fas fa-th-large"></i> Repasser en grille 2×2';
  focusBtn.addEventListener('click', exitFocusMode);
  focusBarEl.appendChild(focusBtn);

  catalogue.parentNode.insertBefore(boutiqueBarEl, catalogue);
  catalogue.parentNode.insertBefore(focusBarEl, catalogue);
}

// Onglet boutique actif (null si "Tous")
function currentVendorButton() {
  const btn = document.querySelector('.cat-btn.active');
  if (!btn || btn.classList.contains('tous-btn') || btn.dataset.category === 'tous') return null;
  return btn;
}

// Affiche / masque les deux barres selon l'état courant
function refreshBoutiqueUi() {
  ensureBoutiqueBars();
  if (!boutiqueBarEl) return;
  const btn = currentVendorButton();
  const searchInput = document.getElementById('product-search');
  const searching = !!(searchInput && searchInput.value.trim());

  if (!btn || searching) {
    boutiqueBarEl.style.display = 'none';
    focusBarEl.style.display = 'none';
    return;
  }
  boutiqueNameEl.innerHTML = '<i class="fas fa-store"></i>';
  boutiqueNameEl.appendChild(document.createTextNode(btn.textContent.trim()));
  boutiqueBarEl.style.display = 'flex';

  const section = document.getElementById('cat-' + btn.dataset.category);
  focusBarEl.style.display = (section && section.classList.contains('focus-mode')) ? 'block' : 'none';
}

function clearAllFocusModes() {
  document.querySelectorAll('.category-section.focus-mode').forEach(function(sec) {
    sec.classList.remove('focus-mode');
  });
}

function enterFocusMode(section) {
  if (!section || section.classList.contains('tous-grid')) return;
  clearAllFocusModes();
  section.classList.add('focus-mode');
  refreshBoutiqueUi();
}

// Bouton "Repasser en grille 2×2"
function exitFocusMode() {
  clearAllFocusModes();
  refreshBoutiqueUi();
  if (lastFocusedProductId) {
    let card = null;
    try {
      card = document.querySelector('.product-card[data-id="' + CSS.escape(lastFocusedProductId) + '"]');
    } catch (e) { card = null; }
    if (card) {
      requestAnimationFrame(function() {
        card.scrollIntoView({ block: 'center' });
      });
    }
  }
}

// [PROTECTION IMAGES] Empêche le menu "Enregistrer l'image" (appui long
// mobile / clic droit desktop) et le glisser-déposer, SUR LES IMAGES
// UNIQUEMENT. Délégation d'événement sur tout le document (au lieu d'un
// écouteur par image) : ça couvre aussi une image de galerie qui change
// dynamiquement (clic sur une vignette), sans rien à ré-attacher.
// N'affecte ni les clics, ni la navigation, ni les captures d'écran —
// seuls "clic droit" et "glisser" sont interceptés, rien d'autre.
document.addEventListener('contextmenu', function (e) {
  if (e.target && e.target.tagName === 'IMG') e.preventDefault();
});
document.addEventListener('dragstart', function (e) {
  if (e.target && e.target.tagName === 'IMG') e.preventDefault();
});

(function() {
  const phoneNumber = "+22961196907"; // Numéro WhatsApp
  let cart = []; // Structure : [{id, name, price, qty}]

  // [MULTI-VENDEURS] Numéro WhatsApp du vendeur d'un produit.
  // Repli automatique sur le numéro de la boutique principale ci-dessus.
  function vendorPhone(vendorId) {
    return (window.Platform && window.Platform.phoneOf(vendorId)) || phoneNumber;
  }

  // --- Configuration Telegram (capture des commandes) ---
  const TELEGRAM_BOT_TOKEN = "8605139398:AAHMkn4MdRdx1RgO9Kgk1ZXM174-kmqAYGw";
  const TELEGRAM_CHAT_ID = "1279801985";

  // Envoie un message sur ton Telegram. Ne bloque jamais la suite du processus.
  function sendToTelegram(text) {
    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'Markdown'
      })
    }).catch(function(err) {
      console.error('Erreur envoi Telegram:', err);
    });
  }

  // Envoie les données du client vers Formspree (deuxième copie des commandes).
  const FORMSPREE_URL = "https://formspree.io/f/xljdrejq";

  function sendToFormspree(data) {
    fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    }).catch(function(err) {
      console.error('Erreur envoi Formspree:', err);
    });
  }

  // Remarque : il n'y a plus d'envoi automatique tant que le client n'a
  // pas cliqué sur "Confirmer sur WhatsApp". L'envoi Telegram + Formspree
  // se déclenche uniquement au moment de la confirmation (voir plus bas).

  // Éléments DOM
  const cartToggleBtn = document.getElementById('cart-toggle-btn');
  const cartCountEl = document.getElementById('cart-count');
  const modal = document.getElementById('modal-commande');
  const closeModalBtn = document.getElementById('close-modal');
  const cartSummaryEl = document.getElementById('cart-summary');
  const formCommande = document.getElementById('form-commande');

  // 1. Navigation entre les boutiques (et "Tous")
  const catButtons = document.querySelectorAll('.cat-btn');
  const sections = document.querySelectorAll('.category-section');

  catButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      catButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const category = this.dataset.category;
      // [PERF] Construit les fiches de cette boutique SEULEMENT maintenant
      // (si ce n'est pas déjà fait) — "tous" n'a pas besoin de ça, déjà
      // construite au chargement ; ensureBoutiqueRendered l'ignore sans effet.
      if (window.Platform && window.Platform.ensureBoutiqueRendered) {
        window.Platform.ensureBoutiqueRendered(category);
        const justRenderedSection = document.getElementById('cat-' + category);
        if (justRenderedSection) injectShareButtons(justRenderedSection); // bouton Partager sur les cartes qui viennent d'apparaître
      }
      sections.forEach(sec => sec.classList.remove('active'));
      const activeSec = document.getElementById('cat-' + category);
      if (activeSec) activeSec.classList.add('active');
      repositionTousButton(this);
    });
  });

  // 2-3-4. [PERF] Galerie (vignettes) + Caractéristiques + "Commander" :
  // UN SEUL écouteur, posé sur #catalogue, au lieu d'un écouteur par
  // vignette/toggle/bouton (potentiellement des centaines avec un grand
  // catalogue). Le navigateur clic -> un seul gestionnaire à exécuter,
  // qui identifie l'élément concerné avec closest(). Fonctionne aussi
  // pour du contenu ajouté plus tard (rien à ré-attacher).
  const catalogueEl = document.getElementById('catalogue');
  if (catalogueEl) {
    catalogueEl.addEventListener('click', function(e) {

      // --- Vignette de la galerie photo ---
      const thumb = e.target.closest('.thumb');
      if (thumb) {
        const gallery = thumb.closest('.product-gallery');
        const mainImg = gallery && gallery.querySelector('.main-img');
        if (mainImg) mainImg.src = thumb.src;
        if (gallery) gallery.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        return;
      }

      // --- Panneau "Caractéristiques" déroulant ---
      const toggle = e.target.closest('.features-toggle');
      if (toggle) {
        const panel = document.getElementById(toggle.dataset.target);
        if (panel) {
          panel.classList.toggle('open');
          toggle.classList.toggle('open');
        }
        return;
      }

      // --- Bouton "Commander Maintenant" (ajout panier) ---
      const addBtn = e.target.closest('.add-to-cart-btn');
      if (addBtn) {
        const card = addBtn.closest('.product-card');
        if (!card) return;
        const id = card.dataset.id;
        const name = card.dataset.name;
        const price = parseInt(card.dataset.price, 10) || 0;

        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
          existingItem.qty += 1;
        } else {
          cart.push({ id, name, price, qty: 1 });
        }

        updateCartBadge();
        renderCartModal();
        openModal();
      }
    });
  }

  // Mise à jour du compteur sur l'en-tête
  function updateCartBadge() {
    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    cartCountEl.textContent = totalCount;
  }

  // Rendu dynamique du panier dans la modale
  function renderCartModal() {
    if (cart.length === 0) {
      cartSummaryEl.innerHTML = '<p style="text-align:center; color:#64748b; font-size:0.85rem;">Votre panier est vide.</p>';
      return;
    }

    let html = '';
    let totalPrix = 0;

    cart.forEach(item => {
      const lineTotal = item.price * item.qty;
      totalPrix += lineTotal;

      html += `
        <div class="cart-item">
          <div class="cart-item-info">
            <span class="cart-item-title">${item.name}</span>
            <span class="cart-item-price">${item.price.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div class="cart-item-controls">
            <button type="button" class="qty-btn" data-id="${item.id}" data-action="minus">-</button>
            <span>${item.qty}</span>
            <button type="button" class="qty-btn" data-id="${item.id}" data-action="plus">+</button>
          </div>
        </div>
      `;
    });

    html += `
      <div class="cart-total-bar">
        <span>Total :</span>
        <span>${totalPrix.toLocaleString('fr-FR')} FCFA</span>
      </div>
    `;

    cartSummaryEl.innerHTML = html;

    // Attacher les événements + / -
    cartSummaryEl.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        const action = this.dataset.action;
        const item = cart.find(i => i.id === id);

        if (item) {
          if (action === 'plus') {
            item.qty += 1;
          } else if (action === 'minus') {
            item.qty -= 1;
            if (item.qty <= 0) {
              cart = cart.filter(i => i.id !== id);
            }
          }
          updateCartBadge();
          renderCartModal();
        }
      });
    });
  }

  // 5. Gestion de la Fenêtre Modal
  function openModal() {
    modal.style.display = "flex";
  }

  function closeModal() {
    modal.style.display = "none";
  }

  cartToggleBtn.addEventListener('click', function() {
    renderCartModal();
    openModal();
  });

  closeModalBtn.addEventListener('click', function() {
    closeModal();
  });

  window.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeModal();
    }
  });

  // 6. Envoi Groupé de la commande via WhatsApp
  formCommande.addEventListener('submit', function(e) {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Votre panier est vide. Veuillez ajouter un produit.");
      return;
    }

    const nom = document.getElementById('cmd-nom').value.trim();
    const tel = document.getElementById('cmd-tel').value.trim();
    const adresse = document.getElementById('cmd-adresse').value.trim();

    // [MULTI-VENDEURS] Le panier est regroupé par vendeur : chaque vendeur
    // reçoit sa propre commande sur SON WhatsApp.
    const groups = window.Platform
      ? window.Platform.groupCartByVendor(cart)
      : [{ vendor: null, items: cart, total: cart.reduce((a, i) => a + i.price * i.qty, 0) }];

    // [LIEN PRODUIT DANS LA COMMANDE] Permet au vendeur de cliquer sur le
    // lien et de voir exactement de quel produit il s'agit (utile quand
    // plusieurs modèles se ressemblent). Réutilise buildProductUrl, DÉJÀ
    // utilisée par le bouton Partager — même lien, un seul endroit à tenir
    // à jour si jamais l'adresse du site change.
    function lignesProduits(items) {
      return items.map(item =>
        `• ${item.name} (x${item.qty}) - ${(item.price * item.qty).toLocaleString('fr-FR')} FCFA\n` +
        `  🔗 ${buildProductUrl(item.id)}\n`
      ).join('');
    }

    // Retire les caractères qui cassent le Markdown de Telegram
    function nomSur(name) { return String(name || '').replace(/[*_`\[]/g, ''); }

    let detailsProduits = "";
    let totalGeneral = 0;
    groups.forEach(g => {
      totalGeneral += g.total;
      detailsProduits += (g.vendor ? "🏪 *" + nomSur(g.vendor.name) + "*\n" : "") + lignesProduits(g.items);
    });

    const infosClient = "👤 *Nom & Prénom :* " + nom + "\n" +
                        "📞 *Téléphone :* " + tel + "\n" +
                        "📍 *Adresse :* " + adresse;

    // Copie complète (tous vendeurs) pour l'administrateur de la plateforme
    const summary = "🛍️ *NOUVELLE COMMANDE MULTI-PRODUITS*\n\n" +
                    "📦 *Articles commandés :*\n" + detailsProduits + "\n" +
                    "💰 *TOTAL :* " + totalGeneral.toLocaleString('fr-FR') + " FCFA\n\n" +
                    infosClient;

    // Envoi simultané vers Telegram ET Formspree, déclenché uniquement
    // au clic sur "Confirmer sur WhatsApp", avant l'ouverture de WhatsApp.
    sendToTelegram(summary);
    sendToFormspree({
      statut: "Commande confirmée (envoyée sur WhatsApp)",
      nom: nom,
      telephone: tel,
      adresse: adresse,
      vendeurs: groups.map(g => g.vendor ? g.vendor.name : '').join(', '),
      produits: detailsProduits,
      total: totalGeneral.toLocaleString('fr-FR') + " FCFA"
    });

    // Un message WhatsApp par vendeur, envoyé au numéro de CE vendeur
    const envois = groups.map(g => {
      const msgVendeur = "🛍️ *NOUVELLE COMMANDE MULTI-PRODUITS*\n\n" +
                         "📦 *Articles commandés :*\n" + lignesProduits(g.items) + "\n" +
                         "💰 *TOTAL :* " + g.total.toLocaleString('fr-FR') + " FCFA\n\n" +
                         infosClient;
      return {
        vendorName: g.vendor ? g.vendor.name : 'Boutique',
        count: g.items.reduce((a, i) => a + i.qty, 0),
        total: g.total,
        url: 'https://wa.me/' + vendorPhone(g.vendor ? g.vendor.id : '') + '?text=' + encodeURIComponent(msgVendeur)
      };
    });

    if (envois.length === 1) {
      // Cas courant : un seul vendeur -> redirection directe, comme avant
      window.open(envois[0].url, '_blank');
    } else if (window.Platform) {
      // Plusieurs vendeurs : un bouton WhatsApp par vendeur (évite le blocage des pop-ups)
      window.Platform.showSplitOrder(envois);
    }

    formCommande.reset();
    cart = [];
    updateCartBadge();
    closeModal();
  });
})();

/* ============================================================
   AJOUTS — Partage produit + Recherche en temps réel
   (nouveau bloc indépendant, le code ci-dessus n'est pas modifié)
   ============================================================ */
(function() {

  // ------------------------------------------------------------
  // 1. Injection du bouton "Partager" sur chaque carte produit
  //    (juste après "Commander Maintenant", sur la même ligne)
  // ------------------------------------------------------------
  // [PERF] Fonction désormais globale (injectShareButtons), rappelée à
  // chaque boutique construite à la demande — voir section 1 du bloc
  // précédent et activateProductFromHash plus bas.
  injectShareButtons();

  // ------------------------------------------------------------
  // 2. Ouverture directe sur un produit via le lien de partage (#id)
  // ------------------------------------------------------------
  function activateProductFromHash(forcedId) {
    // [UX] forcedId : id fourni directement (clic depuis "Tous" ou carte compacte)
    const hash = (typeof forcedId === 'string' && forcedId) ? forcedId : window.location.hash.replace('#', '');
    if (!hash) return false;

    // [PERF] Rendu différé : la carte ciblée n'existe pas encore tant que
    // sa boutique n'a pas été construite. On la construit maintenant, si
    // ce n'est pas déjà fait, AVANT de chercher la carte dans le DOM.
    if (window.Platform && window.Platform.vendorOfProduct && window.Platform.ensureBoutiqueRendered) {
      const owner = window.Platform.vendorOfProduct(hash);
      if (owner) {
        window.Platform.ensureBoutiqueRendered(owner.id);
        const justRenderedSection = document.getElementById('cat-' + owner.id);
        if (justRenderedSection) injectShareButtons(justRenderedSection);
      }
    }

    let targetCard;
    try {
      targetCard = document.querySelector('.product-card[data-id="' + CSS.escape(hash) + '"]');
    } catch (e) {
      targetCard = null;
    }
    if (!targetCard) return false;

    // Si une recherche est en cours, on la réinitialise pour être sûr
    // que le produit ciblé soit visible.
    const searchInputEl = document.getElementById('product-search');
    if (searchInputEl && searchInputEl.value) {
      searchInputEl.value = '';
      applySearch('');
    }

    // Affiche la bonne catégorie (même logique que le clic sur cat-btn)
    const parentSection = targetCard.closest('.category-section');
    if (parentSection) {
      document.querySelectorAll('.category-section').forEach(function(sec) {
        sec.classList.remove('active');
      });
      parentSection.classList.add('active');

      const category = parentSection.id.replace('cat-', '');
      document.querySelectorAll('.cat-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.category === category);
      });
      // [MULTI-VENDEURS] Même repositionnement que le clic manuel (voir
      // section 1), pour rester cohérent quand on arrive via un lien.
      const activeBtn = document.querySelector('.cat-btn[data-category="' + category + '"]');
      if (activeBtn) repositionTousButton(activeBtn);

      // [UX] Mode "Galerie Focus" : grand format + bouton sticky "Repasser en grille 2×2"
      enterFocusMode(parentSection);
    }
    lastFocusedProductId = hash;

    // Défilement fluide + encadrement temporaire
    // (block:'start' + scroll-margin CSS : le produit s'aligne sous le header
    // et sous le bouton sticky)
    setTimeout(function() {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      targetCard.classList.add('product-highlight-flash');
      setTimeout(function() {
        targetCard.classList.remove('product-highlight-flash');
      }, 2200);
    }, 150);
    return true;
  }

  window.addEventListener('hashchange', function() { activateProductFromHash(); });

  // ------------------------------------------------------------
  // [UX BOUTIQUES] Ouverture d'un produit en vue Focus + liens ?vendor=
  // ------------------------------------------------------------
  const catalogueForUx = document.getElementById('catalogue');

  function productExists(id) {
    if (window.Platform && window.Platform.vendorOfProduct && window.Platform.vendorOfProduct(id)) return true;
    try {
      return !!document.querySelector('.product-card[data-id="' + CSS.escape(id) + '"]');
    } catch (e) { return false; }
  }

  function openProductFocus(id) {
    const ok = activateProductFromHash(id);
    if (ok && window.location.hash !== '#' + id) {
      try {
        history.pushState(null, '', window.location.pathname + window.location.search + '#' + id);
      } catch (e) { /* non bloquant */ }
    }
    return ok;
  }

  if (catalogueForUx) {
    // (A) Clic sur un produit de la grille "Tous" -> boutique du vendeur,
    //     mode Galerie Focus, scroll jusqu'au produit. Phase de capture :
    //     passe avant tout ancien gestionnaire de clic de ces cartes.
    //     Si l'id est introuvable, on n'intercepte rien (comportement d'origine).
    catalogueForUx.addEventListener('click', function(e) {
      const card = e.target.closest('.tous-card');
      if (!card || !card.dataset.id) return;
      if (!card.closest('.category-section.tous-grid')) return;
      if (!productExists(card.dataset.id)) return;
      e.stopPropagation();
      e.preventDefault();
      openProductFocus(card.dataset.id);
    }, true);

    // (B) Clic sur une carte compacte (grille 2×2) -> vue Focus sur ce produit.
    //     Les boutons (Commander, Partager...) gardent leur comportement.
    catalogueForUx.addEventListener('click', function(e) {
      const card = e.target.closest('.product-card');
      if (!card) return;
      const section = card.closest('.category-section');
      if (!section || section.classList.contains('tous-grid') || section.classList.contains('focus-mode')) return;
      if (e.target.closest('button, a, input, .btn')) return;
      if (card.dataset.id) openProductFocus(card.dataset.id);
    });
  }

  // Changer d'onglet (Tous / boutique) ou re-cliquer sa boutique : retour à la
  // grille 2×2 par défaut. Ce écouteur est ajouté APRÈS celui de la navigation
  // d'origine, il s'exécute donc quand l'onglet actif est déjà mis à jour.
  document.querySelectorAll('.cat-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      clearAllFocusModes();
      refreshBoutiqueUi();
    });
  });

  // Les barres se masquent pendant la recherche plein écran
  const searchForUx = document.getElementById('product-search');
  if (searchForUx) {
    searchForUx.addEventListener('input', function() {
      setTimeout(refreshBoutiqueUi, 130);
    });
  }
  const clearForUx = document.getElementById('search-clear-btn');
  if (clearForUx) {
    clearForUx.addEventListener('click', refreshBoutiqueUi);
  }

  // Lien direct de boutique : ?vendor=ID (ou ?boutique=ID)
  function openBoutiqueById(vendorId) {
    const wanted = String(vendorId || '').trim().toLowerCase();
    if (!wanted) return false;
    const btn = Array.from(document.querySelectorAll('.cat-btn')).find(function(b) {
      return !b.classList.contains('tous-btn') &&
             String(b.dataset.category || '').toLowerCase() === wanted;
    });
    if (!btn) return false;
    btn.click(); // réutilise toute la logique de navigation existante (rendu différé inclus)
    try {
      const nav = document.getElementById('category-nav');
      if (nav) nav.scrollLeft = Math.max(0, btn.offsetLeft - nav.clientWidth / 2 + btn.offsetWidth / 2);
    } catch (e) { /* non bloquant */ }
    return true;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const vendorParam = params.get('vendor') || params.get('boutique');
    if (vendorParam) openBoutiqueById(vendorParam);
  } catch (e) { /* non bloquant */ }

  refreshBoutiqueUi();

  // Un éventuel #produit dans l'URL reste prioritaire sur ?vendor=
  activateProductFromHash(); // au chargement initial de la page

  // ------------------------------------------------------------
  // 3. Barre de recherche en temps réel
  // ------------------------------------------------------------
  const searchInput = document.getElementById('product-search');
  const searchClearBtn = document.getElementById('search-clear-btn');

  // [PERF] Le catalogue est rendu une seule fois et ne change plus ensuite :
  // on capture ici, une seule fois, la liste des cartes/sections ET le texte
  // de recherche de chaque carte (nom + description + sa section), au lieu
  // de re-parcourir le DOM et de relire .textContent à CHAQUE frappe.
  const searchIndex = Array.from(document.querySelectorAll('.product-card')).map(function (card) {
    const descEl = card.querySelector('.description');
    return {
      card: card,
      section: card.closest('.category-section'),
      haystack: ((card.dataset.name || '') + ' ' + (descEl ? descEl.textContent : '')).toLowerCase()
    };
  });
  const allSectionsCached = document.querySelectorAll('.category-section');

  function applySearch(query) {
    const q = (query || '').trim().toLowerCase();

    if (searchClearBtn) {
      searchClearBtn.style.display = q ? 'flex' : 'none';
    }

    if (!q) {
      // Champ vidé : on retire les états forcés, l'affichage
      // classique par catégorie (géré par .active) reprend la main.
      allSectionsCached.forEach(function(sec) {
        sec.classList.remove('search-force-active');
      });
      searchIndex.forEach(function(entry) {
        entry.card.classList.remove('search-hidden');
      });
      return;
    }

    const sectionsWithMatch = new Set();

    searchIndex.forEach(function(entry) {
      const matches = entry.haystack.indexOf(q) !== -1;
      entry.card.classList.toggle('search-hidden', !matches);
      if (matches && entry.section) sectionsWithMatch.add(entry.section);
    });

    allSectionsCached.forEach(function(sec) {
      sec.classList.toggle('search-force-active', sectionsWithMatch.has(sec));
    });
  }

  if (searchInput) {
    // [PERF] Léger anti-rebond (120 ms) : évite de relancer la recherche à
    // CHAQUE touche pressée lors d'une frappe rapide — une seule exécution
    // une fois que la personne marque une courte pause, sans délai perçu.
    let searchDebounceTimer = null;
    searchInput.addEventListener('input', function() {
      const value = this.value;
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(function () { applySearch(value); }, 120);
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', function() {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      applySearch('');
    });
  }

})();

/* ============================================================
   AJOUTS — Géolocalisation GPS pour le champ adresse
   (nouveau bloc indépendant, le code ci-dessus n'est pas modifié)
   ============================================================ */
(function() {

  const gpsBtn = document.getElementById('gps-btn');
  const gpsStatus = document.getElementById('gps-status');
  const adresseInput = document.getElementById('cmd-adresse');

  if (!gpsBtn || !adresseInput) return;

  function setStatus(message, type) {
    if (!gpsStatus) return;
    gpsStatus.textContent = message || '';
    gpsStatus.classList.remove('gps-success', 'gps-error');
    if (type === 'success') gpsStatus.classList.add('gps-success');
    if (type === 'error') gpsStatus.classList.add('gps-error');
  }

  gpsBtn.addEventListener('click', function() {
    // Géolocalisation non supportée par le navigateur/appareil :
    // le client garde la main pour saisir son adresse manuellement.
    if (!navigator.geolocation) {
      setStatus('❌ Géolocalisation non supportée, saisissez l\'adresse manuellement.', 'error');
      return;
    }

    gpsBtn.disabled = true;
    setStatus('Recherche en cours...', null);

    navigator.geolocation.getCurrentPosition(
      function(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapsLink = 'https://maps.google.com/?q=' + lat + ',' + lng;

        adresseInput.value = mapsLink;
        setStatus('✅ Position ajoutée', 'success');
        gpsBtn.disabled = false;
      },
      function() {
        // Refus de permission, timeout ou erreur : non-bloquant,
        // le client peut toujours saisir son adresse à la main.
        setStatus('❌ Erreur, saisissez l\'adresse manuellement.', 'error');
        gpsBtn.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

})();

/* ============================================================
   [RECHERCHE EN SURCOUCHE] AJOUT PUR — ne modifie ni ne supprime aucune
   fonction existante. La recherche d'origine (plus haut dans ce fichier,
   qui masque les cartes DANS #catalogue) continue de fonctionner exactement
   comme avant et tourne toujours en parallèle ; son effet est simplement
   invisible pendant que cet écran plein écran est affiché par-dessus.

   Comportement : dès 1 caractère tapé, le contenu habituel (bannière,
   onglets boutiques, grille) se masque et une grille de résultats prend
   sa place, immédiatement sous la barre de recherche. Recherche sur TOUT
   le catalogue actif (nom, description, nom du vendeur) — y compris les
   produits volontairement exclus de la grille "Tous" (includeInTous /
   hideFromTous) : ces réglages concernent le fil "Tous", pas la capacité
   d'un visiteur à retrouver un produit par sa recherche.
   ============================================================ */
(function () {
  const searchInputEl = document.getElementById('product-search');
  const catalogueEl = document.getElementById('catalogue');
  if (!searchInputEl || !catalogueEl || !catalogueEl.parentNode) return;

  function escHtmlOverlay(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Conteneur de résultats, créé une seule fois, juste avant le catalogue
  // (donc juste sous la barre de recherche, en haut de la zone de contenu).
  const resultsEl = document.createElement('div');
  resultsEl.id = 'search-overlay-results';
  resultsEl.style.display = 'none';
  catalogueEl.parentNode.insertBefore(resultsEl, catalogueEl);

  function toggleMainContent(show) {
    const trustBar = document.querySelector('.trust-badges-bar');
    const banner = document.querySelector('.promo-banner');
    const nav = document.getElementById('category-nav');
    if (trustBar) trustBar.style.display = show ? '' : 'none';
    if (banner) banner.style.display = show ? '' : 'none';
    if (nav) nav.style.display = show ? '' : 'none';
    catalogueEl.style.display = show ? '' : 'none';
    resultsEl.style.display = show ? 'none' : 'block';
  }

  function buildResultsHtml(q) {
    const vendeurs = (window.Platform && window.Platform.vendors) ? window.Platform.vendors() : [];
    const matches = [];

    vendeurs.forEach(function (v) {
      if (v.active === false) return;
      (v.products || []).forEach(function (p) {
        const haystack = ((p.name || '') + ' ' + (p.description || '') + ' ' + (v.name || '')).toLowerCase();
        if (haystack.indexOf(q) !== -1) matches.push({ p: p, v: v });
      });
    });

    if (!matches.length) {
      return '<p class="search-overlay-empty">Aucun produit trouvé pour votre recherche.</p>';
    }

    // [PERF] Plafond d'affichage : une recherche très large (ex. "a") ne
    // construit plus des centaines de cartes/images d'un coup.
    const MAX_RESULTS = 60;
    const totalMatches = matches.length;
    if (totalMatches > MAX_RESULTS) matches.length = MAX_RESULTS;

    return '<div class="search-overlay-grid">' + matches.map(function (m) {
      const p = m.p, v = m.v;
      const title = p.title || p.name;
      const price = Number(p.price) || 0;
      const img = (p.images && p.images[0]) || '';
      return '' +
        '<div class="tous-card search-result-card" data-id="' + escHtmlOverlay(p.id) + '">' +
          '<div class="tous-card-img"><img src="' + escHtmlOverlay(img) + '" alt="' + escHtmlOverlay(p.alt || p.name) + '" loading="lazy" decoding="async"></div>' +
          '<div class="tous-card-body">' +
            '<div class="tous-card-name">' + escHtmlOverlay(title) + '</div>' +
            '<div class="tous-card-price">' + price.toLocaleString('fr-FR') + ' FCFA</div>' +
            '<div class="tous-card-vendor"><i class="fas fa-store"></i> ' + escHtmlOverlay(v.name) + '</div>' +
          '</div>' +
        '</div>';
    }).join('') + '</div>' +
      (totalMatches > MAX_RESULTS
        ? '<p class="search-overlay-empty">' + totalMatches + ' résultats : affinez votre recherche pour voir les autres.</p>'
        : '');
  }

  function runOverlaySearch(rawQuery) {
    const q = (rawQuery || '').trim().toLowerCase();
    if (!q) {
      toggleMainContent(true);
      resultsEl.innerHTML = '';
      return;
    }
    resultsEl.innerHTML = buildResultsHtml(q);
    toggleMainContent(false);
  }

  // Clic sur un résultat -> referme l'écran de recherche puis ouvre la
  // fiche complète chez le bon vendeur (même mécanisme de lien #id que la
  // grille "Tous" : galerie, caractéristiques, bouton Commander inclus).
  resultsEl.addEventListener('click', function (e) {
    const card = e.target.closest('.search-result-card');
    if (!card) return;
    const id = card.dataset.id;
    searchInputEl.value = '';
    runOverlaySearch('');
    if (window.location.hash === '#' + id) {
      window.dispatchEvent(new Event('hashchange'));
    } else {
      window.location.hash = id;
    }
  });

  // Écouteur INDÉPENDANT de celui de la recherche d'origine (voir plus
  // haut dans ce fichier) : les deux tournent sans interférer l'un avec
  // l'autre.
  let overlayDebounce = null;
  searchInputEl.addEventListener('input', function () {
    const value = this.value;
    clearTimeout(overlayDebounce);
    overlayDebounce = setTimeout(function () { runOverlaySearch(value); }, 120);
  });

  // Le bouton "Effacer" existant doit aussi refermer cet écran.
  const clearBtn = document.getElementById('search-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () { runOverlaySearch(''); });
  }
})();
