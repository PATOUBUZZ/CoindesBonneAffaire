(function() {
  const phoneNumber = "+22961196907"; // Numéro WhatsApp
  let selectedProductName = "";

  // 1. Navigation catégories
  const catButtons = document.querySelectorAll('.cat-btn');
  const sections = document.querySelectorAll('.category-section');

  catButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      catButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const category = this.dataset.category;
      sections.forEach(sec => sec.classList.remove('active'));
      document.getElementById('cat-' + category).classList.add('active');
    });
  });

  // 2. Panneau caractéristiques déroulant
  const toggles = document.querySelectorAll('.features-toggle');
  toggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
      const targetId = this.dataset.target;
      const panel = document.getElementById(targetId);
      if (panel) {
        panel.classList.toggle('open');
        this.classList.toggle('open');
      }
    });
  });

  // 3. Liens WhatsApp directs
  document.querySelectorAll('.wa-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const msg = this.dataset.msg || "Produit boutique";
      window.open('https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent("Bonjour, intéressé par : " + msg), '_blank');
    });
  });

  // 4. Liens d'Appel
  document.querySelectorAll('.call-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'tel:' + phoneNumber;
    });
  });

  // 5. GESTION DU PANNEAU (MODAL) A 4 CHAMPS DE COMMANDE
  const modal = document.getElementById('modal-commande');
  const closeModalBtn = document.getElementById('close-modal');
  const modalProductName = document.getElementById('modal-product-name');
  const formCommande = document.getElementById('form-commande');

  // Ouverture du modal lors du clic sur "Commander"
  document.querySelectorAll('.form-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const card = this.closest('.product-card');
      const fullTitle = card?.querySelector('.product-title')?.textContent?.trim() || "Produit";
      selectedProductName = fullTitle.split('  ')[0]; // Extrait le nom du produit sans le prix
      
      modalProductName.textContent = "Produit : " + selectedProductName;
      modal.style.display = "flex";
    });
  });

  // Fermer la fenêtre modal (bouton X)
  closeModalBtn.addEventListener('click', function() {
    modal.style.display = "none";
  });

  // Fermer si clic à l'extérieur
  window.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Soumission des 4 champs du formulaire
  formCommande.addEventListener('submit', function(e) {
    e.preventDefault();

    const nom = document.getElementById('cmd-nom').value.trim();
    const tel = document.getElementById('cmd-tel').value.trim();
    const qty = document.getElementById('cmd-qty').value;
    const adresse = document.getElementById('cmd-adresse').value.trim();

    // Construction du message WhatsApp propre
    const summary = "🛍️ *NOUVELLE COMMANDE*\n\n" +
                    "📦 *Produit :* " + selectedProductName + "\n" +
                    "🔢 *Quantité :* " + qty + "\n" +
                    "👤 *Nom & Prénom :* " + nom + "\n" +
                    "📞 *Téléphone :* " + tel + "\n" +
                    "📍 *Adresse :* " + adresse;

    window.open('https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(summary), '_blank');

    // Réinitialisation et fermeture
    formCommande.reset();
    document.getElementById('cmd-qty').value = "1";
    modal.style.display = "none";
  });
})();
