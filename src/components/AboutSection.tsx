import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { IMAGE_CONFIG } from '../config/images';
import { Check, MapPin } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const { t } = useLanguage();

  const highlights = [
    'Personalized Stitching',
    'Attention to Detail',
    'Ladies & Kids Clothing',
    'Pakistani Fashion Heritage',
    'Customer-Focused Service',
    'Sadiqabad Atelier Location',
  ];

  return (
    <section id="about" className="py-20 md:py-28 bg-gradient-to-b from-blue-50/50 via-white to-blue-50/40 border-t border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Atelier Image */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div
                aria-hidden="true"
                className="absolute -inset-2 bg-gradient-to-tr from-blue-400/30 to-blue-100/80 rounded-2xl blur-xs -z-10"
              />
              <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-white shadow-xl aspect-square">
                <img
                  src={IMAGE_CONFIG.about.url}
                  alt={IMAGE_CONFIG.about.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-blue-950/90 via-blue-950/40 to-transparent text-white">
                  <div className="flex items-center gap-1.5 text-xs text-blue-100">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>Sadiqabad, Punjab, Pakistan</span>
                  </div>
                  <p className="text-sm font-semibold mt-0.5">
                    {t('brandName')} Studio
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="lg:col-span-7">
            <p className="text-xs uppercase tracking-widest text-blue-700 font-bold mb-2">
              Our Story &amp; Craft
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif-display font-medium text-blue-950 tracking-tight mb-4">
              {t('aboutTitle')}
            </h2>
            <div className="w-12 h-1 bg-blue-600 rounded-full mb-6" />

            <div className="space-y-4 text-base text-slate-600 font-light leading-relaxed mb-8">
              <p>{t('aboutP1')}</p>
              <p>{t('aboutP2')}</p>
              <p>{t('aboutP3')}</p>
            </div>

            {/* Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-blue-100">
              {highlights.map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm font-semibold text-slate-800">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                    <Check className="w-3 h-3 text-blue-700" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
