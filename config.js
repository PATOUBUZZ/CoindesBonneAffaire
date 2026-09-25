/* ============================================================
   CONFIG.JS — Réglages généraux de la plateforme
   (fichier modifié rarement : catégories + règles globales)
   ============================================================ */
window.PLATFORM_CONFIG = {

  // [SUPABASE] Renseignez url + anonKey pour lire les vendeurs/produits/photos
  // depuis Supabase au lieu de vendors.json (voir le guide d'intégration pour
  // savoir où trouver ces deux valeurs). Laissez les deux vides "" pour
  // continuer avec vendors.json exactement comme avant — rien d'autre à changer.
  //
  // SÉCURITÉ : anonKey est faite pour être publique (visible dans le code du
  // site) — c'est le rôle des policies "lecture publique" du script SQL de
  // limiter ce qu'elle peut faire. Ne mettez JAMAIS ici la clé "service_role"
  // (celle-là donne un accès total à la base, elle doit rester strictement
  // secrète et ne JAMAIS apparaître dans un fichier envoyé au navigateur).
  supabase: {
    url: '',      // ex: 'https://abcdefghijklmno.supabase.co'
    anonKey: ''   // la clé "anon public" (Project Settings -> API)
  },

  // Nombre d'emplacements produits par vendeur partenaire.
  // (La boutique principale, marquée "house: true", n'est pas limitée.)
  maxSlotsPerVendor: 6,

  // Afficher "Vendu par ..." aussi sur les produits de la boutique principale ?
  showHouseTag: false,

  // Mélanger l'ordre des produits À L'INTÉRIEUR de chaque boutique, à chaque
  // chargement. Concerne uniquement l'ordre DANS un onglet de boutique.
  // false = ordre stable (ordre d'écriture dans vendors.json).
  shuffleProducts: false,

  // [ÉQUITÉ] Mélanger l'ordre des ONGLETS BOUTIQUE dans le header (le bouton
  // "Tous" reste toujours en tête / à côté de l'onglet actif, lui, n'est
  // jamais mélangé). true (recommandé) = ordre différent à chaque chargement
  // du site, pour que chaque vendeur ait sa chance d'apparaître en premier.
  // POUR BLOQUER CET ALÉATOIRE (ordre stable, dans l'ordre de vendors.json) :
  // passer cette valeur à false.
  shuffleVendorNav: true,

  // NOTE : la grille "Tous" (tous les produits de tous les vendeurs) est
  // TOUJOURS mélangée à chaque chargement, sans réglage pour la désactiver —
  // c'est le principe même de cette vue (équité totale, voir platform.js).

  // Catégories : servent uniquement à CLASSER vos produits dans vendors.json
  // (champ "category" de chaque produit). Depuis l'ajout des boutiques et de
  // la vue "Tous", elles ne créent plus d'onglet dans le header — elles
  // restent disponibles pour un filtrage par type de produit si vous en
  // avez besoin plus tard.
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
