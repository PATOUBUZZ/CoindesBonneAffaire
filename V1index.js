(function() {
  const phoneNumber = "+22961196907"; // Numéro WhatsApp
  let cart = []; // Structure : [{id, name, price, qty}]

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

  // 1. Navigation entre les catégories
  const catButtons = document.querySelectorAll('.cat-btn');
  const sections = document.querySelectorAll('.category-section');

  catButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      catButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const category = this.dataset.category;
      sections.forEach(sec => sec.classList.remove('active'));
      const activeSec = document.getElementById('cat-' + category);
      if (activeSec) activeSec.classList.add('active');
    });
  });

  // 2. Gestionnaire de Galerie d'images avec Vignettes (Thumbnails)
  document.querySelectorAll('.product-gallery').forEach(gallery => {
    const mainImg = gallery.querySelector('.main-img');
    const thumbs = gallery.querySelectorAll('.thumb');

    thumbs.forEach(thumb => {
      thumb.addEventListener('click', function() {
        // Mettre à jour la source de l'image principale
        mainImg.src = this.src;

        // Mise à jour de la classe active
        thumbs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
      });
    });
  });

  // 3. Panneau de caractéristiques déroulant
  document.querySelectorAll('.features-toggle').forEach(toggle => {
    toggle.addEventListener('click', function() {
      const targetId = this.dataset.target;
      const panel = document.getElementById(targetId);
      if (panel) {
        panel.classList.toggle('open');
        this.classList.toggle('open');
      }
    });
  });

  // 4. Gestion du Panier (Ajout)
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const card = this.closest('.product-card');
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
    });
  });

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

  // 6. Liens secondaires directs (WhatsApp direct & Appel direct)
  document.querySelectorAll('.wa-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const msg = this.dataset.msg || "Produit boutique";
      window.open('https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent("Bonjour, intéressé par : " + msg), '_blank');
    });
  });

  document.querySelectorAll('.call-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'tel:' + phoneNumber;
    });
  });

  // 7. Envoi Groupé de la commande via WhatsApp
  formCommande.addEventListener('submit', function(e) {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Votre panier est vide. Veuillez ajouter un produit.");
      return;
    }

    const nom = document.getElementById('cmd-nom').value.trim();
    const tel = document.getElementById('cmd-tel').value.trim();
    const adresse = document.getElementById('cmd-adresse').value.trim();

    let detailsProduits = "";
    let totalGeneral = 0;

    cart.forEach(item => {
      const lineTotal = item.price * item.qty;
      totalGeneral += lineTotal;
      detailsProduits += `• ${item.name} (x${item.qty}) - ${lineTotal.toLocaleString('fr-FR')} FCFA\n`;
    });

    const summary = "🛍️ *NOUVELLE COMMANDE MULTI-PRODUITS*\n\n" +
                    "📦 *Articles commandés :*\n" + detailsProduits + "\n" +
                    "💰 *TOTAL :* " + totalGeneral.toLocaleString('fr-FR') + " FCFA\n\n" +
                    "👤 *Nom & Prénom :* " + nom + "\n" +
                    "📞 *Téléphone :* " + tel + "\n" +
                    "📍 *Adresse :* " + adresse;

    // Envoi simultané vers Telegram ET Formspree, déclenché uniquement
    // au clic sur "Confirmer sur WhatsApp", avant l'ouverture de WhatsApp.
    sendToTelegram(summary);
    sendToFormspree({
      statut: "Commande confirmée (envoyée sur WhatsApp)",
      nom: nom,
      telephone: tel,
      adresse: adresse,
      produits: detailsProduits,
      total: totalGeneral.toLocaleString('fr-FR') + " FCFA"
    });

    window.open('https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(summary), '_blank');

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
  document.querySelectorAll('.product-card').forEach(function(card) {
    const actionButtons = card.querySelector('.action-buttons');
    if (!actionButtons) return;

    const addToCartBtn = actionButtons.querySelector('.add-to-cart-btn');
    if (!addToCartBtn) return;

    const productId = card.dataset.id || '';
    const productName = card.dataset.name || 'ce produit';

    // Ligne conteneur : Commander Maintenant + Partager, côte à côte
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

    // On déplace le bouton existant (ses écouteurs restent intacts)
    // dans la nouvelle ligne, sans le recréer.
    addToCartBtn.parentNode.insertBefore(primaryRow, addToCartBtn);
    primaryRow.appendChild(addToCartBtn);
    primaryRow.appendChild(shareBtn);
  });

  function buildProductUrl(productId) {
    return window.location.origin + window.location.pathname + '#' + productId;
  }

  function shareProduct(productId, productName) {
    const url = buildProductUrl(productId);
    const shareData = {
      title: 'Le Coin des Bonnes Affaires',
      text: productName,
      url: url
    };

    if (navigator.share) {
      // Mobile : partage natif
      navigator.share(shareData).catch(function() {
        /* utilisateur a annulé, on ne fait rien */
      });
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      // Ordinateur / non supporté : copie presse-papiers
      navigator.clipboard.writeText(url).then(function() {
        showShareToast('Lien copié dans le presse-papiers !');
      }).catch(function() {
        window.prompt('Copiez ce lien :', url);
      });
    } else {
      window.prompt('Copiez ce lien :', url);
    }
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

  // ------------------------------------------------------------
  // 2. Ouverture directe sur un produit via le lien de partage (#id)
  // ------------------------------------------------------------
  function activateProductFromHash() {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;

    let targetCard;
    try {
      targetCard = document.querySelector('.product-card[data-id="' + CSS.escape(hash) + '"]');
    } catch (e) {
      targetCard = null;
    }
    if (!targetCard) return;

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
    }

    // Défilement fluide + encadrement temporaire
    setTimeout(function() {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetCard.classList.add('product-highlight-flash');
      setTimeout(function() {
        targetCard.classList.remove('product-highlight-flash');
      }, 2200);
    }, 150);
  }

  window.addEventListener('hashchange', activateProductFromHash);
  activateProductFromHash(); // au chargement initial de la page

  // ------------------------------------------------------------
  // 3. Barre de recherche en temps réel
  // ------------------------------------------------------------
  const searchInput = document.getElementById('product-search');
  const searchClearBtn = document.getElementById('search-clear-btn');

  function applySearch(query) {
    const q = (query || '').trim().toLowerCase();
    const allSections = document.querySelectorAll('.category-section');
    const allCards = document.querySelectorAll('.product-card');

    if (searchClearBtn) {
      searchClearBtn.style.display = q ? 'flex' : 'none';
    }

    if (!q) {
      // Champ vidé : on retire les états forcés, l'affichage
      // classique par catégorie (géré par .active) reprend la main.
      allSections.forEach(function(sec) {
        sec.classList.remove('search-force-active');
      });
      allCards.forEach(function(card) {
        card.classList.remove('search-hidden');
      });
      return;
    }

    const sectionsWithMatch = new Set();

    allCards.forEach(function(card) {
      const name = (card.dataset.name || '').toLowerCase();
      const descEl = card.querySelector('.description');
      const desc = descEl ? descEl.textContent.toLowerCase() : '';
      const matches = name.indexOf(q) !== -1 || desc.indexOf(q) !== -1;

      card.classList.toggle('search-hidden', !matches);

      if (matches) {
        const parentSection = card.closest('.category-section');
        if (parentSection) sectionsWithMatch.add(parentSection);
      }
    });

    allSections.forEach(function(sec) {
      sec.classList.toggle('search-force-active', sectionsWithMatch.has(sec));
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      applySearch(this.value);
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
