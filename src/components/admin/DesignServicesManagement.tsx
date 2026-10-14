import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  BoutiqueDesign,
  BoutiqueServiceItem,
  DesignCategory,
  ServicePricingType,
} from '../../types';
import {
  fetchBoutiqueDesigns,
  upsertBoutiqueDesign,
  deleteBoutiqueDesign,
  fetchBoutiqueServices,
  upsertBoutiqueService,
  deleteBoutiqueService,
  uploadManagementImage,
} from '../../lib/supabase';
import {
  Sparkles,
  Scissors,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Upload,
  RefreshCw,
  X,
  AlertTriangle,
  Tag,
  DollarSign,
  MessageCircle,
} from 'lucide-react';

const DESIGN_CATEGORIES: DesignCategory[] = [
  'Daily Wear',
  'Formal Wear',
  'Party Wear',
  'Bridal',
  'Pakistani Suits',
  'Ladies',
  'Kids',
  'Embroidery',
  'Custom Designs',
  'Alterations',
];

const SERVICE_CATEGORIES = [
  'Ladies Stitching',
  'Kids Stitching',
  'Bridal Stitching',
  'Party Wear Stitching',
  'Daily Wear',
  'Pakistani Suits',
  'Custom Designing',
  'Embroidery',
  'Alterations',
];

export const DesignServicesManagement: React.FC = () => {
  const { language, formatText } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'designs' | 'services'>('designs');

  // Designs State
  const [designs, setDesigns] = useState<BoutiqueDesign[]>([]);
  const [services, setServices] = useState<BoutiqueServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Design Modal
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<BoutiqueDesign | null>(null);
  const [designName, setDesignName] = useState('');
  const [designNameUrdu, setDesignNameUrdu] = useState('');
  const [designNameRomanUrdu, setDesignNameRomanUrdu] = useState('');
  const [designDesc, setDesignDesc] = useState('');
  const [designDescUrdu, setDesignDescUrdu] = useState('');
  const [designDescRomanUrdu, setDesignDescRomanUrdu] = useState('');
  const [designImageUrl, setDesignImageUrl] = useState('');
  const [designCategory, setDesignCategory] = useState<DesignCategory>('Pakistani Suits');
  const [designPrice, setDesignPrice] = useState<string>('4500');
  const [designIsActive, setDesignIsActive] = useState(true);
  const [designIsFeatured, setDesignIsFeatured] = useState(false);
  const [designDisplayOrder, setDesignDisplayOrder] = useState(0);
  const [savingDesign, setSavingDesign] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [designFormError, setDesignFormError] = useState<string | null>(null);
  const [designDeleteConfirmId, setDesignDeleteConfirmId] = useState<string | null>(null);

  // Services Modal
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<BoutiqueServiceItem | null>(null);
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceTitleUrdu, setServiceTitleUrdu] = useState('');
  const [serviceTitleRomanUrdu, setServiceTitleRomanUrdu] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceDescUrdu, setServiceDescUrdu] = useState('');
  const [serviceDescRomanUrdu, setServiceDescRomanUrdu] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Ladies Stitching');
  const [servicePricingType, setServicePricingType] = useState<ServicePricingType>('starting_at');
  const [serviceFixedPrice, setServiceFixedPrice] = useState('2500');
  const [serviceStartingPrice, setServiceStartingPrice] = useState('1800');
  const [serviceSalePrice, setServiceSalePrice] = useState('');
  const [serviceDiscountPercent, setServiceDiscountPercent] = useState<number | undefined>(undefined);
  const [serviceQuotationNote, setServiceQuotationNote] = useState('');
  const [serviceImageUrl, setServiceImageUrl] = useState('');
  const [serviceIsFeatured, setServiceIsFeatured] = useState(false);
  const [uploadingServiceImage, setUploadingServiceImage] = useState(false);
  const [serviceFormError, setServiceFormError] = useState<string | null>(null);
  const [serviceIsActive, setServiceIsActive] = useState(true);
  const [serviceDisplayOrder, setServiceDisplayOrder] = useState(0);
  const [savingService, setSavingService] = useState(false);
  const [serviceDeleteConfirmId, setServiceDeleteConfirmId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [desData, serData] = await Promise.all([
        fetchBoutiqueDesigns(),
        fetchBoutiqueServices(),
      ]);
      setDesigns(desData);
      setServices(serData);
    } catch (err) {
      console.error('Failed to load designs/services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Design Handlers
  const openAddDesignModal = () => {
    setEditingDesign(null);
    setDesignName('');
    setDesignNameUrdu('');
    setDesignNameRomanUrdu('');
    setDesignDesc('');
    setDesignDescUrdu('');
    setDesignDescRomanUrdu('');
    setDesignImageUrl('/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg');
    setDesignCategory('Pakistani Suits');
    setDesignPrice('4500');
    setDesignIsActive(true);
    setDesignIsFeatured(false);
    setDesignDisplayOrder(designs.length + 1);
    setIsDesignModalOpen(true);
  };

  const openEditDesignModal = (item: BoutiqueDesign) => {
    setEditingDesign(item);
    setDesignName(item.name);
    setDesignNameUrdu(item.name_urdu || '');
    setDesignNameRomanUrdu(item.name_roman_urdu || '');
    setDesignDesc(item.description || '');
    setDesignDescUrdu(item.description_urdu || '');
    setDesignDescRomanUrdu(item.description_roman_urdu || '');
    setDesignImageUrl(item.image_url);
    setDesignCategory(item.category);
    setDesignPrice(item.price ? String(item.price) : '');
    setDesignIsActive(item.is_active);
    setDesignIsFeatured(item.is_featured);
    setDesignDisplayOrder(item.display_order);
    setIsDesignModalOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setDesignFormError(
        formatText(
          'Please select a valid image file (JPEG, PNG, WebP).',
          'براہ کرم درست تصویری فائل (JPEG, PNG, WebP) منتخب کریں۔',
          'Bara-e-meherbani image file (JPEG, PNG, WebP) select karein.'
        )
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setDesignFormError(
        formatText(
          'Image size exceeds 5MB limit. Please choose a smaller photo.',
          'تصویر کا سائز 5MB سے زیادہ ہے۔ براہ کرم چھوٹی تصویر منتخب کریں۔',
          'Image size 5MB se zyada hai. Choti photo muntakhib karein.'
        )
      );
      return;
    }

    setDesignFormError(null);
    setUploadingImage(true);
    try {
      const res = await uploadManagementImage(file, 'designs');
      if (res.url) {
        setDesignImageUrl(res.url);
      } else if (res.error) {
        setDesignFormError(res.error);
      }
    } catch (err: any) {
      setDesignFormError(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleServiceImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setServiceFormError(
        formatText(
          'Please select a valid image file (JPEG, PNG, WebP).',
          'براہ کرم درست تصویری فائل (JPEG, PNG, WebP) منتخب کریں۔',
          'Bara-e-meherbani image file (JPEG, PNG, WebP) select karein.'
        )
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setServiceFormError(
        formatText(
          'Image size exceeds 5MB limit. Please choose a smaller photo.',
          'تصویر کا سائز 5MB سے زیادہ ہے۔ براہ کرم چھوٹی تصویر منتخب کریں۔',
          'Image size 5MB se zyada hai. Choti photo muntakhib karein.'
        )
      );
      return;
    }

    setServiceFormError(null);
    setUploadingServiceImage(true);
    try {
      const res = await uploadManagementImage(file, 'services');
      if (res.url) {
        setServiceImageUrl(res.url);
      } else if (res.error) {
        setServiceFormError(res.error);
      }
    } catch (err: any) {
      setServiceFormError(err.message || 'Image upload failed');
    } finally {
      setUploadingServiceImage(false);
    }
  };

  const handleSaveDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designName.trim() || !designImageUrl.trim()) return;

    setSavingDesign(true);
    try {
      const payload: Partial<BoutiqueDesign> = {
        id: editingDesign ? editingDesign.id : undefined,
        name: designName.trim(),
        name_urdu: designNameUrdu.trim() || undefined,
        name_roman_urdu: designNameRomanUrdu.trim() || undefined,
        description: designDesc.trim() || undefined,
        description_urdu: designDescUrdu.trim() || undefined,
        description_roman_urdu: designDescRomanUrdu.trim() || undefined,
        image_url: designImageUrl.trim(),
        category: designCategory,
        price: designPrice ? parseFloat(designPrice) : undefined,
        is_active: designIsActive,
        is_featured: designIsFeatured,
        display_order: Number(designDisplayOrder) || 0,
      };

      const res = await upsertBoutiqueDesign(payload);
      if (res.success) {
        setIsDesignModalOpen(false);
        loadData();
      }
    } catch (err) {
      console.error('Failed to save design:', err);
    } finally {
      setSavingDesign(false);
    }
  };

  const handleDeleteDesign = async (id: string) => {
    try {
      const res = await deleteBoutiqueDesign(id);
      if (res.success) {
        setDesigns((prev) => prev.filter((d) => d.id !== id));
        setDesignDeleteConfirmId(null);
      }
    } catch (err) {
      console.error('Failed to delete design:', err);
    }
  };

  // Service Handlers
  const openAddServiceModal = () => {
    setEditingService(null);
    setServiceTitle('');
    setServiceTitleUrdu('');
    setServiceTitleRomanUrdu('');
    setServiceDesc('');
    setServiceDescUrdu('');
    setServiceDescRomanUrdu('');
    setServiceCategory('Ladies Stitching');
    setServicePricingType('starting_at');
    setServiceFixedPrice('2500');
    setServiceStartingPrice('1800');
    setServiceSalePrice('');
    setServiceDiscountPercent(undefined);
    setServiceQuotationNote('');
    setServiceImageUrl('');
    setServiceIsFeatured(false);
    setServiceIsActive(true);
    setServiceDisplayOrder(services.length + 1);
    setServiceFormError(null);
    setIsServiceModalOpen(true);
  };

  const openEditServiceModal = (item: BoutiqueServiceItem) => {
    setEditingService(item);
    setServiceTitle(item.title);
    setServiceTitleUrdu(item.title_urdu || '');
    setServiceTitleRomanUrdu(item.title_roman_urdu || '');
    setServiceDesc(item.description || '');
    setServiceDescUrdu(item.description_urdu || '');
    setServiceDescRomanUrdu(item.description_roman_urdu || '');
    setServiceCategory(item.category);
    setServicePricingType(item.pricing_type || (item.fixed_price ? 'fixed' : item.quotation_note ? 'quotation' : 'starting_at'));
    setServiceFixedPrice(item.fixed_price ? String(item.fixed_price) : '2500');
    setServiceStartingPrice(item.starting_price ? String(item.starting_price) : '1800');
    setServiceSalePrice(item.sale_price ? String(item.sale_price) : '');
    setServiceDiscountPercent(item.discount_percent);
    setServiceQuotationNote(item.quotation_note || '');
    setServiceImageUrl(item.image_url || '');
    setServiceIsFeatured(Boolean(item.is_featured));
    setServiceIsActive(item.is_active);
    setServiceDisplayOrder(item.display_order);
    setServiceFormError(null);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceTitle.trim()) return;

    setSavingService(true);
    try {
      const payload: Partial<BoutiqueServiceItem> = {
        id: editingService ? editingService.id : undefined,
        title: serviceTitle.trim(),
        title_urdu: serviceTitleUrdu.trim() || undefined,
        title_roman_urdu: serviceTitleRomanUrdu.trim() || undefined,
        description: serviceDesc.trim() || undefined,
        description_urdu: serviceDescUrdu.trim() || undefined,
        description_roman_urdu: serviceDescRomanUrdu.trim() || undefined,
        category: serviceCategory,
        pricing_type: servicePricingType,
        fixed_price: servicePricingType === 'fixed' && serviceFixedPrice ? parseFloat(serviceFixedPrice) : undefined,
        starting_price: servicePricingType === 'starting_at' && serviceStartingPrice ? parseFloat(serviceStartingPrice) : undefined,
        sale_price: servicePricingType !== 'quotation' && serviceSalePrice ? parseFloat(serviceSalePrice) : undefined,
        discount_percent: servicePricingType !== 'quotation' ? serviceDiscountPercent : undefined,
        quotation_note: servicePricingType === 'quotation' ? (serviceQuotationNote.trim() || 'Contact for Quotation') : undefined,
        image_url: serviceImageUrl.trim() || undefined,
        is_featured: serviceIsFeatured,
        is_active: serviceIsActive,
        display_order: Number(serviceDisplayOrder) || 0,
      };

      const res = await upsertBoutiqueService(payload);
      if (res.success) {
        setIsServiceModalOpen(false);
        loadData();
      }
    } catch (err) {
      console.error('Failed to save service:', err);
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      const res = await deleteBoutiqueService(id);
      if (res.success) {
        setServices((prev) => prev.filter((s) => s.id !== id));
        setServiceDeleteConfirmId(null);
      }
    } catch (err) {
      console.error('Failed to delete service:', err);
    }
  };

  const filteredDesigns = designs.filter((d) => {
    const matchesSearch =
      !searchQuery ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.name_urdu && d.name_urdu.toLowerCase().includes(searchQuery.toLowerCase())) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header and Sub Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DFD3]">
        <div>
          <h2 className="text-xl font-serif-display font-bold text-blue-950">
            {language === 'ur' ? 'Designs Aur Khidmaat Intizam' : 'Design & Services Management'}
          </h2>
          <p className="text-xs text-slate-600 mt-1 font-light">
            {language === 'ur'
              ? 'Boutique kay formal & bridal designs aur silai khidmaat kay charges manage karein.'
              : 'Curate your exclusive Pakistani collection gallery and tailor service menu.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-[#F0E8DC] p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveSubTab('designs')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeSubTab === 'designs'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-blue-950'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>{language === 'ur' ? 'Designs Gallery' : 'Designs Gallery'}</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-[#E5DACB] rounded-full">
                  {designs.length}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('services')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeSubTab === 'services'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-blue-950'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-blue-600" />
                <span>{language === 'ur' ? 'Silai Services' : 'Stitching Services'}</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-[#E5DACB] rounded-full">
                  {services.length}
                </span>
              </span>
            </button>
          </div>

          {activeSubTab === 'designs' ? (
            <button
              type="button"
              onClick={openAddDesignModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ur' ? 'Naya Design' : 'Add Design'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={openAddServiceModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ur' ? 'Nayi Service' : 'Add Service'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: BOUTIQUE DESIGNS */}
      {activeSubTab === 'designs' && (
        <div className="space-y-4">
          {/* Search & Category Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-white border border-blue-100 rounded-xl">
            <div className="relative">
              <Search className="w-4 h-4 absolute start-3 top-3 text-[#9A8D7C]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search design title, style, or category..."
                className="w-full ps-9 pe-3 py-2 text-xs bg-blue-50/30 border border-[#E0D4C3] rounded-lg text-slate-900"
              />
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-blue-50/30 border border-[#E0D4C3] rounded-lg text-slate-900"
              >
                <option value="all">All Design Categories</option>
                {DESIGN_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-[#8C7E6D] flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm">Loading designs...</span>
            </div>
          ) : filteredDesigns.length === 0 ? (
            <div className="py-16 text-center bg-white border border-blue-100 rounded-xl p-8">
              <Sparkles className="w-12 h-12 text-[#C9BEAF] mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">No designs in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDesigns.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white border rounded-xl overflow-hidden shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between ${
                    item.is_active ? 'border-[#E2D4BF]' : 'border-blue-100 opacity-75'
                  }`}
                >
                  <div>
                    <div className="relative aspect-4/3 bg-blue-50 overflow-hidden group">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg';
                        }}
                      />
                      <div className="absolute top-2 start-2 flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-blue-600/90 text-white">
                          {item.category}
                        </span>
                        {item.is_featured && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-blue-600 text-white">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="absolute top-2 end-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                            item.is_active ? 'bg-emerald-600 text-white' : 'bg-gray-600 text-white'
                          }`}
                        >
                          {item.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-serif-display font-bold text-sm text-blue-950">
                        {language === 'ur' && item.name_urdu ? item.name_urdu : item.name}
                      </h3>
                      {item.name_urdu && language !== 'ur' && (
                        <p className="text-[11px] text-[#8C7E6D] italic">{item.name_urdu}</p>
                      )}

                      {item.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-light">
                          {language === 'ur' && item.description_urdu ? item.description_urdu : item.description}
                        </p>
                      )}

                      {item.price && (
                        <p className="text-sm font-bold text-blue-600 pt-1">
                          PKR {item.price.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/30 border-t border-[#F0E8DC] flex items-center justify-between">
                    <span className="text-[10px] text-[#9A8D7C]">Order #{item.display_order}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditDesignModal(item)}
                        className="p-1.5 text-blue-600 hover:bg-[#F0E8DC] rounded-md transition-colors"
                        title="Edit Design"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDesignDeleteConfirmId(item.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Design"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: STITCHING SERVICES */}
      {activeSubTab === 'services' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((ser) => (
              <div
                key={ser.id}
                className="bg-white border border-blue-100 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif-display font-bold text-base text-blue-950">
                        {language === 'ur' && ser.title_urdu ? ser.title_urdu : ser.title}
                      </h3>
                      <span className="inline-block px-2 py-0.5 mt-1 text-[11px] font-semibold rounded bg-blue-50 text-blue-600">
                        {ser.category}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ser.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {ser.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {ser.description && (
                    <p className="text-xs text-slate-600 leading-relaxed font-light">
                      {language === 'ur' && ser.description_urdu ? ser.description_urdu : ser.description}
                    </p>
                  )}

                  {ser.pricing_type === 'fixed' && ser.fixed_price ? (
                    <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-200">
                      <p className="text-[10px] text-blue-700 uppercase font-semibold">Fixed Price</p>
                      <p className="text-base font-bold text-blue-900">
                        PKR {ser.fixed_price.toLocaleString()}
                      </p>
                    </div>
                  ) : ser.pricing_type === 'quotation' ? (
                    <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-[10px] text-amber-800 uppercase font-semibold">Pricing Note</p>
                      <p className="text-xs font-semibold text-amber-900">
                        {ser.quotation_note || 'Contact for Quotation'}
                      </p>
                    </div>
                  ) : ser.starting_price ? (
                    <div className="p-2.5 bg-blue-50/30 rounded-lg border border-blue-100">
                      <p className="text-[10px] text-slate-600 uppercase font-semibold">Starting From</p>
                      <p className="text-base font-bold text-blue-600">
                        PKR {ser.starting_price.toLocaleString()}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-blue-50">
                  <span className="text-[10px] text-slate-400">Order #{ser.display_order}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditServiceModal(ser)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit Service"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceDeleteConfirmId(ser.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete Service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT DESIGN */}
      {isDesignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-blue-200 rounded-2xl max-w-lg w-full p-6 shadow-xl my-8 relative">
            <button
              type="button"
              onClick={() => setIsDesignModalOpen(false)}
              className="absolute top-4 end-4 p-1.5 text-slate-400 hover:text-blue-950 rounded-md cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif-display font-bold text-blue-950 mb-1">
              {editingDesign ? 'Edit Boutique Design' : 'Add New Boutique Design'}
            </h3>
            <p className="text-xs text-slate-600 mb-4 font-light">
              Add catalog pieces with English, Urdu, and Roman Urdu descriptions.
            </p>

            {designFormError && (
              <div className="p-3 mb-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{designFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDesign} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                    placeholder="Royal Silk Sharara"
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Name (اردو)
                  </label>
                  <input
                    type="text"
                    value={designNameUrdu}
                    onChange={(e) => setDesignNameUrdu(e.target.value)}
                    placeholder="شاہانہ سلک شرارہ"
                    dir="rtl"
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900 font-urdu"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Name (Roman Urdu)
                  </label>
                  <input
                    type="text"
                    value={designNameRomanUrdu}
                    onChange={(e) => setDesignNameRomanUrdu(e.target.value)}
                    placeholder="Shahana Silk Sharara"
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Design Image URL or Upload *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={designImageUrl}
                    onChange={(e) => setDesignImageUrl(e.target.value)}
                    placeholder="/src/assets/images/... or https://..."
                    className="flex-1 px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  />
                  <label className="px-3 py-2 text-xs font-medium bg-blue-50 text-blue-900 border border-blue-200 rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0 hover:bg-blue-100">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                  <select
                    value={designCategory}
                    onChange={(e) => setDesignCategory(e.target.value as DesignCategory)}
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  >
                    {DESIGN_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Price (PKR)</label>
                  <input
                    type="number"
                    value={designPrice}
                    onChange={(e) => setDesignPrice(e.target.value)}
                    placeholder="4500"
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Order</label>
                  <input
                    type="number"
                    value={designDisplayOrder}
                    onChange={(e) => setDesignDisplayOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Description (English)
                  </label>
                  <textarea
                    rows={2}
                    value={designDesc}
                    onChange={(e) => setDesignDesc(e.target.value)}
                    placeholder="Resham embroidery on sleeves..."
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Description (اردو)
                  </label>
                  <textarea
                    rows={2}
                    value={designDescUrdu}
                    onChange={(e) => setDesignDescUrdu(e.target.value)}
                    placeholder="آستین پر ریشم کی نفیس کڑھائی..."
                    dir="rtl"
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900 font-urdu"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Description (Roman Urdu)
                  </label>
                  <textarea
                    rows={2}
                    value={designDescRomanUrdu}
                    onChange={(e) => setDesignDescRomanUrdu(e.target.value)}
                    placeholder="Aasteen par resham karhai..."
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={designIsActive}
                    onChange={(e) => setDesignIsActive(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Active (Dastiyab)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={designIsFeatured}
                    onChange={(e) => setDesignIsFeatured(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Featured Collection</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-blue-100">
                <button
                  type="button"
                  onClick={() => setIsDesignModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDesign}
                  className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  {savingDesign && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Design</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SERVICE */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-blue-200 rounded-2xl max-w-lg w-full p-6 shadow-xl my-8 relative">
            <button
              type="button"
              onClick={() => setIsServiceModalOpen(false)}
              className="absolute top-4 end-4 p-1.5 text-slate-400 hover:text-blue-950 rounded-md cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif-display font-bold text-blue-950 mb-1">
              {editingService ? 'Edit Stitching Service' : 'Add Stitching Service'}
            </h3>
            <p className="text-xs text-slate-600 mb-4 font-light">
              Configure boutique services, pricing models (Fixed, Starting Price, or Quotation), and multi-lingual descriptions.
            </p>

            {serviceFormError && (
              <div className="p-3 mb-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{serviceFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveService} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={serviceTitle}
                    onChange={(e) => setServiceTitle(e.target.value)}
                    placeholder="Ladies 3-Piece Stitching"
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Title (اردو)
                  </label>
                  <input
                    type="text"
                    value={serviceTitleUrdu}
                    onChange={(e) => setServiceTitleUrdu(e.target.value)}
                    placeholder="خواتین تھری پیس سلائی"
                    dir="rtl"
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900 font-urdu"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Title (Roman Urdu)
                  </label>
                  <input
                    type="text"
                    value={serviceTitleRomanUrdu}
                    onChange={(e) => setServiceTitleRomanUrdu(e.target.value)}
                    placeholder="Khawateen 3-Piece Silai"
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  >
                    {SERVICE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Pricing Model</label>
                  <select
                    value={servicePricingType}
                    onChange={(e) => setServicePricingType(e.target.value as ServicePricingType)}
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="starting_at">Starting From Price</option>
                    <option value="fixed">Fixed Price</option>
                    <option value="quotation">Contact for Quotation</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Price / Quotation Input */}
              {servicePricingType === 'fixed' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Fixed Price (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={serviceFixedPrice}
                    onChange={(e) => {
                      setServiceFixedPrice(e.target.value);
                      const orig = parseFloat(e.target.value) || 0;
                      const sale = parseFloat(serviceSalePrice) || 0;
                      if (orig > 0 && sale > 0 && sale < orig) {
                        setServiceDiscountPercent(Math.round(((orig - sale) / orig) * 100));
                      } else {
                        setServiceDiscountPercent(undefined);
                      }
                    }}
                    placeholder="2500"
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900 font-bold"
                  />
                </div>
              ) : servicePricingType === 'quotation' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Quotation Message Note
                  </label>
                  <input
                    type="text"
                    value={serviceQuotationNote}
                    onChange={(e) => setServiceQuotationNote(e.target.value)}
                    placeholder="Contact for Quotation / Custom Estimate"
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Starting Price (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={serviceStartingPrice}
                    onChange={(e) => {
                      setServiceStartingPrice(e.target.value);
                      const orig = parseFloat(e.target.value) || 0;
                      const sale = parseFloat(serviceSalePrice) || 0;
                      if (orig > 0 && sale > 0 && sale < orig) {
                        setServiceDiscountPercent(Math.round(((orig - sale) / orig) * 100));
                      } else {
                        setServiceDiscountPercent(undefined);
                      }
                    }}
                    placeholder="1800"
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900 font-bold"
                  />
                </div>
              )}

              {/* Optional Sale Price & Discount */}
              {servicePricingType !== 'quotation' && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-blue-950 mb-1">
                        {formatText('Special Sale Price (PKR, Optional)', 'رعایتی سیل قیمت (اختیاری)', 'Sale Price (PKR, Optional)')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={serviceSalePrice}
                        onChange={(e) => {
                          const val = e.target.value;
                          setServiceSalePrice(val);
                          const orig = parseFloat(servicePricingType === 'fixed' ? serviceFixedPrice : serviceStartingPrice) || 0;
                          const sale = parseFloat(val) || 0;
                          if (orig > 0 && sale > 0 && sale < orig) {
                            setServiceDiscountPercent(Math.round(((orig - sale) / orig) * 100));
                          } else {
                            setServiceDiscountPercent(undefined);
                          }
                        }}
                        placeholder="e.g. 2000"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-lg text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        {formatText('Calculated Discount', 'رعایت کی شرح', 'Discount')}
                      </label>
                      <div className="px-3 py-1.5 text-xs bg-white border border-blue-100 rounded-lg flex items-center gap-1.5 text-emerald-700 font-bold min-h-[32px]">
                        {serviceDiscountPercent ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {serviceDiscountPercent}% OFF
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal text-[11px]">Regular Price</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Optional Service Banner Image
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={serviceImageUrl}
                    onChange={(e) => setServiceImageUrl(e.target.value)}
                    placeholder="/src/assets/images/... or https://..."
                    className="flex-1 px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  />
                  <label className="px-3 py-2 text-xs font-medium bg-blue-50 text-blue-900 border border-blue-200 rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0 hover:bg-blue-100">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingServiceImage ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleServiceImageFileChange}
                      className="hidden"
                      disabled={uploadingServiceImage}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Description (English)
                  </label>
                  <textarea
                    rows={2}
                    value={serviceDesc}
                    onChange={(e) => setServiceDesc(e.target.value)}
                    placeholder="Fine lining, piping, double stitching..."
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Description (اردو)
                  </label>
                  <textarea
                    rows={2}
                    value={serviceDescUrdu}
                    onChange={(e) => setServiceDescUrdu(e.target.value)}
                    placeholder="اندرونی استر، پائپنگ اور ڈبل سلائی..."
                    dir="rtl"
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900 font-urdu"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Description (Roman Urdu)
                  </label>
                  <textarea
                    rows={2}
                    value={serviceDescRomanUrdu}
                    onChange={(e) => setServiceDescRomanUrdu(e.target.value)}
                    placeholder="Astar, piping aur behtareen finish..."
                    className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={serviceIsActive}
                    onChange={(e) => setServiceIsActive(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Active on website menu</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={serviceIsFeatured}
                    onChange={(e) => setServiceIsFeatured(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Featured Service</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-blue-100">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  {savingService && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Service</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation for Design */}
      {designDeleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-red-200 rounded-xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
            <h4 className="font-serif-display font-bold text-base text-blue-950">Delete Design?</h4>
            <p className="text-xs text-slate-600">Are you sure you want to remove this design?</p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setDesignDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-[#F3EDE2] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDesign(designDeleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation for Service */}
      {serviceDeleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-red-200 rounded-xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
            <h4 className="font-serif-display font-bold text-base text-blue-950">Delete Service?</h4>
            <p className="text-xs text-slate-600">Are you sure you want to remove this service?</p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setServiceDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-[#F3EDE2] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteService(serviceDeleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
