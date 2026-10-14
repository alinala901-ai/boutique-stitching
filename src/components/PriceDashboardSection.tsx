import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { SaleItem } from '../types';
import { fetchSaleItems, upsertSaleItem, deleteSaleItem } from '../lib/supabase';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Search,
  Check,
  X,
  RefreshCw,
  LayoutDashboard,
  ExternalLink,
  Percent,
} from 'lucide-react';

interface PriceDashboardSectionProps {
  onOpenAdminPortal?: () => void;
  onOpenBooking?: (serviceName?: string) => void;
}

export const PriceDashboardSection: React.FC<PriceDashboardSectionProps> = ({
  onOpenAdminPortal,
  onOpenBooking,
}) => {
  const { language, formatText } = useLanguage();
  const [items, setItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'ladies' | 'kids'>('all');

  // Modal State for Add / Edit Item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemCategory, setItemCategory] = useState<'ladies' | 'kids'>('ladies');
  const [itemOriginalPrice, setItemOriginalPrice] = useState('');
  const [itemSalePrice, setItemSalePrice] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation State
  const [itemToDelete, setItemToDelete] = useState<SaleItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchSaleItems(false);
      setItems(data);
    } catch (err) {
      console.error('Failed to load dashboard items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => loadData();
    window.addEventListener('storage', handleSync);
    window.addEventListener('boutique_sale_items_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('boutique_sale_items_updated', handleSync);
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingItemId(null);
    setItemTitle('');
    setItemCategory('ladies');
    setItemOriginalPrice('');
    setItemSalePrice('');
    setItemDescription('');
    setItemImageUrl('/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SaleItem) => {
    setEditingItemId(item.id);
    setItemTitle(item.title);
    setItemCategory(item.category);
    setItemOriginalPrice(item.original_price.toString());
    setItemSalePrice(item.sale_price.toString());
    setItemDescription(item.description || '');
    setItemImageUrl(item.image_url);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const orig = parseFloat(itemOriginalPrice);
    const sale = parseFloat(itemSalePrice);

    if (!itemTitle.trim()) {
      setFormError(formatText('Item title is required.', 'آئٹم کا نام درج کریں', 'Item ka naam darj karein'));
      return;
    }
    if (isNaN(orig) || orig < 0) {
      setFormError(formatText('Original price must be valid.', 'اصل قیمت درست ہونی چاہیے', 'Original price theek honi chahiye'));
      return;
    }
    if (isNaN(sale) || sale < 0) {
      setFormError(formatText('Sale price must be valid.', 'سیل قیمت درست ہونی چاہیے', 'Sale price theek honi chahiye'));
      return;
    }
    if (sale > orig) {
      setFormError(formatText('Sale price cannot exceed original price.', 'سیل قیمت اصل قیمت سے زیادہ نہیں ہو سکتی', 'Sale price original price se zyada nahi ho sakti'));
      return;
    }

    setIsSaving(true);
    try {
      const res = await upsertSaleItem({
        id: editingItemId || undefined,
        title: itemTitle.trim(),
        category: itemCategory,
        original_price: orig,
        sale_price: sale,
        description: itemDescription.trim(),
        image_url: itemImageUrl,
        is_active: true,
        is_featured: true,
      });

      if (res.data) {
        await loadData();
        setIsModalOpen(false);
        setEditingItemId(null);
      } else if (res.error) {
        setFormError(res.error);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await deleteSaleItem(id);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        setItemToDelete(null);
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      (item.title_urdu && item.title_urdu.includes(q)) ||
      (item.title_roman_urdu && item.title_roman_urdu.toLowerCase().includes(q));
    const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <section
      id="price-dashboard"
      className="py-12 bg-gradient-to-b from-blue-50/50 via-white to-blue-50/30 border-y-2 border-blue-200"
      dir={language === 'ur' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* DASHBOARD TOP HEADER & CONTROLS */}
        <div className="bg-white rounded-2xl border-2 border-blue-300 p-5 sm:p-6 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-blue-100">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <LayoutDashboard className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-serif-display font-bold text-blue-950">
                    {formatText(
                      'Live Items & Price Dashboard',
                      'اشیاء اور قیمت کا لائیو ڈیش بورڈ (شامل اور ڈیلیٹ کریں)',
                      'Live Items & Price Dashboard (Add & Delete Rates)'
                    )}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                    {items.length} {formatText('Items', 'اشیاء', 'Items')}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  {formatText(
                    'Direct management: Add new garments with prices in PKR, edit rates, or delete items instantly.',
                    'براہ راست کنٹرول: قیمت (PKR) کے ساتھ نئے سوٹس شامل کریں، قیمت بدلیں یا ڈیلیٹ کریں۔',
                    'Direct control: Naye kapray price ke sath add karein, rates edit karein ya delete karein.'
                  )}
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS: ADD ITEM & FULL ADMIN */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-102"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {formatText('+ Add Item with Price', '+ قیمت کے ساتھ نیا آئٹم شامل کریں', '+ Add Item with Price')}
                </span>
              </button>

              {onOpenAdminPortal && (
                <button
                  type="button"
                  onClick={onOpenAdminPortal}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>
                    {formatText('Full Atelier Studio', 'مکمل اسٹوڈیو پورٹل', 'Full Atelier Studio')}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* SEARCH & CATEGORY FILTERS */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={formatText('Search by title or category...', 'نام یا کیٹیگری سے تلاش کریں...', 'Search title or category...')}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {formatText('All', 'تمام', 'All')} ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('ladies')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  categoryFilter === 'ladies'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {formatText('Ladies Collection', 'خواتین', 'Ladies')} ({items.filter((i) => i.category === 'ladies').length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('kids')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  categoryFilter === 'kids'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {formatText('Kids Collection', 'بچے', 'Kids')} ({items.filter((i) => i.category === 'kids').length})
              </button>
            </div>
          </div>
        </div>

        {/* ITEMS GRID WITH PRICES, EDIT & DELETE */}
        {loading ? (
          <div className="py-16 text-center text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm">Loading price catalog...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center bg-white border-2 border-dashed border-blue-200 rounded-2xl space-y-4">
            <Tag className="w-12 h-12 text-blue-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">
              {formatText('No Items Found', 'کوئی آئٹم نہیں ملا', 'Koi Item Nahi Mila')}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {formatText(
                'Start by adding your first boutique clothing item with custom pricing.',
                'قیمت کے ساتھ اپنا پہلا بوتیک آئٹم شامل کریں۔',
                'Price ke sath pehla boutique item add karein.'
              )}
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{formatText('Add First Item with Price', 'پہلا آئٹم شامل کریں', 'Pehla Item Add Karein')}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map((item) => {
              const hasDiscount = item.original_price > item.sale_price;
              const discountPercent = item.discount_percentage || (hasDiscount
                ? Math.round(((item.original_price - item.sale_price) / item.original_price) * 100)
                : 0);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border-2 border-blue-100 hover:border-blue-400 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  {/* Photo Header */}
                  <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-900/80 text-white backdrop-blur-xs">
                      {item.category === 'kids' ? 'Kids' : 'Ladies'}
                    </span>
                    {discountPercent > 0 && (
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 text-[11px] font-black rounded-full bg-rose-600 text-white shadow-sm">
                        -{discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-blue-950 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* PRICING BLOCK (Bold, Clear PKR rates) */}
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Current Price
                      </span>
                      <div className="flex items-baseline justify-between gap-1 mt-0.5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black font-mono text-emerald-700">
                            PKR {item.sale_price.toLocaleString('en-PK')}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-slate-400 line-through font-mono">
                              PKR {item.original_price.toLocaleString('en-PK')}
                            </span>
                          )}
                        </div>
                      </div>
                      {hasDiscount && (
                        <p className="text-[10px] text-emerald-700 font-medium mt-0.5 font-mono">
                          Save: PKR {(item.original_price - item.sale_price).toLocaleString('en-PK')}
                        </p>
                      )}
                    </div>

                    {/* ACTION BUTTONS: EDIT PRICE & DELETE */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="flex-1 py-1.5 px-2.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title="Edit Price & Details"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>{formatText('Edit Price', 'قیمت بدلیں', 'Edit Price')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        className="py-1.5 px-3 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{formatText('Delete', 'ڈیلیٹ', 'Delete')}</span>
                      </button>
                    </div>

                    {onOpenBooking && (
                      <button
                        type="button"
                        onClick={() => onOpenBooking(item.title)}
                        className="w-full py-1.5 text-[11px] font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-center cursor-pointer border border-slate-200"
                      >
                        {formatText('Book Consultation for this Suit →', 'سلائی بکنگ کروائیں ←', 'Book Stitching →')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT ITEM WITH PRICE MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl border border-blue-200 p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-blue-100">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Tag className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-blue-950 font-serif-display">
                  {editingItemId
                    ? formatText('Edit Garment Price & Details', 'قیمت اور تفصیل بدلیں', 'Edit Garment & Price')
                    : formatText('+ Add New Item with Price', '+ نیا آئٹم اور قیمت شامل کریں', '+ Add Item with Price')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-3.5 text-start">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {formatText('Garment Title / Name *', 'آئٹم کا نام *', 'Garment Title *')}
                </label>
                <input
                  type="text"
                  required
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="e.g. Peach Embroidered Lawn 3-Piece"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {formatText('Category *', 'کیٹیگری *', 'Category *')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setItemCategory('ladies')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      itemCategory === 'ladies'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Ladies Collection
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemCategory('kids')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      itemCategory === 'kids'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Kids Collection
                  </button>
                </div>
              </div>

              {/* Pricing row (Original + Sale) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {formatText('Original Price (PKR) *', 'اصل قیمت (PKR) *', 'Original Price (PKR) *')}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50"
                    value={itemOriginalPrice}
                    onChange={(e) => setItemOriginalPrice(e.target.value)}
                    placeholder="8500"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1">
                    {formatText('Sale Price (PKR) *', 'سیل قیمت (PKR) *', 'Sale Price (PKR) *')}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50"
                    value={itemSalePrice}
                    onChange={(e) => setItemSalePrice(e.target.value)}
                    placeholder="6500"
                    className="w-full px-3 py-2 text-xs bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Discount Calculator Preview */}
              {(() => {
                const orig = parseFloat(itemOriginalPrice);
                const sale = parseFloat(itemSalePrice);
                if (!isNaN(orig) && !isNaN(sale) && orig > 0 && sale <= orig) {
                  const discount = Math.round(((orig - sale) / orig) * 100);
                  const savings = orig - sale;
                  return (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                      <span className="text-emerald-900 font-bold flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-emerald-600" />
                        Discount: {discount}% OFF
                      </span>
                      <span className="text-emerald-800 font-mono text-[11px] font-bold">
                        Bachat: PKR {savings.toLocaleString()}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {formatText('Description (Fabric / Detailing)', 'تفصیل (کپڑا / کڑھائی)', 'Description')}
                </label>
                <textarea
                  rows={2}
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Pure Swiss lawn with hand-crafted neck embroidery..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white resize-none"
                />
              </div>

              {/* Photo Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {formatText('Select Garment Photo', 'تصویر منتخب کریں', 'Garment Photo')}
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[
                    '/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg',
                    '/src/assets/images/homepage_ladies_teal_formal_1791433341529.jpg',
                    '/src/assets/images/homepage_kids_blue_suit_1791433355604.jpg',
                    '/src/assets/images/homepage_party_magenta_lehenga_1791433369559.jpg',
                  ].map((imgSrc) => (
                    <button
                      key={imgSrc}
                      type="button"
                      onClick={() => setItemImageUrl(imgSrc)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        itemImageUrl === imgSrc
                          ? 'border-blue-600 ring-2 ring-blue-300'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img src={imgSrc} alt="Preset garment" className="w-full h-full object-cover" />
                      {itemImageUrl === imgSrc && (
                        <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={itemImageUrl}
                  onChange={(e) => setItemImageUrl(e.target.value)}
                  placeholder="Or enter custom image URL..."
                  className="w-full px-3 py-1.5 text-[11px] bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-mono"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  {formatText('Cancel', 'منسوخ', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingItemId ? 'Update Item & Price' : 'Save Item with Price'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {itemToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-rose-100 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {formatText('Delete Item with Price?', 'آئٹم اور قیمت ڈیلیٹ کریں؟', 'Delete Item with Price?')}
                </h3>
                <p className="text-xs text-slate-500">
                  {formatText('This will permanently delete this item from the catalog.', 'یہ عمل اس آئٹم کو کیٹلاگ سے مستقل ڈیلیٹ کر دے گا۔', 'This will delete this item from the catalog.')}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
              <img
                src={itemToDelete.image_url}
                alt={itemToDelete.title}
                className="w-12 h-12 rounded-lg object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{itemToDelete.title}</p>
                <p className="text-[11px] text-emerald-700 font-mono font-bold mt-0.5">
                  PKR {itemToDelete.sale_price.toLocaleString('en-PK')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {formatText('Cancel', 'منسوخ', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteItem(itemToDelete.id)}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{formatText('Yes, Delete Item', 'ہاں، ڈیلیٹ کریں', 'Yes, Delete Item')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
