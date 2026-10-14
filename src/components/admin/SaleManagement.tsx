import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { SaleItem } from '../../types';
import {
  fetchSaleItems,
  upsertSaleItem,
  deleteSaleItem,
  uploadManagementImage,
} from '../../lib/supabase';
import {
  Tag,
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
  DollarSign,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const SaleManagement: React.FC = () => {
  const { language, formatText } = useLanguage();
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'ladies' | 'kids'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SaleItem | null>(null);
  const [previewItem, setPreviewItem] = useState<SaleItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [titleUrdu, setTitleUrdu] = useState('');
  const [titleRomanUrdu, setTitleRomanUrdu] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionUrdu, setDescriptionUrdu] = useState('');
  const [descriptionRomanUrdu, setDescriptionRomanUrdu] = useState('');
  const [category, setCategory] = useState<'ladies' | 'kids'>('ladies');
  const [originalPrice, setOriginalPrice] = useState<string>('6000');
  const [salePrice, setSalePrice] = useState<string>('4500');
  const [imageUrl, setImageUrl] = useState<string>('/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchSaleItems(false);
      setSaleItems(data);
    } catch (err) {
      console.error('Failed to load sale items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculated discount percentage in real time
  const liveDiscount = useMemo(() => {
    const orig = parseFloat(originalPrice) || 0;
    const sale = parseFloat(salePrice) || 0;
    if (orig > 0 && sale <= orig && sale >= 0) {
      return Math.round(((orig - sale) / orig) * 100);
    }
    return 0;
  }, [originalPrice, salePrice]);

  // Filtered List
  const filteredItems = useMemo(() => {
    return saleItems.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.title_urdu && item.title_urdu.includes(q)) ||
        (item.title_roman_urdu && item.title_roman_urdu.toLowerCase().includes(q));

      const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.is_active) ||
        (statusFilter === 'inactive' && !item.is_active);

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [saleItems, searchQuery, categoryFilter, statusFilter]);

  // Open Modal for Create
  const handleOpenCreate = () => {
    setEditingItem(null);
    setTitle('');
    setTitleUrdu('');
    setTitleRomanUrdu('');
    setDescription('');
    setDescriptionUrdu('');
    setDescriptionRomanUrdu('');
    setCategory('ladies');
    setOriginalPrice('6500');
    setSalePrice('4850');
    setImageUrl('/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg');
    setIsActive(true);
    setIsFeatured(false);
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate('');
    setDisplayOrder(saleItems.length + 1);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (item: SaleItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setTitleUrdu(item.title_urdu || '');
    setTitleRomanUrdu(item.title_roman_urdu || '');
    setDescription(item.description || '');
    setDescriptionUrdu(item.description_urdu || '');
    setDescriptionRomanUrdu(item.description_roman_urdu || '');
    setCategory(item.category);
    setOriginalPrice(String(item.original_price));
    setSalePrice(String(item.sale_price));
    setImageUrl(item.image_url);
    setIsActive(item.is_active);
    setIsFeatured(item.is_featured);
    setStartDate(item.start_date || '');
    setEndDate(item.end_date || '');
    setDisplayOrder(item.display_order);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await uploadManagementImage(file, 'sale');
      if (res.url) {
        setImageUrl(res.url);
      } else if (res.error) {
        setFormError(res.error);
      }
    } catch (err: any) {
      setFormError(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  // Save Item
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const orig = parseFloat(originalPrice);
    const sale = parseFloat(salePrice);

    if (isNaN(orig) || orig < 0) {
      setFormError(formatText('Original price must be a valid non-negative number.', 'اصل قیمت صفر یا اس سے زیادہ ہونی چاہیے۔', 'Original price zero ya us se zyada honi chahiye.'));
      return;
    }
    if (isNaN(sale) || sale < 0) {
      setFormError(formatText('Sale price must be a valid non-negative number.', 'سیل قیمت صفر یا اس سے زیادہ ہونی چاہیے۔', 'Sale price zero ya us se zyada honi chahiye.'));
      return;
    }
    if (sale > orig) {
      setFormError(formatText('Sale price cannot exceed the original price.', 'سیل قیمت اصل قیمت سے زیادہ نہیں ہو سکتی۔', 'Sale price original price se zyada nahi ho sakti.'));
      return;
    }
    if (!title.trim()) {
      setFormError(formatText('Please provide a title for the offer.', 'برائے مہربانی آفر کا عنوان درج کریں۔', 'Baraye meherbani offer ka title darj karein.'));
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload: Partial<SaleItem> = {
      id: editingItem ? editingItem.id : undefined,
      title: title.trim(),
      title_urdu: titleUrdu.trim() || undefined,
      title_roman_urdu: titleRomanUrdu.trim() || undefined,
      description: description.trim(),
      description_urdu: descriptionUrdu.trim() || undefined,
      description_roman_urdu: descriptionRomanUrdu.trim() || undefined,
      category,
      original_price: orig,
      sale_price: sale,
      discount_percentage: liveDiscount,
      image_url: imageUrl,
      is_active: isActive,
      is_featured: isFeatured,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      display_order: displayOrder,
    };

    const res = await upsertSaleItem(payload);
    setSaving(false);

    if (res.error && !res.data) {
      setFormError(res.error);
    } else {
      setIsModalOpen(false);
      loadData();
    }
  };

  // Delete Item
  const handleDelete = async (id: string) => {
    await deleteSaleItem(id);
    setDeleteConfirmId(null);
    loadData();
  };

  // Toggle Active
  const handleToggleActive = async (item: SaleItem) => {
    await upsertSaleItem({ ...item, is_active: !item.is_active });
    loadData();
  };

  return (
    <div className="space-y-6" dir={language === 'ur' ? 'rtl' : 'ltr'}>
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white border border-blue-100 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Tag className="w-4 h-4" />
            </span>
            <h3 className="text-base font-serif-display font-semibold text-blue-950">
              {formatText('Sale & Price Management', 'سیل اور قیمتوں کا انتظام', 'Sale Aur Prices Ka Intizam')}
            </h3>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {formatText(
              'Manage special offers, product discounts (PKR), categories, and scheduled sale banners.',
              'سیل آفرز، ڈسکاؤنٹ کی قیمتیں (روپے)، کیٹیگریز اور شیڈول سیل کا انتظام کریں۔',
              'Special offers, product discounts (PKR), categories aur scheduled sale banners ka intizam karein.'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{formatText('Add Sale Item', 'نیا سیل آئٹم شامل کریں', 'Naya Sale Item Add Karein')}</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-blue-100 rounded-xl shadow-2xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {formatText('Total Offers', 'کل آفرز', 'Total Offers')}
          </p>
          <p className="text-xl font-serif-display font-bold text-blue-950 mt-0.5">
            {saleItems.length}
          </p>
        </div>

        <div className="p-3 bg-white border border-blue-100 rounded-xl shadow-2xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            {formatText('Active Live', 'فعال لائیو', 'Active Live')}
          </p>
          <p className="text-xl font-serif-display font-bold text-emerald-800 mt-0.5">
            {saleItems.filter((i) => i.is_active).length}
          </p>
        </div>

        <div className="p-3 bg-white border border-blue-100 rounded-xl shadow-2xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">
            {formatText('Ladies Offers', 'خواتین آفرز', 'Ladies Offers')}
          </p>
          <p className="text-xl font-serif-display font-bold text-blue-950 mt-0.5">
            {saleItems.filter((i) => i.category === 'ladies').length}
          </p>
        </div>

        <div className="p-3 bg-white border border-blue-100 rounded-xl shadow-2xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
            {formatText('Kids Offers', 'بچوں کی آفرز', 'Kids Offers')}
          </p>
          <p className="text-xl font-serif-display font-bold text-amber-800 mt-0.5">
            {saleItems.filter((i) => i.category === 'kids').length}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white border border-blue-100 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={formatText('Search sale items by name...', 'آئٹم کے نام سے تلاش کریں...', 'Sale items naam se talash karein...')}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none"
          >
            <option value="all">{formatText('All Categories', 'تمام کیٹیگریز', 'Tamam Categories')}</option>
            <option value="ladies">{formatText('Ladies', 'خواتین', 'Ladies')}</option>
            <option value="kids">{formatText('Kids', 'بچے', 'Kids')}</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none"
          >
            <option value="all">{formatText('All Statuses', 'تمام اسٹیٹس', 'Tamam Status')}</option>
            <option value="active">{formatText('Active', 'فعال', 'Active')}</option>
            <option value="inactive">{formatText('Inactive', 'غیر فعال', 'Inactive')}</option>
          </select>

          <button
            type="button"
            onClick={loadData}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-blue-50/70 border-b border-blue-100 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Item &amp; Image</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Original Price</th>
                <th className="py-3 px-3">Sale Price</th>
                <th className="py-3 px-3">Discount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    {formatText('No sale items found matching your filters.', 'کوئی سیل آئٹم نہیں ملا۔', 'Koi sale item nahi mila.')}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                    {/* Item Title & Thumb */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-12 h-12 rounded-lg object-cover border border-blue-100 shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-blue-950 line-clamp-1">{item.title}</p>
                          {item.title_urdu && (
                            <p className="text-[10px] text-slate-500 line-clamp-1">{item.title_urdu}</p>
                          )}
                          {item.title_roman_urdu && (
                            <p className="text-[10px] text-blue-700 line-clamp-1 font-mono">{item.title_roman_urdu}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                        {item.category === 'kids' ? 'Kids' : 'Ladies'}
                      </span>
                    </td>

                    {/* Original Price */}
                    <td className="py-3 px-3 font-mono text-slate-600 line-through">
                      PKR {item.original_price.toLocaleString('en-PK')}
                    </td>

                    {/* Sale Price */}
                    <td className="py-3 px-3 font-mono font-bold text-blue-950">
                      PKR {item.sale_price.toLocaleString('en-PK')}
                    </td>

                    {/* Discount Badge */}
                    <td className="py-3 px-3">
                      {item.discount_percentage && item.discount_percentage > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                          {item.discount_percentage}% OFF
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">0%</span>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          item.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {item.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          className="p-1.5 hover:bg-blue-100 text-blue-700 rounded transition-colors cursor-pointer"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 hover:bg-blue-100 text-blue-700 rounded transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1.5 hover:bg-rose-100 text-rose-600 rounded transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden flex flex-col my-auto max-h-[92vh]">
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-semibold text-blue-950">
                  {editingItem ? formatText('Edit Sale Item', 'سیل آئٹم تبدیل کریں', 'Sale Item Edit Karein') : formatText('Add New Sale Item', 'نیا سیل آئٹم شامل کریں', 'Naya Sale Item Add Karein')}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title Fields (English, Urdu, Roman Urdu) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Product / Offer Name *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="English title (e.g. Peach Embroidered 3-Piece Stitched Suit)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <input
                    type="text"
                    value={titleUrdu}
                    onChange={(e) => setTitleUrdu(e.target.value)}
                    placeholder="اردو عنوان (مثلاً پیچ ریشم کڑھائی سوٹ)"
                    dir="rtl"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    value={titleRomanUrdu}
                    onChange={(e) => setTitleRomanUrdu(e.target.value)}
                    placeholder="Roman Urdu (e.g. Peach Resham Karhai Suit)"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Description Fields */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="English description..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <textarea
                    rows={2}
                    value={descriptionUrdu}
                    onChange={(e) => setDescriptionUrdu(e.target.value)}
                    placeholder="اردو تفصیل..."
                    dir="rtl"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  />
                  <textarea
                    rows={2}
                    value={descriptionRomanUrdu}
                    onChange={(e) => setDescriptionRomanUrdu(e.target.value)}
                    placeholder="Roman Urdu tafseel..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Category, Original Price, Sale Price, Live Discount Calculation */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as 'ladies' | 'kids')}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white outline-none"
                  >
                    <option value="ladies">Ladies</option>
                    <option value="kids">Kids</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Original Price (PKR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Sale Price (PKR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Calculated Discount
                  </label>
                  <div className="px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-center font-bold text-amber-900 font-mono">
                    {liveDiscount}% OFF
                  </div>
                </div>
              </div>

              {/* Image Upload / URL */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Product Image URL or File Upload *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/src/assets/images/... or hosted URL"
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-[11px] outline-none"
                  />
                  <label className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 font-medium rounded-lg cursor-pointer flex items-center gap-1 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Dates & Statuses */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-700">Active (Visible on Website)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-700">Mark as Featured</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {formatText('Cancel', 'منسوخ کریں', 'Mansookh Karein')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {saving
                    ? formatText('Saving...', 'محفوظ ہو رہا ہے...', 'Mehfooz Ho Raha Hai...')
                    : formatText('Save Sale Item', 'سیل آئٹم محفوظ کریں', 'Sale Item Mehfooz Karein')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-sm w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-blue-100">
            <img
              src={previewItem.image_url}
              alt={previewItem.title}
              className="w-full aspect-4/3 object-cover"
            />
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase text-blue-700">
                  {previewItem.category === 'kids' ? 'Kids' : 'Ladies'}
                </span>
                {previewItem.discount_percentage && previewItem.discount_percentage > 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-white">
                    {previewItem.discount_percentage}% OFF
                  </span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-blue-950 mb-1">{previewItem.title}</h4>
              <p className="text-xs text-slate-500 mb-3">{previewItem.description}</p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-xs text-slate-400 line-through font-mono">
                  PKR {previewItem.original_price}
                </span>
                <span className="text-base font-bold text-blue-950 font-mono">
                  PKR {previewItem.sale_price}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-sm w-full bg-white rounded-2xl p-5 shadow-2xl border border-rose-200 text-center">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              {formatText('Confirm Delete Sale Item', 'سیل آئٹم حذف کرنے کی تصدیق', 'Sale Item Delete Karne Ki Tasdeeq')}
            </h4>
            <p className="text-xs text-slate-600 mb-4">
              {formatText(
                'Are you sure you want to remove this sale offer from the website?',
                'کیا آپ واقعی اس سیل آفر کو ویب سائٹ سے ہٹانا چاہتے ہیں؟',
                'Kya aap waqai is sale offer ko website se hatana chahte hain?'
              )}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                {formatText('Cancel', 'منسوخ کریں', 'Mansookh')}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
              >
                {formatText('Yes, Delete', 'ہاں، حذف کریں', 'Haan, Delete Karein')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
