/**
 * Centralized Sale & Special Offers Configuration for Boutique Stitching
 * Sadiqabad, Punjab, Pakistan
 * 
 * OWNER INSTRUCTIONS:
 * Provide your actual sale image URL in SALE_IMAGE_URL below.
 * When you provide the URL, the sale card will automatically display your custom image.
 * If left empty (''), the system gracefully falls back to the flagship showcase collection image.
 */

// =======================================================================
// PLACEHOLDER FOR OWNER'S SALE IMAGE URL:
// Set this to your actual sale banner or outfit image URL (e.g. '/my-sale-image.jpg' or hosted URL).
// =======================================================================
export const SALE_IMAGE_URL = '';

export interface SaleItem {
  id: string;
  title: string;
  titleRomanUrdu: string;
  description: string;
  descriptionRomanUrdu: string;
  category: 'ladies' | 'kids' | 'formal';
  categoryLabel: string;
  categoryLabelRomanUrdu: string;
  originalPrice: number; // in PKR
  salePrice: number;     // in PKR
  discountBadge?: string;
  imageUrl?: string;
  alt: string;
  isFeatured?: boolean;
}

export const SALE_ITEMS: SaleItem[] = [
  {
    id: 'sale-featured-1',
    title: 'Peach Embroidered Festive 3-Piece Stitched Suit',
    titleRomanUrdu: 'Peach Resham Karhai Festive 3-Piece Silai Suit',
    description: 'Fine lawn shirt with heavy resham neckline embroidery, scalloped organza daman & matching dupatta with trousers.',
    descriptionRomanUrdu: 'Nafis lawn kameez par resham karhai, cut-work organza daman, matching dupatta aur stitched trouser.',
    category: 'ladies',
    categoryLabel: 'Ladies Festive',
    categoryLabelRomanUrdu: 'Ladies Collection',
    originalPrice: 6500,
    salePrice: 4850,
    discountBadge: '25% OFF',
    // Uses SALE_IMAGE_URL if configured, otherwise falls back to peach embroidered suit
    imageUrl: SALE_IMAGE_URL || '/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg',
    alt: 'Peach luxury embroidered 3-piece formal suit on special boutique sale in Sadiqabad',
    isFeatured: true,
  },
  {
    id: 'sale-teal-2',
    title: 'Teal Peacock Silk Formal Kurta & Cigarette Pants',
    titleRomanUrdu: 'Teal Peacock Silk Formal Kurta Aur Cigarette Pants',
    description: 'Luxury pure silk kurta with metallic zardozi collar, statement cuff sleeves, and tailored cigarette trousers.',
    descriptionRomanUrdu: 'Silk kurta par zardozi gala, flared statement sleeves aur cigarette pant silai.',
    category: 'formal',
    categoryLabel: 'Party & Formal',
    categoryLabelRomanUrdu: 'Party Wear',
    originalPrice: 8200,
    salePrice: 6200,
    discountBadge: '24% OFF',
    imageUrl: '/src/assets/images/homepage_ladies_teal_formal_1791433341529.jpg',
    alt: 'Teal peacock silk embroidered Pakistani formal suit with statement sleeves on sale',
    isFeatured: false,
  },
  {
    id: 'sale-kids-3',
    title: 'Kids Royal Blue Festive Kurta Shalwar & Dupatta',
    titleRomanUrdu: 'Bachon Ka Royal Blue Festive Kurta Shalwar Aur Dupatta',
    description: 'Comfortable cotton lawn traditional outfit for girls with zari border trim, soft inner lining and dupatta.',
    descriptionRomanUrdu: 'Bachiyon kay liye aaram-deh cotton lawn suit, zari patti aur matching dupatta.',
    category: 'kids',
    categoryLabel: 'Kids Collection',
    categoryLabelRomanUrdu: 'Bachon Ki Collection',
    originalPrice: 4200,
    salePrice: 3150,
    discountBadge: '25% OFF',
    imageUrl: '/src/assets/images/homepage_kids_blue_suit_1791433355604.jpg',
    alt: 'Kids royal blue festive printed and embroidered 3-piece traditional suit on sale',
    isFeatured: false,
  },
  {
    id: 'sale-magenta-4',
    title: 'Magenta Floral Festive Lehenga Choli with Gota',
    titleRomanUrdu: 'Magenta Floral Festive Lehenga Choli Gota Patti Kay Sath',
    description: 'Voluminous flared floral lehenga with gold gota patti lace, structured choli, and lightweight organza dupatta.',
    descriptionRomanUrdu: 'Phoolon wala ghaire-dar lehenga, matching choli aur sonehri gota patti border dupatta.',
    category: 'formal',
    categoryLabel: 'Wedding Guest & Festive',
    categoryLabelRomanUrdu: 'Shaadi & Festive',
    originalPrice: 12500,
    salePrice: 9500,
    discountBadge: '24% OFF',
    imageUrl: '/src/assets/images/homepage_party_magenta_lehenga_1791433369559.jpg',
    alt: 'Magenta floral flared festive lehenga choli with gota lace trim on boutique sale',
    isFeatured: false,
  },
];
