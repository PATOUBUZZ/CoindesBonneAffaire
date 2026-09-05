(function() {
  const phoneNumber = "+22961196907"; // Numéro WhatsApp du vendeur
  let cart = []; // Structure : [{id, name, price, qty}]

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
const carousels = document.querySelectorAll('.carousel'); // sélectionne TOUS les carrousels
const scrollAmount = 350;

carousels.forEach(carousel => {
  setInterval(() => {
    carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });

    // Quand on dépasse la moitié (fin du premier set), revenir au début
    if (carousel.scrollLeft >= carousel.scrollWidth / 2) {
      carousel.scrollTo({ left: 0, behavior: 'instant' });
    }
  }, 2000);
});
  // 2. Panneau de caractéristiques déroulant
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

  // 3. Gestion du Panier (Ajout)
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

  // Mise à jour du compteur sur le header
  function updateCartBadge() {
    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    cartCountEl.textContent = totalCount;
  }

  // Rendu dynamique du panier dans le modal
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

    // Attacher les événements +/-
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

  // 4. Gestion de la Fenêtre Modal
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

  // 5. Liens secondaires directs (WhatsApp direct & Appel direct)
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

    // Construction du récapitulatif des produits
    let detailsProduits = "";
    let totalGeneral = 0;

    cart.forEach(item => {
      const lineTotal = item.price * item.qty;
      totalGeneral += lineTotal;
      detailsProduits += `• ${item.name} (x${item.qty}) - ${lineTotal.toLocaleString('fr-FR')} FCFA\n`;
    });

    // Message WhatsApp structuré et propre
    const summary = "🛍️ *NOUVELLE COMMANDE MULTI-PRODUITS*\n\n" +
                    "📦 *Articles commandés :*\n" + detailsProduits + "\n" +
                    "💰 *TOTAL :* " + totalGeneral.toLocaleString('fr-FR') + " FCFA\n\n" +
                    "👤 *Nom & Prénom :* " + nom + "\n" +
                    "📞 *Téléphone :* " + tel + "\n" +
                    "📍 *Adresse :* " + adresse;

    window.open('https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(summary), '_blank');

    // Réinitialisation après envoi
    formCommande.reset();
    cart = [];
    updateCartBadge();
    closeModal();
  });
})();
