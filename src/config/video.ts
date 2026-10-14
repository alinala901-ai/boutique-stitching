/**
 * Boutique Stitching — Centralized Video Configuration
 *
 * HOW TO INSERT YOUR REAL BOUTIQUE VIDEO URL:
 * 1. For a YouTube Video:
 *    Paste your YouTube watch or share URL into `videoUrl` below or in the Admin Portal -> Settings.
 *    Supported formats:
 *      - https://www.youtube.com/watch?v=VIDEO_ID
 *      - https://youtu.be/VIDEO_ID
 *      - https://www.youtube.com/shorts/VIDEO_ID
 *    The player uses privacy-enhanced embed (youtube-nocookie.com).
 *
 * 2. For an Uploaded MP4 Video:
 *    Host your MP4 file (or place it in /public or upload to Supabase storage) and paste the URL:
 *      - https://your-domain.com/videos/boutique-tour.mp4
 *      - /videos/boutique_showcase.mp4
 *
 * 3. Video Poster / Thumbnail:
 *    Provide an image URL in `posterUrl` or leave blank to use the high-resolution atelier tailoring image.
 *
 * 4. Active Status:
 *    Set `isActive: true` to display the section on the home page.
 */

export interface VideoConfig {
  videoUrl: string;
  posterUrl: string;
  title: string;
  subtitle: string;
  isActive: boolean;
  autoplay: boolean;
  captionsUrl?: string;
}

export interface BoutiqueVideoItem {
  id: string;
  title: string;
  title_urdu: string;
  title_roman_urdu: string;
  subtitle: string;
  subtitle_urdu: string;
  subtitle_roman_urdu: string;
  category: 'cutting' | 'bridal' | 'tour' | 'kids';
  categoryLabel: string;
  categoryLabel_urdu: string;
  videoUrl: string;
  posterUrl: string;
  duration: string;
  tag: string;
  description: string;
  description_urdu: string;
  description_roman_urdu: string;
  features: string[];
}

export const DEFAULT_BOUTIQUE_VIDEOS: BoutiqueVideoItem[] = [
  {
    id: 'vid-1',
    title: 'Master Artisanal Cutting & Kurti Pattern Drafting',
    title_urdu: 'ماہر کٹنگ ماسٹر اور قمیض و کرتی کٹنگ کا لائیو طریقہ',
    title_roman_urdu: 'Master Cutting & Kurti Kameez Pattern Drafting',
    subtitle: 'Professional Pakistani boutique master tailor cutting lawn kurti, armhole marking & measurements.',
    subtitle_urdu: 'سینئر کٹنگ ماسٹر کے ہاتھوں درست ناپ، گلے کا ڈیزائن اور کرتی کٹنگ کا لائیو مشاہدہ کریں۔',
    subtitle_roman_urdu: 'Senior cutting master ke hathon durust naap, gale ka design aur kurti cutting ka live tareeqa.',
    category: 'cutting',
    categoryLabel: 'Cutting & Pattern Making',
    categoryLabel_urdu: 'کٹنگ اور پیٹرن میکنگ',
    videoUrl: 'https://www.youtube.com/watch?v=f5g7cKj30F8',
    posterUrl: '/src/assets/images/craftsmanship_custom_tailoring_1791431948318.jpg',
    duration: '12:40',
    tag: 'Boutique Master Cutting',
    description: 'Every luxury dress begins with millimeter precision. Watch master tailoring techniques for cutting women’s kameez and designer kurtis with perfect armhole drape.',
    description_urdu: 'ہر عمدہ سلائی کا آغاز درست ناپ سے ہوتا ہے۔ ہمارے کاریگر گاہک کی فٹنگ کے مطابق خاص پیٹرن اور کٹنگ تیار کرتے ہیں۔',
    description_roman_urdu: 'Har umda silai ka aaghaz durust naap se hota hai. Master karigar kurti aur kameez ki flawless fitting cutting karte hain.',
    features: ['Accurate shoulder slope & armhole marking', 'Step-by-step kurti panel cutting', 'Special tailored scissors precision'],
  },
  {
    id: 'vid-2',
    title: 'Royal Bridal Couture, Zardozi & Hand Embroidery',
    title_urdu: 'برائیڈل کڑھائی، زردوزی، دبکہ اور ہاتھ کا کام',
    title_roman_urdu: 'Bridal Karhai, Zardozi, Dabka Aur Aari Kaam',
    subtitle: 'Intricate zardozi, kora dabka, moti, and resham hand embroidery on royal velvet bridal wear.',
    subtitle_urdu: 'شاہانہ مخمل اور آرگنزا برائیڈل لہنگا چولی پر ہاتھ کے نفیس دبکہ و زردوزی کام کی جھلک۔',
    subtitle_roman_urdu: 'Shahana velvet aur organza bridal lehenga par hath ke dabka, moti aur zardozi kaam ki jhalak.',
    category: 'bridal',
    categoryLabel: 'Bridal & Haute Couture',
    categoryLabel_urdu: 'برائیڈل اور ہوٹ کوٹور',
    videoUrl: 'https://www.youtube.com/watch?v=gT8oE5G6T4k',
    posterUrl: '/src/assets/images/bridal_couture_stitching_1791431932649.jpg',
    duration: '08:15',
    tag: 'Royal Bridal Atelier',
    description: 'Centuries-old needlecraft brought to life by master artisans. Intricate zardozi, pearls, kora dabka, and micro-sequins crafted onto bespoke bridal outfits.',
    description_urdu: 'روایتی کاریگری کے شاہکار۔ باریک زردوزی، موتی، کورا دبکہ اور ہاتھ کی سلائی سے تیار کردہ عروسی ملبوسات۔',
    description_roman_urdu: 'Rawayati karigari ke shahkaar. Bareek zardozi, moti, kora dabka aur hath ki silai se tayar bridal lehenga choli.',
    features: ['Intricate kora dabka & resham thread', 'Swarovski crystal & pearl hand-setting', 'Royal dupatta border scalloping'],
  },
  {
    id: 'vid-3',
    title: 'Designer Ladies 3-Piece Stitched Collection & Boutique Finishing',
    title_urdu: 'خواتین کے سلے ہوئے تھری پیس ملبوسات اور سٹوڈیو ٹور',
    title_roman_urdu: 'Khawateen Ke Sile Hue 3-Piece Suits Aur Finishing Tour',
    subtitle: 'Full showcase of finished Pakistani designer 3-piece lawn suits, party wear frocks, and bell sleeve silhouettes.',
    subtitle_urdu: 'سلے ہوئے تھری پیس لان، پارٹی فراکس اور بیل سلیوز سوٹس کا سٹوڈیو واک تھرو اور اوورلاک فنشنگ۔',
    subtitle_roman_urdu: 'Sile hue 3-piece lawn, party frocks, lace attachments aur press finishing ka studio tour.',
    category: 'tour',
    categoryLabel: 'Studio Showcase & Cuts',
    categoryLabel_urdu: 'سٹوڈیو شوکیس اور کٹس',
    videoUrl: 'https://www.youtube.com/watch?v=l_a6aY78w3Y',
    posterUrl: '/src/assets/images/ladies_collection_showcase_1791431903541.jpg',
    duration: '07:20',
    tag: 'Atelier Stitched Collection',
    description: 'Walk through our boutique studio where finished customer outfits are inspected under daylight lamps, organza border lace patches are verified, and steam-pressed.',
    description_urdu: 'ہماری صادق آباد بوتیک کا دورہ جہاں سلے ہوئے کپڑوں کا تفصیلی معائنہ اور نفیس فنشنگ کی جاتی ہے۔',
    description_roman_urdu: 'Humari Sadiqabad boutique ka daura jahan sile hue kapron ka tafseeli muana aur finishing hoti hai.',
    features: ['Cigarette pants & flared trousers styling', 'Organza patch-work & lace loops', 'Steam ironed & dust-protected packing'],
  },
  {
    id: 'vid-4',
    title: 'Kids Traditional Festive Stitching & Soft Lining Quality',
    title_urdu: 'بچوں کے روایتی سوٹس کی سلائی، نرم استر اور فائنل فنشنگ',
    title_roman_urdu: 'Bachon Ke Suits Ki Silai, Naram Astar Aur Final Quality',
    subtitle: 'Special tailoring for little girls & boys festive wear with ultra-soft skin-friendly cotton inner lining.',
    subtitle_urdu: 'بچوں کے کپڑوں میں کھجلی سے پاک نرم سوتی استر کی سلائی اور فائنل ڈلیوری پیکنگ۔',
    subtitle_roman_urdu: 'Bachon ke kapron mein skin-friendly naram sooti astar aur safe elasticated stitching.',
    category: 'kids',
    categoryLabel: 'Kids Gentle Stitching',
    categoryLabel_urdu: 'بچوں کی نازک سلائی',
    videoUrl: 'https://www.youtube.com/watch?v=J8n8dZ1s6n4',
    posterUrl: '/src/assets/images/kids_collection_showcase_1791431917668.jpg',
    duration: '06:10',
    tag: 'Kids Comfort Tailoring',
    description: 'Children require maximum comfort without sacrificing festive beauty. We use ultra-soft inner linings, soft edge piping, and child-safe elasticated waistbands.',
    description_urdu: 'بچوں کے کپڑوں میں خوبصورتی کے ساتھ نرمی کا خاص خیال رکھا جاتا ہے تاکہ بچے پرسکون رہیں۔',
    description_roman_urdu: 'Bachon ke kapron mein khubsurti ke sath narmi ka khas khayal rakha jata hai taake bachay comfortable rahein.',
    features: ['Soft skin-friendly inner lining', 'Reinforced seams for active kids', 'Steam ironed & boxed delivery'],
  },
];

export const BOUTIQUE_VIDEOS_STORAGE_KEY = 'boutique_videos_list_v5';

export const DEFAULT_VIDEO_CONFIG: VideoConfig = {
  // INSERT YOUR REAL VIDEO URL HERE (YouTube link or MP4 link):
  videoUrl: '',
  // High-resolution Pakistani atelier craftsmanship image as default poster thumbnail:
  posterUrl: '/src/assets/images/craftsmanship_custom_tailoring_1791431948318.jpg',
  title: 'Discover Our Boutique',
  subtitle: 'From creative designs to beautifully stitched outfits, discover the art of boutique tailoring.',
  isActive: true,
  autoplay: false,
  captionsUrl: '',
};

export const VIDEO_CONFIG_STORAGE_KEY = 'boutique_video_config';

/**
 * Extracts a 11-character YouTube video ID if URL is a YouTube link.
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);
  return match && match[1] && match[1].length === 11 ? match[1] : null;
}

/**
 * Generates privacy-enhanced YouTube embed URL from any YouTube link.
 */
export function getYouTubeEmbedUrl(url: string, autoplay = false): string | null {
  const id = getYouTubeVideoId(url);
  if (!id) return null;
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1${autoplay ? '&autoplay=1' : ''}`;
}

/**
 * Checks whether the URL is likely a direct video stream (MP4, WebM, Ogg, or cloud storage direct link).
 */
export function isDirectVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed.endsWith('.mp4') ||
    trimmed.endsWith('.webm') ||
    trimmed.endsWith('.ogg') ||
    trimmed.endsWith('.mov') ||
    trimmed.includes('/videos/') ||
    trimmed.includes('storage.googleapis.com') ||
    trimmed.includes('.supabase.co/storage/')
  );
}

/**
 * Loads current video configuration from local storage if updated by admin, falling back to defaults.
 */
export function getVideoConfig(): VideoConfig {
  if (typeof window === 'undefined') return DEFAULT_VIDEO_CONFIG;
  try {
    const raw = localStorage.getItem(VIDEO_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_VIDEO_CONFIG,
        ...parsed,
      };
    }
  } catch (e) {
    console.error('Error loading video config from localStorage:', e);
  }
  return DEFAULT_VIDEO_CONFIG;
}

/**
 * Saves updated video configuration to localStorage and fires a custom event for instant UI sync.
 */
export function saveVideoConfig(config: Partial<VideoConfig>): VideoConfig {
  const current = getVideoConfig();
  const updated: VideoConfig = {
    ...current,
    ...config,
  };
  try {
    localStorage.setItem(VIDEO_CONFIG_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('boutique_video_config_updated', { detail: updated }));
  } catch (e) {
    console.error('Error saving video config to localStorage:', e);
  }
  return updated;
}

/**
 * Loads the 4 boutique videos list from localStorage or returns default 4 videos.
 */
export function getBoutiqueVideos(): BoutiqueVideoItem[] {
  if (typeof window === 'undefined') return DEFAULT_BOUTIQUE_VIDEOS;
  try {
    // Purge any legacy dummy video cache
    const legacyKeys = ['boutique_videos_list', 'boutique_videos_list_v2', 'boutique_videos_list_v3'];
    for (const key of legacyKeys) {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }

    const raw = localStorage.getItem(BOUTIQUE_VIDEOS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 4) {
        // Ensure no dummy/joke URLs remain
        const hasDummy = parsed.some(
          (v: BoutiqueVideoItem) =>
            v.videoUrl.includes('dQw4w9WgXcQ') ||
            v.videoUrl.includes('ScMzIvxBSi4') ||
            v.videoUrl.includes('jNQXAC9IVRw') ||
            v.videoUrl.includes('9bZkp7q19f0')
        );
        if (!hasDummy) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error('Error loading boutique videos:', e);
  }
  return DEFAULT_BOUTIQUE_VIDEOS;
}

/**
 * Saves updated boutique videos list and dispatches event.
 */
export function saveBoutiqueVideos(videos: BoutiqueVideoItem[]): BoutiqueVideoItem[] {
  try {
    localStorage.setItem(BOUTIQUE_VIDEOS_STORAGE_KEY, JSON.stringify(videos));
    window.dispatchEvent(new CustomEvent('boutique_videos_updated', { detail: videos }));
  } catch (e) {
    console.error('Error saving boutique videos:', e);
  }
  return videos;
}

