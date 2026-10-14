import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { IMAGE_CONFIG } from '../config/images';
import { ArrowUpRight } from 'lucide-react';

interface LadiesCollectionProps {
  onSelectCategory: (categoryName: string) => void;
}

export const LadiesCollection: React.FC<LadiesCollectionProps> = ({ onSelectCategory }) => {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const categories = [
    {
      id: 'peach-3piece',
      title: t('ladiesCat3Piece'),
      description: t('ladiesCat3PieceDesc'),
      image: IMAGE_CONFIG.peachSuit.url,
      tag: 'Owner Featured Collection',
      categoryType: '3piece',
    },
    {
      id: 'teal-formal',
      title: t('ladiesCatFormal'),
      description: t('ladiesCatFormalDesc'),
      image: IMAGE_CONFIG.tealSuit.url,
      tag: 'Formal Pret',
      categoryType: 'formal',
    },
    {
      id: 'magenta-party',
      title: t('ladiesCatParty'),
      description: t('ladiesCatPartyDesc'),
      image: IMAGE_CONFIG.magentaLehenga.url,
      tag: 'Festive & Party',
      categoryType: 'party',
    },
    {
      id: 'bridal',
      title: t('ladiesCatBridal'),
      description: t('ladiesCatBridalDesc'),
      image: IMAGE_CONFIG.bridal.url,
      tag: 'Bespoke Couture',
      categoryType: 'bridal',
    },
    {
      id: '2piece',
      title: t('ladiesCat2Piece'),
      description: t('ladiesCat2PieceDesc'),
      image: IMAGE_CONFIG.peachSuit.url,
      tag: 'Everyday & Semi-Formal',
      categoryType: '2piece',
    },
    {
      id: 'custom',
      title: t('ladiesCatCustom'),
      description: t('ladiesCatCustomDesc'),
      image: IMAGE_CONFIG.customStitching.url,
      tag: 'Personal Design',
      categoryType: 'custom',
    },
  ];

  const filteredCategories =
    activeFilter === 'all'
      ? categories
      : categories.filter((c) => c.categoryType === activeFilter);

  return (
    <section id="ladies" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-widest text-blue-700 font-bold mb-2">
              Women's Couture &amp; Pret
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif-display font-medium text-blue-950 tracking-tight">
              {t('ladiesTitle')}
            </h2>
            <div className="w-12 h-1 bg-blue-600 rounded-full mt-3 mb-4" />
            <p className="text-base text-slate-600 leading-relaxed font-light">
              {t('ladiesSubtitle')}
            </p>
          </div>

          {/* Interactive filter tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-blue-50/70 rounded-lg border border-blue-200">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-900'
              }`}
            >
              All Styles
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('3piece')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeFilter === '3piece'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-900'
              }`}
            >
              3 Piece
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('formal')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeFilter === 'formal'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-900'
              }`}
            >
              Formal
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('party')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeFilter === 'party'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-900'
              }`}
            >
              Party Wear
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('bridal')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeFilter === 'bridal'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-900'
              }`}
            >
              Bridal
            </button>
          </div>
        </div>

        {/* Collection Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="group bg-white border border-blue-100 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10 hover:border-blue-300 flex flex-col"
            >
              {/* Card Image */}
              <div className="relative aspect-[3/4] bg-blue-50 overflow-hidden">
                <img
                  src={cat.image}
                  alt={`${cat.title} - Pakistani Ladies Boutique Stitching`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-3 right-3">
                  <span className="text-[11px] font-semibold tracking-wide px-2.5 py-1 bg-blue-950/85 text-white backdrop-blur-xs rounded shadow-xs">
                    {cat.tag}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-serif-display font-semibold text-blue-950 mb-2 group-hover:text-blue-700 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-light mb-6">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-blue-50 flex items-center justify-between">
                  <span className="text-xs text-blue-700 font-semibold">
                    Custom Stitching Available
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectCategory(`Ladies: ${cat.title}`)}
                    className="p-2 text-blue-700 hover:text-white hover:bg-blue-600 rounded-full transition-colors cursor-pointer"
                    aria-label={`Select ${cat.title} for stitching`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
