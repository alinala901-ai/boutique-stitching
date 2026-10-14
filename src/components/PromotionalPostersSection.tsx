import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Poster } from '../types';
import { fetchActivePosters, fetchPosters } from '../lib/supabase';
import {
  Sparkles,
  Calendar,
  ArrowRight,
  Play,
  Eye,
  X,
  Tag,
  Scissors,
  CheckCircle2,
} from 'lucide-react';
import { getYouTubeEmbedUrl } from '../config/video';

interface PromotionalPostersSectionProps {
  onOpenBooking: (campaignTitle?: string) => void;
}

export const PromotionalPostersSection: React.FC<PromotionalPostersSectionProps> = ({ onOpenBooking }) => {
  const { language, formatText } = useLanguage();
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lightboxPoster, setLightboxPoster] = useState<Poster | null>(null);

  const loadPosters = async () => {
    try {
      const active = await fetchActivePosters();
      if (active && active.length > 0) {
        setPosters(active);
      } else {
        const all = await fetchPosters();
        setPosters(all.filter((p) => p.is_active));
      }
    } catch (err) {
      console.warn('Error loading promotional posters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosters();

    const handleUpdate = () => {
      loadPosters();
    };

    window.addEventListener('boutique_posters_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('boutique_posters_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  if (loading || posters.length === 0) {
    return null;
  }

  const getPosterTitle = (poster: Poster) => {
    if (language === 'ur' && poster.title_urdu) return poster.title_urdu;
    if (language === 'roman_ur' && poster.title_roman_urdu) return poster.title_roman_urdu;
    return poster.title;
  };

  const getPosterDesc = (poster: Poster) => {
    if (language === 'ur' && poster.description_urdu) return poster.description_urdu;
    if (language === 'roman_ur' && poster.description_roman_urdu) return poster.description_roman_urdu;
    return poster.description || '';
  };

  const categories = ['All', 'Sale', 'Bridal', 'Ladies', 'Kids', 'Special Offers'];

  const filteredPosters =
    selectedCategory === 'All'
      ? posters
      : posters.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <section
      id="promotional-posters"
      className="py-16 md:py-24 bg-gradient-to-b from-blue-50/40 via-white to-blue-50/20 border-b border-blue-100"
      dir={language === 'ur' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {formatText(
                '5 Featured Boutique Posters & Campaigns',
                'بوتیک کے ۵ خصوصی پروموشنل پوسٹرز اور کیمپینز',
                'Boutique Ke 5 Khasusi Promotional Posters'
              )}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif-display font-medium text-slate-900 tracking-tight mb-4">
            {formatText(
              'Latest Boutique Posters & Special Announcements',
              'بوتیک کے تازہ ترین پوسٹرز اور خصوصی اعلانات',
              'Boutique Ke Taza Tareen Posters Aur Aelanaat'
            )}
          </h2>

          <p className="text-base text-slate-600 max-w-2xl mx-auto font-light">
            {formatText(
              'Explore all 5 seasonal stitching offers, festive bridal campaigns, and exclusive collection showcases from our Sadiqabad atelier.',
              'ہماری صادق آباد بوتیک کے تمام ۵ فیسٹیو آفرز، برائیڈل کیمپینز، اور ایکسپریس سلائی کے پوسٹرز ملاحظہ فرمائیں۔',
              'Humari Sadiqabad boutique ke tamam 5 festive offers, bridal campaigns aur silai posters check karein.'
            )}
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105'
                    : 'bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 hover:border-blue-300'
                }`}
              >
                {cat === 'All' ? `${formatText('All Posters', 'تمام پوسٹرز', 'Tamam Posters')} (${posters.length})` : cat}
              </button>
            );
          })}
        </div>

        {/* Posters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredPosters.map((poster, idx) => {
            const isVideo = poster.media_type === 'video' || !!poster.video_url;
            const title = getPosterTitle(poster);
            const desc = getPosterDesc(poster);

            return (
              <div
                key={poster.id || idx}
                className="group relative bg-white rounded-2xl border border-blue-100 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1"
              >
                {/* Media Container */}
                <div className="relative aspect-[4/3] sm:aspect-[16/11] bg-slate-100 overflow-hidden">
                  <img
                    src={poster.image_url}
                    alt={title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-black/25" />

                  {/* Category Badge & Poster Number */}
                  <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5">
                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-blue-600 text-white shadow-sm">
                      {poster.category}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/90 text-slate-800 shadow-xs">
                      #{idx + 1}
                    </span>
                    {poster.is_featured && (
                      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-500 text-white shadow-sm flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Featured</span>
                      </span>
                    )}
                  </div>

                  {/* Quick Preview Button */}
                  <button
                    type="button"
                    onClick={() => setLightboxPoster(poster)}
                    className="absolute top-3.5 right-3.5 z-10 p-2 rounded-full bg-black/50 hover:bg-blue-600 text-white backdrop-blur-xs transition-colors cursor-pointer"
                    title={isVideo ? 'Watch Video' : 'View Full Poster'}
                  >
                    {isVideo ? <Play className="w-3.5 h-3.5 fill-current" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  {/* Date Range if present */}
                  {(poster.start_date || poster.end_date) && (
                    <div className="absolute bottom-3 left-3 text-[11px] font-medium text-white/90 flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-md backdrop-blur-xs">
                      <Calendar className="w-3 h-3 text-blue-300" />
                      <span>
                        {poster.start_date ? new Date(poster.start_date).toLocaleDateString() : ''}
                        {poster.end_date ? ` — ${new Date(poster.end_date).toLocaleDateString()}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-serif-display font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                      {title}
                    </h3>
                    {desc && (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                        {desc}
                      </p>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenBooking(title)}
                      className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>
                        {formatText('Book This Offer', 'یہ آفر بک کریں', 'Yeh Offer Book Karein')}
                      </span>
                      <ArrowRight className={`w-3.5 h-3.5 ${language === 'ur' ? 'rotate-180' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setLightboxPoster(poster)}
                      className="p-2.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                      title={formatText('View Poster', 'پوسٹر دیکھیں', 'Poster Dekhein')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxPoster && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-blue-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-blue-600 text-white">
                  {lightboxPoster.category}
                </span>
                <h4 className="text-sm font-semibold text-blue-950 truncate max-w-xs sm:max-w-md">
                  {getPosterTitle(lightboxPoster)}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setLightboxPoster(null)}
                className="p-1 rounded-lg text-slate-600 hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Media Body */}
            <div className="p-4 overflow-y-auto space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center aspect-[16/10]">
                {lightboxPoster.media_type === 'video' && lightboxPoster.video_url ? (
                  getYouTubeEmbedUrl(lightboxPoster.video_url) ? (
                    <iframe
                      src={getYouTubeEmbedUrl(lightboxPoster.video_url)!}
                      title={lightboxPoster.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={lightboxPoster.video_url}
                      poster={lightboxPoster.image_url}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <img
                    src={lightboxPoster.image_url}
                    alt={getPosterTitle(lightboxPoster)}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <div>
                <h3 className="text-lg font-serif-display font-bold text-slate-900 mb-2">
                  {getPosterTitle(lightboxPoster)}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {getPosterDesc(lightboxPoster)}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const title = getPosterTitle(lightboxPoster);
                    setLightboxPoster(null);
                    onOpenBooking(title);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>{formatText('Book Consultation for this Poster', 'اس پوسٹر کے لیے بکنگ کریں', 'Book This Poster')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
