/*
 * Configuration publique Supabase pour Le Coin des Bonnes Affaires V2.
 *
 * IMPORTANT :
 * - SUPABASE_URL et SUPABASE_ANON_KEY sont des valeurs publiques.
 * - NE JAMAIS mettre la clé service_role ici.
 * - Le site peut fonctionner sans Supabase grâce aux données de secours
 *   présentes dans index.js.
 */
window.MARKETPLACE_CONFIG = {
  SUPABASE_URL: 'https://hwwmrybbhthbhjykselh.supabase.co/rest/v1/',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d21yeWJiaHRoYmhqeWtzZWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMTg1ODUsImV4cCI6MjEwNTU5NDU4NX0.j1Wf76KPqKZzIXaSYM38cia4GEn416jpEAgdBkvVNx4',
  DEFAULT_VENDOR_WHATSAPP: '+22961196907',
  FORMSPREE_URL: 'https://formspree.io/f/xljdrejq',
  CURRENCY: 'FCFA'
};
