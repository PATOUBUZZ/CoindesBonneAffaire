(function () {
  'use strict';

  const CONFIG = window.MARKETPLACE_CONFIG || {};
  const DEFAULT_VENDOR = {
    id: 'vendor-principal',
    name: 'Le Coin des Bonnes Affaires',
    slug: 'le-coin-des-bonnes-affaires',
    description: 'Boutique principale de la marketplace',
    whatsapp: CONFIG.DEFAULT_VENDOR_WHATSAPP || '+22961196907',
    phone: CONFIG.DEFAULT_VENDOR_WHATSAPP || '+22961196907',
    active: true
  };

  // Données de secours : elles reprennent les produits actuellement présents
  // dans le site. Elles permettent au site de continuer à fonctionner même
  // avant la configuration de Supabase.
  const FALLBACK_VENDORS = [DEFAULT_VENDOR];
  const FALLBACK_PRODUCTS = [
  {
    "id": "lunette-1",
    "name": "Lunette Anti-lumière bleue Classique",
    "price": 8000,
    "description": "Protection écrans, UV, soleil. Avec étui.",
    "category": "lunettes",
    "images": [
      "Lunette01/1767399301442.png",
      "Lunette01/PXL_20260626_150225444.jpg",
      "Lunette01/PXL_20260626_151232192.jpg",
      "Lunette01/PXL_20260626_151305628.jpg"
    ],
    "features": [
      "Filtre lumière bleue 90%",
      "Protection UV400",
      "Monture légère en acétate",
      "Livrée avec étui rigide"
    ],
    "featured_position": 1,
    "active": true
  },
  {
    "id": "lunette-2",
    "name": "Lunette Photochromique Outdoor",
    "price": 8000,
    "description": "S'adapte à la luminosité, idéale extérieur.",
    "category": "lunettes",
    "images": [
      "Lunette02/54645451216.webp",
      "Lunette02/20260819_163958.jpg",
      "Lunette02/20260819_164056_compressed.jpeg",
      "Lunette02/20260819_164056.jpg"
    ],
    "features": [
      "Verres photochromiques actifs",
      "Anti-reflet & anti-rayures",
      "Monture métal flexible"
    ],
    "featured_position": 2,
    "active": true
  },
  {
    "id": "lunette-3",
    "name": "Lunette Premium Anti-fatigue",
    "price": 10000,
    "description": "Confort optimal, branches ajustables.",
    "category": "lunettes",
    "images": [
      "Lunette03/1555526558.webp",
      "Lunette03/20260819_163045.jpg",
      "Lunette03/20260819_163237.jpg",
      "Lunette03/20260819_163313.jpg"
    ],
    "features": [],
    "featured_position": 3,
    "active": true
  },
  {
    "id": "lunette-4",
    "name": "Lunette Anti-lumière bleue Pro",
    "price": 8000,
    "description": "Protection professionnelle pour développeurs & gamers.",
    "category": "lunettes",
    "images": [
      "Lunette04/1789129833714_compressed.webp",
      "Lunette04/1787445416117.png",
      "Lunette04/20260819_164152.jpg",
      "Lunette04/20260819_164221.jpg"
    ],
    "features": [],
    "featured_position": 4,
    "active": true
  },
  {
    "id": "lunette-5",
    "name": "Lunette Solaire Polarisée",
    "price": 9000,
    "description": "Verres polarisés HD anti-éblouissement.",
    "category": "lunettes",
    "images": [
      "Lunette05/image1.jpg",
      "Lunette05/image2.jpg",
      "Lunette05/image3.jpg",
      "Lunette05/image4.jpg"
    ],
    "features": [],
    "featured_position": 5,
    "active": true
  },
  {
    "id": "filtre-1",
    "name": "Filtre d'eau de cuisine",
    "price": 3000,
    "description": "Eau pure, élimine chlore et impuretés. 3 pour 6000F.",
    "category": "filtre",
    "images": [
      "Filtre01/image1.jpg",
      "Filtre01/image2.jpg",
      "Filtre01/image3.jpg",
      "Filtre01/image4.jpg"
    ],
    "features": [],
    "featured_position": 1,
    "active": true
  },
  {
    "id": "filtre-2",
    "name": "Filtre d'eau sur Robinet",
    "price": 3000,
    "description": "Installation rapide, purification instantanée.",
    "category": "filtre",
    "images": [
      "Filtre02/image1.jpg",
      "Filtre02/image2.jpg",
      "Filtre02/image3.jpg",
      "Filtre02/image4.jpg"
    ],
    "features": [],
    "featured_position": 2,
    "active": true
  },
  {
    "id": "filtre-3",
    "name": "Cartouche Filtre à Charbon",
    "price": 2500,
    "description": "Recharge filtre charbon actif longue durée.",
    "category": "filtre",
    "images": [
      "Filtre03/image1.jpg",
      "Filtre03/image2.jpg",
      "Filtre03/image3.jpg",
      "Filtre03/image4.jpg"
    ],
    "features": [],
    "featured_position": 3,
    "active": true
  },
  {
    "id": "filtre-4",
    "name": "Purificateur d'eau Compact",
    "price": 4000,
    "description": "Système multi-couches anti-bactérien.",
    "category": "filtre",
    "images": [
      "Filtre04/image1.jpg",
      "Filtre04/image2.jpg",
      "Filtre04/image3.jpg",
      "Filtre04/image4.jpg"
    ],
    "features": [],
    "featured_position": 4,
    "active": true
  },
  {
    "id": "filtre-5",
    "name": "Pommeau de Douche Filtrant",
    "price": 5000,
    "description": "Billes céramiques purifiantes pour une peau douce.",
    "category": "filtre",
    "images": [
      "Filtre05/image1.jpg",
      "Filtre05/image2.jpg",
      "Filtre05/image3.jpg",
      "Filtre05/image4.jpg"
    ],
    "features": [],
    "featured_position": 5,
    "active": true
  },
  {
    "id": "tableau-1",
    "name": "Tableau mural personnalisé",
    "price": 9000,
    "description": "Cadre noir, plaque dorée, plexiglas. Sur mesure.",
    "category": "tableau",
    "images": [
      "Tableau01/IMG-20260528-WA0004(1).jpg",
      "Tableau01/1789424976932_compressed.webp",
      "Tableau01/1789424802944.jpg",
      "Tableau01/1789424968822_compressed.webp"
    ],
    "features": [],
    "featured_position": 1,
    "active": true
  },
  {
    "id": "tableau-2",
    "name": "Tableau Portrait Plexiglas",
    "price": 8000,
    "description": "Finition brillante luxe avec support métallique.",
    "category": "tableau",
    "images": [
      "Tableau02/s-l1200_compressed.webp",
      "Tableau02/1789427266449_compressed.webp",
      "Tableau02/1789427275029_compressed.webp",
      "Tableau02/tableau-dcoratif-avec-cadre_compressed.webp"
    ],
    "features": [],
    "featured_position": 2,
    "active": true
  },
  {
    "id": "tableau-3",
    "name": "Cadre Photo Lumineux LED",
    "price": 10000,
    "description": "Éclairage LED intégré pour mettre vos photos en valeur.",
    "category": "tableau",
    "images": [
      "Tableau03/image1.jpg",
      "Tableau03/image2.jpg",
      "Tableau03/image3.jpg",
      "Tableau03/image4.jpg"
    ],
    "features": [],
    "featured_position": 3,
    "active": true
  },
  {
    "id": "tableau-4",
    "name": "Plaque Acrylique Décorative",
    "price": 7000,
    "description": "Impression HD directe sur plaque acrylique haute qualité.",
    "category": "tableau",
    "images": [
      "Tableau04/image1.jpg",
      "Tableau04/image2.jpg",
      "Tableau04/image3.jpg",
      "Tableau04/image4.jpg"
    ],
    "features": [],
    "featured_position": 4,
    "active": true
  },
  {
    "id": "tableau-5",
    "name": "Tableau Triptyque Moderne",
    "price": 12000,
    "description": "Ensemble de 3 panneaux pour une décoration grand format.",
    "category": "tableau",
    "images": [
      "Tableau05/image1.jpg",
      "Tableau05/image2.jpg",
      "Tableau05/image3.jpg",
      "Tableau05/image4.jpg"
    ],
    "features": [],
    "featured_position": 5,
    "active": true
  },
  {
    "id": "stand-1",
    "name": "Stand PC ergonomique",
    "price": 41000,
    "description": "Réglable, améliore la posture.",
    "category": "stand",
    "images": [
      "SUPPORT02E/1762677939124.png",
      "SUPPORT02E/1762677942373.png",
      "SUPPORT02E/1762677948195.png",
      "SUPPORT02E/1762677914834.png"
    ],
    "features": [],
    "featured_position": 1,
    "active": true
  },
  {
    "id": "stand-2",
    "name": "Support PC Aluminium",
    "price": 37500,
    "description": "Structure alu pliable et refroidissante.",
    "category": "stand",
    "images": [
      "SUPPORT01E/1789426308554_compressed.webp",
      "SUPPORT01E/1789426482931_compressed.webp",
      "SUPPORT01E/1789426502102_compressed.webp",
      "SUPPORT01E/1789426482931_compressed.webp"
    ],
    "features": [],
    "featured_position": 2,
    "active": true
  },
  {
    "id": "stand-3",
    "name": "Support Ventilée USB",
    "price": 115000,
    "description": "Double ventilateur silencieux alimenté par USB.",
    "category": "stand",
    "images": [
      "SupportTV/1789430425454_compressed.webp",
      "SupportTV/1789430372636_compressed.webp",
      "SupportTV/1789430323930_compressed.webp",
      "SupportTV/1789430264401_compressed.webp"
    ],
    "features": [],
    "featured_position": 3,
    "active": true
  },
  {
    "id": "stand-4",
    "name": "Stand Téléphone / Tablette",
    "price": 2500,
    "description": "Support universel réglable de bureau.",
    "category": "stand",
    "images": [
      "Stand04/image1.jpg",
      "Stand04/image2.jpg",
      "Stand04/image3.jpg",
      "Stand04/image4.jpg"
    ],
    "features": [],
    "featured_position": 4,
    "active": true
  },
  {
    "id": "stand-5",
    "name": "Support Vertical Double PC",
    "price": 4500,
    "description": "Rangement vertical gain de place pour 2 ordinateurs.",
    "category": "stand",
    "images": [
      "Stand05/image1.jpg",
      "Stand05/image2.jpg",
      "Stand05/image3.jpg",
      "Stand05/image4.jpg"
    ],
    "features": [],
    "featured_position": 5,
    "active": true
  },
  {
    "id": "otg-1",
    "name": "Adaptateur OTG Type-C",
    "price": 2000,
    "description": "Connectez clé USB à votre téléphone Android.",
    "category": "otg",
    "images": [
      "Otg01/image1.jpg",
      "Otg01/image2.jpg",
      "Otg01/image3.jpg",
      "Otg01/image4.jpg"
    ],
    "features": [],
    "featured_position": 1,
    "active": true
  },
  {
    "id": "otg-2",
    "name": "Adaptateur OTG iPhone/Lightning",
    "price": 2500,
    "description": "Transférez vos fichiers facilement sur iPhone/iPad.",
    "category": "otg",
    "images": [
      "Otg02/image1.jpg",
      "Otg02/image2.jpg",
      "Otg02/image3.jpg",
      "Otg02/image4.jpg"
    ],
    "features": [],
    "featured_position": 2,
    "active": true
  },
  {
    "id": "otg-3",
    "name": "Câble OTG Tressé Ultra-Résistant",
    "price": 2500,
    "description": "Câble renforcé en nylon anti-torsion.",
    "category": "otg",
    "images": [
      "Otg03/image1.jpg",
      "Otg03/image2.jpg",
      "Otg03/image3.jpg",
      "Otg03/image4.jpg"
    ],
    "features": [],
    "featured_position": 3,
    "active": true
  },
  {
    "id": "otg-4",
    "name": "Adaptateur OTG 2-en-1 Micro/Type-C",
    "price": 3000,
    "description": "Compatible Micro-USB et USB Type-C simultanément.",
    "category": "otg",
    "images": [
      "Otg04/image1.jpg",
      "Otg04/image2.jpg",
      "Otg04/image3.jpg",
      "Otg04/image4.jpg"
    ],
    "features": [],
    "featured_position": 4,
    "active": true
  },
  {
    "id": "otg-5",
    "name": "Hub Mini OTG 3 Ports",
    "price": 3500,
    "description": "Connectez jusqu'à 3 périphériques USB en même temps sur smartphone.",
    "category": "otg",
    "images": [
      "Otg05/image1.jpg",
      "Otg05/image2.jpg",
      "Otg05/image3.jpg",
      "Otg05/image4.jpg"
    ],
    "features": [],
    "featured_position": 5,
    "active": true
  },
  {
    "id": "ecouteurs-1",
    "name": "Écouteurs sans fil TWS",
    "price": 5000,
    "description": "Bluetooth 5.0, autonomie longue durée.",
    "category": "ecouteurs",
    "images": [
      "Ecouteurs01/image1.jpg",
      "Ecouteurs01/image2.jpg",
      "Ecouteurs01/image3.jpg",
      "Ecouteurs01/image4.jpg"
    ],
    "features": [],
    "featured_position": 1,
    "active": true
  },
  {
    "id": "ecouteurs-2",
    "name": "Écouteurs Pro ANC",
    "price": 8000,
    "description": "Réduction active du bruit et son HD stéréo.",
    "category": "ecouteurs",
    "images": [
      "Ecouteurs02/image1.jpg",
      "Ecouteurs02/image2.jpg",
      "Ecouteurs02/image3.jpg",
      "Ecouteurs02/image4.jpg"
    ],
    "features": [],
    "featured_position": 2,
    "active": true
  },
  {
    "id": "ecouteurs-3",
    "name": "Casque Bluetooth Pliable",
    "price": 7000,
    "description": "Basses puissantes et coussinets grand confort.",
    "category": "ecouteurs",
    "images": [
      "Ecouteurs03/image1.jpg",
      "Ecouteurs03/image2.jpg",
      "Ecouteurs03/image3.jpg",
      "Ecouteurs03/image4.jpg"
    ],
    "features": [],
    "featured_position": 3,
    "active": true
  },
  {
    "id": "ecouteurs-4",
    "name": "Écouteurs Sport Magnétiques",
    "price": 4500,
    "description": "Idéal pour le sport, résistant à la transpiration.",
    "category": "ecouteurs",
    "images": [
      "Ecouteurs04/image1.jpg",
      "Ecouteurs04/image2.jpg",
      "Ecouteurs04/image3.jpg",
      "Ecouteurs04/image4.jpg"
    ],
    "features": [],
    "featured_position": 4,
    "active": true
  },
  {
    "id": "ecouteurs-5",
    "name": "Écouteurs Filaire Jack 3.5mm",
    "price": 2000,
    "description": "Son clair et micro intégré pour appels.",
    "category": "ecouteurs",
    "images": [
      "Ecouteurs05/image1.jpg",
      "Ecouteurs05/image2.jpg",
      "Ecouteurs05/image3.jpg",
      "Ecouteurs05/image4.jpg"
    ],
    "features": [],
    "featured_position": 5,
    "active": true
  },
  {
    "id": "hub-1",
    "name": "Hub PC 4 Ports USB 3.0",
    "price": 3500,
    "description": "USB 3.0 ultra rapide, compact et résistant.",
    "category": "hub",
    "images": [
      "Hub01/image1.jpg",
      "Hub01/image2.jpg",
      "Hub01/image3.jpg",
      "Hub01/image4.jpg"
    ],
    "features": [],
    "featured_position": 1,
    "active": true
  },
  {
    "id": "hub-2",
    "name": "Hub Type-C HDMI 4K",
    "price": 7000,
    "description": "Sortie HDMI 4K, USB 3.0, port de charge PD.",
    "category": "hub",
    "images": [
      "Hub02/image1.jpg",
      "Hub02/image2.jpg",
      "Hub02/image3.jpg",
      "Hub02/image4.jpg"
    ],
    "features": [],
    "featured_position": 2,
    "active": true
  },
  {
    "id": "hub-3",
    "name": "Hub Lecteur Carte SD/TF",
    "price": 3000,
    "description": "Double fente SD et Micro SD transfert rapide.",
    "category": "hub",
    "images": [
      "Hub03/image1.jpg",
      "Hub03/image2.jpg",
      "Hub03/image3.jpg",
      "Hub03/image4.jpg"
    ],
    "features": [],
    "featured_position": 3,
    "active": true
  },
  {
    "id": "hub-4",
    "name": "Hub USB Interrupteurs LED",
    "price": 5000,
    "description": "Boutons On/Off pour chaque port avec voyant LED.",
    "category": "hub",
    "images": [
      "Hub04/image1.jpg",
      "Hub04/image2.jpg",
      "Hub04/image3.jpg",
      "Hub04/image4.jpg"
    ],
    "features": [],
    "featured_position": 4,
    "active": true
  },
  {
    "id": "hub-5",
    "name": "Station d'accueil 8-en-1 USB-C",
    "price": 10000,
    "description": "HDMI 4K, RJ45, Ethernet, USB 3.0, Lecteur SD.",
    "category": "hub",
    "images": [
      "Hub05/image1.jpg",
      "Hub05/image2.jpg",
      "Hub05/image3.jpg",
      "Hub05/image4.jpg"
    ],
    "features": [],
    "featured_position": 5,
    "active": true
  }
];
  const FALLBACK_CATEGORIES = [
    { id: 'lunettes', name: 'Lunettes', icon: 'fa-glasses', active: true },
    { id: 'tableau', name: 'Tableaux', icon: 'fa-image', active: true },
    { id: 'stand', name: 'Bras Articulé', icon: 'fa-laptop', active: true },
    { id: 'filtre', name: "Filtre d'eau", icon: 'fa-faucet', active: true },
    { id: 'otg', name: 'OTG', icon: 'fa-usb', active: true },
    { id: 'ecouteurs', name: 'Écouteurs', icon: 'fa-headphones', active: true },
    { id: 'hub', name: 'Hub', icon: 'fa-network-wired', active: true }
  ];

  let vendors = [];
  let products = [];
  let categories = [];
  let cart = loadCart();
  let supabaseClient = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const cartToggleBtn = $('#cart-toggle-btn');
  const cartCountEl = $('#cart-count');
  const modal = $('#modal-commande');
  const closeModalBtn = $('#close-modal');
  const cartSummaryEl = $('#cart-summary');
  const formCommande = $('#form-commande');
  const marketplaceStatus = $('#marketplace-status');
  const vendorSections = $('#vendor-sections');
  const categoryNavList = $('#category-nav-list');
  const searchInput = $('#product-search');
  const searchClearBtn = $('#search-clear-btn');
  const emptySearchState = $('#empty-search-state');
  const multiVendorModal = $('#multi-vendor-modal');
  const multiVendorList = $('#multi-vendor-list');

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    updateCartBadge();
    initModalEvents();
    initGPS();
    initSearch();
    initMultiVendorModal();

    const loaded = await loadMarketplaceData();
    vendors = loaded.vendors;
    products = loaded.products;
    categories = loaded.categories;

    renderCategoryNav();
    renderMarketplace();
    bindGlobalProductEvents();
    renderCartModal();
    activateProductFromHash();

    setStatus(
      loaded.fromSupabase
        ? 'Marketplace synchronisée.'
        : 'Mode catalogue local actif — connectez Supabase pour gérer les vendeurs et produits.',
      loaded.fromSupabase ? 'success' : 'info'
    );
  }

  async function loadMarketplaceData() {
    supabaseClient = createSupabaseClient();
    if (!supabaseClient) {
      return normalizeData(FALLBACK_VENDORS, FALLBACK_PRODUCTS, FALLBACK_CATEGORIES, false);
    }

    try {
      const [vendorResult, productResult, categoryResult] = await Promise.all([
        supabaseClient.from('vendors').select('*').eq('active', true).order('created_at', { ascending: true }),
        supabaseClient.from('products').select('*').eq('active', true).order('featured_position', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true }),
        supabaseClient.from('categories').select('*').eq('active', true).order('name', { ascending: true })
      ]);

      if (vendorResult.error || productResult.error || categoryResult.error) {
        throw vendorResult.error || productResult.error || categoryResult.error;
      }

      const dbVendors = vendorResult.data || [];
      const dbProducts = productResult.data || [];
      const dbCategories = categoryResult.data || [];

      if (!dbVendors.length || !dbProducts.length) {
        console.warn('Supabase est configuré mais ne contient pas encore de catalogue actif. Fallback utilisé.');
        return normalizeData(FALLBACK_VENDORS, FALLBACK_PRODUCTS, FALLBACK_CATEGORIES, false);
      }

      return normalizeData(dbVendors, dbProducts, dbCategories.length ? dbCategories : FALLBACK_CATEGORIES, true);
    } catch (error) {
      console.error('Erreur Supabase :', error);
      return normalizeData(FALLBACK_VENDORS, FALLBACK_PRODUCTS, FALLBACK_CATEGORIES, false);
    }
  }

  function createSupabaseClient() {
    if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) return null;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    return window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  }

  function normalizeData(vendorRows, productRows, categoryRows, fromSupabase) {
    const vendorMap = new Map();
    vendorRows.forEach(v => vendorMap.set(String(v.id), normalizeVendor(v)));

    const normalizedProducts = productRows.map(p => {
      const vendor = vendorMap.get(String(p.vendor_id)) || DEFAULT_VENDOR;
      return normalizeProduct(p, vendor);
    }).filter(p => p.active);

    const normalizedVendors = vendorRows.map(normalizeVendor).filter(v => v.active);
    const normalizedCategories = categoryRows.map(normalizeCategory).filter(c => c.active);

    if (!fromSupabase) {
      const byVendor = new Map();
      normalizedProducts.forEach(p => {
        if (!byVendor.has(p.vendorId)) byVendor.set(p.vendorId, []);
        byVendor.get(p.vendorId).push(p);
      });
      byVendor.forEach(list => list.forEach((p, index) => { p.featured_position = index < 6 ? index + 1 : null; }));
    }

    return {
      vendors: normalizedVendors.length ? normalizedVendors : [DEFAULT_VENDOR],
      products: normalizedProducts.length ? normalizedProducts : FALLBACK_PRODUCTS,
      categories: normalizedCategories.length ? normalizedCategories : FALLBACK_CATEGORIES,
      fromSupabase
    };
  }

  function normalizeVendor(v) {
    return {
      id: String(v.id),
      name: v.name || 'Vendeur',
      slug: v.slug || slugify(v.name || 'vendeur'),
      logo: v.logo || '',
      description: v.description || '',
      whatsapp: normalizeWhatsapp(v.whatsapp || DEFAULT_VENDOR.whatsapp),
      phone: v.phone || v.whatsapp || DEFAULT_VENDOR.phone,
      city: v.city || '',
      active: v.active !== false
    };
  }

  function normalizeCategory(c) {
    const id = String(c.id || c.slug || slugify(c.name || 'categorie'));
    const fallback = FALLBACK_CATEGORIES.find(x => x.id === id);
    return {
      id,
      name: c.name || fallback?.name || id,
      icon: c.icon || fallback?.icon || 'fa-tag',
      active: c.active !== false
    };
  }

  function normalizeProduct(p, vendor) {
    let images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
    if (!images.length) {
      images = [p.image_1, p.image_2, p.image_3, p.image_4].filter(Boolean);
    }
    if (!images.length && p.image_url) images = [p.image_url];

    let features = Array.isArray(p.features) ? p.features.filter(Boolean) : [];
    if (!features.length) features = [p.feature_1, p.feature_2, p.feature_3, p.feature_4].filter(Boolean);

    return {
      id: String(p.id),
      name: p.name || 'Produit',
      slug: p.slug || slugify(p.name || String(p.id)),
      price: Number(p.price) || 0,
      description: p.description || '',
      category: String(p.category_id || p.category || 'autres'),
      images: images.length ? images : ['https://placehold.co/800x800?text=Produit'],
      features,
      featured_position: Number(p.featured_position) || null,
      vendorId: String(p.vendor_id || vendor.id),
      vendorName: vendor.name,
      vendorWhatsapp: vendor.whatsapp,
      vendorPhone: vendor.phone,
      active: p.active !== false
    };
  }

  function renderCategoryNav() {
    if (!categoryNavList) return;
    categoryNavList.innerHTML = categories.map((cat, index) => `
      <button class="cat-btn ${index === 0 ? 'active' : ''}" data-category="${escapeAttr(cat.id)}" type="button">
        <i class="fas ${escapeAttr(cat.icon)}"></i> ${escapeHtml(cat.name)}
      </button>
    `).join('');

    $$('.cat-btn', categoryNavList).forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.cat-btn', categoryNavList).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const category = btn.dataset.category;
        const target = document.getElementById('cat-' + category);
        $$('.category-section').forEach(sec => sec.classList.remove('active'));
        if (target) target.classList.add('active');
        clearSearch(false);
      });
    });
  }

  function renderMarketplace() {
    if (!vendorSections) return;
    const activeVendors = vendors.filter(v => v.active);
    const vendorFeatured = activeVendors.map(v => ({
      vendor: v,
      products: products.filter(p => p.vendorId === v.id && p.active && p.featured_position >= 1 && p.featured_position <= 6)
        .sort((a, b) => (a.featured_position || 99) - (b.featured_position || 99))
        .slice(0, 6)
    })).filter(group => group.products.length);

    const featuredHtml = vendorFeatured.map(group => `
      <section class="vendor-section" data-vendor-id="${escapeAttr(group.vendor.id)}">
        <div class="vendor-header">
          <div class="vendor-avatar"><i class="fas fa-store"></i></div>
          <div class="vendor-header-text">
            <span class="vendor-label">Vendeur partenaire</span>
            <h3>${escapeHtml(group.vendor.name)}</h3>
            ${group.vendor.description ? `<p>${escapeHtml(group.vendor.description)}</p>` : ''}
          </div>
          <span class="vendor-slot-count">${group.products.length}/6 vedettes</span>
        </div>
        <div class="vendor-featured-grid">
          ${group.products.map(renderProductCard).join('')}
        </div>
      </section>
    `).join('');

    const categoryHtml = categories.map((cat, index) => {
      const catProducts = products.filter(p => p.active && p.category === cat.id);
      return `
        <section class="category-section ${index === 0 ? 'active' : ''}" id="cat-${escapeAttr(cat.id)}" data-category="${escapeAttr(cat.id)}">
          <div class="category-section-heading">
            <div><span class="section-kicker"><i class="fas ${escapeAttr(cat.icon)}"></i> Catalogue</span><h3>${escapeHtml(cat.name)}</h3></div>
            <span class="category-count">${catProducts.length} produit${catProducts.length > 1 ? 's' : ''}</span>
          </div>
          <div class="category-products-grid">
            ${catProducts.length ? catProducts.map(renderProductCard).join('') : '<div class="empty-category">Aucun produit dans cette catégorie.</div>'}
          </div>
        </section>
      `;
    }).join('');

    vendorSections.innerHTML = featuredHtml + categoryHtml;
  }

  function renderProductCard(product) {
    const images = product.images.length ? product.images : ['https://placehold.co/800x800?text=Produit'];
    const main = images[0];
    const featureId = 'feat-' + slugify(product.id) + '-' + Math.random().toString(36).slice(2, 7);
    const featuresHtml = product.features.length ? `
      <button class="features-toggle" data-target="${featureId}" type="button"><i class="fas fa-chevron-down"></i> Caractéristiques</button>
      <div class="features-panel" id="${featureId}">
        <ul class="features-list">${product.features.map(f => `<li><i class="fas fa-check-circle"></i> ${escapeHtml(f)}</li>`).join('')}</ul>
      </div>
    ` : '';

    return `
      <article class="product-card" data-id="${escapeAttr(product.id)}" data-slug="${escapeAttr(product.slug)}" data-name="${escapeAttr(product.name)}" data-price="${product.price}" data-vendor-id="${escapeAttr(product.vendorId)}" data-vendor-whatsapp="${escapeAttr(product.vendorWhatsapp)}">
        <div class="product-gallery">
          <div class="main-image-container">
            <img src="${escapeAttr(main)}" alt="${escapeAttr(product.name)}" class="main-img" loading="lazy">
          </div>
          <div class="thumbnails-container">
            ${images.slice(0, 4).map((img, i) => `<img src="${escapeAttr(img)}" class="thumb ${i === 0 ? 'active' : ''}" alt="Vue ${i + 1}" loading="lazy">`).join('')}
          </div>
        </div>
        <div class="product-vendor-mini"><i class="fas fa-store"></i> ${escapeHtml(product.vendorName)}</div>
        <div class="product-title">${escapeHtml(product.name)} <span class="price">${formatPrice(product.price)} FCFA</span></div>
        <div class="description">${escapeHtml(product.description)}</div>
        ${featuresHtml}
        <div class="action-buttons">
          <div class="primary-row">
            <button class="btn btn-primary add-to-cart-btn" type="button"><i class="fas fa-cart-plus"></i> Commander Maintenant</button>
            <button class="btn btn-share-product" type="button" aria-label="Partager ${escapeAttr(product.name)}"><i class="fas fa-share-alt"></i></button>
          </div>
          <div class="secondary-actions">
            <a href="#" class="btn btn-subtle wa-link" data-msg="${escapeAttr(product.name)}"><i class="fab fa-whatsapp"></i> WhatsApp</a>
            <a href="#" class="btn btn-subtle call-link"><i class="fas fa-phone-alt"></i> Appel</a>
          </div>
        </div>
      </article>
    `;
  }

  function bindGlobalProductEvents() {
    $$('.product-gallery').forEach(gallery => {
      const mainImg = $('.main-img', gallery);
      $$('.thumb', gallery).forEach(thumb => thumb.addEventListener('click', () => {
        mainImg.src = thumb.src;
        $$('.thumb', gallery).forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      }));
    });

    $$('.features-toggle').forEach(toggle => toggle.addEventListener('click', () => {
      const panel = document.getElementById(toggle.dataset.target);
      if (panel) {
        panel.classList.toggle('open');
        toggle.classList.toggle('open');
      }
    }));

    $$('.add-to-cart-btn').forEach(btn => btn.addEventListener('click', () => {
      const card = btn.closest('.product-card');
      const product = findProduct(card?.dataset.id);
      if (!product) return;
      addToCart(product);
      updateCartBadge();
      renderCartModal();
      openModal();
    }));

    $$('.wa-link').forEach(link => link.addEventListener('click', e => {
      e.preventDefault();
      const card = link.closest('.product-card');
      const product = findProduct(card?.dataset.id);
      if (!product) return;
      const msg = `Bonjour, je suis intéressé(e) par : ${product.name} — ${formatPrice(product.price)} FCFA.`;
      openWhatsApp(product.vendorWhatsapp, msg);
    }));

    $$('.call-link').forEach(link => link.addEventListener('click', e => {
      e.preventDefault();
      const card = link.closest('.product-card');
      const product = findProduct(card?.dataset.id);
      const phone = product?.vendorPhone || DEFAULT_VENDOR.phone;
      window.location.href = 'tel:' + phone;
    }));

    $$('.btn-share-product').forEach(btn => btn.addEventListener('click', () => {
      const card = btn.closest('.product-card');
      const product = findProduct(card?.dataset.id);
      if (product) shareProduct(product);
    }));
  }

  function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        vendorId: product.vendorId,
        vendorName: product.vendorName,
        vendorWhatsapp: product.vendorWhatsapp,
        vendorPhone: product.vendorPhone
      });
    }
    saveCart();
  }

  function renderCartModal() {
    if (!cartSummaryEl) return;
    if (!cart.length) {
      cartSummaryEl.innerHTML = '<p style="text-align:center; color:#64748b; font-size:0.85rem;">Votre panier est vide.</p>';
      updateCheckoutVendorNote([]);
      return;
    }

    const groups = groupCartByVendor(cart);
    let total = 0;
    let html = '';

    groups.forEach(group => {
      const groupTotal = group.items.reduce((sum, item) => sum + item.price * item.qty, 0);
      total += groupTotal;
      html += `<div class="cart-vendor-group"><div class="cart-vendor-title"><i class="fas fa-store"></i>${escapeHtml(group.vendorName)}</div>`;
      group.items.forEach(item => {
        html += `
          <div class="cart-item">
            <div class="cart-item-info">
              <span class="cart-item-title">${escapeHtml(item.name)}</span>
              <span class="cart-item-price">${formatPrice(item.price)} FCFA</span>
            </div>
            <div class="cart-item-controls">
              <button type="button" class="qty-btn" data-id="${escapeAttr(item.id)}" data-action="minus">-</button>
              <span>${item.qty}</span>
              <button type="button" class="qty-btn" data-id="${escapeAttr(item.id)}" data-action="plus">+</button>
            </div>
          </div>`;
      });
      html += `<div class="cart-vendor-subtotal">Sous-total vendeur : <strong>${formatPrice(groupTotal)} FCFA</strong></div></div>`;
    });

    html += `<div class="cart-total-bar"><span>Total général :</span><span>${formatPrice(total)} FCFA</span></div>`;
    cartSummaryEl.innerHTML = html;
    updateCheckoutVendorNote(groups);

    $$('.qty-btn', cartSummaryEl).forEach(btn => btn.addEventListener('click', () => {
      const item = cart.find(i => i.id === btn.dataset.id);
      if (!item) return;
      if (btn.dataset.action === 'plus') item.qty += 1;
      else item.qty -= 1;
      cart = cart.filter(i => i.qty > 0);
      saveCart();
      updateCartBadge();
      renderCartModal();
    }));
  }

  function updateCheckoutVendorNote(groups) {
    const note = $('#checkout-vendor-note');
    if (!note) return;
    if (!groups.length) {
      note.style.display = 'none';
      return;
    }
    note.style.display = 'block';
    note.innerHTML = groups.length === 1
      ? `<i class="fas fa-store"></i> Cette commande sera envoyée à <strong>${escapeHtml(groups[0].vendorName)}</strong> sur WhatsApp.`
      : `<i class="fas fa-store"></i> Votre panier contient <strong>${groups.length} vendeurs</strong>. Chaque vendeur recevra uniquement les produits qui lui appartiennent.`;
  }

  function initModalEvents() {
    cartToggleBtn?.addEventListener('click', () => { renderCartModal(); openModal(); });
    closeModalBtn?.addEventListener('click', closeModal);
    window.addEventListener('click', e => {
      if (e.target === modal) closeModal();
      if (e.target === multiVendorModal) closeMultiVendorModal();
    });
  }

  function openModal() { if (modal) modal.style.display = 'flex'; }
  function closeModal() { if (modal) modal.style.display = 'none'; }

  async function handleCheckoutSubmit(e) {
    e.preventDefault();
    if (!cart.length) {
      alert('Votre panier est vide. Veuillez ajouter un produit.');
      return;
    }

    const nom = $('#cmd-nom')?.value.trim();
    const tel = $('#cmd-tel')?.value.trim();
    const adresse = $('#cmd-adresse')?.value.trim();
    if (!nom || !tel || !adresse) return;

    const groups = groupCartByVendor(cart);
    const orderGroups = groups.map(group => createVendorOrder(group, nom, tel, adresse));

    // Enregistre les commandes sans jamais bloquer WhatsApp si Supabase est indisponible.
    await Promise.all(orderGroups.map(saveOrderToSupabase));
    sendOrderToFormspree(orderGroups, nom, tel, adresse);

    if (orderGroups.length === 1) {
      openWhatsApp(orderGroups[0].vendorWhatsapp, orderGroups[0].whatsappMessage);
      finishCheckout();
      return;
    }

    showMultiVendorHandoff(orderGroups);
    finishCheckout(false);
  }

  formCommande?.addEventListener('submit', handleCheckoutSubmit);

  function createVendorOrder(group, nom, tel, adresse) {
    const total = group.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const details = group.items.map(item => `• ${item.name} (x${item.qty}) - ${formatPrice(item.price * item.qty)} FCFA`).join('\n');
    const orderId = 'CDBA-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const whatsappMessage = `🛍️ *NOUVELLE COMMANDE*\n\n📦 *Articles commandés :*\n${details}\n\n💰 *TOTAL :* ${formatPrice(total)} FCFA\n\n👤 *Nom & Prénoms :* ${nom}\n📞 *Téléphone :* ${tel}\n📍 *Adresse :* ${adresse}\n🧾 *Référence :* ${orderId}`;
    return {
      orderId,
      vendorId: group.vendorId,
      vendorName: group.vendorName,
      vendorWhatsapp: group.vendorWhatsapp,
      items: group.items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      total,
      nom, tel, adresse,
      whatsappMessage
    };
  }

  async function saveOrderToSupabase(order) {
    if (!supabaseClient) return;
    try {
      await supabaseClient.from('orders').insert({
        public_order_id: order.orderId,
        vendor_id: order.vendorId,
        customer_name: order.nom,
        customer_phone: order.tel,
        customer_address: order.adresse,
        items: order.items,
        total: order.total,
        status: 'whatsapp_confirmed',
        source: getTrafficSource()
      });
    } catch (error) {
      console.warn('Enregistrement commande Supabase impossible :', error);
    }
  }

  function sendOrderToFormspree(orderGroups, nom, tel, adresse) {
    const url = CONFIG.FORMSPREE_URL;
    if (!url) return;
    const payload = {
      statut: 'Commande confirmée (envoyée sur WhatsApp)',
      nom,
      telephone: tel,
      adresse,
      vendeurs: orderGroups.map(g => g.vendorName).join(' | '),
      produits: orderGroups.map(g => g.items.map(i => `• ${i.name} (x${i.qty})`).join('\n')).join('\n---\n'),
      total: formatPrice(orderGroups.reduce((sum, g) => sum + g.total, 0)) + ' FCFA',
      source: JSON.stringify(getTrafficSource())
    };
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.warn('Formspree :', err));
  }

  function showMultiVendorHandoff(orderGroups) {
    if (!multiVendorModal || !multiVendorList) return;
    multiVendorList.innerHTML = orderGroups.map((order, index) => `
      <div class="vendor-send-card ${index === 0 ? 'pending' : ''}" data-order-index="${index}">
        <div><strong>${escapeHtml(order.vendorName)}</strong><span>${formatPrice(order.total)} FCFA · ${order.items.length} article${order.items.length > 1 ? 's' : ''}</span></div>
        <button type="button" class="btn btn-primary vendor-whatsapp-send" data-order-index="${index}">
          <i class="fab fa-whatsapp"></i> ${index === 0 ? 'Envoyer maintenant' : 'Envoyer'}
        </button>
      </div>
    `).join('');

    $$('.vendor-whatsapp-send', multiVendorList).forEach(btn => btn.addEventListener('click', () => {
      const order = orderGroups[Number(btn.dataset.orderIndex)];
      if (!order) return;
      openWhatsApp(order.vendorWhatsapp, order.whatsappMessage);
      btn.innerHTML = '<i class="fas fa-check"></i> Envoyé';
      btn.disabled = true;
      btn.closest('.vendor-send-card')?.classList.add('sent');
    }));

    multiVendorModal.style.display = 'flex';
    multiVendorModal.setAttribute('aria-hidden', 'false');
  }

  function initMultiVendorModal() {
    $('#close-multi-vendor-modal')?.addEventListener('click', closeMultiVendorModal);
    $('#close-multi-vendor')?.addEventListener('click', closeMultiVendorModal);
  }

  function closeMultiVendorModal() {
    if (!multiVendorModal) return;
    multiVendorModal.style.display = 'none';
    multiVendorModal.setAttribute('aria-hidden', 'true');
  }

  function finishCheckout(clearCart = true) {
    if (clearCart) cart = [];
    saveCart();
    updateCartBadge();
    if (clearCart) {
      formCommande?.reset();
      closeModal();
    } else {
      formCommande?.reset();
      closeModal();
    }
  }

  function groupCartByVendor(items) {
    const map = new Map();
    items.forEach(item => {
      const key = item.vendorId || 'vendor-principal';
      if (!map.has(key)) {
        map.set(key, {
          vendorId: key,
          vendorName: item.vendorName || DEFAULT_VENDOR.name,
          vendorWhatsapp: item.vendorWhatsapp || DEFAULT_VENDOR.whatsapp,
          items: []
        });
      }
      map.get(key).items.push(item);
    });
    return Array.from(map.values());
  }

  function openWhatsApp(phone, message) {
    const normalized = normalizeWhatsapp(phone);
    if (!normalized) {
      alert('Le vendeur n’a pas encore renseigné de numéro WhatsApp valide.');
      return;
    }
    window.open('https://wa.me/' + normalized + '?text=' + encodeURIComponent(message), '_blank', 'noopener');
  }

  function normalizeWhatsapp(phone) {
    return String(phone || '').replace(/[^0-9]/g, '');
  }

  function shareProduct(product) {
    const url = buildProductUrl(product.slug || product.id);
    const shareData = { title: 'Le Coin des Bonnes Affaires', text: product.name, url };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => showShareToast('Lien copié dans le presse-papiers !')).catch(() => window.prompt('Copiez ce lien :', url));
    } else {
      window.prompt('Copiez ce lien :', url);
    }
  }

  function buildProductUrl(identifier) {
    return window.location.origin + window.location.pathname + '#' + encodeURIComponent(identifier);
  }

  function activateProductFromHash() {
    const rawHash = decodeURIComponent(window.location.hash.replace(/^#/, ''));
    if (!rawHash) return;
    const target = $$('.product-card').find(card => card.dataset.id === rawHash || card.dataset.slug === rawHash);
    if (!target) return;
    clearSearch(false);
    const section = target.closest('.category-section');
    if (section) {
      $$('.category-section').forEach(sec => sec.classList.remove('active'));
      section.classList.add('active');
      $$('.cat-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.category === section.dataset.category));
    }
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('product-highlight-flash');
      setTimeout(() => target.classList.remove('product-highlight-flash'), 2200);
    }, 150);
  }

  window.addEventListener('hashchange', activateProductFromHash);

  function initSearch() {
    searchInput?.addEventListener('input', () => applySearch(searchInput.value));
    searchClearBtn?.addEventListener('click', () => clearSearch(true));
  }

  function applySearch(query) {
    const q = (query || '').trim().toLowerCase();
    if (searchClearBtn) searchClearBtn.style.display = q ? 'flex' : 'none';
    let matches = 0;
    const sections = $$('.category-section');
    sections.forEach(sec => {
      let sectionMatches = 0;
      $$('.product-card', sec).forEach(card => {
        const p = findProduct(card.dataset.id);
        const haystack = `${card.dataset.name || ''} ${p?.description || ''} ${p?.vendorName || ''}`.toLowerCase();
        const match = !q || haystack.includes(q);
        card.classList.toggle('search-hidden', !match);
        if (match) { sectionMatches += 1; matches += 1; }
      });
      sec.classList.toggle('search-force-active', !!q && sectionMatches > 0);
    });
    if (emptySearchState) emptySearchState.style.display = q && matches === 0 ? 'block' : 'none';
    if (!q) {
      sections.forEach(sec => sec.classList.remove('search-force-active'));
      const active = $('.category-section');
      if (active) active.classList.add('active');
    }
  }

  function clearSearch(focus) {
    if (searchInput) searchInput.value = '';
    applySearch('');
    if (focus) searchInput?.focus();
  }

  function initGPS() {
    const gpsBtn = $('#gps-btn');
    const gpsStatus = $('#gps-status');
    const adresseInput = $('#cmd-adresse');
    if (!gpsBtn || !adresseInput) return;
    gpsBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        setGPSStatus(gpsStatus, '❌ Géolocalisation non supportée, saisissez l’adresse manuellement.', 'error');
        return;
      }
      gpsBtn.disabled = true;
      setGPSStatus(gpsStatus, 'Recherche en cours…', '');
      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        adresseInput.value = `https://maps.google.com/?q=${latitude},${longitude}`;
        setGPSStatus(gpsStatus, '✅ Position ajoutée', 'success');
        gpsBtn.disabled = false;
      }, () => {
        setGPSStatus(gpsStatus, '❌ Erreur, saisissez l’adresse manuellement.', 'error');
        gpsBtn.disabled = false;
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
    });
  }

  function setGPSStatus(el, message, type) {
    if (!el) return;
    el.textContent = message;
    el.classList.remove('gps-success', 'gps-error');
    if (type === 'success') el.classList.add('gps-success');
    if (type === 'error') el.classList.add('gps-error');
  }

  function updateCartBadge() {
    if (cartCountEl) cartCountEl.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
  }

  function findProduct(id) { return products.find(p => p.id === String(id)); }

  function saveCart() {
    try { localStorage.setItem('cdb_cart_v2', JSON.stringify(cart)); } catch (_) {}
  }

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem('cdb_cart_v2') || '[]');
      return Array.isArray(saved) ? saved.filter(i => i && i.id && Number(i.qty) > 0) : [];
    } catch (_) { return []; }
  }

  function getTrafficSource() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_content: params.get('utm_content') || '',
      vendor_id: params.get('vendor_id') || '',
      product_id: params.get('product_id') || ''
    };
  }

  function formatPrice(value) { return Number(value || 0).toLocaleString('fr-FR'); }
  function slugify(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
  function escapeAttr(value) { return escapeHtml(value); }

  function setStatus(message, type) {
    if (!marketplaceStatus) return;
    marketplaceStatus.className = 'marketplace-status ' + (type || '');
    marketplaceStatus.innerHTML = type === 'success'
      ? `<i class="fas fa-check-circle"></i> ${escapeHtml(message)}`
      : type === 'info'
        ? `<i class="fas fa-info-circle"></i> ${escapeHtml(message)}`
        : `<span class="loading-spinner"></span> ${escapeHtml(message)}`;
  }

  function showShareToast(message) {
    let toast = $('#share-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'share-toast';
      toast.className = 'share-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._hideTimeout);
    toast._hideTimeout = setTimeout(() => toast.classList.remove('show'), 2200);
  }

})();
