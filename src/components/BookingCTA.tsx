import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Scissors, ArrowRight, MessageSquare } from 'lucide-react';

interface BookingCTAProps {
  onOpenBooking: () => void;
}

export const BookingCTA: React.FC<BookingCTAProps> = ({ onOpenBooking }) => {
  const { t, language } = useLanguage();

  return (
    <section className="py-20 md:py-24 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white relative overflow-hidden">
      {/* Decorative hairline texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-15 bg-[radial-gradient(#93c5fd_1px,transparent_1px)] [background-size:24px_24px]"
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-800/80 text-blue-200 border border-blue-700/60 text-xs uppercase tracking-widest font-bold mb-6 shadow-xs">
          <Scissors className="w-3.5 h-3.5 text-blue-300" />
          <span>Boutique Tailoring Consultation</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif-display font-medium text-white tracking-tight mb-6 text-balance">
          {t('ctaTitle')}
        </h2>

        <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed font-light mb-10">
          {t('ctaSubtitle')}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={onOpenBooking}
            className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-blue-950 bg-white hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-all shadow-xl hover:shadow-2xl hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white flex items-center gap-2 group cursor-pointer"
          >
            <span>{t('ctaPrimary')}</span>
            <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${language === 'ur' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
          </button>

          <a
            href="#contact"
            className="px-8 py-4 text-xs font-semibold uppercase tracking-wider text-white bg-blue-800/60 hover:bg-blue-800 border border-blue-500/40 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white flex items-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-blue-300" />
            <span>{t('ctaSecondary')}</span>
          </a>
        </div>
      </div>
    </section>
  );
};
