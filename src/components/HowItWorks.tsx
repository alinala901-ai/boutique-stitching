import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Palette, Ruler, Scissors, PackageCheck } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const { t } = useLanguage();

  const steps = [
    {
      num: t('howStep1Num'),
      title: t('howStep1Title'),
      desc: t('howStep1Desc'),
      icon: Palette,
    },
    {
      num: t('howStep2Num'),
      title: t('howStep2Title'),
      desc: t('howStep2Desc'),
      icon: Ruler,
    },
    {
      num: t('howStep3Num'),
      title: t('howStep3Title'),
      desc: t('howStep3Desc'),
      icon: Scissors,
    },
    {
      num: t('howStep4Num'),
      title: t('howStep4Title'),
      desc: t('howStep4Desc'),
      icon: PackageCheck,
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-blue-50/40 via-white to-blue-50/40 border-t border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs uppercase tracking-widest text-blue-700 font-bold mb-2">
            Seamless Tailoring Experience
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif-display font-medium text-blue-950 tracking-tight">
            {t('howTitle')}
          </h2>
          <div className="w-16 h-1 bg-blue-600 rounded-full mx-auto mt-3 mb-4" />
          <p className="text-base text-slate-600 leading-relaxed font-light">
            {t('howSubtitle')}
          </p>
        </div>

        {/* 4 Steps Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="relative bg-white border border-blue-100 rounded-xl p-6 shadow-xs hover:shadow-xl hover:shadow-blue-900/10 hover:border-blue-300 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                      <Icon className="w-6 h-6" />
                    </span>
                    <span className="text-2xl font-serif-display font-bold text-blue-600">
                      {step.num}
                    </span>
                  </div>

                  <h3 className="text-lg font-serif-display font-semibold text-blue-950 mb-2">
                    {step.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed font-light">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-blue-50 text-[11px] font-semibold text-blue-500 uppercase tracking-wider">
                  Step {index + 1} of 4
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
