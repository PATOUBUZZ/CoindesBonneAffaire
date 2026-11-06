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
    url: 'https://gezpfixiznuxldosxqqr.supabase.co',      // ex: 'https://abcdefghijklmno.supabase.co'
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlenBmaXhpem51eGxkb3N4cXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNDM3NzYsImV4cCI6MjEwNTkxOTc3Nn0.EAWBxuUewSKqPk1bs0mqpj9TRL-oD2wKF1nxSWiYUdo'   // la clé "anon public" (Project Settings -> API)
  },

  // [MARQUE] Nom et LOGO de la plateforme (utilisés par brand.js sur index.html
  // ET vendeur.html). Le logo remplace l'icône de boutique à gauche du nom,
  // dans le header.
  //   logo : chemin de votre image (ex: 'logo.webp' déposé à côté d'index.html,
  //          ou une URL https://...). Format conseillé : carré, fond transparent
  //          (PNG/WebP/SVG), 128×128 px minimum. Laissez "" pour garder l'icône.
  //   logoAlt : texte alternatif (accessibilité).
  //   favicon : true = le même logo sert aussi d'icône d'onglet du navigateur.
  brand: {
    name: 'Nya-Market',
    logo: 'img/Logo.png',          // ex: 'logo.webp'
    logoAlt: 'Logo Nya-Market',
    favicon: true
  },

  // [PHOTOS VENDEURS] Niveau de compression appliqué par vendeur.html AVANT
  // l'envoi des photos produits (côté navigateur du vendeur).
  //   photoMaxSide  : côté le plus long, en pixels (plus petit = plus léger).
  //   photoQuality  : qualité WebP de départ, de 0.4 (très compressé) à 0.95 (quasi sans perte).
  //   photoTargetKB : poids visé par photo, en Ko. Si une photo est plus lourde,
  //                   la qualité puis la taille sont réduites automatiquement
  //                   jusqu'à l'atteindre. Mettez 0 pour désactiver (qualité fixe).
  //   docMaxSide / docQuality : même principe pour la pièce d'identité (gardez-la lisible).
  // Préréglages :
  //   Léger     -> maxSide 800,  quality 0.6,  targetKB 40
  //   Équilibré -> maxSide 1000, quality 0.8,  targetKB 60   (par défaut)
  //   Qualité   -> maxSide 1400, quality 0.9,  targetKB 150
  uploads: {
    photoMaxSide: 1000,
    photoQuality: 0.8,
    photoTargetKB: 60,
    docMaxSide: 1600,
    docQuality: 0.82
  },

  // [ANNONCES] Bandeau défilant dans le header fixe. Les messages viennent de la
  // table Supabase "announcements" (colonnes : message, link, is_active...).
  //   enabled : INTERRUPTEUR GÉNÉRAL. false = le bandeau n'est jamais affiché,
  //             même si des lignes sont actives dans Supabase (aucune requête n'est faite).
  //   (Pour couper UN SEUL message : décochez is_active sur sa ligne dans Supabase.)
  announcements: {
    enabled: true,
    table: 'announcements'
  },

  // [NOTIFICATIONS PUSH] Clé PUBLIQUE VAPID (celle-ci peut être visible dans le
  // code ; la clé PRIVÉE, elle, reste dans les variables Vercel). Laissez "" pour
  // désactiver complètement les notifications (la cloche n'apparaît pas).
  push: {
    vapidPublicKey: 'BP70bPHmdzX7dJ8HizWN0TesVEW2DI8JKLH6AALavdOj0q3vwDyTPlOWZOfxxtPZ7XfRVcy0aJLoT8NntduwxqQ'   // ex: 'BOr7...' (voir GUIDE-CONFIGURATION.md, étape 3)
  },

  // [ASSISTANT] Chatbot (FAQ + recherche de produits). enabled:false = bouton masqué.
  chat: { enabled: true, endpoint: '/api/chat' },

  // Nombre d'emplacements produits par vendeur partenaire.
  // (La boutique principale, marquée "house: true", n'est pas limitée.)
  // Plafond d'AFFICHAGE du site par boutique (hors boutique principale). La vraie limite de chaque vendeur se règle
  // dans admin.html (globale ou par vendeur, de 1 à 100) : gardez cette valeur >= à la plus grande limite que vous autorisez.
  maxSlotsPerVendor: 100,

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

  // [PERF] Grille "Tous" : nombre de produits affichés au chargement ET ajoutés
  // à chaque clic sur "Voir plus de produits" (24 = 8 lignes de 3). Conseillé :
  // un multiple de 3 (24 ou 30). Ne change rien à la recherche, qui porte
  // toujours sur l'ensemble du catalogue.
  tousPageSize: 24,

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
