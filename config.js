/* ============================================================
   CONFIG.JS — Réglages généraux de la plateforme
   (fichier modifié rarement : catégories + règles globales)
   ============================================================ */
window.PLATFORM_CONFIG = {

  // Nombre d'emplacements produits par vendeur partenaire.
  // (La boutique principale, marquée "house: true", n'est pas limitée.)
  maxSlotsPerVendor: 6,

  // Afficher "Vendu par ..." aussi sur les produits de la boutique principale ?
  showHouseTag: false,

  // Mélanger l'ordre des produits à chaque visite (équité de visibilité entre vendeurs).
  // false = ordre stable (boutique principale d'abord, puis vendeurs dans l'ordre d'inscription).
  shuffleProducts: false,

  // Catégories affichées dans le menu. L'ordre ici = l'ordre du menu.
  // Une catégorie sans produit n'est pas affichée. Si un vendeur utilise une
  // catégorie absente de cette liste, elle est créée automatiquement.
  categories: [
    { id: 'lunettes',  label: 'Lunettes',       icon: 'fas fa-glasses' },
    { id: 'tableau',   label: 'Tableaux',       icon: 'fas fa-image' },
    { id: 'stand',     label: 'Bras Articulé',  icon: 'fas fa-laptop' },
    { id: 'filtre',    label: "Filtre d'eau",   icon: 'fas fa-faucet' },
    { id: 'otg',       label: 'OTG',            icon: 'fas fa-usb' },
    { id: 'ecouteurs', label: 'Écouteurs',      icon: 'fas fa-headphones' },
    { id: 'hub',       label: 'Hub',            icon: 'fas fa-network-wired' }
  ]
};
