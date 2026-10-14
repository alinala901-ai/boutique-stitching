import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { IMAGE_CONFIG } from '../config/images';
import { GalleryItem, BoutiqueDesign } from '../types';
import { fetchBoutiqueDesigns } from '../lib/supabase';
import { X, ZoomIn, Eye, Tag } from 'lucide-react';

export const GallerySection: React.FC = () => {
  const { t, language, formatText } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [items, setItems] = useState<GalleryItem[]>([]);

  const defaultGalleryItems: GalleryItem[] = [
    {
      id: 'g-peach-1',
      title: 'Peach Scalloped 3-Piece Ensemble',
      titleUrdu: 'Peach Rang Ka Resham Aur Scallop 3-Piece Suit',
      category: 'ladies',
      categoryLabel: 'Ladies Collection',
      categoryLabelUrdu: 'Ladies Collection',
      imageUrl: IMAGE_CONFIG.peachSuit.url,
      alt: 'Pakistani luxury peach embroidered 3-piece formal suit with scalloped organza dupatta',
      description: 'Fine white floral resham embroidery on peach lawn shirt with dramatic scalloped organza dupatta.',
      descriptionUrdu: 'Peach rang kay fabric par safaid resham karhai, cut-work daaman aur khubsurat organza dupatta.',
    },
    {
      id: 'g-teal-1',
      title: 'Teal Formal Embroidered Suit',
      titleUrdu: 'Teal Peacock Silk Par Rasmi Karhai Suit',
      category: 'party',
      categoryLabel: 'Party Wear',
      categoryLabelUrdu: 'Party Wear',
      imageUrl: IMAGE_CONFIG.tealSuit.url,
      alt: 'Luxury deep teal peacock blue embroidered Pakistani formal suit with statement bell sleeves',
      description: 'Rich peacock teal silhouette with multi-colored neckline embroidery and wide statement sleeves.',
      descriptionUrdu: 'Shahana teal rang par multi-color neck embroidery, statement bell sleeves aur behtareen silai.',
    },
    {
      id: 'g-kids-1',
      title: 'Royal Blue Kids Festive Suit',
      titleUrdu: 'Bachiyon Ka Riwayati Royal Blue Kurta Dupatta',
      category: 'kids',
      categoryLabel: 'Kids Collection',
      categoryLabelUrdu: 'Bachon Ki Collection',
      imageUrl: IMAGE_CONFIG.kidsBlueSuit.url,
      alt: 'Royal blue traditional printed and embroidered 3-piece suit with organza dupatta for young girls',
      description: 'Charming royal blue festive suit with comfortable inner tailoring and matching lightweight dupatta.',
      descriptionUrdu: 'Bachiyon kay liye Eid aur taqreebat par pehannay ka aaram-deh, halka phulka aur pyara 3-piece suit.',
    },
    {
      id: 'g-magenta-1',
      title: 'Magenta Floral Festive Lehenga Choli',
      titleUrdu: 'Magenta Phoolon Wala Lehenga Choli Gota Patti Kay Sath',
      category: 'bridal',
      categoryLabel: 'Festive & Bridal',
      categoryLabelUrdu: 'Bridal & Party Wear',
      imageUrl: IMAGE_CONFIG.magentaLehenga.url,
      alt: 'Festive magenta plum floral printed lehenga choli with gota border trim and sheer dupatta',
      description: 'Voluminous flared silk lehenga with floral blossoms, cropped blouse, and shimmering gota border trims.',
      descriptionUrdu: 'Shahana magenta rang par dilkash print flared lehenga, matching choli aur chamakdar gota patti kaam.',
    },
    {
      id: 'g-bridal-1',
      title: 'Bridal Zardozi Handwork',
      titleUrdu: 'Bridal Zardozi Aur Dabka Karigari',
      category: 'bridal',
      categoryLabel: 'Bridal Couture',
      categoryLabelUrdu: 'Bridal Wear',
      imageUrl: IMAGE_CONFIG.bridal.url,
      alt: 'Intricate zardozi and hand embroidery on Pakistani bridal couture dress',
      description: 'Traditional dabka, sitara, and golden threadwork crafted for bespoke Pakistani wedding ensembles.',
      descriptionUrdu: 'Shadi biaha kay khas riwayati joron par dabka, sitara aur sonay kay dhagay ki dasti karigari.',
    },
    {
      id: 'g-custom-1',
      title: 'Bespoke Atelier Tailoring',
      titleUrdu: 'Master Cutting Aur Darzi Ki Maharat',
      category: 'custom',
      categoryLabel: 'Custom Stitching',
      categoryLabelUrdu: 'Custom Silai',
      imageUrl: IMAGE_CONFIG.customStitching.url,
      alt: 'Master artisan tailor measuring fine fabric with tape in boutique workshop',
      description: 'Precision measurement, chalk-marked pattern cuts, and reinforced seams for a perfect custom fit.',
      descriptionUrdu: 'Har libas ko customer kay infiradi naap kay mutabiq dorust cutting aur paedaar silai se tayar kiya jata hai.',
    },
  ];

  const mapDesignToGalleryCategory = (cat: string): 'ladies' | 'kids' | 'bridal' | 'party' | 'suits' | 'custom' => {
    const c = cat.toLowerCase();
    if (c.includes('kid')) return 'kids';
    if (c.includes('bridal')) return 'bridal';
    if (c.includes('party')) return 'party';
    if (c.includes('suit')) return 'suits';
    if (c.includes('custom') || c.includes('alteration') || c.includes('embroidery')) return 'custom';
    return 'ladies';
  };

  const loadGalleryData = async () => {
    try {
      const liveDesigns = await fetchBoutiqueDesigns();
      const activeDesigns = liveDesigns.filter((d) => d.is_active);

      const dynamicGalleryItems: GalleryItem[] = activeDesigns.map((d) => ({
        id: d.id,
        title: d.name,
        titleUrdu: d.name_urdu || d.name,
        titleRomanUrdu: d.name_roman_urdu || d.name,
        category: mapDesignToGalleryCategory(d.category),
        categoryLabel: d.category,
        categoryLabelUrdu: d.category,
        imageUrl: d.image_url,
        alt: d.name,
        description: d.description || `${d.name} bespoke tailored Pakistani design.`,
        descriptionUrdu: d.description_urdu || `${d.name} خاص بوتیک سلائی۔`,
        descriptionRomanUrdu: d.description_roman_urdu || `${d.name} khas boutique silai.`,
        price: d.price,
        isFeatured: d.is_featured,
      }));

      // Merge dynamic designs with defaults without duplicate IDs
      const dynamicIds = new Set(dynamicGalleryItems.map((item) => item.id));
      const merged = [
        ...dynamicGalleryItems,
        ...defaultGalleryItems.filter((item) => !dynamicIds.has(item.id)),
      ];
      setItems(merged);
    } catch {
      setItems(defaultGalleryItems);
    }
  };

  useEffect(() => {
    loadGalleryData();

    const handleSync = () => loadGalleryData();
    window.addEventListener('storage', handleSync);
    window.addEventListener('boutique_designs_updated', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('boutique_designs_updated', handleSync);
    };
  }, []);

  useEffect(() => {
    if (!activeItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveItem(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItem]);

  const filterButtons = [
    { key: 'all', label: t('filterAll') },
    { key: 'ladies', label: t('filterLadies') },
    { key: 'kids', label: t('filterKids') },
    { key: 'bridal', label: t('filterBridal') },
    { key: 'party', label: t('filterParty') },
    { key: 'custom', label: t('filterCustom') },
  ];

  const filteredItems =
    selectedCategory === 'all'
      ? items
      : items.filter((item) => item.category === selectedCategory);

  return (
    <section id="designs" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-widest text-blue-700 font-bold mb-2">
            Portfolio &amp; Showcase
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif-display font-medium text-blue-950 tracking-tight">
            {t('designsTitle')}
          </h2>
          <div className="w-16 h-1 bg-blue-600 rounded-full mx-auto mt-3 mb-4" />
          <p className="text-base text-slate-600 leading-relaxed font-light">
            {t('designsSubtitle')}
          </p>
        </div>

        {/* Filter Bar (Segmented Controls) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-12">
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={() => setSelectedCategory(btn.key)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer ${
                selectedCategory === btn.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50/70 text-slate-700 hover:bg-blue-100 hover:text-blue-950 border border-blue-100'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative bg-white border border-blue-100 rounded-xl overflow-hidden shadow-xs hover:shadow-xl hover:shadow-blue-900/10 hover:border-blue-300 transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-blue-50">
                <img
                  src={item.imageUrl}
                  alt={item.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Featured Badge */}
                {item.isFeatured && (
                  <div className="absolute top-3 start-3 z-10 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    {formatText('Featured Design', 'خاص ڈیزائن', 'Featured Design')}
                  </div>
                )}

                {/* Scrim Overlay on Hover */}
                <div className="absolute inset-0 bg-blue-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-4">
                  <button
                    type="button"
                    onClick={() => setActiveItem(item)}
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-blue-950 bg-white rounded-lg shadow-md hover:bg-blue-50 flex items-center gap-1.5 transition-transform scale-95 group-hover:scale-100 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-700" />
                    <span>{t('viewDetails')}</span>
                  </button>
                </div>
              </div>

              {/* Caption */}
              <div className="p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-blue-700 font-semibold">
                      {language === 'en' ? item.categoryLabel : item.categoryLabelUrdu}
                    </span>
                    {item.price && (
                      <span className="text-[10px] font-bold font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        PKR {item.price.toLocaleString('en-PK')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-serif-display font-semibold text-blue-950 mt-0.5 group-hover:text-blue-700 transition-colors">
                    {language === 'ur'
                      ? item.titleUrdu
                      : language === 'roman_ur' && item.titleRomanUrdu
                      ? item.titleRomanUrdu
                      : item.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveItem(item)}
                  className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded-md transition-colors cursor-pointer shrink-0"
                  aria-label="View larger image"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Lightbox Modal */}
      {activeItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/80 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Design View"
        >
          <div className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-blue-100">
            <button
              type="button"
              onClick={() => setActiveItem(null)}
              className="absolute top-3 right-3 z-10 p-2 text-white bg-blue-950/70 hover:bg-blue-950 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
              aria-label={t('closeModal')}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-[4/3] sm:aspect-[16/10] bg-slate-950 relative">
              <img
                src={activeItem.imageUrl}
                alt={activeItem.alt}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-6">
              <span className="text-xs uppercase tracking-widest text-blue-700 font-semibold">
                {language === 'en' ? activeItem.categoryLabel : activeItem.categoryLabelUrdu}
              </span>
              <h3 className="text-2xl font-serif-display font-medium text-blue-950 mt-1 mb-2">
                {language === 'en' ? activeItem.title : activeItem.titleUrdu}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-light mb-6">
                {language === 'en' ? activeItem.description : activeItem.descriptionUrdu}
              </p>

              <div className="pt-4 border-t border-blue-50 flex items-center justify-between">
                <span className="text-xs text-blue-600 font-medium">
                  Boutique Stitching · Sadiqabad
                </span>
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                >
                  {t('closeModal')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
