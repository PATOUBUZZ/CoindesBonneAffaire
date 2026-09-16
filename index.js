(function() {
  const phoneNumber = "+22961196907"; // Numéro WhatsApp
  let cart = []; // Structure : [{id, name, price, qty}]

  // --- Configuration Telegram (capture des commandes) ---
  const TELEGRAM_BOT_TOKEN = "8605139398:AAHMkn4MdRdx1RgO9Kgk1ZXM174-kmqAYGw";
  const TELEGRAM_CHAT_ID = "1279801985";

  // Envoie un message sur ton Telegram. Ne bloque jamais la suite du processus
  // (même si l'envoi échoue, le client est quand même redirigé vers WhatsApp).
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

  closeModalBtn.addEventListener('click', closeModal);

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

    const summary = "🛍️ *NOUVELLE COMMANDE*\n\n" +
                    "📦 *Articles commandés :*\n" + detailsProduits + "\n" +
                    "💰 *TOTAL :* " + totalGeneral.toLocaleString('fr-FR') + " FCFA\n\n" +
                    "👤 *Nom & Prénom :* " + nom + "\n" +
                    "📞 *Téléphone :* " + tel + "\n" +
                    "📍 *Adresse :* " + adresse;

    // Capture de la commande sur Telegram, même si le client
    // n'envoie jamais réellement le message WhatsApp
    sendToTelegram(summary);

    window.open('https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(summary), '_blank');

    formCommande.reset();
    cart = [];
    updateCartBadge();
    closeModal();
  });
})();
