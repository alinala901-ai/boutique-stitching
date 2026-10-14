/**
 * Centralized Image Asset Configuration for Boutique Stitching.
 * 
 * OWNER INSTRUCTIONS:
 * Updated with the official home page design collection images provided by the owner:
 * 1. Peach Terracotta Embroidered 3-Piece Suit (Hero / Ladies Collection)
 * 2. Teal Formal Embroidered Suit (Ladies Formal / pret)
 * 3. Kids Royal Blue Traditional Suit (Kids Festive Collection)
 * 4. Festive Magenta Floral Lehenga Choli (Party Wear & Wedding Guest)
 */

export interface ImageAsset {
  id: string;
  url: string;
  alt: string;
  aspectRatio: '16:9' | '4:3' | '1:1' | '4:5' | '3:4';
  title: string;
  category: string;
  note?: string;
}

export const IMAGE_CONFIG = {
  // Image 1 — Hero Visual (Page: Home, Section: Hero)
  hero: {
    id: 'hero',
    url: '/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg',
    alt: 'Pakistani luxury peach embroidered 3-piece formal suit with scalloped organza dupatta by Boutique Stitching',
    aspectRatio: '3:4' as const,
    title: 'Boutique Stitching Flagship Collection',
    category: 'Hero',
    note: 'Official home page showcase image',
  },

  // Image 2 — Ladies Collection (Section: Ladies Collection - Teal Formal)
  ladiesCollection: {
    id: 'ladies-collection',
    url: '/src/assets/images/homepage_ladies_teal_formal_1791433341529.jpg',
    alt: 'Luxury deep teal peacock blue embroidered Pakistani formal suit with resham neckline and flared sleeves',
    aspectRatio: '4:3' as const,
    title: 'Teal Formal Embroidered Suit',
    category: 'Ladies',
    note: 'Official home page ladies formal collection image',
  },

  // Image 3 — Kids Collection (Section: Kids Collection - Blue Traditional)
  kidsCollection: {
    id: 'kids-collection',
    url: '/src/assets/images/homepage_kids_blue_suit_1791433355604.jpg',
    alt: 'Pakistani young girl wearing royal blue printed and embroidered 3-piece festive kurta pajama suit with dupatta',
    aspectRatio: '3:4' as const,
    title: 'Kids Festive Blue Ensemble',
    category: 'Kids',
    note: 'Official home page kids collection image',
  },

  // Image 4 — Bridal & Wedding Wear
  bridal: {
    id: 'bridal-wear',
    url: '/src/assets/images/bridal_couture_stitching_1791431932649.jpg',
    alt: 'Intricate zardozi and hand embroidery on Pakistani bridal couture dress',
    aspectRatio: '4:3' as const,
    title: 'Bridal Couture Work',
    category: 'Bridal',
    note: 'Artisanal bridal stitching detail',
  },

  // Image 5 — Party Wear (Section: Our Designs / Party Wear - Magenta Lehenga Choli)
  partyWear: {
    id: 'party-wear',
    url: '/src/assets/images/homepage_party_magenta_lehenga_1791433369559.jpg',
    alt: 'Festive magenta plum floral printed lehenga choli with gota border trim and sheer dupatta by Boutique Stitching',
    aspectRatio: '3:4' as const,
    title: 'Magenta Festive Lehenga Choli',
    category: 'Party Wear',
    note: 'Official home page festive party wear image',
  },

  // Peach 3-Piece Outfit
  peachSuit: {
    id: 'peach-suit',
    url: '/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg',
    alt: 'Peach terracotta embroidered 3-piece suit with scalloped organza dupatta',
    aspectRatio: '3:4' as const,
    title: 'Peach Scalloped 3-Piece Suit',
    category: 'Ladies',
  },

  // Teal Formal Outfit
  tealSuit: {
    id: 'teal-suit',
    url: '/src/assets/images/homepage_ladies_teal_formal_1791433341529.jpg',
    alt: 'Deep teal blue embroidered Pakistani silk suit with statement sleeves',
    aspectRatio: '4:3' as const,
    title: 'Teal Resham Formal Suit',
    category: 'Ladies',
  },

  // Kids Blue Outfit
  kidsBlueSuit: {
    id: 'kids-blue-suit',
    url: '/src/assets/images/homepage_kids_blue_suit_1791433355604.jpg',
    alt: 'Royal blue printed and embroidered festive kids suit with dupatta',
    aspectRatio: '3:4' as const,
    title: 'Kids Traditional Blue Suit',
    category: 'Kids',
  },

  // Magenta Lehenga Choli
  magentaLehenga: {
    id: 'magenta-lehenga',
    url: '/src/assets/images/homepage_party_magenta_lehenga_1791433369559.jpg',
    alt: 'Festive magenta floral lehenga choli with gota trim',
    aspectRatio: '3:4' as const,
    title: 'Magenta Floral Festive Lehenga',
    category: 'Party Wear',
  },

  // Atelier Workshop / Craftsmanship
  customStitching: {
    id: 'custom-stitching',
    url: '/src/assets/images/craftsmanship_custom_tailoring_1791431948318.jpg',
    alt: 'Master artisan tailor measuring silk fabric with tape in boutique workshop',
    aspectRatio: '1:1' as const,
    title: 'Artisanal Custom Stitching',
    category: 'Craftsmanship',
  },

  // About Section
  about: {
    id: 'about',
    url: '/src/assets/images/craftsmanship_custom_tailoring_1791431948318.jpg',
    alt: 'Dedicated tailor hand-crafting traditional Pakistani garments at Boutique Stitching',
    aspectRatio: '1:1' as const,
    title: 'Craftsmanship Story',
    category: 'About',
  },
};
