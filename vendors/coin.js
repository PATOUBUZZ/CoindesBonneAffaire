/* ============================================================
   VENDEUR : Le Coin des Bonnes Affaires (boutique principale)
   Les 35 produits d'origine, repris tels quels depuis l'ancien index.html.
   Les dossiers d'images existants (Lunette01/, Hub03/, ...) ne bougent pas.
   ============================================================ */
Platform.registerVendor({
  id: 'coin',
  name: 'Le Coin des Bonnes Affaires',
  whatsapp: '+22961196907',
  house: true,          // boutique principale : pas de limite de 6 emplacements
  active: true,

  products: [

    // ---------- LUNETTES ----------
    {
      id: "lunette-1",
      category: "lunettes",
      name: "Lunette Anti-lumière bleue Classique",
      title: "Lunette Anti-lumière bleue",
      price: 8000,
      description: "Protection écrans, UV, soleil. Avec étui.",
      waMsg: "Lunette classique 8000F",
      alt: "Lunette Classique",
      images: ["Lunette01/1767399301442.png", "Lunette01/PXL_20260626_150225444.jpg", "Lunette01/PXL_20260626_151232192.jpg", "Lunette01/PXL_20260626_151305628.jpg"],
      features: [
        "Filtre lumière bleue 90%",
        "Protection UV400",
        "Monture légère en acétate",
        "Livrée avec étui rigide"
      ]
    },
    {
      id: "lunette-2",
      category: "lunettes",
      name: "Lunette Photochromique Outdoor",
      price: 8000,
      description: "S'adapte à la luminosité, idéale extérieur.",
      waMsg: "Lunette photochromique 8000F",
      alt: "Lunette Photochromique",
      images: ["Lunette02/54645451216.webp", "Lunette02/20260819_163958.jpg", "Lunette02/20260819_164056_compressed.jpeg", "Lunette02/20260819_164056.jpg"],
      features: [
        "Verres photochromiques actifs",
        "Anti-reflet & anti-rayures",
        "Monture métal flexible"
      ]
    },
    {
      id: "lunette-3",
      category: "lunettes",
      name: "Lunette Premium Anti-fatigue",
      price: 10000,
      description: "Confort optimal, branches ajustables.",
      waMsg: "Lunette premium 10000F",
      alt: "Lunette Premium",
      images: ["Lunette03/1555526558.webp", "Lunette03/20260819_163045.jpg", "Lunette03/20260819_163237.jpg", "Lunette03/20260819_163313.jpg"]
    },
    {
      id: "lunette-4",
      category: "lunettes",
      name: "Lunette Anti-lumière bleue Pro",
      price: 8000,
      description: "Protection professionnelle pour développeurs & gamers.",
      waMsg: "Lunette pro 8000F",
      alt: "Lunette Pro",
      images: ["Lunette04/1789129833714_compressed.webp", "Lunette04/1787445416117.png", "Lunette04/20260819_164152.jpg", "Lunette04/20260819_164221.jpg"]
    },
    {
      id: "lunette-5",
      category: "lunettes",
      name: "Lunette Solaire Polarisée",
      price: 9000,
      description: "Verres polarisés HD anti-éblouissement.",
      waMsg: "Lunette solaire 9000F",
      alt: "Lunette Solaire",
      images: ["Lunette05/image1.jpg", "Lunette05/image2.jpg", "Lunette05/image3.jpg", "Lunette05/image4.jpg"]
    },

    // ---------- FILTRE ----------
    {
      id: "filtre-1",
      category: "filtre",
      name: "Filtre d'eau de cuisine",
      price: 3000,
      description: "Eau pure, élimine chlore et impuretés. 3 pour 6000F.",
      waMsg: "Filtre eau cuisine",
      alt: "Filtre Cuisine",
      images: ["Filtre01/image1.jpg", "Filtre01/image2.jpg", "Filtre01/image3.jpg", "Filtre01/image4.jpg"]
    },
    {
      id: "filtre-2",
      category: "filtre",
      name: "Filtre d'eau sur Robinet",
      price: 3000,
      description: "Installation rapide, purification instantanée.",
      waMsg: "Filtre robinet",
      alt: "Filtre Robinet",
      images: ["Filtre02/image1.jpg", "Filtre02/image2.jpg", "Filtre02/image3.jpg", "Filtre02/image4.jpg"]
    },
    {
      id: "filtre-3",
      category: "filtre",
      name: "Cartouche Filtre à Charbon",
      price: 2500,
      description: "Recharge filtre charbon actif longue durée.",
      waMsg: "Cartouche filtre",
      alt: "Cartouche Filtre",
      images: ["Filtre03/image1.jpg", "Filtre03/image2.jpg", "Filtre03/image3.jpg", "Filtre03/image4.jpg"]
    },
    {
      id: "filtre-4",
      category: "filtre",
      name: "Purificateur d'eau Compact",
      price: 4000,
      description: "Système multi-couches anti-bactérien.",
      waMsg: "Purificateur d eau",
      alt: "Purificateur Compact",
      images: ["Filtre04/image1.jpg", "Filtre04/image2.jpg", "Filtre04/image3.jpg", "Filtre04/image4.jpg"]
    },
    {
      id: "filtre-5",
      category: "filtre",
      name: "Pommeau de Douche Filtrant",
      price: 5000,
      description: "Billes céramiques purifiantes pour une peau douce.",
      waMsg: "Pommeau filtrant",
      alt: "Pommeau Filtrant",
      images: ["Filtre05/image1.jpg", "Filtre05/image2.jpg", "Filtre05/image3.jpg", "Filtre05/image4.jpg"]
    },

    // ---------- TABLEAU ----------
    {
      id: "tableau-1",
      category: "tableau",
      name: "Tableau mural personnalisé",
      price: 9000,
      description: "Cadre noir, plaque dorée, plexiglas. Sur mesure.",
      waMsg: "Tableau personnalisé",
      alt: "Tableau mural",
      images: ["Tableau01/IMG-20260528-WA0004(1).jpg", "Tableau01/1789424976932_compressed.webp", "Tableau01/1789424802944.jpg", "Tableau01/1789424968822_compressed.webp"]
    },
    {
      id: "tableau-2",
      category: "tableau",
      name: "Tableau Portrait Plexiglas",
      price: 8000,
      description: "Finition brillante luxe avec support métallique.",
      waMsg: "Tableau plexiglas",
      alt: "Tableau Plexiglas",
      images: ["Tableau02/s-l1200_compressed.webp", "Tableau02/1789427266449_compressed.webp", "Tableau02/1789427275029_compressed.webp", "Tableau02/tableau-dcoratif-avec-cadre_compressed.webp"]
    },
    {
      id: "tableau-3",
      category: "tableau",
      name: "Cadre Photo Lumineux LED",
      price: 10000,
      description: "Éclairage LED intégré pour mettre vos photos en valeur.",
      waMsg: "Cadre LED",
      alt: "Cadre LED",
      images: ["Tableau03/image1.jpg", "Tableau03/image2.jpg", "Tableau03/image3.jpg", "Tableau03/image4.jpg"]
    },
    {
      id: "tableau-4",
      category: "tableau",
      name: "Plaque Acrylique Décorative",
      price: 7000,
      description: "Impression HD directe sur plaque acrylique haute qualité.",
      waMsg: "Plaque acrylique",
      alt: "Plaque Acrylique",
      images: ["Tableau04/image1.jpg", "Tableau04/image2.jpg", "Tableau04/image3.jpg", "Tableau04/image4.jpg"]
    },
    {
      id: "tableau-5",
      category: "tableau",
      name: "Tableau Triptyque Moderne",
      title: "Tableau Triptyque 3 Pièces",
      price: 12000,
      description: "Ensemble de 3 panneaux pour une décoration grand format.",
      waMsg: "Tableau triptyque",
      alt: "Tableau Triptyque",
      images: ["Tableau05/image1.jpg", "Tableau05/image2.jpg", "Tableau05/image3.jpg", "Tableau05/image4.jpg"]
    },

    // ---------- STAND ----------
    {
      id: "stand-1",
      category: "stand",
      name: "Stand PC ergonomique",
      title: "Support ergonomique en fer, jusqu'a 12kg par bras",
      price: 41000,
      description: "Réglable, améliore la posture.",
      waMsg: "Stand PC",
      alt: "Stand PC ergonomique",
      images: ["SUPPORT02E/1762677939124.png", "SUPPORT02E/1762677942373.png", "SUPPORT02E/1762677948195.png", "SUPPORT02E/1762677914834.png"]
    },
    {
      id: "stand-2",
      category: "stand",
      name: "Support PC Aluminium",
      title: ">Support ergonomique en fer, jusqu'a 12kg par bras",
      price: 37500,
      description: "Structure alu pliable et refroidissante.",
      waMsg: "Stand PC alu",
      alt: "Support PC Aluminium",
      images: ["SUPPORT01E/1789426308554_compressed.webp", "SUPPORT01E/1789426482931_compressed.webp", "SUPPORT01E/1789426502102_compressed.webp", "SUPPORT01E/1789426482931_compressed.webp"]
    },
    {
      id: "stand-3",
      category: "stand",
      name: "Support Ventilée USB",
      title: "Support mobile TV en métal pour les conférence etc..",
      price: 115000,
      description: "Double ventilateur silencieux alimenté par USB.",
      waMsg: "Stand PC ventile",
      alt: "Support Ventilé",
      images: ["SupportTV/1789430425454_compressed.webp", "SupportTV/1789430372636_compressed.webp", "SupportTV/1789430323930_compressed.webp", "SupportTV/1789430264401_compressed.webp"]
    },
    {
      id: "stand-4",
      category: "stand",
      name: "Stand Téléphone / Tablette",
      price: 2500,
      description: "Support universel réglable de bureau.",
      waMsg: "Stand telephone",
      alt: "Stand Telephone",
      images: ["Stand04/image1.jpg", "Stand04/image2.jpg", "Stand04/image3.jpg", "Stand04/image4.jpg"]
    },
    {
      id: "stand-5",
      category: "stand",
      name: "Support Vertical Double PC",
      price: 4500,
      description: "Rangement vertical gain de place pour 2 ordinateurs.",
      waMsg: "Support vertical PC",
      alt: "Support Vertical",
      images: ["Stand05/image1.jpg", "Stand05/image2.jpg", "Stand05/image3.jpg", "Stand05/image4.jpg"]
    },

    // ---------- OTG ----------
    {
      id: "otg-1",
      category: "otg",
      name: "Adaptateur OTG Type-C",
      price: 2000,
      description: "Connectez clé USB à votre téléphone Android.",
      waMsg: "OTG Type C",
      alt: "OTG Type-C",
      images: ["Otg01/image1.jpg", "Otg01/image2.jpg", "Otg01/image3.jpg", "Otg01/image4.jpg"]
    },
    {
      id: "otg-2",
      category: "otg",
      name: "Adaptateur OTG iPhone/Lightning",
      title: "Adaptateur OTG iPhone",
      price: 2500,
      description: "Transférez vos fichiers facilement sur iPhone/iPad.",
      waMsg: "OTG iPhone",
      alt: "OTG iPhone",
      images: ["Otg02/image1.jpg", "Otg02/image2.jpg", "Otg02/image3.jpg", "Otg02/image4.jpg"]
    },
    {
      id: "otg-3",
      category: "otg",
      name: "Câble OTG Tressé Ultra-Résistant",
      title: "Câble OTG Tressé",
      price: 2500,
      description: "Câble renforcé en nylon anti-torsion.",
      waMsg: "Cable OTG tresse",
      alt: "Cable OTG Tresce",
      images: ["Otg03/image1.jpg", "Otg03/image2.jpg", "Otg03/image3.jpg", "Otg03/image4.jpg"]
    },
    {
      id: "otg-4",
      category: "otg",
      name: "Adaptateur OTG 2-en-1 Micro/Type-C",
      title: "Adaptateur OTG 2-en-1",
      price: 3000,
      description: "Compatible Micro-USB et USB Type-C simultanément.",
      waMsg: "OTG 2 en 1",
      alt: "OTG 2-en-1",
      images: ["Otg04/image1.jpg", "Otg04/image2.jpg", "Otg04/image3.jpg", "Otg04/image4.jpg"]
    },
    {
      id: "otg-5",
      category: "otg",
      name: "Hub Mini OTG 3 Ports",
      price: 3500,
      description: "Connectez jusqu'à 3 périphériques USB en même temps sur smartphone.",
      waMsg: "Mini Hub OTG",
      alt: "Mini Hub OTG",
      images: ["Otg05/image1.jpg", "Otg05/image2.jpg", "Otg05/image3.jpg", "Otg05/image4.jpg"]
    },

    // ---------- ECOUTEURS ----------
    {
      id: "ecouteurs-1",
      category: "ecouteurs",
      name: "Écouteurs sans fil TWS",
      price: 5000,
      description: "Bluetooth 5.0, autonomie longue durée.",
      waMsg: "Ecouteurs TWS",
      alt: "Ecouteurs TWS",
      images: ["Ecouteurs01/image1.jpg", "Ecouteurs01/image2.jpg", "Ecouteurs01/image3.jpg", "Ecouteurs01/image4.jpg"]
    },
    {
      id: "ecouteurs-2",
      category: "ecouteurs",
      name: "Écouteurs Pro ANC",
      price: 8000,
      description: "Réduction active du bruit et son HD stéréo.",
      waMsg: "Ecouteurs Pro ANC",
      alt: "Ecouteurs Pro ANC",
      images: ["Ecouteurs02/image1.jpg", "Ecouteurs02/image2.jpg", "Ecouteurs02/image3.jpg", "Ecouteurs02/image4.jpg"]
    },
    {
      id: "ecouteurs-3",
      category: "ecouteurs",
      name: "Casque Bluetooth Pliable",
      price: 7000,
      description: "Basses puissantes et coussinets grand confort.",
      waMsg: "Casque bluetooth",
      alt: "Casque Bluetooth",
      images: ["Ecouteurs03/image1.jpg", "Ecouteurs03/image2.jpg", "Ecouteurs03/image3.jpg", "Ecouteurs03/image4.jpg"]
    },
    {
      id: "ecouteurs-4",
      category: "ecouteurs",
      name: "Écouteurs Sport Magnétiques",
      price: 4500,
      description: "Idéal pour le sport, résistant à la transpiration.",
      waMsg: "Ecouteurs sport",
      alt: "Ecouteurs Sport",
      images: ["Ecouteurs04/image1.jpg", "Ecouteurs04/image2.jpg", "Ecouteurs04/image3.jpg", "Ecouteurs04/image4.jpg"]
    },
    {
      id: "ecouteurs-5",
      category: "ecouteurs",
      name: "Écouteurs Filaire Jack 3.5mm",
      title: "Écouteurs Filaire Jack",
      price: 2000,
      description: "Son clair et micro intégré pour appels.",
      waMsg: "Ecouteurs filaires",
      alt: "Ecouteurs Filaire",
      images: ["Ecouteurs05/image1.jpg", "Ecouteurs05/image2.jpg", "Ecouteurs05/image3.jpg", "Ecouteurs05/image4.jpg"]
    },

    // ---------- HUB ----------
    {
      id: "hub-1",
      category: "hub",
      name: "Hub PC 4 Ports USB 3.0",
      price: 3500,
      description: "USB 3.0 ultra rapide, compact et résistant.",
      waMsg: "Hub PC 4 ports",
      alt: "Hub USB 3.0",
      images: ["Hub01/image1.jpg", "Hub01/image2.jpg", "Hub01/image3.jpg", "Hub01/image4.jpg"]
    },
    {
      id: "hub-2",
      category: "hub",
      name: "Hub Type-C HDMI 4K",
      price: 7000,
      description: "Sortie HDMI 4K, USB 3.0, port de charge PD.",
      waMsg: "Hub Type C HDMI",
      alt: "Hub HDMI 4K",
      images: ["Hub02/image1.jpg", "Hub02/image2.jpg", "Hub02/image3.jpg", "Hub02/image4.jpg"]
    },
    {
      id: "hub-3",
      category: "hub",
      name: "Hub Lecteur Carte SD/TF",
      price: 3000,
      description: "Double fente SD et Micro SD transfert rapide.",
      waMsg: "Hub lecteur carte",
      alt: "Hub Lecteur Carte",
      images: ["Hub03/image1.jpg", "Hub03/image2.jpg", "Hub03/image3.jpg", "Hub03/image4.jpg"]
    },
    {
      id: "hub-4",
      category: "hub",
      name: "Hub USB Interrupteurs LED",
      price: 5000,
      description: "Boutons On/Off pour chaque port avec voyant LED.",
      waMsg: "Hub interrupteurs",
      alt: "Hub Interrupteurs",
      images: ["Hub04/image1.jpg", "Hub04/image2.jpg", "Hub04/image3.jpg", "Hub04/image4.jpg"]
    },
    {
      id: "hub-5",
      category: "hub",
      name: "Station d'accueil 8-en-1 USB-C",
      title: "Station d'accueil 8-en-1",
      price: 10000,
      description: "HDMI 4K, RJ45, Ethernet, USB 3.0, Lecteur SD.",
      waMsg: "Station d accueil 8 en 1",
      alt: "Station d'accueil 8-en-1",
      images: ["Hub05/image1.jpg", "Hub05/image2.jpg", "Hub05/image3.jpg", "Hub05/image4.jpg"]
    }
  ]
});
