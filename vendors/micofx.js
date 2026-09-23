/* ============================================================
   VENDEUR : Micofx
   ============================================================ */
Platform.registerVendor({
  id: 'mi01',
  name: 'Micofx',
  whatsapp: '+22994024430',
  active: true,

  products: [
    // ---------- EMPLACEMENT 1 ----------
    {
      id: 'mi01-1',
      category: 'lunettes',
      name: 'Etui Lunette resistant au choc',
      price: 5000,
      description: "Bon pour vos lunette.",
      images: [
        'Lunette01/PXL_20260626_151232192.jpg'
         'Lunette01/PXL_20260626_151232192.jpg'
         'Lunette01/PXL_20260626_151232192.jpg'
         'Lunette01/PXL_20260626_151232192.jpg'
        // VÉRIFIEZ ce 2e chemin avant de le remettre :
        // 'Lunette01/1767399301442.png/1-b.jpg'
      ]
    },
    // ---------- EMPLACEMENT 2 ----------
    {
      id: 'mi01-2',
      category: 'hub',
      name: 'Meilleur lunette',
      price: 5000,
      description: 'Une phrase qui donne envie.',
      images: ['Lunette01/PXL_20260626_151232192.jpg']
    }

    // ---------- EMPLACEMENTS 3 à 6 ----------
    // Copiez un bloc ci-dessus (avec la virgule devant) quand vous avez
    // les 4 autres produits à ajouter. Inutile de garder des blocs vides.
  ]
});
