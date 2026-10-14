import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Scissors, MapPin, Ruler, Shield, Search, User as UserIcon, Tag } from 'lucide-react';
import { getSocialPlatforms } from '../config/social';
import { renderSocialIcon } from './SocialIcons';

interface FooterProps {
  onOpenMeasurementGuide?: () => void;
  onOpenAdminPortal?: () => void;
  onOpenOrderLookup?: () => void;
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
  onOpenDashboard?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenMeasurementGuide,
  onOpenAdminPortal,
  onOpenOrderLookup,
  onOpenAuth,
  onOpenDashboard,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [socialPlatforms, setSocialPlatforms] = useState(getSocialPlatforms);

  useEffect(() => {
    const handleUpdate = () => setSocialPlatforms(getSocialPlatforms());
    window.addEventListener('boutique_social_config_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('boutique_social_config_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return (
    <footer className="bg-blue-950 text-blue-200 border-t border-blue-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-white font-serif-display text-2xl font-semibold">
              <span className="w-8 h-8 rounded-full bg-blue-800 border border-blue-700 flex items-center justify-center text-white shadow-2xs">
                <Scissors className="w-4 h-4" />
              </span>
              <span>{t('brandName')}</span>
            </div>
            <p className="text-sm text-blue-200/80 font-light max-w-md leading-relaxed">
              {t('heroSubtitle')}
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-300 pt-2">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Sadiqabad, Punjab, Pakistan</span>
            </div>

            {/* Social Icons Strip in Brand Column */}
            <div className="pt-2">
              <p className="text-[11px] uppercase tracking-wider text-blue-300 font-semibold mb-2.5">
                {t('socialTitle')}
              </p>
              <div className="flex items-center gap-2.5">
                {socialPlatforms.map((platform) =>
                  platform.isConfigured ? (
                    <a
                      key={platform.id}
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${platform.name} - ${platform.handle}`}
                      title={`${platform.name} (${platform.handle})`}
                      className="w-8 h-8 rounded-full bg-blue-900 hover:bg-blue-800 border border-blue-800 flex items-center justify-center text-blue-200 hover:text-white transition-all duration-200 hover:scale-110"
                    >
                      {renderSocialIcon(platform.id, 'w-4 h-4')}
                    </a>
                  ) : (
                    <span
                      key={platform.id}
                      title={`${platform.name} - Profile link coming soon`}
                      aria-label={`${platform.name} - Profile link coming soon`}
                      className="w-8 h-8 rounded-full bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400/50 cursor-not-allowed"
                    >
                      {renderSocialIcon(platform.id, 'w-4 h-4')}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Navigation &amp; Orders
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#services" className="hover:text-white transition-colors">
                  {t('navServices')}
                </a>
              </li>
              <li>
                <a href="#sale" className="hover:text-white text-blue-300 transition-colors flex items-center gap-1.5 font-medium">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{t('navSale')}</span>
                </a>
              </li>
              <li>
                <a href="#ladies" className="hover:text-white transition-colors">
                  {t('navLadies')}
                </a>
              </li>
              <li>
                <a href="#kids" className="hover:text-white transition-colors">
                  {t('navKids')}
                </a>
              </li>
              <li>
                <a href="#boutique-video" className="hover:text-white transition-colors">
                  {t('videoTitle')}
                </a>
              </li>
              <li>
                <a href="#designs" className="hover:text-white transition-colors">
                  {t('navDesigns')}
                </a>
              </li>
              {onOpenOrderLookup && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenOrderLookup}
                    className="hover:text-white transition-colors flex items-center gap-1.5 text-left text-blue-300 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{t('navTrackOrder')}</span>
                  </button>
                </li>
              )}
              {user ? (
                onOpenDashboard && (
                  <li>
                    <button
                      type="button"
                      onClick={onOpenDashboard}
                      className="hover:text-white transition-colors flex items-center gap-1.5 text-left text-blue-200 cursor-pointer"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>{t('navMyAccount')}</span>
                    </button>
                  </li>
                )
              ) : (
                onOpenAuth && (
                  <li>
                    <button
                      type="button"
                      onClick={() => onOpenAuth('signin')}
                      className="hover:text-white transition-colors flex items-center gap-1.5 text-left text-blue-300 cursor-pointer"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>{t('navSignIn')} / {t('navSignUp')}</span>
                    </button>
                  </li>
                )
              )}
              {onOpenMeasurementGuide && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenMeasurementGuide}
                    className="hover:text-white transition-colors flex items-center gap-1.5 text-left text-blue-300 cursor-pointer"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>{t('navGuide')}</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Stitched Categories & Staff */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Stitching Services
            </p>
            <ul className="space-y-2 text-sm text-blue-200/80 mb-6 font-light">
              <li>Ladies 2 &amp; 3 Piece</li>
              <li>Bridal Couture</li>
              <li>Formal &amp; Party Wear</li>
              <li>Kids Traditional &amp; Frocks</li>
              <li>Custom Tailoring &amp; Alterations</li>
            </ul>

            {onOpenAdminPortal && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenAdminPortal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Shield className="w-3 h-3 text-blue-400" />
                  <span>{t('staffPortal')} (Atelier Staff)</span>
                </button>
              </div>
            )}
          </div>

          {/* Social Presence Column */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Connect &amp; Follow
            </p>
            <p className="text-xs text-blue-200/80 mb-3 leading-relaxed font-light">
              {t('socialSubtitle')}
            </p>
            <ul className="space-y-2 text-xs">
              {socialPlatforms.map((platform) => (
                <li key={platform.id}>
                  <a
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${platform.name} - ${platform.handle}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-blue-900/80 hover:bg-blue-800 border border-blue-800 text-blue-200 hover:text-white transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      {renderSocialIcon(platform.id, 'w-3.5 h-3.5')}
                      <span className="font-semibold text-white">{platform.name}</span>
                    </div>
                    <span className="text-[10px] text-blue-300 group-hover:text-white font-mono">
                      {platform.handle}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-blue-900 flex flex-col sm:flex-row items-center justify-between text-xs text-blue-300/80 gap-4">
          <p>
            &copy; {new Date().getFullYear()} {t('brandName')}. {t('footerRights')}
          </p>
          <p className="text-center sm:text-right font-light text-blue-200">
            Sadiqabad, Punjab · Fine Tailoring &amp; Custom Stitching
          </p>
        </div>
      </div>
    </footer>
  );
};
