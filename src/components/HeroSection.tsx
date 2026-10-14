import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { IMAGE_CONFIG } from '../config/images';
import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onOpenBooking: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenBooking }) => {
  const { t, language } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-white pt-12 pb-20 md:pt-16 md:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Text Content Column */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Clean unboxed editorial kicker */}
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-blue-700 mb-4 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('heroTagline')}</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif-display font-medium text-slate-900 tracking-tight leading-[1.15] mb-6 text-balance">
              {t('heroHeading')}
            </h1>

            {/* Supporting Copy */}
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mb-8 font-light">
              {t('heroSubtitle')}
            </p>

            {/* CTA Group */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onOpenBooking}
                className="px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-all shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 flex items-center gap-2 group cursor-pointer"
              >
                <span>{t('ctaPrimary')}</span>
                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${language === 'ur' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
              </button>

              <a
                href="#designs"
                className="px-6 py-3.5 text-sm font-semibold text-blue-900 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 shadow-2xs"
              >
                {t('heroExploreCTA')}
              </a>
            </div>

            {/* Quiet trust markers */}
            <div className="mt-12 pt-8 border-t border-blue-100 grid grid-cols-3 gap-6 text-start">
              <div>
                <p className="text-xs uppercase tracking-wider text-blue-600 font-semibold">Focus</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">Ladies &amp; Kids</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-blue-600 font-semibold">Fitting</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">Custom Tailored</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-blue-600 font-semibold">Location</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">Sadiqabad, Punjab</p>
              </div>
            </div>
          </div>

          {/* Hero Visual Asset Column */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Subtle blue accent frame backdrop */}
              <div
                aria-hidden="true"
                className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-blue-300/40 to-blue-100/60 blur-xs -z-10"
              />

              <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-white shadow-2xl aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/5]">
                <img
                  src={IMAGE_CONFIG.hero.url}
                  alt={IMAGE_CONFIG.hero.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                  loading="eager"
                />
                
                {/* Subtle scrim overlay at bottom */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-blue-950/85 via-blue-950/40 to-transparent text-white">
                  <p className="text-xs font-light text-blue-100 tracking-wide">
                    {IMAGE_CONFIG.hero.title}
                  </p>
                  <p className="text-sm font-medium mt-0.5">
                    {t('brandName')} · Sadiqabad
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
