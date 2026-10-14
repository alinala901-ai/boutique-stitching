import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle2, Award, Sparkles, Compass, Users } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const { t } = useLanguage();

  const trustPoints = [
    {
      id: 'quality',
      title: t('whyQualityTitle'),
      desc: t('whyQualityDesc'),
      icon: Award,
    },
    {
      id: 'custom-fit',
      title: t('whyFitTitle'),
      desc: t('whyFitDesc'),
      icon: CheckCircle2,
    },
    {
      id: 'detail',
      title: t('whyDetailTitle'),
      desc: t('whyDetailDesc'),
      icon: Sparkles,
    },
    {
      id: 'pakistani-fashion',
      title: t('whyFashionTitle'),
      desc: t('whyFashionDesc'),
      icon: Compass,
    },
    {
      id: 'expertise',
      title: t('whyExpertiseTitle'),
      desc: t('whyExpertiseDesc'),
      icon: Users,
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs uppercase tracking-widest text-blue-700 font-bold mb-2">
            Commitment to Excellence
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif-display font-medium text-blue-950 tracking-tight">
            {t('whyTitle')}
          </h2>
          <div className="w-16 h-1 bg-blue-600 rounded-full mx-auto mt-3 mb-4" />
          <p className="text-base text-slate-600 leading-relaxed font-light">
            {t('whySubtitle')}
          </p>
        </div>

        {/* 5 Trust Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trustPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <div
                key={point.id}
                className={`bg-white border border-blue-100 rounded-xl p-7 shadow-xs hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/10 transition-all duration-300 ${
                  index === 4 ? 'md:col-span-2 lg:col-span-1' : ''
                }`}
              >
                <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-5 shadow-2xs">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-serif-display font-semibold text-blue-950 mb-2">
                  {point.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-light">
                  {point.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
