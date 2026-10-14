/**
 * Centralized Social Media Configuration for Boutique Stitching
 * Sadiqabad, Punjab, Pakistan
 * 
 * OWNER INSTRUCTIONS:
 * Provide your official social media profile URLs below or in the Admin Dashboard Settings.
 * If a URL is empty, the website will not invent fake URLs and will gracefully hide or disable the link.
 */

export interface SocialConfig {
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
}

export const DEFAULT_SOCIAL_CONFIG: SocialConfig = {
  // Empty by default — configured via Admin Settings or provided by owner:
  instagramUrl: '',
  facebookUrl: '',
  tiktokUrl: '',
  youtubeUrl: '',
};

export const SOCIAL_STORAGE_KEY = 'boutique_social_config';

export function getSocialConfig(): SocialConfig {
  if (typeof window === 'undefined') return DEFAULT_SOCIAL_CONFIG;
  try {
    const raw = localStorage.getItem(SOCIAL_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SOCIAL_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error reading social config:', e);
  }
  return DEFAULT_SOCIAL_CONFIG;
}

export function saveSocialConfig(config: Partial<SocialConfig>): SocialConfig {
  const current = getSocialConfig();
  const updated: SocialConfig = { ...current, ...config };
  try {
    localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('boutique_social_config_updated', { detail: updated }));
  } catch (e) {
    console.error('Error saving social config:', e);
  }
  return updated;
}

export interface SocialPlatform {
  id: 'instagram' | 'facebook' | 'tiktok' | 'youtube';
  name: string;
  url: string;
  handle: string;
  isConfigured: boolean;
  description: string;
  descriptionUrdu: string;
  descriptionRomanUrdu: string;
  color: string;
}

export function getSocialPlatforms(): SocialPlatform[] {
  const config = getSocialConfig();
  return [
    {
      id: 'instagram',
      name: 'Instagram',
      url: config.instagramUrl,
      handle: config.instagramUrl ? '@boutiquestitching' : 'Pending Link',
      isConfigured: Boolean(config.instagramUrl && config.instagramUrl.trim().length > 0),
      description: 'Latest dress designs, reels & stitching showcases',
      descriptionUrdu: 'تازہ ترین ڈیزائنز اور سلائی کی ویڈیوز',
      descriptionRomanUrdu: 'Naye designs, reels aur stitching ki videos',
      color: 'hover:text-[#E1306C] hover:border-[#E1306C]/40',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      url: config.facebookUrl,
      handle: config.facebookUrl ? 'Boutique Stitching Sadiqabad' : 'Pending Link',
      isConfigured: Boolean(config.facebookUrl && config.facebookUrl.trim().length > 0),
      description: 'Community updates, reviews & customer galleries',
      descriptionUrdu: 'کمیونٹی اپڈیٹس، ریویوز اور کسٹمر گیلری',
      descriptionRomanUrdu: 'Updates, customer reviews aur galleries',
      color: 'hover:text-[#1877F2] hover:border-[#1877F2]/40',
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      url: config.tiktokUrl,
      handle: config.tiktokUrl ? '@boutiquestitching' : 'Pending Link',
      isConfigured: Boolean(config.tiktokUrl && config.tiktokUrl.trim().length > 0),
      description: 'Behind-the-scenes stitching & styling tutorials',
      descriptionUrdu: 'سلائی مشین، کٹنگ اور ڈیزائننگ ٹیوٹوریلز',
      descriptionRomanUrdu: 'Atelier cutting, silai aur design tutorials',
      color: 'hover:text-[#00F2FE] hover:border-[#00F2FE]/40',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      url: config.youtubeUrl,
      handle: config.youtubeUrl ? 'Boutique Stitching Official' : 'Pending Link',
      isConfigured: Boolean(config.youtubeUrl && config.youtubeUrl.trim().length > 0),
      description: 'Detailed measurement guides & dress tutorials',
      descriptionUrdu: 'ناپ لینے اور سلائی کے مکمل اسباق',
      descriptionRomanUrdu: 'Mukammal naap lene ki videos aur silai guide',
      color: 'hover:text-[#FF0000] hover:border-[#FF0000]/40',
    },
  ];
}

// Backward compatibility export
export const SOCIAL_PLATFORMS = getSocialPlatforms();
