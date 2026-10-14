import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { SaleItem } from '../types';
import { fetchSaleItems } from '../lib/supabase';
import { Tag, Sparkles, ArrowRight, CheckCircle2, ShoppingBag, Eye, X, Scissors } from 'lucide-react';

interface SaleSectionProps {
  onOpenBooking: (serviceName?: string) => void;
}

export const SaleSection: React.FC<SaleSectionProps> = ({ onOpenBooking }) => {
  const { t, language, formatText } = useLanguage();
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'ladies' | 'kids'>('all');
  const [previewItem, setPreviewItem] = useState<SaleItem | null>(null);

  const loadItems = async () => {
    try {
      const data = await fetchSaleItems(true);
      setSaleItems(data);
    } catch (err) {
      console.error('Failed to load sale items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();

    const handleStorage = () => loadItems();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('boutique_sale_items_updated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('boutique_sale_items_updated', handleStorage);
    };
  }, []);

  const filteredItems = selectedFilter === 'all'
    ? saleItems
    : saleItems.filter((item) => item.category === selectedFilter);

  const formatPrice = (amount: number) => {
    return `PKR ${amount.toLocaleString('en-PK')}`;
  };

  if (!loading && saleItems.length === 0) {
    return null; // Gracefully hidden if no active sale offers
  }

  return (
    <section id="sale" className="py-20 md:py-28 bg-gradient-to-b from-white via-blue-50/30 to-white border-y border-blue-100" dir={language === 'ur' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3 border border-blue-200">
            <Tag className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('saleBadge')} · Sadiqabad Studio</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif-display font-medium text-blue-950 tracking-tight">
            {t('saleSectionTitle')}
          </h2>
          <div className="w-20 h-1 bg-blue-600 rounded-full mx-auto mt-4 mb-5" />
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-light">
            {t('saleSectionSubtitle')}
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              {formatText('All Offers', 'تمام آفرز', 'Tamam Offers')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('ladies')}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                selectedFilter === 'ladies'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              {formatText('Ladies Collection', 'خواتین کے سوٹس', 'Ladies Suits')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('kids')}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                selectedFilter === 'kids'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              {formatText('Kids Collection', 'بچوں کے ملبوسات', 'Bachon Ke Kapray')}
            </button>
          </div>
        </div>

        {/* Sale Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => {
            const title = language === 'ur' && item.title_urdu
              ? item.title_urdu
              : language === 'roman_ur' && item.title_roman_urdu
              ? item.title_roman_urdu
              : item.title;

            const desc = language === 'ur' && item.description_urdu
              ? item.description_urdu
              : language === 'roman_ur' && item.description_roman_urdu
              ? item.description_roman_urdu
              : item.description;

            const discount = item.discount_percentage || (item.original_price > item.sale_price
              ? Math.round(((item.original_price - item.sale_price) / item.original_price) * 100)
              : 0);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col group"
              >
                {/* Image Container with Badges */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-blue-50">
                  <img
                    src={item.image_url}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/40 via-transparent to-transparent opacity-60" />

                  {/* Top Badges */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-blue-950/80 backdrop-blur-xs text-white border border-white/20">
                      {item.category === 'kids' ? formatText('Kids', 'بچے', 'Kids') : formatText('Ladies', 'خواتین', 'Ladies')}
                    </span>
                    {discount > 0 && (
                      <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-amber-500 text-white shadow-md">
                        {discount}% OFF
                      </span>
                    )}
                  </div>

                  {/* Quick Preview Hover Button */}
                  <div className="absolute inset-0 bg-blue-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="px-4 py-2 bg-white/95 text-blue-950 font-semibold text-xs rounded-lg shadow-lg flex items-center gap-1.5 hover:bg-white transition-all transform hover:scale-105 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>{formatText('View Details', 'تفصیلات دیکھیں', 'Tafseelat Dekhein')}</span>
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-serif-display font-semibold text-blue-950 line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors">
                      {title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-light mb-4">
                      {desc}
                    </p>
                  </div>

                  {/* Pricing Display as required by prompt */}
                  <div className="pt-4 border-t border-blue-50">
                    <div className="flex items-baseline justify-between mb-4">
                      <div>
                        {item.original_price > item.sale_price && (
                          <span className="text-xs text-slate-600 line-through mr-2 font-mono">
                            {formatPrice(item.original_price)}
                          </span>
                        )}
                        <span className="text-lg font-bold text-blue-950 font-mono">
                          {formatPrice(item.sale_price)}
                        </span>
                      </div>
                      {discount > 0 && (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {formatText(`Save ${discount}%`, `${discount}٪ بچت`, `${discount}% Bachat`)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenBooking(item.title)}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>{t('bookCTA')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-blue-100 flex flex-col">
            <div className="relative aspect-4/3 w-full bg-blue-50">
              <img
                src={previewItem.image_url}
                alt={previewItem.title}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              {previewItem.discount_percentage && previewItem.discount_percentage > 0 && (
                <span className="absolute bottom-3 left-3 px-3 py-1 text-xs font-black uppercase rounded-full bg-amber-500 text-white shadow">
                  {previewItem.discount_percentage}% OFF
                </span>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  {previewItem.category === 'kids' ? 'Kids Collection' : 'Ladies Collection'}
                </span>
                <span className="text-xs text-slate-600">Sadiqabad Studio</span>
              </div>

              <h3 className="text-xl font-serif-display font-semibold text-blue-950 mb-2">
                {language === 'ur' && previewItem.title_urdu
                  ? previewItem.title_urdu
                  : language === 'roman_ur' && previewItem.title_roman_urdu
                  ? previewItem.title_roman_urdu
                  : previewItem.title}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                {language === 'ur' && previewItem.description_urdu
                  ? previewItem.description_urdu
                  : language === 'roman_ur' && previewItem.description_roman_urdu
                  ? previewItem.description_roman_urdu
                  : previewItem.description}
              </p>

              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100 mb-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-600 block">Offer Price</span>
                  <div className="flex items-baseline gap-2">
                    {previewItem.original_price > previewItem.sale_price && (
                      <span className="text-xs text-slate-600 line-through font-mono">
                        {formatPrice(previewItem.original_price)}
                      </span>
                    )}
                    <span className="text-xl font-bold text-blue-950 font-mono">
                      {formatPrice(previewItem.sale_price)}
                    </span>
                  </div>
                </div>
                {previewItem.discount_percentage && previewItem.discount_percentage > 0 && (
                  <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                    {previewItem.discount_percentage}% Discount
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const sel = previewItem.title;
                    setPreviewItem(null);
                    onOpenBooking(sel);
                  }}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Scissors className="w-4 h-4" />
                  <span>{t('bookCTA')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {formatText('Close', 'بند کریں', 'Band Karein')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
