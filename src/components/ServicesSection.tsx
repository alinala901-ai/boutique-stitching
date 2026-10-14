import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { BoutiqueServiceItem } from '../types';
import { fetchBoutiqueServices } from '../lib/supabase';
import {
  Scissors,
  Sparkles,
  Heart,
  Crown,
  Shirt,
  Calendar,
  PenTool,
  Wrench,
  ArrowRight,
  Tag,
  MessageCircle,
} from 'lucide-react';

interface ServicesSectionProps {
  onSelectService: (serviceName: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService }) => {
  const { t, language, formatText } = useLanguage();
  const [services, setServices] = useState<BoutiqueServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultServices: BoutiqueServiceItem[] = [
    {
      id: 'srv-ladies',
      title: 'Ladies Custom Stitching',
      title_urdu: 'خواتین کی سلائی',
      title_roman_urdu: 'Khawateen Ki Silai',
      description: 'Custom stitched kameez shalwar, trousers, necklines, sleeves styling, and perfect fit.',
      description_urdu: 'قمیض شلوار، ٹراؤزر اور جدید ڈیزائننگ کی ماہرانہ سلائی۔',
      description_roman_urdu: 'Kameez shalwar, trouser aur design ki behtareen silai.',
      category: 'Ladies Stitching',
      icon_name: 'Scissors',
      pricing_type: 'starting_at',
      starting_price: 1800,
      is_active: true,
      display_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'srv-kids',
      title: 'Kids Festive & Traditional',
      title_urdu: 'بچوں کے ملبوسات',
      title_roman_urdu: 'Bachon Kay Kapray',
      description: 'Comfortable, soft-lined traditional stitching for young girls and children.',
      description_urdu: 'بچوں کے لیے نرم، آرام دہ اور خوبصورت روایتی ملبوسات۔',
      description_roman_urdu: 'Bachon ke liye aaram-deh aur khoobsurat traditional kapray.',
      category: 'Kids Stitching',
      icon_name: 'Heart',
      pricing_type: 'starting_at',
      starting_price: 1200,
      is_active: true,
      display_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'srv-suits',
      title: 'Pakistani 3-Piece Suits',
      title_urdu: 'پاکستانی ۳ پیس سوٹ',
      title_roman_urdu: 'Pakistani 3-Piece Suits',
      description: 'Lawn, cotton, silk, and chiffon unstitched fabrics transformed into designer cuts.',
      description_urdu: 'لان، کاٹن اور شفون کپڑوں کی شاندار ماسٹر کٹنگ اور سلائی۔',
      description_roman_urdu: 'Lawn, cotton aur chiffon joron ki designer style silai.',
      category: 'Pakistani Suits',
      icon_name: 'Shirt',
      pricing_type: 'starting_at',
      starting_price: 2200,
      is_active: true,
      display_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'srv-bridal',
      title: 'Bridal Wear Couture',
      title_urdu: 'برائیڈل اور شادی کے جوڑے',
      title_roman_urdu: 'Bridal Aur Shaadi Ka Jora',
      description: 'Luxury lehengas, maxis, heavy embellishment, can-can fitting, and regal bridal finishes.',
      description_urdu: 'لہنگا، میکسی اور بھاری کڑھائی والے برائیڈل سوٹس کی خصوصی سلائی۔',
      description_roman_urdu: 'Lehenga, maxi aur shaadi kay bhari joron ki shandaar silai.',
      category: 'Bridal Stitching',
      icon_name: 'Crown',
      pricing_type: 'starting_at',
      starting_price: 8000,
      is_active: true,
      display_order: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'srv-party',
      title: 'Party & Festive Wear',
      title_urdu: 'پارٹی اور عید ویئر',
      title_roman_urdu: 'Party Aur Eid Wear',
      description: 'Celebration ensembles, organza styling, lace embellishments, and flared silhouettes.',
      description_urdu: 'تہواروں، عید اور دعوتوں کے لیے دلکش فینسی جوڑے۔',
      description_roman_urdu: 'Taqreebat, Eid aur party ke liye fancy aur khubsurat cuts.',
      category: 'Party Wear Stitching',
      icon_name: 'Sparkles',
      pricing_type: 'starting_at',
      starting_price: 3500,
      is_active: true,
      display_order: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'srv-daily',
      title: 'Daily Pret & Cotton Wear',
      title_urdu: 'روزمرہ لان اور کاٹن سوٹس',
      title_roman_urdu: 'Daily Pret & Cotton Suits',
      description: 'Clean, durable everyday kurtas and two-piece sets made for summer and daily ease.',
      description_urdu: 'روزانہ کے استعمال کے لیے پائیدار، ہلکے اور خوبصورت کرتے۔',
      description_roman_urdu: 'Rozmarrah pehannay ke liye aaram-deh cotton aur lawn kapray.',
      category: 'Daily Wear',
      icon_name: 'Calendar',
      pricing_type: 'starting_at',
      starting_price: 1500,
      is_active: true,
      display_order: 6,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'srv-custom',
      title: 'Custom Designing & Styling',
      title_urdu: 'کسٹم ڈیزائنگ اور اسٹائلنگ',
      title_roman_urdu: 'Custom Designing & Styling',
      description: 'Send your inspiration photo or sketch; we bring your dream outfit to life.',
      description_urdu: 'اپنی پسند کی تصویر یا خاکہ بھیجیں، ہم ہو بہو تیار کریں گے۔',
      description_roman_urdu: 'Apni pasand ki photo bhejein, hum bilkul waisa tayyar karein gay.',
      category: 'Custom Designing',
      icon_name: 'PenTool',
      pricing_type: 'quotation',
      quotation_note: 'Contact for Quotation',
      is_active: true,
      display_order: 7,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'srv-alterations',
      title: 'Garment Alterations & Resizing',
      title_urdu: 'آلٹریشن اور فٹنگ درستگی',
      title_roman_urdu: 'Alterations & Fitting',
      description: 'Size adjustments, neckline remodeling, shortening lengths, and perfect fitting fixes.',
      description_urdu: 'سائز کی تبدیلی، فٹنگ کی درستی اور کپڑوں کی ازسرنو مرمت۔',
      description_roman_urdu: 'Fitting ki durustagi, size adjusting aur alter ki sahulat.',
      category: 'Alterations',
      icon_name: 'Wrench',
      pricing_type: 'starting_at',
      starting_price: 500,
      is_active: true,
      display_order: 8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const loadServices = async () => {
    try {
      const data = await fetchBoutiqueServices();
      const activeOnly = data.filter((s) => s.is_active);
      if (activeOnly.length > 0) {
        setServices(activeOnly);
      } else {
        setServices(defaultServices);
      }
    } catch {
      setServices(defaultServices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();

    const handleSync = () => loadServices();
    window.addEventListener('storage', handleSync);
    window.addEventListener('boutique_services_updated', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('boutique_services_updated', handleSync);
    };
  }, []);

  const getServiceIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('kid')) return Heart;
    if (cat.includes('bridal')) return Crown;
    if (cat.includes('party')) return Sparkles;
    if (cat.includes('suit')) return Shirt;
    if (cat.includes('daily')) return Calendar;
    if (cat.includes('custom') || cat.includes('embroidery')) return PenTool;
    if (cat.includes('alter')) return Wrench;
    return Scissors;
  };

  return (
    <section id="services" className="py-20 md:py-28 bg-gradient-to-b from-white via-blue-50/40 to-white border-t border-b border-blue-100" dir={language === 'ur' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs uppercase tracking-widest text-blue-700 font-bold mb-2">
            Atelier Expertise · Sadiqabad Studio
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif-display font-medium text-blue-950 tracking-tight">
            {t('servicesTitle')}
          </h2>
          <div className="w-16 h-1 bg-blue-600 rounded-full mx-auto mt-4 mb-4" />
          <p className="text-base text-slate-600 leading-relaxed font-light">
            {t('servicesSubtitle')}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((item, index) => {
            const Icon = getServiceIcon(item.category || item.title);
            
            const title =
              language === 'ur' && item.title_urdu
                ? item.title_urdu
                : language === 'roman_ur' && item.title_roman_urdu
                ? item.title_roman_urdu
                : item.title;

            const description =
              language === 'ur' && item.description_urdu
                ? item.description_urdu
                : language === 'roman_ur' && item.description_roman_urdu
                ? item.description_roman_urdu
                : item.description;

            return (
              <div
                key={item.id}
                className="group relative bg-white border border-blue-100 hover:border-blue-400 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center transition-colors group-hover:bg-blue-600 group-hover:text-white shadow-2xs">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-mono font-semibold text-blue-400">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="text-lg font-serif-display font-semibold text-blue-950 mb-2 group-hover:text-blue-700 transition-colors">
                    {title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed mb-4 font-light">
                    {description}
                  </p>

                  {/* Flexible Price Display: Fixed, Starting Price, or Quotation */}
                  <div className="mb-4">
                    {item.pricing_type === 'quotation' ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold">
                        <MessageCircle className="w-3 h-3 text-amber-700" />
                        <span>{item.quotation_note || formatText('Contact for Quotation', 'رابطہ برائے کوٹیشن', 'Quotation ke liye rabta karein')}</span>
                      </div>
                    ) : item.sale_price && (item.fixed_price || item.starting_price) ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-950 border border-emerald-200 text-xs font-bold font-mono">
                          <Tag className="w-3 h-3 text-emerald-700" />
                          <span>PKR {item.sale_price.toLocaleString('en-PK')}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 line-through font-mono">
                          PKR {(item.fixed_price || item.starting_price)?.toLocaleString('en-PK')}
                        </span>
                        {item.discount_percent ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {item.discount_percent}% OFF
                          </span>
                        ) : null}
                      </div>
                    ) : item.pricing_type === 'fixed' && item.fixed_price ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold font-mono">
                        <Tag className="w-3 h-3 text-blue-600" />
                        <span>PKR {item.fixed_price.toLocaleString('en-PK')}</span>
                      </div>
                    ) : item.starting_price ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50/80 text-blue-900 border border-blue-100 text-xs font-medium font-mono">
                        <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">
                          {formatText('From', 'شروع', 'Shuru')}
                        </span>
                        <span className="font-bold text-blue-950">PKR {item.starting_price.toLocaleString('en-PK')}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="pt-4 border-t border-blue-50">
                  <button
                    type="button"
                    onClick={() => onSelectService(item.title)}
                    className="w-full text-xs font-semibold uppercase tracking-wider text-blue-700 hover:text-blue-900 flex items-center justify-between group-hover:translate-x-0.5 transition-all cursor-pointer"
                  >
                    <span>{t('serviceInquireBtn')}</span>
                    <ArrowRight className={`w-3.5 h-3.5 ${language === 'ur' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
