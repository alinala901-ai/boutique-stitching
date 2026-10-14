import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { IMAGE_CONFIG } from '../config/images';
import { Heart, Sparkles, ArrowRight } from 'lucide-react';

interface KidsCollectionProps {
  onSelectCategory: (categoryName: string) => void;
}

export const KidsCollection: React.FC<KidsCollectionProps> = ({ onSelectCategory }) => {
  const { t, language } = useLanguage();

  const kidsCategories = [
    {
      id: 'girls',
      title: t('kidsCatGirls'),
      description: t('kidsCatGirlsDesc'),
      image: IMAGE_CONFIG.kidsBlueSuit.url,
      ageGroup: 'Girls (Ages 2–14)',
      tag: 'Owner Featured Collection',
    },
    {
      id: 'traditional',
      title: t('kidsCatTrad'),
      description: t('kidsCatTradDesc'),
      image: IMAGE_CONFIG.kidsBlueSuit.url,
      ageGroup: 'Festive & Eid',
      tag: 'Festive Wear',
    },
    {
      id: 'party',
      title: t('kidsCatParty'),
      description: t('kidsCatPartyDesc'),
      image: IMAGE_CONFIG.kidsBlueSuit.url,
      ageGroup: 'Family Weddings',
      tag: 'Occasion Wear',
    },
    {
      id: 'boys',
      title: t('kidsCatBoys'),
      description: t('kidsCatBoysDesc'),
      image: IMAGE_CONFIG.kidsCollection.url,
      ageGroup: 'Boys (Ages 1–14)',
      tag: 'Kurta Shalwar',
    },
    {
      id: 'custom-kids',
      title: t('kidsCatCustom'),
      description: t('kidsCatCustomDesc'),
      image: IMAGE_CONFIG.customStitching.url,
      ageGroup: 'Bespoke Family Matching',
      tag: 'Custom Made',
    },
  ];

  return (
    <section id="kids" className="py-20 md:py-28 bg-gradient-to-b from-blue-50/50 via-white to-blue-50/40 border-t border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-blue-700 font-bold mb-2">
            <Heart className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
            <span>Family &amp; Children Atelier</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif-display font-medium text-blue-950 tracking-tight">
            {t('kidsTitle')}
          </h2>
          <div className="w-16 h-1 bg-blue-600 rounded-full mx-auto mt-3 mb-4" />
          <p className="text-base text-slate-600 leading-relaxed font-light">
            {t('kidsSubtitle')}
          </p>
        </div>

        {/* Kids Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {kidsCategories.map((item, index) => (
            <div
              key={item.id}
              className={`bg-white border border-blue-100 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10 hover:border-blue-300 flex flex-col justify-between ${
                index === 4 ? 'sm:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div>
                <div className="relative aspect-[3/4] bg-blue-50 overflow-hidden">
                  <img
                    src={item.image}
                    alt={`${item.title} - Kids Stitching by Boutique Stitching`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[11px] font-semibold tracking-wide px-2.5 py-1 bg-white/95 text-blue-950 backdrop-blur-xs rounded shadow-xs border border-blue-100">
                      {item.ageGroup}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="text-[11px] font-semibold tracking-wide px-2.5 py-1 bg-blue-600 text-white rounded shadow-xs">
                      {item.tag}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-serif-display font-semibold text-blue-950 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-light mb-4">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  type="button"
                  onClick={() => onSelectCategory(`Kids: ${item.title}`)}
                  className="w-full py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50/70 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 group-hover:text-white" />
                  <span>{t('serviceInquireBtn')}</span>
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-1 ${language === 'ur' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
