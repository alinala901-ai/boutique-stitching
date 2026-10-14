import React from 'react';
import { Instagram, Facebook, Youtube } from 'lucide-react';
import { SOCIAL_PLATFORMS, SocialPlatform } from '../config/social';

// Custom SVG for TikTok to match Lucide's 24px stroke / fill aesthetic
export const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.35a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3.14 15.6a6.34 6.34 0 0 0 6.34 6.35 6.34 6.34 0 0 0 6.34-6.35V8.82a8.27 8.27 0 0 0 3.77 1.32V6.69z" />
  </svg>
);

export const renderSocialIcon = (id: SocialPlatform['id'], className = 'w-4 h-4') => {
  switch (id) {
    case 'instagram':
      return <Instagram className={className} />;
    case 'facebook':
      return <Facebook className={className} />;
    case 'tiktok':
      return <TikTokIcon className={className} />;
    case 'youtube':
      return <Youtube className={className} />;
  }
};
