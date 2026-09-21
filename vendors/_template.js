/* ============================================================
   MODÈLE — NOUVEAU VENDEUR (6 emplacements)
   ------------------------------------------------------------
   POUR AJOUTER UN VENDEUR (5 minutes) :
   1. Copier ce fichier  ->  vendors/nom-du-vendeur.js
   2. Créer le dossier d'images  ->  vendeurs/nom-du-vendeur/
      et y déposer les photos (ex : 1-a.jpg, 1-b.jpg, 2-a.jpg ...)
   3. Remplir les champs ci-dessous (id, name, whatsapp + produits)
   4. Ajouter UNE ligne dans index.html, sous la ligne de vendors/coin.js :
        <script src="vendors/nom-du-vendeur.js"></script>

   RÈGLES :
   - "id" du vendeur et "id" de chaque produit : uniques sur TOUT le site,
     sans espace ni accent. Convention : préfixer avec l'id du vendeur
     (ex : "awa-1", "awa-2"...). Cet id sert aussi au lien de partage (#awa-1).
   - "whatsapp" : numéro au format international. TESTER le lien
     https://wa.me/<numéro> avant de mettre le vendeur en ligne.
   - 6 produits maximum (le 7e et les suivants sont ignorés).
   - "images" : de 1 à 4 photos par produit. La 1re = photo principale.
   - "category" : une catégorie de config.js (lunettes, hub, ...) ou une
     nouvelle (elle sera créée automatiquement dans le menu).
   - "active: false" suspend le vendeur (ses produits disparaissent)
     sans supprimer ses données.
   - Champs facultatifs : title, alt, features, waMsg.
   ============================================================ */
Platform.registerVendor({
  id: 'nom-du-vendeur',
  name: 'Nom de la boutique',
  whatsapp: '+229XXXXXXXXXX',
  active: true,

  products: [
    // ---------- EMPLACEMENT 1 ----------
    {
      id: 'nom-du-vendeur-1',
      category: 'lunettes',
      name: 'Nom complet du produit',
      price: 5000,
      description: 'Une phrase qui donne envie.',
      images: [
        'vendeurs/nom-du-vendeur/1-a.jpg',
        'vendeurs/nom-du-vendeur/1-b.jpg'
      ]
    },
    // ---------- EMPLACEMENT 2 ----------
    {
      id: 'nom-du-vendeur-2',
      category: 'hub',
      name: 'Nom complet du produit',
      price: 5000,
      description: 'Une phrase qui donne envie.',
      images: ['vendeurs/nom-du-vendeur/2-a.jpg']
    },
    // ---------- EMPLACEMENT 3 ----------
    {
      id: 'nom-du-vendeur-3',
      category: 'hub',
      name: 'Nom complet du produit',
      price: 5000,
      description: 'Une phrase qui donne envie.',
      images: ['vendeurs/nom-du-vendeur/3-a.jpg']
    },
    // ---------- EMPLACEMENT 4 ----------
    {
      id: 'nom-du-vendeur-4',
      category: 'hub',
      name: 'Nom complet du produit',
      price: 5000,
      description: 'Une phrase qui donne envie.',
      images: ['vendeurs/nom-du-vendeur/4-a.jpg']
    },
    // ---------- EMPLACEMENT 5 ----------
    {
      id: 'nom-du-vendeur-5',
      category: 'hub',
      name: 'Nom complet du produit',
      price: 5000,
      description: 'Une phrase qui donne envie.',
      images: ['vendeurs/nom-du-vendeur/5-a.jpg']
    },
    // ---------- EMPLACEMENT 6 ----------
    {
      id: 'nom-du-vendeur-6',
      category: 'hub',
      name: 'Nom complet du produit',
      price: 5000,
      description: 'Une phrase qui donne envie.',
      images: ['vendeurs/nom-du-vendeur/6-a.jpg']
    }
  ]
});
