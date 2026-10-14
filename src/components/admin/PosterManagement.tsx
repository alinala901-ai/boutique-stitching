import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Poster, PosterCategory } from '../../types';
import {
  fetchPosters,
  upsertPoster,
  deletePoster,
  uploadManagementImage,
} from '../../lib/supabase';
import {
  getYouTubeVideoId,
  isDirectVideoUrl,
  saveVideoConfig,
} from '../../config/video';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Sparkles,
  Image as ImageIcon,
  Film,
  Play,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  X,
  Upload,
} from 'lucide-react';

const POSTER_CATEGORIES: PosterCategory[] = [
  'Sale',
  'New Arrival',
  'Eid Collection',
  'Bridal',
  'Party Wear',
  'Ladies',
  'Kids',
  'Special Offers',
  'Custom Designs',
];

const PRESET_BOUTIQUE_IMAGES = [
  { url: '/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg', label: 'Festive Peach' },
  { url: '/src/assets/images/bridal_couture_stitching_1791431932649.jpg', label: 'Bridal Couture' },
  { url: '/src/assets/images/homepage_ladies_teal_formal_1791433341529.jpg', label: 'Teal Formal' },
  { url: '/src/assets/images/homepage_party_magenta_lehenga_1791433369559.jpg', label: 'Magenta Lehenga' },
  { url: '/src/assets/images/homepage_kids_blue_suit_1791433355604.jpg', label: 'Kids Kurta' },
  { url: '/src/assets/images/craftsmanship_custom_tailoring_1791431948318.jpg', label: 'Atelier Tailoring' },
];

interface PosterManagementProps {
  initialOpenAdd?: boolean;
}

export const PosterManagement: React.FC<PosterManagementProps> = ({ initialOpenAdd = false }) => {
  const { language, formatText } = useLanguage();
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoster, setEditingPoster] = useState<Poster | null>(null);
  const [previewPoster, setPreviewPoster] = useState<Poster | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form Fields
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [title, setTitle] = useState('');
  const [titleUrdu, setTitleUrdu] = useState('');
  const [titleRomanUrdu, setTitleRomanUrdu] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionUrdu, setDescriptionUrdu] = useState('');
  const [descriptionRomanUrdu, setDescriptionRomanUrdu] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState('');
  const [category, setCategory] = useState<PosterCategory>('Special Offers');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const loadPostersData = async () => {
    setLoading(true);
    try {
      const data = await fetchPosters();
      setPosters(data);
    } catch (err) {
      console.error('Failed to load posters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPostersData();
  }, []);

  const openAddModal = () => {
    setEditingPoster(null);
    setMediaType('image');
    setTitle('');
    setTitleUrdu('');
    setTitleRomanUrdu('');
    setDescription('');
    setDescriptionUrdu('');
    setDescriptionRomanUrdu('');
    setImageUrl('/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg');
    setVideoUrl('');
    setVideoThumbnailUrl('/src/assets/images/craftsmanship_custom_tailoring_1791431948318.jpg');
    setCategory('Special Offers');
    setIsActive(true);
    setIsFeatured(false);
    setDisplayOrder(posters.length + 1);
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate('');
    setFormError(null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (initialOpenAdd) {
      openAddModal();
    }
  }, [initialOpenAdd]);

  useEffect(() => {
    const handleTrigger = () => openAddModal();
    window.addEventListener('open_add_poster_modal', handleTrigger);
    return () => window.removeEventListener('open_add_poster_modal', handleTrigger);
  }, [posters.length]);

  const openEditModal = (poster: Poster) => {
    setEditingPoster(poster);
    setMediaType(poster.media_type || (poster.video_url ? 'video' : 'image'));
    setTitle(poster.title);
    setTitleUrdu(poster.title_urdu || '');
    setTitleRomanUrdu(poster.title_roman_urdu || '');
    setDescription(poster.description || '');
    setDescriptionUrdu(poster.description_urdu || '');
    setDescriptionRomanUrdu(poster.description_roman_urdu || '');
    setImageUrl(poster.image_url);
    setVideoUrl(poster.video_url || '');
    setVideoThumbnailUrl(poster.video_thumbnail_url || poster.image_url);
    setCategory(poster.category);
    setIsActive(poster.is_active);
    setIsFeatured(poster.is_featured);
    setDisplayOrder(poster.display_order);
    setStartDate(poster.start_date ? poster.start_date.slice(0, 10) : '');
    setEndDate(poster.end_date ? poster.end_date.slice(0, 10) : '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadManagementImage(file, 'posters');
      if (res.url) {
        if (mediaType === 'video') {
          setVideoThumbnailUrl(res.url);
        } else {
          setImageUrl(res.url);
        }
      } else if (res.error) {
        setFormError(res.error);
      }
    } catch (err: any) {
      setFormError(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSavePoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError(formatText('Title is required.', 'عنوان درج کرنا ضروری ہے۔', 'Title darj karna zaroori hai.'));
      return;
    }

    if (mediaType === 'video' && !videoUrl.trim()) {
      setFormError(formatText('Video URL is required for video media type.', 'ویڈیو میڈیا کے لیے ویڈیو لنک درج کریں۔', 'Video media ke liye video URL zaroori hai.'));
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload: Partial<Poster> = {
      id: editingPoster ? editingPoster.id : undefined,
      title: title.trim(),
      title_urdu: titleUrdu.trim() || undefined,
      title_roman_urdu: titleRomanUrdu.trim() || undefined,
      description: description.trim(),
      description_urdu: descriptionUrdu.trim() || undefined,
      description_roman_urdu: descriptionRomanUrdu.trim() || undefined,
      media_type: mediaType,
      image_url: mediaType === 'video' ? (videoThumbnailUrl || imageUrl) : imageUrl,
      video_url: mediaType === 'video' ? videoUrl.trim() : undefined,
      video_thumbnail_url: mediaType === 'video' ? (videoThumbnailUrl || imageUrl) : undefined,
      category,
      is_active: isActive,
      is_featured: isFeatured,
      display_order: displayOrder,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    };

    const res = await upsertPoster(payload);
    setSaving(false);

    if (res.error && !res.poster) {
      setFormError(res.error);
    } else {
      // If it's an active video, synchronize with video config for immediate homepage display
      if (mediaType === 'video' && isActive) {
        saveVideoConfig({
          videoUrl: videoUrl.trim(),
          posterUrl: videoThumbnailUrl || imageUrl,
          title: title.trim(),
          subtitle: description.trim() || undefined,
          isActive: true,
        });
      }

      setIsModalOpen(false);
      loadPostersData();
    }
  };

  const handleDeletePoster = async (id: string) => {
    await deletePoster(id);
    setDeleteConfirmId(null);
    loadPostersData();
  };

  const handleToggleActive = async (poster: Poster) => {
    await upsertPoster({ ...poster, is_active: !poster.is_active });
    loadPostersData();
  };

  const filteredPosters = posters.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.title_urdu && p.title_urdu.includes(q)) ||
      (p.title_roman_urdu && p.title_roman_urdu.toLowerCase().includes(q));

    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesType =
      mediaTypeFilter === 'all' ||
      (mediaTypeFilter === 'video' && (p.media_type === 'video' || !!p.video_url)) ||
      (mediaTypeFilter === 'image' && p.media_type !== 'video' && !p.video_url);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.is_active) ||
      (statusFilter === 'inactive' && !p.is_active);

    return matchesSearch && matchesCat && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6" dir={language === 'ur' ? 'rtl' : 'ltr'}>
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white border border-blue-100 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <ImageIcon className="w-4 h-4" />
            </span>
            <h3 className="text-base font-serif-display font-semibold text-blue-950">
              {formatText('Poster & Video Management', 'پوسٹر اور ویڈیو کا انتظام', 'Poster Aur Video Ka Intizam')}
            </h3>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {formatText(
              'Publish promotional posters, seasonal Eid/Bridal campaign graphics, and boutique video showcases.',
              'سیل پوسٹرز، عید و برائیڈل کیمپین اور بوتیک ویڈیوز کا مکمل انتظام کریں۔',
              'Sale posters, Eid/Bridal campaign graphics aur boutique video showcases manage karein.'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{formatText('Add Media / Poster', 'نیا پوسٹر یا ویڈیو شامل کریں', 'Naya Poster / Video Add Karein')}</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-blue-100 rounded-xl shadow-2xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {formatText('Total Media', 'کل میڈیا', 'Total Media')}
          </p>
          <p className="text-xl font-serif-display font-bold text-blue-950 mt-0.5">
            {posters.length}
          </p>
        </div>

        <div className="p-3 bg-white border border-blue-100 rounded-xl shadow-2xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            {formatText('Active Live', 'فعال پوسٹرز', 'Active Live')}
          </p>
          <p className="text-xl font-serif-display font-bold text-emerald-800 mt-0.5">
            {posters.filter((p) => p.is_active).length}
          </p>
        </div>

        <div className="p-3 bg-white border border-blue-100 rounded-xl shadow-2xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">
            {formatText('Image Posters', 'تصویری پوسٹرز', 'Image Posters')}
          </p>
          <p className="text-xl font-serif-display font-bold text-blue-950 mt-0.5">
            {posters.filter((p) => p.media_type !== 'video' && !p.video_url).length}
          </p>
        </div>

        <div className="p-3 bg-white border border-blue-100 rounded-xl shadow-2xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
            {formatText('Video Showcases', 'بوتیک ویڈیوز', 'Video Showcases')}
          </p>
          <p className="text-xl font-serif-display font-bold text-amber-800 mt-0.5">
            {posters.filter((p) => p.media_type === 'video' || !!p.video_url).length}
          </p>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white border border-blue-100 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={formatText('Search media by title...', 'عنوان سے تلاش کریں...', 'Title se search karein...')}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Media Type Filter */}
          <select
            value={mediaTypeFilter}
            onChange={(e) => setMediaTypeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none"
          >
            <option value="all">{formatText('All Media Types', 'تمام میڈیا', 'All Media')}</option>
            <option value="image">{formatText('Images Only', 'صرف تصاویر', 'Images Only')}</option>
            <option value="video">{formatText('Videos Only', 'صرف ویڈیوز', 'Videos Only')}</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none"
          >
            <option value="all">{formatText('All Categories', 'تمام کیٹیگریز', 'Tamam Categories')}</option>
            {POSTER_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none"
          >
            <option value="all">{formatText('All Statuses', 'تمام اسٹیٹس', 'Tamam Status')}</option>
            <option value="active">{formatText('Active', 'فعال', 'Active')}</option>
            <option value="inactive">{formatText('Inactive', 'غیر فعال', 'Inactive')}</option>
          </select>

          <button
            type="button"
            onClick={loadPostersData}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid of Posters & Videos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPosters.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-blue-100 rounded-xl">
            {formatText('No posters or videos found.', 'کوئی پوسٹر یا ویڈیو نہیں ملی۔', 'Koi poster ya video nahi mili.')}
          </div>
        ) : (
          filteredPosters.map((poster) => {
            const isVideo = poster.media_type === 'video' || !!poster.video_url;

            return (
              <div
                key={poster.id}
                className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col group"
              >
                {/* Media Thumbnail Container */}
                <div className="relative aspect-16/9 bg-slate-950 overflow-hidden">
                  <img
                    src={poster.video_thumbnail_url || poster.image_url}
                    alt={poster.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/30" />

                  {/* Badges */}
                  <div className="absolute top-2 inset-x-2 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-950/80 backdrop-blur-xs text-white border border-white/20">
                      {poster.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        poster.is_active
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-400 text-white'
                      }`}
                    >
                      {poster.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>

                  {/* Play Indicator if Video */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 fill-current translate-x-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Quick Action Overlay */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setPreviewPoster(poster)}
                      className="px-2.5 py-1 bg-white/95 text-blue-950 rounded text-[10px] font-bold shadow flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{formatText('Preview', 'پیش منظر', 'Preview')}</span>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {isVideo ? (
                        <Film className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                      <h4 className="text-sm font-semibold text-blue-950 line-clamp-1">
                        {poster.title}
                      </h4>
                    </div>

                    {poster.title_urdu && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mb-0.5" dir="rtl">
                        {poster.title_urdu}
                      </p>
                    )}

                    {poster.title_roman_urdu && (
                      <p className="text-[11px] text-blue-700 font-mono line-clamp-1 mb-1">
                        {poster.title_roman_urdu}
                      </p>
                    )}

                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                      {poster.description}
                    </p>
                  </div>

                  {/* Actions & Dates */}
                  <div className="pt-3 mt-3 border-t border-blue-50 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(poster)}
                      className="text-[10px] font-semibold text-slate-500 hover:text-blue-700 cursor-pointer"
                    >
                      {poster.is_active ? 'Click to Deactivate' : 'Click to Activate'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(poster)}
                        className="p-1.5 hover:bg-blue-100 text-blue-700 rounded transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(poster.id)}
                        className="p-1.5 hover:bg-rose-100 text-rose-600 rounded transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
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
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-semibold text-blue-950">
                  {editingPoster
                    ? formatText('Edit Poster / Video', 'پوسٹر یا ویڈیو تبدیل کریں', 'Poster / Video Edit Karein')
                    : formatText('Add New Poster or Video', 'نیا پوسٹر یا ویڈیو شامل کریں', 'Naya Poster Ya Video Add Karein')}
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

            <form onSubmit={handleSavePoster} className="p-5 space-y-4 overflow-y-auto text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Media Type Switcher */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-blue-950 block">Media Type</span>
                  <span className="text-[11px] text-slate-500">
                    Choose whether you are publishing an image poster or video showcase.
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-blue-200">
                  <button
                    type="button"
                    onClick={() => setMediaType('image')}
                    className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                      mediaType === 'image'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType('video')}
                    className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                      mediaType === 'video'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Video</span>
                  </button>
                </div>
              </div>

              {/* Title Fields (English, Urdu, Roman Urdu) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Title (English) *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Eid Festive Luxury Stitched Collection"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <input
                    type="text"
                    value={titleUrdu}
                    onChange={(e) => setTitleUrdu(e.target.value)}
                    placeholder="اردو عنوان (مثلاً عید فیسٹیو کلیکشن)"
                    dir="rtl"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    value={titleRomanUrdu}
                    onChange={(e) => setTitleRomanUrdu(e.target.value)}
                    placeholder="Roman Urdu title (e.g. Eid Festive Silai Collection)"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Video URL & Thumbnail if video type */}
              {mediaType === 'video' ? (
                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-amber-950">
                        Video Source URL (YouTube link or MP4 file) *
                      </label>
                      {videoUrl && (
                        <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                          {getYouTubeVideoId(videoUrl)
                            ? `YouTube ID: ${getYouTubeVideoId(videoUrl)}`
                            : isDirectVideoUrl(videoUrl)
                            ? 'MP4 Direct Stream'
                            : 'Custom URL'}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... or https://domain.com/video.mp4"
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-white outline-none"
                    />
                    <p className="text-[11px] text-amber-800/80 mt-1">
                      Supported formats: YouTube share/watch links or direct MP4 stream URL.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-amber-950 block mb-1">
                      Video Poster / Thumbnail Image URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={videoThumbnailUrl}
                        onChange={(e) => setVideoThumbnailUrl(e.target.value)}
                        placeholder="/src/assets/images/... or uploaded URL"
                        className="flex-1 px-3 py-1.5 border border-amber-300 rounded-lg bg-white font-mono text-[11px] outline-none"
                      />
                      <label className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 font-medium rounded-lg cursor-pointer flex items-center gap-1 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                /* Poster Image URL & Upload */
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Poster Image URL or Upload *
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
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Preset Quick Select Thumbnails */}
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-500 font-medium block mb-1">
                      {formatText('Or select high-res boutique photography preset:', 'یا بوتیک کی تیار شدہ تصاویر میں سے منتخب کریں:', 'Ya boutique preset photos mein se select karein:')}
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {PRESET_BOUTIQUE_IMAGES.map((preset) => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => setImageUrl(preset.url)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] border shrink-0 transition-all cursor-pointer ${
                            imageUrl === preset.url
                              ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-4 h-4 rounded object-cover"
                          />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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

              {/* Category & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PosterCategory)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white outline-none"
                  >
                    {POSTER_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              {/* Schedule Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              {/* Active & Featured Toggles */}
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
                  <span className="font-semibold text-slate-700">Featured</span>
                </label>
              </div>

              {/* Action Buttons */}
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
                    : formatText('Save Media', 'محفوظ کریں', 'Mehfooz Karein')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewPoster && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-blue-100 flex flex-col">
            <div className="relative aspect-video w-full bg-slate-950">
              {previewPoster.media_type === 'video' || previewPoster.video_url ? (
                previewPoster.video_url && getYouTubeVideoId(previewPoster.video_url) ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${getYouTubeVideoId(previewPoster.video_url)}?autoplay=1`}
                    title={previewPoster.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <video
                    src={previewPoster.video_url}
                    poster={previewPoster.video_thumbnail_url || previewPoster.image_url}
                    controls
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <img
                  src={previewPoster.image_url}
                  alt={previewPoster.title}
                  className="w-full h-full object-cover"
                />
              )}

              <button
                type="button"
                onClick={() => setPreviewPoster(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 inline-block mb-2">
                {previewPoster.category}
              </span>
              <h3 className="text-base font-semibold text-blue-950 mb-1">
                {previewPoster.title}
              </h3>
              <p className="text-xs text-slate-600 mb-4">{previewPoster.description}</p>
              <button
                type="button"
                onClick={() => setPreviewPoster(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
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
              {formatText('Confirm Delete Media', 'حذف کرنے کی تصدیق کریں', 'Delete Karne Ki Tasdeeq')}
            </h4>
            <p className="text-xs text-slate-600 mb-4">
              {formatText(
                'Are you sure you want to remove this poster / video from the system?',
                'کیا آپ واقعی اس میڈیا کو سسٹم سے ہٹانا چاہتے ہیں؟',
                'Kya aap waqai is media ko system se hatana chahte hain?'
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
                onClick={() => handleDeletePoster(deleteConfirmId)}
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
