import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getSocialPlatforms, SocialPlatform } from '../config/social';
import { renderSocialIcon } from './SocialIcons';
import { Share2, ExternalLink, Clock } from 'lucide-react';

export const SocialFollowSection: React.FC = () => {
  const { t, language, formatText } = useLanguage();
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(getSocialPlatforms);

  useEffect(() => {
    const handleUpdate = () => {
      setPlatforms(getSocialPlatforms());
    };
    window.addEventListener('boutique_social_config_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('boutique_social_config_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return (
    <div className="bg-white border border-blue-100 rounded-2xl p-6 sm:p-8 shadow-xs hover:border-blue-300 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
          <Share2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-serif-display font-semibold text-blue-950">
            {t('socialTitle')}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('socialSubtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {platforms.map((platform) => {
          const desc = language === 'ur'
            ? platform.descriptionUrdu
            : language === 'roman_ur'
            ? platform.descriptionRomanUrdu
            : platform.description;

          if (!platform.isConfigured) {
            return (
              <div
                key={platform.id}
                className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between opacity-80"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 shadow-2xs">
                      {renderSocialIcon(platform.id, 'w-5 h-5')}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-200/70 text-slate-600 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatText('Pending', 'جلد آ رہا ہے', 'Jald Aa Raha Hai')}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800">
                    {platform.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5 font-medium">
                    {formatText('Profile link awaiting update', 'لنک جلد اپڈیٹ ہو گا', 'Profile link jald update hoga')}
                  </p>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-light">
                    {desc}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/60 text-[11px] font-semibold text-slate-400">
                  <span>{formatText('Official Channel Coming Soon', 'آفیشل چینل جلد دستیاب ہو گا', 'Official Channel Jald Aayega')}</span>
                </div>
              </div>
            );
          }

          return (
            <a
              key={platform.id}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${platform.name} - ${platform.handle}`}
              className={`group p-4 rounded-xl bg-blue-50/50 hover:bg-blue-100/70 border border-blue-100 transition-all duration-200 flex flex-col justify-between hover:shadow-md ${platform.color}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="p-2 rounded-lg bg-white border border-blue-100 text-blue-900 group-hover:scale-110 transition-transform shadow-2xs">
                    {renderSocialIcon(platform.id, 'w-5 h-5')}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-900 transition-colors" />
                </div>
                <h4 className="text-sm font-semibold text-blue-950">
                  {platform.name}
                </h4>
                <p className="text-xs text-blue-700 font-mono mt-0.5 font-medium">
                  {platform.handle}
                </p>
                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed font-light">
                  {desc}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-blue-100 flex items-center justify-between text-[11px] font-bold text-blue-700 group-hover:text-blue-950">
                <span>{t('socialFollowBtn')}</span>
                <span>&rarr;</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
