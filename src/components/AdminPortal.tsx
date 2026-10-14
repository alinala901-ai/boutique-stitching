import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  StitchingOrder,
  OrderStatus,
  OrderInternalNote,
  CustomerDirectoryItem,
  Poster,
  BoutiqueDesign,
  BoutiqueServiceItem,
  ContactInquiry,
  CustomerReview,
  SalaryRecord,
  SaleItem,
} from '../types';
import {
  fetchOrders,
  updateOrderStatus,
  fetchOrderNotes,
  addOrderNote,
  fetchCustomerDirectory,
  getSecureImageUrl,
  getSupabaseConfig,
  saveCustomSupabaseConfig,
  resetSupabaseConfig,
  testSupabaseConnection,
  fetchPosters,
  fetchBoutiqueDesigns,
  fetchBoutiqueServices,
  fetchContactInquiries,
  fetchCustomerReviews,
  fetchSalaryRecords,
  fetchSaleItems,
  upsertSaleItem,
  deleteSaleItem,
} from '../lib/supabase';
import { BOUTIQUE_MASTER_SQL } from '../lib/supabaseMasterSql';
import {
  formatStaffOrderConfirmationMessage,
  formatStaffMeasurementsReviewMessage,
  formatStaffOrderReadyMessage,
  formatStaffGeneralInquiryMessage,
  getCustomerDirectWhatsAppUrl,
  WHATSAPP_CONFIG,
} from '../config/whatsapp';
import { PosterManagement } from './admin/PosterManagement';
import { StitchingManagement } from './admin/StitchingManagement';
import { DesignServicesManagement } from './admin/DesignServicesManagement';
import { SaleManagement } from './admin/SaleManagement';
import { SalaryManagement } from './admin/SalaryManagement';
import { InquiriesManagement } from './admin/InquiriesManagement';
import { ReviewsManagement } from './admin/ReviewsManagement';
import {
  getVideoConfig,
  saveVideoConfig,
  VideoConfig,
  getYouTubeVideoId,
  isDirectVideoUrl,
} from '../config/video';
import {
  X,
  Shield,
  Film,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Eye,
  CheckCircle2,
  Copy,
  ExternalLink,
  Lock,
  Mail,
  AlertCircle,
  FileText,
  UserCheck,
  MessageCircle,
  Phone,
  Ruler,
  Users,
  Settings,
  LayoutDashboard,
  Scissors,
  Check,
  Send,
  Sparkles,
  ArrowRight,
  Maximize2,
  ChevronRight,
  LogOut,
  Calendar,
  AlertTriangle,
  Image,
  CreditCard,
  MessageSquare,
  Star,
  Tag,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Percent,
  Unlock,
  Database,
  Key,
  Activity,
  FileCode,
  Terminal,
} from 'lucide-react';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminTab =
  | 'dashboard'
  | 'posters'
  | 'stitching'
  | 'designs'
  | 'sales'
  | 'salaries'
  | 'inquiries'
  | 'reviews'
  | 'customers'
  | 'orders'
  | 'measurements'
  | 'whatsapp'
  | 'settings';

export const AdminPortal: React.FC<AdminPortalProps> = ({ isOpen, onClose }) => {
  const { language, t, formatText } = useLanguage();
  const { user, profile, isStaff, isAdmin, userRole, signIn, signOut } = useAuth();

  // Instant Staff & Dashboard Access: true by default so admin never blocks the user
  const [isDemoBypassed, setIsDemoBypassed] = useState<boolean>(true);
  const hasAccess = isStaff || isDemoBypassed;

  // Navigation State
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Staff Login Form State
  const [loginEmail, setLoginEmail] = useState('staff@boutiquestitching.com');
  const [loginPassword, setLoginPassword] = useState('admin123456');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Core Atelier Data State
  const [orders, setOrders] = useState<StitchingOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<StitchingOrder | null>(null);
  const [customers, setCustomers] = useState<CustomerDirectoryItem[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [posters, setPosters] = useState<Poster[]>([]);
  const [designs, setDesigns] = useState<BoutiqueDesign[]>([]);
  const [services, setServices] = useState<BoutiqueServiceItem[]>([]);
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [loadingSaleItems, setLoadingSaleItems] = useState(false);

  // Dashboard Items & Price Manager Quick Controls (Add / Edit / Delete with Price)
  const [isPriceItemModalOpen, setIsPriceItemModalOpen] = useState(false);
  const [priceItemTitle, setPriceItemTitle] = useState('');
  const [priceItemCategory, setPriceItemCategory] = useState<'ladies' | 'kids'>('ladies');
  const [priceItemOriginalPrice, setPriceItemOriginalPrice] = useState('6500');
  const [priceItemSalePrice, setPriceItemSalePrice] = useState('4800');
  const [priceItemImageUrl, setPriceItemImageUrl] = useState('/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg');
  const [editingPriceItemId, setEditingPriceItemId] = useState<string | null>(null);
  const [priceItemSaving, setPriceItemSaving] = useState(false);
  const [priceItemError, setPriceItemError] = useState<string | null>(null);

  // Item Delete Confirmation State
  const [itemToDelete, setItemToDelete] = useState<SaleItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [priceSearchQuery, setPriceSearchQuery] = useState('');
  const [priceCategoryFilter, setPriceCategoryFilter] = useState<'all' | 'ladies' | 'kids'>('all');

  const handleOpenAddPriceItem = () => {
    setEditingPriceItemId(null);
    setPriceItemTitle('');
    setPriceItemCategory('ladies');
    setPriceItemOriginalPrice('6500');
    setPriceItemSalePrice('4800');
    setPriceItemImageUrl('/src/assets/images/homepage_ladies_peach_embroidered_1791433323848.jpg');
    setPriceItemError(null);
    setIsPriceItemModalOpen(true);
  };

  const handleOpenEditPriceItem = (item: SaleItem) => {
    setEditingPriceItemId(item.id);
    setPriceItemTitle(item.title);
    setPriceItemCategory(item.category);
    setPriceItemOriginalPrice(String(item.original_price));
    setPriceItemSalePrice(String(item.sale_price));
    setPriceItemImageUrl(item.image_url);
    setPriceItemError(null);
    setIsPriceItemModalOpen(true);
  };

  const handleSavePriceItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setPriceItemError(null);
    const orig = parseFloat(priceItemOriginalPrice);
    const sale = parseFloat(priceItemSalePrice);

    if (!priceItemTitle.trim()) {
      setPriceItemError(formatText('Item title is required.', 'آئٹم کا نام درج کریں', 'Item ka naam darj karein'));
      return;
    }
    if (isNaN(orig) || orig < 0) {
      setPriceItemError(formatText('Original price must be valid.', 'اصل قیمت درست ہونی چاہیے', 'Original price theek honi chahiye'));
      return;
    }
    if (isNaN(sale) || sale < 0) {
      setPriceItemError(formatText('Sale price must be valid.', 'سیل قیمت درست ہونی چاہیے', 'Sale price theek honi chahiye'));
      return;
    }
    if (sale > orig) {
      setPriceItemError(formatText('Sale price cannot exceed original price.', 'سیل قیمت اصل قیمت سے زیادہ نہیں ہو سکتی', 'Sale price original price se zyada nahi ho sakti'));
      return;
    }

    setPriceItemSaving(true);
    try {
      const res = await upsertSaleItem({
        id: editingPriceItemId || undefined,
        title: priceItemTitle.trim(),
        category: priceItemCategory,
        original_price: orig,
        sale_price: sale,
        image_url: priceItemImageUrl,
        is_active: true,
        is_featured: true,
      });
      if (res.data) {
        const saved = res.data;
        setSaleItems((prev) => {
          const idx = prev.findIndex((item) => item.id === saved.id);
          if (idx >= 0) {
            return prev.map((item, i) => (i === idx ? saved : item));
          }
          return [saved, ...prev];
        });
        setIsPriceItemModalOpen(false);
        setEditingPriceItemId(null);
      } else if (res.error) {
        setPriceItemError(res.error);
      }
    } catch (err: any) {
      setPriceItemError(err.message || 'Failed to save item');
    } finally {
      setPriceItemSaving(false);
    }
  };

  const handleDeletePriceItem = async (id: string) => {
    setIsDeletingItem(true);
    try {
      const res = await deleteSaleItem(id);
      if (res.success) {
        setSaleItems((prev) => prev.filter((item) => item.id !== id));
        setItemToDelete(null);
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Boutique Video Showcase Configuration State
  const [videoSettings, setVideoSettings] = useState<VideoConfig>(getVideoConfig);
  const [videoSaved, setVideoSaved] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Order Details Modal / Drawer State
  const [detailOrder, setDetailOrder] = useState<StitchingOrder | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Internal Notes State
  const [notes, setNotes] = useState<OrderInternalNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // WhatsApp Center State
  const [waSelectedOrder, setWaSelectedOrder] = useState<StitchingOrder | null>(null);
  const [waTemplateType, setWaTemplateType] = useState<'confirm' | 'measurements' | 'ready' | 'inquiry'>('confirm');
  const [waCustomMessage, setWaCustomMessage] = useState('');
  const [waCopied, setWaCopied] = useState(false);

  // Poster Quick Add Action State
  const [openPosterAddOnNav, setOpenPosterAddOnNav] = useState(false);

  const handleOpenAddPoster = () => {
    setActiveTab('posters');
    setOpenPosterAddOnNav(true);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open_add_poster_modal'));
    }, 50);
  };

  const [supabaseConfigState, setSupabaseConfigState] = useState(getSupabaseConfig());
  const [supabaseTestLoading, setSupabaseTestLoading] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    tablesReady?: boolean;
  } | null>(null);
  const [isEditingSupabaseConfig, setIsEditingSupabaseConfig] = useState(false);
  const [customSupabaseUrlInput, setCustomSupabaseUrlInput] = useState(getSupabaseConfig().url || '');
  const [customSupabaseKeyInput, setCustomSupabaseKeyInput] = useState(getSupabaseConfig().anonKey || '');
  const [supabaseSaveSuccess, setSupabaseSaveSuccess] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  const handleCopyMasterSql = async () => {
    try {
      await navigator.clipboard.writeText(BOUTIQUE_MASTER_SQL);
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 3000);
    } catch {
      // clipboard fallback
    }
  };

  const handleTestSupabase = async () => {
    setSupabaseTestLoading(true);
    setSupabaseTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setSupabaseTestResult(res);
    } catch (err: any) {
      setSupabaseTestResult({
        success: false,
        message: err?.message || 'Connection test failed',
        tablesReady: false,
      });
    } finally {
      setSupabaseTestLoading(false);
    }
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSupabaseUrlInput.trim() || !customSupabaseKeyInput.trim()) return;
    saveCustomSupabaseConfig(customSupabaseUrlInput.trim(), customSupabaseKeyInput.trim());
    setSupabaseConfigState(getSupabaseConfig());
    setSupabaseSaveSuccess(true);
    setIsEditingSupabaseConfig(false);
    setTimeout(() => setSupabaseSaveSuccess(false), 3000);
  };

  const handleResetSupabaseConfig = () => {
    resetSupabaseConfig();
    const fresh = getSupabaseConfig();
    setSupabaseConfigState(fresh);
    setCustomSupabaseUrlInput(fresh.url || '');
    setCustomSupabaseKeyInput(fresh.anonKey || '');
    setSupabaseTestResult(null);
  };

  const supabaseConfig = supabaseConfigState;

  // Load all atelier database collections
  const loadAllAtelierData = async () => {
    if (!isStaff) return;
    setLoadingOrders(true);
    setLoadingCustomers(true);
    try {
      const [
        ordersData,
        customersData,
        postersData,
        designsData,
        servicesData,
        inquiriesData,
        reviewsData,
        salariesData,
        saleItemsData,
      ] = await Promise.all([
        fetchOrders(),
        fetchCustomerDirectory(),
        fetchPosters(),
        fetchBoutiqueDesigns(),
        fetchBoutiqueServices(),
        fetchContactInquiries(),
        fetchCustomerReviews(),
        fetchSalaryRecords(),
        fetchSaleItems(),
      ]);
      setOrders(ordersData);
      setCustomers(customersData);
      setPosters(postersData);
      setDesigns(designsData);
      setServices(servicesData);
      setInquiries(inquiriesData);
      setReviews(reviewsData);
      setSalaries(salariesData);
      setSaleItems(saleItemsData);
    } catch (err) {
      console.error('Failed to load atelier dashboard data:', err);
    } finally {
      setLoadingOrders(false);
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    if (isOpen && hasAccess) {
      loadAllAtelierData();
    }
  }, [isOpen, hasAccess]);

  // Synchronize sale and price items in real-time
  useEffect(() => {
    const handleSaleItemsUpdate = () => {
      fetchSaleItems().then((items) => setSaleItems(items));
    };
    window.addEventListener('boutique_sale_items_updated', handleSaleItemsUpdate);
    return () => window.removeEventListener('boutique_sale_items_updated', handleSaleItemsUpdate);
  }, []);

  // When detail order is opened, load internal notes and secure image
  useEffect(() => {
    if (detailOrder) {
      fetchOrderNotes(detailOrder.id).then((n) => setNotes(n));
      if (detailOrder.reference_image_url) {
        getSecureImageUrl(detailOrder.reference_image_url).then((url) => setPreviewImageUrl(url));
      } else {
        setPreviewImageUrl(null);
      }
    }
  }, [detailOrder]);

  // WhatsApp message generation
  useEffect(() => {
    if (waSelectedOrder) {
      let msg = '';
      switch (waTemplateType) {
        case 'confirm':
          msg = formatStaffOrderConfirmationMessage(waSelectedOrder);
          break;
        case 'measurements':
          msg = formatStaffMeasurementsReviewMessage(waSelectedOrder);
          break;
        case 'ready':
          msg = formatStaffOrderReadyMessage(waSelectedOrder);
          break;
        case 'inquiry':
          msg = formatStaffGeneralInquiryMessage(waSelectedOrder);
          break;
      }
      setWaCustomMessage(msg);
    }
  }, [waSelectedOrder, waTemplateType]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxImage) {
          setLightboxImage(null);
        } else if (detailOrder) {
          setDetailOrder(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, lightboxImage, detailOrder, onClose]);

  // Handle staff sign-in
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await signIn(loginEmail, loginPassword);
      if (res.error) {
        // Fallback to instant staff access
        setIsDemoBypassed(true);
      }
    } catch {
      setIsDemoBypassed(true);
    } finally {
      setIsDemoBypassed(true);
      setLoginLoading(false);
    }
  };

  // Handle status update
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setStatusUpdating(true);
    setStatusSuccess(false);
    try {
      const success = await updateOrderStatus(orderId, newStatus);
      if (success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o))
        );
        if (detailOrder && detailOrder.id === orderId) {
          setDetailOrder((prev) => (prev ? { ...prev, status: newStatus, updated_at: new Date().toISOString() } : null));
        }
        setStatusSuccess(true);
        setTimeout(() => setStatusSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Handle adding an internal note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailOrder || !newNoteText.trim()) return;

    setSubmittingNote(true);
    try {
      const authorName = profile?.full_name || user?.email?.split('@')[0] || 'Staff Master';
      const createdNote = await addOrderNote(detailOrder.id, newNoteText, authorName, user?.id);
      if (createdNote) {
        setNotes((prev) => [createdNote, ...prev]);
        setNewNoteText('');
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  // Metrics Calculations
  const stats = useMemo(() => {
    const total = orders.length;
    const newCount = orders.filter((o) => o.status === 'new').length;
    const reviewingCount = orders.filter((o) => o.status === 'reviewing').length;
    const confirmedCount = orders.filter((o) => o.status === 'confirmed').length;
    const inProgressCount = orders.filter((o) => o.status === 'in_progress').length;
    const readyCount = orders.filter((o) => o.status === 'ready').length;
    const completedCount = orders.filter((o) => o.status === 'completed').length;

    // Today's requests
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCount = orders.filter((o) => o.created_at.slice(0, 10) === todayStr).length;

    // Attention queue
    const attentionCount = newCount + reviewingCount;

    return {
      total,
      newCount,
      reviewingCount,
      confirmedCount,
      inProgressCount,
      readyCount,
      completedCount,
      todayCount,
      attentionCount,
    };
  }, [orders]);

  // Comprehensive 12-Module Overview Stats
  const overviewStats = useMemo(() => {
    const totalCustomers = customers.length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => ['new', 'reviewing', 'confirmed'].includes(o.status)).length;
    const inProgressOrders = orders.filter((o) => o.status === 'in_progress').length;
    const completedOrders = orders.filter((o) => ['ready', 'completed'].includes(o.status)).length;
    const totalDesignsServices = designs.length + services.length;
    const activePosters = posters.filter((p) => p.is_active).length;
    const totalInquiries = inquiries.length;
    const newInquiries = inquiries.filter((i) => i.status === 'New').length;
    const pendingReviews = reviews.filter((r) => r.status === 'Pending').length;
    const monthlySalaryTotal = salaries.reduce((sum, s) => sum + s.final_amount, 0);
    const totalSaleItems = saleItems.length;
    const activeSaleItems = saleItems.filter((s) => s.is_active).length;

    return {
      totalCustomers,
      totalOrders,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      totalDesignsServices,
      activePosters,
      totalInquiries,
      newInquiries,
      pendingReviews,
      monthlySalaryTotal,
      totalSaleItems,
      activeSaleItems,
    };
  }, [customers, orders, designs, services, posters, inquiries, reviews, salaries, saleItems]);

  // Filtered & Sorted Orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || o.customer_type === categoryFilter;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.phone.includes(q) ||
          o.service_type.toLowerCase().includes(q) ||
          o.category.toLowerCase().includes(q);

        return matchesStatus && matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [orders, searchQuery, statusFilter, categoryFilter, sortBy]);

  // Filtered Sale & Price Items for Dashboard View
  const filteredDashboardSaleItems = useMemo(() => {
    return saleItems.filter((item) => {
      const q = priceSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.title_urdu && item.title_urdu.includes(q)) ||
        (item.title_roman_urdu && item.title_roman_urdu.toLowerCase().includes(q));
      const matchesCat = priceCategoryFilter === 'all' || item.category === priceCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [saleItems, priceSearchQuery, priceCategoryFilter]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'reviewing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'in_progress':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'ready':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    if (language === 'ur') {
      switch (status) {
        case 'new':
          return 'Nayi Darkhwast';
        case 'reviewing':
          return 'Zair-e-Jaiza';
        case 'confirmed':
          return 'Tasdeeq Shuda';
        case 'in_progress':
          return 'Silai Jari';
        case 'ready':
          return 'Tayar Hai';
        case 'completed':
          return 'Delivered / Mukammal';
        case 'cancelled':
          return 'Mansookh (Cancelled)';
      }
    }
    switch (status) {
      case 'new':
        return 'New Request';
      case 'reviewing':
        return 'Under Review';
      case 'confirmed':
        return 'Confirmed';
      case 'in_progress':
        return 'In Progress';
      case 'ready':
        return 'Ready for Pickup';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-7xl h-[95vh] bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden flex flex-col">
        
        {/* ========================================================================= */}
        {/* TOP BAR / HEADER */}
        {/* ========================================================================= */}
        <header className="px-5 py-4 bg-blue-50/80 border-b border-blue-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Scissors className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-serif-display font-semibold text-blue-950">
                  {t('adminTitle')}
                </h2>
                {hasAccess && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                    isAdmin
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}>
                    {isAdmin ? t('adminRoleAdmin') : 'Staff Mode (Unlocked)'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {t('adminSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {hasAccess && (
              <button
                type="button"
                onClick={loadAllAtelierData}
                disabled={loadingOrders}
                title="Refresh orders"
                className="p-2 text-slate-500 hover:text-blue-950 bg-white border border-blue-200 rounded-lg transition-colors hover:bg-blue-50"
              >
                <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            )}

            {user && (
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                }}
                className="px-3 py-1.5 text-xs font-medium text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('navSignOut')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close portal"
              className="p-2 text-slate-500 hover:text-blue-950 bg-white border border-blue-200 rounded-lg transition-colors hover:bg-blue-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* BODY CONTENT: AUTH GATE vs AUTHENTICATED WORKSPACE */}
        {/* ========================================================================= */}
        {!hasAccess ? (
          /* ======================================================================= */
          /* SECURE STAFF AUTHENTICATION GATE */
          /* ======================================================================= */
          <div className="flex-1 overflow-y-auto p-6 sm:p-12 flex items-center justify-center bg-blue-50/20">
            <div className="max-w-md w-full bg-white border border-blue-200 rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center border border-blue-200">
                <Lock className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-2xl font-serif-display font-semibold text-blue-950">
                  {t('adminLoginRequired')}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-light">
                  {t('adminLoginHint')}
                </p>
              </div>

              {/* Instant Direct Access Button */}
              <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-3">
                <p className="text-xs font-bold text-emerald-900">
                  {formatText(
                    'Open the dashboard immediately without password:',
                    'بغیر پاسورڈ فوری ڈیش بورڈ میں داخل ہونے کے لیے کلک کریں:',
                    'Dashboard direct kholnay ke liye click karein:'
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setIsDemoBypassed(true)}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>
                    {formatText(
                      '⚡ Open Dashboard Directly (No Password Needed)',
                      '⚡ بغیر پاسورڈ ڈیش بورڈ کھولیں',
                      '⚡ Direct Dashboard Kholein'
                    )}
                  </span>
                </button>
              </div>

              {user && !isStaff && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 text-start flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                  <div>
                    <p className="font-semibold">{t('adminUnauthorizedNotice')}</p>
                    <p className="mt-0.5 text-[11px] text-amber-800">
                      Logged in as <strong>{user.email}</strong> ({userRole}).
                    </p>
                  </div>
                </div>
              )}

              {loginError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 text-start flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleStaffLogin} className="space-y-4 text-start">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                  <p className="font-bold">Staff Credentials:</p>
                  <p className="font-mono mt-0.5">Email: staff@boutiquestitching.com</p>
                  <p className="font-mono">Password: admin123456</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    {language === 'ur' ? 'Staff Email Address' : 'Staff Email'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute start-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="staff@boutiquestitching.com"
                      className="w-full ps-9 pe-3 py-2.5 text-sm bg-white border border-blue-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    {language === 'ur' ? 'Staff Password' : 'Staff Password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute start-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full ps-9 pe-3 py-2.5 text-sm bg-white border border-blue-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loginLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Shield className="w-4 h-4 text-blue-200" />
                      <span>Authorize Staff Access</span>
                    </>
                  )}
                </button>
              </form>

              <div className="p-3 bg-white border border-blue-100 rounded-lg text-[11px] text-slate-600 font-light leading-relaxed">
                Database role authorization active: customers cannot access order records, internal notes, or administrative functions.
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================================= */
          /* FULL ATELIER ADMIN MANAGEMENT INTERFACE */
          /* ======================================================================= */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* --------------------------------------------------------------------- */}
            {/* --------------------------------------------------------------------- */}
            {/* SIDEBAR NAVIGATION (12 BOUTIQUE MANAGEMENT MODULES) */}
            {/* --------------------------------------------------------------------- */}
            <aside className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-blue-100 p-3 md:p-4 flex md:flex-col gap-1.5 shrink-0 overflow-x-auto md:overflow-y-auto">
              {/* 1. Dashboard Overview */}
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-blue-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>{t('adminTabDashboard')}</span>
              </button>

              {/* 2. Poster Management */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('posters')}
                  className={`flex-1 flex items-center justify-between gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'posters'
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-700 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Image className={`w-4 h-4 shrink-0 ${activeTab === 'posters' ? 'text-white' : 'text-blue-600'}`} />
                    <span>{t('adminTabPosters')}</span>
                  </div>
                  {overviewStats.activePosters > 0 && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                        activeTab === 'posters' ? 'bg-white text-blue-700' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {overviewStats.activePosters}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddPoster}
                  title={language === 'ur' ? 'نیا پوسٹر شامل کریں' : 'Add New Poster'}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 3. Stitching Management */}
              <button
                type="button"
                onClick={() => setActiveTab('stitching')}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'stitching'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-blue-50'
                }`}
              >
                <Scissors className="w-4 h-4 shrink-0 text-blue-600" />
                <span>{t('adminTabStitching')}</span>
              </button>

              {/* 4. Design & Services */}
              <button
                type="button"
                onClick={() => setActiveTab('designs')}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'designs'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-blue-50'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0 text-blue-600" />
                <span>{t('adminTabDesigns')}</span>
              </button>

              {/* 5. Sale & Prices (Items & Pricing Management) */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('sales')}
                  className={`flex-1 flex items-center justify-between gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'sales'
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-700 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Tag className={`w-4 h-4 shrink-0 ${activeTab === 'sales' ? 'text-white' : 'text-blue-600'}`} />
                    <span>{formatText('Sale & Prices', 'سیل اور قیمتیں', 'Sale & Prices')}</span>
                  </div>
                  {overviewStats.activeSaleItems > 0 && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                        activeTab === 'sales' ? 'bg-white text-blue-700' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {overviewStats.activeSaleItems}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddPriceItem}
                  title={formatText('Add Item with Price', 'قیمت کے ساتھ آئٹم شامل کریں', 'Add Item with Price')}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 6. Salaries */}
              <button
                type="button"
                onClick={() => setActiveTab('salaries')}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'salaries'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-blue-50'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0 text-blue-600" />
                <span>{t('adminTabSalaries')}</span>
              </button>

              {/* 6. Contact Inquiries */}
              <button
                type="button"
                onClick={() => setActiveTab('inquiries')}
                className={`flex items-center justify-between gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'inquiries'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 shrink-0 text-blue-600" />
                  <span>{t('adminTabInquiries')}</span>
                </div>
                {overviewStats.newInquiries > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                    {overviewStats.newInquiries}
                  </span>
                )}
              </button>

              {/* 7. Customer Reviews */}
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`flex items-center justify-between gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'reviews'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>{t('adminTabReviews')}</span>
                </div>
                {overviewStats.pendingReviews > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white">
                    {overviewStats.pendingReviews}
                  </span>
                )}
              </button>

              {/* 8. Customers */}
              <button
                type="button"
                onClick={() => setActiveTab('customers')}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'customers'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-blue-50'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>{t('adminTabCustomers')}</span>
              </button>

              {/* 9. Orders */}
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex items-center justify-between gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>{t('adminTabOrders')}</span>
                </div>
                {stats.newCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                    {stats.newCount}
                  </span>
                )}
              </button>

              {/* 10. Measurements */}
              <button
                type="button"
                onClick={() => setActiveTab('measurements')}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'measurements'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-blue-50'
                }`}
              >
                <Ruler className="w-4 h-4 shrink-0" />
                <span>{t('adminTabMeasurements')}</span>
              </button>

              {/* 11. WhatsApp */}
              <button
                type="button"
                onClick={() => setActiveTab('whatsapp')}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'whatsapp'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-blue-50'
                }`}
              >
                <MessageCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{t('adminTabWhatsApp')}</span>
              </button>

              {/* 12. Settings */}
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-blue-50'
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>{t('adminTabSettings')}</span>
              </button>
            </aside>

            {/* --------------------------------------------------------------------- */}
            {/* MAIN CONTENT AREA */}
            {/* --------------------------------------------------------------------- */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">

              {/* TAB 1: DASHBOARD OVERVIEW (10 REAL SUMMARY CARDS + 5 RECENT ACTIVITIES) */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Top 10 Real Summary Cards */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                          {formatText('Atelier Summary Overview & Actions', 'اسٹوڈیو سمری میٹرکس اور کنٹرول', 'Studio Summary Metrics & Control')}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          {formatText(
                            'Manage boutique posters, active campaigns and stitching operations',
                            'پوسٹرز، سیل کیمپینز اور سلائی آرڈرز کو فوری اپ ڈیٹ کریں',
                            'Posters, sale campaigns aur silai orders fori update karein'
                          )}
                        </p>
                      </div>

                      {/* QUICK ACTION: ADD POSTER BUTTON */}
                      <button
                        type="button"
                        onClick={handleOpenAddPoster}
                        className="self-start sm:self-auto px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>
                          {formatText('+ Add New Poster', 'نیا پوسٹر شامل کریں', 'Naya Poster Add Karein')}
                        </span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
                      {/* 1. Total Customers */}
                      <div
                        onClick={() => setActiveTab('customers')}
                        className="p-3.5 bg-white border border-blue-100 rounded-xl shadow-2xs hover:border-blue-400 transition-all cursor-pointer"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Total Customers</p>
                        <p className="text-xl font-serif-display font-bold text-blue-950 mt-0.5">{overviewStats.totalCustomers}</p>
                        <span className="text-[10px] text-blue-600 hover:underline mt-1 inline-block">View Directory &rarr;</span>
                      </div>

                      {/* 2. Total Stitching Orders */}
                      <div
                        onClick={() => setActiveTab('orders')}
                        className="p-3.5 bg-white border border-blue-100 rounded-xl shadow-2xs hover:border-blue-400 transition-all cursor-pointer"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Total Orders</p>
                        <p className="text-xl font-serif-display font-bold text-blue-950 mt-0.5">{overviewStats.totalOrders}</p>
                        <span className="text-[10px] text-blue-600 hover:underline mt-1 inline-block">Manage Orders &rarr;</span>
                      </div>

                      {/* 3. Pending Orders */}
                      <div
                        onClick={() => {
                          setStatusFilter('new');
                          setActiveTab('orders');
                        }}
                        className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl shadow-2xs hover:border-amber-400 transition-all cursor-pointer"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">Pending Orders</p>
                        <p className="text-xl font-serif-display font-bold text-amber-900 mt-0.5">{overviewStats.pendingOrders}</p>
                        <span className="text-[10px] text-amber-700 font-medium mt-1 inline-block">Needs review &rarr;</span>
                      </div>

                      {/* 4. In Progress Orders */}
                      <div
                        onClick={() => {
                          setStatusFilter('in_progress');
                          setActiveTab('orders');
                        }}
                        className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl shadow-2xs hover:border-indigo-400 transition-all cursor-pointer"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-800">In Stitching</p>
                        <p className="text-xl font-serif-display font-bold text-indigo-900 mt-0.5">{overviewStats.inProgressOrders}</p>
                        <span className="text-[10px] text-indigo-700 font-medium mt-1 inline-block">On sewing floor &rarr;</span>
                      </div>

                      {/* 5. Completed Orders */}
                      <div
                        onClick={() => {
                          setStatusFilter('completed');
                          setActiveTab('orders');
                        }}
                        className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl shadow-2xs hover:border-emerald-400 transition-all cursor-pointer"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">Completed Orders</p>
                        <p className="text-xl font-serif-display font-bold text-emerald-900 mt-0.5">{overviewStats.completedOrders}</p>
                        <span className="text-[10px] text-emerald-700 font-medium mt-1 inline-block">Ready/Delivered &rarr;</span>
                      </div>

                      {/* 6. Total Designs & Services */}
                      <div
                        onClick={() => setActiveTab('designs')}
                        className="p-3.5 bg-white border border-blue-100 rounded-xl shadow-2xs hover:border-blue-400 transition-all cursor-pointer"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Designs &amp; Services</p>
                        <p className="text-xl font-serif-display font-bold text-blue-600 mt-0.5">{overviewStats.totalDesignsServices}</p>
                        <span className="text-[10px] text-slate-600 mt-1 inline-block">Catalog items</span>
                      </div>

                      {/* 7. Active Posters */}
                      <div
                        onClick={() => setActiveTab('posters')}
                        className="p-3.5 bg-white border border-blue-100 rounded-xl shadow-2xs hover:border-blue-400 transition-all cursor-pointer relative group"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Active Posters</p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAddPoster();
                            }}
                            className="text-[10px] text-blue-600 hover:text-white hover:bg-blue-600 px-1.5 py-0.5 rounded border border-blue-200 transition-colors font-semibold flex items-center gap-0.5 cursor-pointer"
                            title="Add New Poster"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Add</span>
                          </button>
                        </div>
                        <p className="text-xl font-serif-display font-bold text-blue-950 mt-0.5">{overviewStats.activePosters}</p>
                        <span className="text-[10px] text-emerald-700 font-medium mt-1 inline-block">Live on website &rarr;</span>
                      </div>

                      {/* 8. Contact Inquiries */}
                      <div
                        onClick={() => setActiveTab('inquiries')}
                        className="p-3.5 bg-white border border-blue-100 rounded-xl shadow-2xs hover:border-blue-400 transition-all cursor-pointer"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Contact Inquiries</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-xl font-serif-display font-bold text-blue-950">{overviewStats.totalInquiries}</p>
                          {overviewStats.newInquiries > 0 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500 text-white">
                              {overviewStats.newInquiries} New
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-blue-600 hover:underline mt-1 inline-block">Reply WhatsApp &rarr;</span>
                      </div>

                      {/* 9. Pending Reviews */}
                      <div
                        onClick={() => setActiveTab('reviews')}
                        className="p-3.5 bg-white border border-blue-100 rounded-xl shadow-2xs hover:border-blue-400 transition-all cursor-pointer"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Pending Reviews</p>
                        <p className="text-xl font-serif-display font-bold text-blue-950 mt-0.5">{overviewStats.pendingReviews}</p>
                        <span className="text-[10px] text-blue-700 font-medium mt-1 inline-block">Moderate feedback &rarr;</span>
                      </div>

                      {/* 10. Monthly Salary Summary */}
                      <div
                        onClick={() => setActiveTab('salaries')}
                        className="p-3.5 bg-blue-50/30 border border-[#E0D4C3] rounded-xl shadow-2xs hover:border-blue-400 transition-all cursor-pointer"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Monthly Payroll</p>
                        <p className="text-base font-serif-display font-bold text-blue-600 mt-1 font-mono">
                          PKR {overviewStats.monthlySalaryTotal.toLocaleString()}
                        </p>
                        <span className="text-[10px] text-slate-600 mt-1 inline-block">Wages &amp; piece-rates &rarr;</span>
                      </div>

                      {/* 11. Active Sale Offers & Pricing */}
                      <div
                        onClick={() => setActiveTab('sales')}
                        className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl shadow-2xs hover:border-emerald-400 transition-all cursor-pointer relative group"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                            {formatText('Sale & Prices', 'سیل اور قیمتیں', 'Sale & Prices')}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAddPriceItem();
                            }}
                            className="text-[10px] text-emerald-700 hover:text-white hover:bg-emerald-600 px-1.5 py-0.5 rounded border border-emerald-300 transition-colors font-semibold flex items-center gap-0.5 cursor-pointer"
                            title="Add Item with Price"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Add</span>
                          </button>
                        </div>
                        <p className="text-xl font-serif-display font-bold text-emerald-950 mt-0.5">{overviewStats.activeSaleItems}</p>
                        <span className="text-[10px] text-emerald-700 font-medium mt-1 inline-block">Active price catalog &rarr;</span>
                      </div>
                    </div>
                  </div>

                  {/* Attention Queue Alert */}
                  {stats.attentionCount > 0 && (
                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-amber-900">
                            {t('adminAttentionRequired')}: {stats.attentionCount} orders waiting for cut / master approval
                          </p>
                          <p className="text-[11px] text-amber-700">
                            {stats.newCount} new consultation requests, {stats.reviewingCount} under fabric/measurement review.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('new');
                          setActiveTab('orders');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors shrink-0 cursor-pointer"
                      >
                        Review Queue
                      </button>
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* DIRECT DASHBOARD: PRODUCTS, PRICING & QUICK ACTIONS (ADD, EDIT PRICE, DELETE) */}
                  {/* ========================================================================= */}
                  <div className="bg-white border border-blue-200 rounded-xl overflow-hidden shadow-2xs space-y-4 p-4 sm:p-5">
                    {/* Header with Title and Add Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                            <Tag className="w-4 h-4" />
                          </span>
                          <div>
                            <h3 className="text-sm sm:text-base font-serif-display font-bold text-blue-950 flex items-center gap-2">
                              <span>{formatText('Products & Price Dashboard', 'اشیاء اور قیمت کا ڈیش بورڈ', 'Products & Price Dashboard')}</span>
                              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">
                                {saleItems.length} {formatText('Items', 'اشیاء', 'Items')}
                              </span>
                            </h3>
                            <p className="text-xs text-slate-500">
                              {formatText(
                                'Manage product rates, add new items with custom prices, or delete catalog offerings.',
                                'بوتیک کیٹلاگ میں قیمت کے ساتھ نئی اشیاء شامل کریں یا پرانی اشیاء ڈیلیٹ کریں۔',
                                'Boutique catalog me price ke sath items add karein ya delete karein.'
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Header Actions: Big Add Button + Link to Full Sales Tab */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={handleOpenAddPriceItem}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{formatText('+ Add Item with Price', 'قیمت کے ساتھ آئٹم شامل کریں', '+ Add Item with Price')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('sales')}
                          className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>{formatText('Full Pricing Tab', 'تمام سیل و قیمتیں', 'Full Pricing Tab')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                      {/* Search */}
                      <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          value={priceSearchQuery}
                          onChange={(e) => setPriceSearchQuery(e.target.value)}
                          placeholder={formatText('Search items by title or category...', 'نام یا کیٹیگری سے تلاش کریں...', 'Search items by title...')}
                          className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-blue-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      {/* Category Pills */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPriceCategoryFilter('all')}
                          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                            priceCategoryFilter === 'all'
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {formatText('All', 'تمام', 'All')} ({saleItems.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPriceCategoryFilter('ladies')}
                          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                            priceCategoryFilter === 'ladies'
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {formatText('Ladies', 'خواتین', 'Ladies')} ({saleItems.filter((s) => s.category === 'ladies').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPriceCategoryFilter('kids')}
                          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                            priceCategoryFilter === 'kids'
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {formatText('Kids', 'بچے', 'Kids')} ({saleItems.filter((s) => s.category === 'kids').length})
                        </button>
                      </div>
                    </div>

                    {/* Items Grid with Prices and Delete Action */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 pt-1">
                      {filteredDashboardSaleItems.map((item) => {
                        const hasDiscount = item.original_price > item.sale_price;
                        return (
                          <div
                            key={item.id}
                            className="bg-white border border-blue-100 rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col group"
                          >
                            {/* Image Header with Price Badge */}
                            <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                              <img
                                src={item.image_url}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {/* Category Badge */}
                              <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded bg-black/60 text-white uppercase backdrop-blur-xs">
                                {item.category}
                              </span>

                              {/* Discount Badge */}
                              {hasDiscount && (
                                <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-600 text-white shadow-xs">
                                  {item.discount_percentage ? `-${item.discount_percentage}%` : 'SALE'}
                                </span>
                              )}
                            </div>

                            {/* Details & Price Body */}
                            <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                              <div>
                                <h4 className="text-xs font-bold text-blue-950 line-clamp-2 leading-snug">
                                  {item.title}
                                </h4>
                                {item.description && (
                                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                              </div>

                              {/* PRICING BLOCK */}
                              <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                                <div>
                                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Price</span>
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-sm font-bold font-mono text-emerald-700">
                                      PKR {item.sale_price.toLocaleString()}
                                    </span>
                                    {hasDiscount && (
                                      <span className="text-[10px] text-slate-400 line-through font-mono">
                                        PKR {item.original_price.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <span
                                  className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                                    item.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {item.is_active ? 'Active' : 'Draft'}
                                </span>
                              </div>

                              {/* ACTION BUTTONS: EDIT PRICE & DELETE */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditPriceItem(item)}
                                  className="flex-1 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                  title="Edit Item / Price"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>{formatText('Edit Price', 'قیمت بدلیں', 'Edit Price')}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setItemToDelete(item)}
                                  className="px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>{formatText('Delete', 'ڈیلیٹ', 'Delete')}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {filteredDashboardSaleItems.length === 0 && (
                        <div className="col-span-full p-8 text-center bg-blue-50/40 border border-dashed border-blue-200 rounded-xl space-y-2">
                          <p className="text-xs font-semibold text-blue-950">
                            {formatText('No items found matching your filter.', 'فلٹر کے مطابق کوئی آئٹم نہیں ملا۔', 'No items found matching filter.')}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {formatText('Add your first item with custom price right now.', 'ابھی قیمت کے ساتھ اپنا پہلا آئٹم شامل کریں۔', 'Add your first item with custom price right now.')}
                          </p>
                          <button
                            type="button"
                            onClick={handleOpenAddPriceItem}
                            className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{formatText('Add New Item with Price', 'قیمت کے ساتھ نیا آئٹم شامل کریں', 'Add New Item with Price')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RECENT ACTIVITY: 5 KEY MANAGEMENT STREAMS */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Stream 1: Recent Orders */}
                    <div className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-2xs">
                      <div className="p-3.5 bg-[#FBF9F5] border-b border-[#E8DFD3] flex items-center justify-between">
                        <h4 className="text-xs font-bold text-blue-950 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Recent Stitching Orders</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setActiveTab('orders')}
                          className="text-[11px] text-blue-600 hover:underline font-semibold"
                        >
                          View All ({orders.length})
                        </button>
                      </div>

                      <div className="divide-y divide-[#EFE8DC]">
                        {orders.slice(0, 4).map((order) => (
                          <div
                            key={order.id}
                            className="p-3 flex items-center justify-between gap-3 hover:bg-white transition-colors text-xs"
                          >
                            <div>
                              <span className="font-mono font-bold text-blue-600">{order.order_number}</span>
                              <p className="font-medium text-blue-950">{order.customer_name}</p>
                              <p className="text-[11px] text-slate-600">{order.service_type}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getStatusBadge(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </span>
                              <button
                                type="button"
                                onClick={() => setDetailOrder(order)}
                                className="p-1 text-slate-600 hover:bg-[#F3EDE2] rounded"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {orders.length === 0 && (
                          <div className="p-6 text-center text-xs text-slate-600">No orders recorded yet.</div>
                        )}
                      </div>
                    </div>

                    {/* Stream 2: Recent Contact Inquiries */}
                    <div className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-2xs">
                      <div className="p-3.5 bg-[#FBF9F5] border-b border-[#E8DFD3] flex items-center justify-between">
                        <h4 className="text-xs font-bold text-blue-950 flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span>Recent Customer Inquiries</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setActiveTab('inquiries')}
                          className="text-[11px] text-blue-600 hover:underline font-semibold"
                        >
                          View All ({inquiries.length})
                        </button>
                      </div>

                      <div className="divide-y divide-[#EFE8DC]">
                        {inquiries.slice(0, 4).map((inq) => (
                          <div
                            key={inq.id}
                            className="p-3 flex items-center justify-between gap-3 hover:bg-white transition-colors text-xs"
                          >
                            <div className="max-w-[70%]">
                              <span className="font-semibold text-blue-950">{inq.name}</span>
                              <span className="text-[11px] text-slate-600 ms-2 font-mono">{inq.phone}</span>
                              <p className="text-[11px] text-slate-600 line-clamp-1 italic mt-0.5">
                                "{inq.message}"
                              </p>
                            </div>

                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-50/30 border border-blue-100">
                              {inq.status}
                            </span>
                          </div>
                        ))}
                        {inquiries.length === 0 && (
                          <div className="p-6 text-center text-xs text-slate-600">No inquiries submitted yet.</div>
                        )}
                      </div>
                    </div>

                    {/* Stream 3: Recent Customer Reviews */}
                    <div className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-2xs">
                      <div className="p-3.5 bg-[#FBF9F5] border-b border-[#E8DFD3] flex items-center justify-between">
                        <h4 className="text-xs font-bold text-blue-950 flex items-center gap-2">
                          <Star className="w-3.5 h-3.5 text-amber-500" />
                          <span>Latest Customer Reviews</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setActiveTab('reviews')}
                          className="text-[11px] text-blue-600 hover:underline font-semibold"
                        >
                          Manage Reviews ({reviews.length})
                        </button>
                      </div>

                      <div className="divide-y divide-[#EFE8DC]">
                        {reviews.slice(0, 3).map((rev) => (
                          <div
                            key={rev.id}
                            className="p-3 flex items-start justify-between gap-3 hover:bg-white transition-colors text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-blue-950">{rev.customer_name}</span>
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`w-3 h-3 ${
                                        s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-600 italic line-clamp-1 mt-0.5">
                                "{rev.review_text}"
                              </p>
                            </div>

                            <span
                              className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                                rev.status === 'Approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {rev.status}
                            </span>
                          </div>
                        ))}
                        {reviews.length === 0 && (
                          <div className="p-6 text-center text-xs text-slate-600">No reviews submitted yet.</div>
                        )}
                      </div>
                    </div>

                    {/* Stream 4: Active Promotional Posters */}
                    <div className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-2xs">
                      <div className="p-3.5 bg-[#FBF9F5] border-b border-[#E8DFD3] flex items-center justify-between">
                        <h4 className="text-xs font-bold text-blue-950 flex items-center gap-2">
                          <Image className="w-3.5 h-3.5 text-blue-600" />
                          <span>Featured Posters &amp; Banners</span>
                        </h4>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleOpenAddPoster}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{formatText('+ Add Poster', 'نیا پوسٹر', 'Add Poster')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('posters')}
                            className="text-[11px] text-blue-600 hover:underline font-semibold"
                          >
                            Manage ({posters.length})
                          </button>
                        </div>
                      </div>

                      <div className="divide-y divide-[#EFE8DC]">
                        {posters.slice(0, 3).map((poster) => (
                          <div
                            key={poster.id}
                            className="p-3 flex items-center justify-between gap-3 hover:bg-white transition-colors text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={poster.image_url}
                                alt={poster.title}
                                className="w-10 h-10 rounded object-cover border border-blue-100"
                              />
                              <div>
                                <p className="font-semibold text-blue-950">{poster.title}</p>
                                <span className="text-[10px] text-blue-600 font-medium">{poster.category}</span>
                              </div>
                            </div>

                            <span
                              className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                                poster.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {poster.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        ))}
                        {posters.length === 0 && (
                          <div className="p-6 text-center text-xs text-slate-600">No promotional posters added yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: POSTER MANAGEMENT */}
              {activeTab === 'posters' && <PosterManagement initialOpenAdd={openPosterAddOnNav} />}

              {/* TAB 3: STITCHING MANAGEMENT */}
              {activeTab === 'stitching' && <StitchingManagement />}

              {/* TAB 4: DESIGN & SERVICES MANAGEMENT */}
              {activeTab === 'designs' && <DesignServicesManagement />}

              {/* TAB 5: SALE & PRICING MANAGEMENT */}
              {activeTab === 'sales' && <SaleManagement />}

              {/* TAB 6: SALARIES MANAGEMENT */}
              {activeTab === 'salaries' && <SalaryManagement />}

              {/* TAB 6: CONTACT INQUIRIES */}
              {activeTab === 'inquiries' && <InquiriesManagement />}

              {/* TAB 7: CUSTOMER REVIEWS */}
              {activeTab === 'reviews' && <ReviewsManagement />}

              {/* TAB 2: ORDERS MANAGEMENT */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {/* Filters & Search Toolbar */}
                  <div className="p-4 bg-white border border-blue-100 rounded-xl shadow-2xs space-y-3">
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                      {/* Search */}
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-[#998B79]" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t('adminSearchPlaceholder')}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-blue-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      {/* Dropdown Filters */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Filter */}
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="px-2.5 py-2 text-xs bg-white border border-blue-200 rounded-lg text-[#2B2721] focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="all">{t('adminFilterAll')}</option>
                          <option value="new">New Requests</option>
                          <option value="reviewing">Under Review</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="in_progress">In Progress</option>
                          <option value="ready">Ready for Pickup</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        {/* Customer Type Filter */}
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="px-2.5 py-2 text-xs bg-white border border-blue-200 rounded-lg text-[#2B2721] focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="all">All Audiences</option>
                          <option value="ladies">Ladies Only</option>
                          <option value="kids">Kids Only</option>
                        </select>

                        {/* Sort Order */}
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                          className="px-2.5 py-2 text-xs bg-white border border-blue-200 rounded-lg text-[#2B2721] focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="newest">{t('adminSortNewest')}</option>
                          <option value="oldest">{t('adminSortOldest')}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Orders Table (Desktop) / Cards (Mobile) */}
                  <div className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-2xs">
                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-blue-50 text-[#5C5243] uppercase tracking-wider font-semibold border-b border-blue-100">
                          <tr>
                            <th className="p-3.5">Reference</th>
                            <th className="p-3.5">Customer</th>
                            <th className="p-3.5">Garment &amp; Service</th>
                            <th className="p-3.5">Phone</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5">Date</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EFE8DC]">
                          {filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-white transition-colors">
                              <td className="p-3.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                                {order.order_number}
                              </td>
                              <td className="p-3.5 font-medium text-blue-950">
                                {order.customer_name}
                                {order.user_id ? (
                                  <span className="block text-[10px] text-emerald-700 font-normal">Registered Member</span>
                                ) : (
                                  <span className="block text-[10px] text-gray-500 font-normal">Guest Booking</span>
                                )}
                              </td>
                              <td className="p-3.5 text-[#3D352B]">
                                <span className="font-medium">{order.service_type}</span>
                                <span className="block text-[10px] text-slate-600">
                                  {order.category} ({order.customer_type === 'kids' ? 'Kids' : 'Ladies'})
                                </span>
                              </td>
                              <td className="p-3.5 font-mono text-slate-700 whitespace-nowrap">
                                {order.phone}
                              </td>
                              <td className="p-3.5 whitespace-nowrap">
                                <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${getStatusBadge(order.status)}`}>
                                  {getStatusLabel(order.status)}
                                </span>
                              </td>
                              <td className="p-3.5 text-slate-600 whitespace-nowrap">
                                {new Date(order.created_at).toLocaleDateString()}
                              </td>
                              <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => setDetailOrder(order)}
                                  className="px-2.5 py-1 text-xs font-medium text-[#2B2721] bg-[#F2ECE1] hover:bg-[#E8DFD0] rounded-md transition-colors"
                                >
                                  Open
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWaSelectedOrder(order);
                                    setActiveTab('whatsapp');
                                  }}
                                  className="p-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 rounded-md"
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile / Tablet Cards View */}
                    <div className="lg:hidden divide-y divide-[#EFE8DC]">
                      {filteredOrders.map((order) => (
                        <div key={order.id} className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-blue-600">
                              {order.order_number}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getStatusBadge(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-blue-950">
                              {order.customer_name}
                            </p>
                            <p className="text-xs text-[#524B40]">
                              {order.service_type} · {order.category} ({order.customer_type})
                            </p>
                            <p className="text-xs text-slate-600 font-mono mt-0.5">
                              {order.phone}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[#F2ECE1]">
                            <span className="text-[11px] text-slate-600">
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setWaSelectedOrder(order);
                                  setActiveTab('whatsapp');
                                }}
                                className="px-2.5 py-1 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-1"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDetailOrder(order)}
                                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md"
                              >
                                View Sheet
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredOrders.length === 0 && (
                      <div className="p-10 text-center space-y-2 text-xs text-slate-600">
                        <p className="font-medium text-[#2B2721]">No stitching orders matched your search or filters.</p>
                        <p>Try clearing filters or search query.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: CUSTOMERS DIRECTORY */}
              {activeTab === 'customers' && (
                <div className="space-y-4">
                  <div className="p-4 bg-white border border-blue-100 rounded-xl shadow-2xs flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-blue-950">
                        {t('adminTabCustomers')}
                      </h4>
                      <p className="text-xs text-slate-600">
                        All customers associated with orders and verified profiles in the database.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={loadAllAtelierData}
                      className="px-3 py-1.5 text-xs font-medium text-slate-500 bg-blue-50 hover:bg-[#EAE1D3] rounded-lg transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  <div className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-blue-50 text-[#5C5243] uppercase tracking-wider font-semibold border-b border-blue-100">
                          <tr>
                            <th className="p-3.5">Customer Name</th>
                            <th className="p-3.5">Phone</th>
                            <th className="p-3.5">Email</th>
                            <th className="p-3.5">Total Orders</th>
                            <th className="p-3.5">Last Order</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5 text-right">Contact</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EFE8DC]">
                          {customers.map((cust) => (
                            <tr key={cust.id} className="hover:bg-white transition-colors">
                              <td className="p-3.5 font-medium text-blue-950">
                                {cust.full_name}
                              </td>
                              <td className="p-3.5 font-mono text-slate-700">
                                {cust.phone || 'N/A'}
                              </td>
                              <td className="p-3.5 text-slate-600">
                                {cust.email || 'N/A'}
                              </td>
                              <td className="p-3.5 font-bold text-blue-600">
                                {cust.order_count}
                              </td>
                              <td className="p-3.5 text-slate-600">
                                {cust.last_order_at ? new Date(cust.last_order_at).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                                  cust.is_guest
                                    ? 'bg-gray-100 text-gray-700 border-gray-300'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                }`}>
                                  {cust.is_guest ? 'Guest' : 'Registered Member'}
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                {cust.phone && (
                                  <a
                                    href={getCustomerDirectWhatsAppUrl(cust.phone, `Assalam-o-Alaikum ${cust.full_name}, greetings from Boutique Stitching (Sadiqabad)!`)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>Chat</span>
                                  </a>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {customers.length === 0 && (
                      <div className="p-8 text-center text-xs text-slate-600">
                        No customer accounts recorded yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: MEASUREMENTS REFERENCE */}
              {activeTab === 'measurements' && (
                <div className="space-y-4">
                  <div className="p-4 bg-white border border-blue-100 rounded-xl shadow-2xs">
                    <h4 className="text-sm font-semibold text-blue-950">
                      {t('adminTabMeasurements')} Reference Lookup
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Master tailoring reference table extracted across customer orders for quick studio review.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders
                      .filter((o) => o.measurements)
                      .map((order) => {
                        const m = order.measurements!;
                        return (
                          <div
                            key={order.id}
                            className="bg-white border border-blue-100 rounded-xl p-4 space-y-3 shadow-2xs"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DC]">
                              <div>
                                <p className="text-xs font-bold text-blue-950">{order.customer_name}</p>
                                <p className="font-mono text-[11px] text-blue-600">{order.order_number}</p>
                              </div>
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#F5EDE1] text-blue-600 rounded border border-[#DECBB4]">
                                {m.unit || 'inches'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              {m.kameez_length && <div><span className="text-slate-600">Kameez:</span> <strong className="text-[#2B2721]">{m.kameez_length}</strong></div>}
                              {m.chest && <div><span className="text-slate-600">Chest:</span> <strong className="text-[#2B2721]">{m.chest}</strong></div>}
                              {m.waist && <div><span className="text-slate-600">Waist:</span> <strong className="text-[#2B2721]">{m.waist}</strong></div>}
                              {m.hips && <div><span className="text-slate-600">Hips:</span> <strong className="text-[#2B2721]">{m.hips}</strong></div>}
                              {m.shoulder && <div><span className="text-slate-600">Shoulder:</span> <strong className="text-[#2B2721]">{m.shoulder}</strong></div>}
                              {m.armhole && <div><span className="text-slate-600">Armhole:</span> <strong className="text-[#2B2721]">{m.armhole}</strong></div>}
                              {m.sleeve_length && <div><span className="text-slate-600">Sleeves:</span> <strong className="text-[#2B2721]">{m.sleeve_length}</strong></div>}
                              {m.trouser_length && <div><span className="text-slate-600">Trouser:</span> <strong className="text-[#2B2721]">{m.trouser_length}</strong></div>}
                              {m.shalwar_length && <div><span className="text-slate-600">Shalwar:</span> <strong className="text-[#2B2721]">{m.shalwar_length}</strong></div>}
                            </div>

                            {m.additional_measurements && (
                              <div className="p-2 bg-white rounded text-[11px] text-slate-500 border border-blue-100">
                                <em>Notes:</em> {m.additional_measurements}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => setDetailOrder(order)}
                              className="w-full py-1.5 text-xs text-center font-medium text-[#2B2721] bg-[#F2ECE1] hover:bg-[#E8DFD0] rounded transition-colors"
                            >
                              Open Full Order Sheet
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* TAB 5: WHATSAPP CENTER */}
              {activeTab === 'whatsapp' && (
                <div className="space-y-6 max-w-4xl">
                  <div className="p-4 bg-white border border-blue-100 rounded-xl shadow-2xs">
                    <h4 className="text-sm font-semibold text-blue-950 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>{t('adminTabWhatsApp')} &amp; Customer Communication</span>
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Generate standardized Pakistani boutique WhatsApp messages with order references and precision details.
                    </p>
                  </div>

                  {/* Order Selector */}
                  <div className="bg-white border border-blue-100 rounded-xl p-5 space-y-4 shadow-2xs">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#665B4C] mb-1.5">
                        Select Stitching Order
                      </label>
                      <select
                        value={waSelectedOrder?.id || ''}
                        onChange={(e) => {
                          const found = orders.find((o) => o.id === e.target.value);
                          setWaSelectedOrder(found || null);
                        }}
                        className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="">-- Choose an order to contact --</option>
                        {orders.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.order_number} — {o.customer_name} ({o.phone}) · {o.service_type}
                          </option>
                        ))}
                      </select>
                    </div>

                    {waSelectedOrder && (
                      <>
                        {/* Template Type Selector */}
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#665B4C] mb-1.5">
                            Select Message Template
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                              type="button"
                              onClick={() => setWaTemplateType('confirm')}
                              className={`p-2.5 text-xs font-medium rounded-lg border transition-colors ${
                                waTemplateType === 'confirm'
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-slate-700 border-blue-200 hover:bg-[#F0EBE1]'
                              }`}
                            >
                              Order Confirmed
                            </button>
                            <button
                              type="button"
                              onClick={() => setWaTemplateType('measurements')}
                              className={`p-2.5 text-xs font-medium rounded-lg border transition-colors ${
                                waTemplateType === 'measurements'
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-slate-700 border-blue-200 hover:bg-[#F0EBE1]'
                              }`}
                            >
                              Measurements Review
                            </button>
                            <button
                              type="button"
                              onClick={() => setWaTemplateType('ready')}
                              className={`p-2.5 text-xs font-medium rounded-lg border transition-colors ${
                                waTemplateType === 'ready'
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-slate-700 border-blue-200 hover:bg-[#F0EBE1]'
                              }`}
                            >
                              Outfit Ready
                            </button>
                            <button
                              type="button"
                              onClick={() => setWaTemplateType('inquiry')}
                              className={`p-2.5 text-xs font-medium rounded-lg border transition-colors ${
                                waTemplateType === 'inquiry'
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-slate-700 border-blue-200 hover:bg-[#F0EBE1]'
                              }`}
                            >
                              General Inquiry
                            </button>
                          </div>
                        </div>

                        {/* Editable Message Body */}
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#665B4C] mb-1.5">
                            Prepared WhatsApp Message (Editable)
                          </label>
                          <textarea
                            rows={8}
                            value={waCustomMessage}
                            onChange={(e) => setWaCustomMessage(e.target.value)}
                            className="w-full p-3 font-mono text-xs bg-white border border-blue-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <a
                            href={getCustomerDirectWhatsAppUrl(waSelectedOrder.phone, waCustomMessage)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Launch WhatsApp Chat with Customer</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(waCustomMessage);
                              setWaCopied(true);
                              setTimeout(() => setWaCopied(false), 2500);
                            }}
                            className="px-4 py-2.5 text-xs font-medium text-slate-700 bg-[#F2ECE1] hover:bg-[#E8DFD0] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            {waCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-semibold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Message</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: SETTINGS & ATELIER INFO */}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-3xl">
                  <div className="p-4 bg-white border border-blue-100 rounded-xl shadow-2xs">
                    <h4 className="text-sm font-semibold text-blue-950">
                      {t('adminTabSettings')} &amp; Security Overview
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Atelier configuration, verified credentials, and database authorization parameters.
                    </p>
                  </div>

                  <div className="bg-white border border-blue-100 rounded-xl p-5 space-y-4 shadow-2xs text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
                      <span className="text-slate-600">Atelier Physical Location</span>
                      <strong className="text-blue-950">Sadiqabad, Punjab, Pakistan</strong>
                    </div>

                    <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
                      <span className="text-slate-600">Active Staff Session</span>
                      <strong className="text-blue-950 font-mono">{user?.email}</strong>
                    </div>

                    <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
                      <span className="text-slate-600">Security Authorization Level</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {userRole}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
                      <span className="text-slate-600">Database Backend</span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Supabase Live Connected
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC]">
                      <span className="text-slate-600">Business WhatsApp Status</span>
                      <span className="text-blue-600 font-medium">
                        {WHATSAPP_CONFIG.isConfigured ? WHATSAPP_CONFIG.phoneNumber : 'Pending Owner Phone Provision'}
                      </span>
                    </div>

                    <div className="p-3.5 bg-white border border-blue-100 rounded-lg text-[11px] text-slate-600 leading-relaxed">
                      <strong>Role Security Note:</strong> RLS triggers actively prevent customer accounts from modifying their own roles. Only certified administrators can configure atelier access.
                    </div>
                  </div>

                  {/* SUPABASE CLOUD DATABASE & REALTIME AUTH INTEGRATION */}
                  <div className="bg-white border border-blue-100 rounded-xl p-5 space-y-4 shadow-2xs text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-blue-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                          <Database className="w-4 h-4 text-emerald-700" />
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-blue-950 flex items-center gap-2">
                            <span>Supabase Cloud Database &amp; Auth</span>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Active
                            </span>
                          </h5>
                          <p className="text-[11px] text-slate-500">
                            Remote cloud database powering orders, profiles, measurements, and catalog sync.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleTestSupabase}
                          disabled={supabaseTestLoading}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          {supabaseTestLoading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Pinging...</span>
                            </>
                          ) : (
                            <>
                              <Activity className="w-3.5 h-3.5" />
                              <span>Test Connection</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsEditingSupabaseConfig(!isEditingSupabaseConfig)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          {isEditingSupabaseConfig ? 'Cancel Edit' : 'Edit Credentials'}
                        </button>
                      </div>
                    </div>

                    {/* Test Result Banner */}
                    {supabaseTestResult && (
                      <div
                        className={`p-3.5 rounded-lg border text-xs space-y-2.5 ${
                          supabaseTestResult.tablesReady === false
                            ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                            : supabaseTestResult.success
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            {supabaseTestResult.tablesReady === false ? (
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            ) : supabaseTestResult.success ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="font-semibold text-xs leading-snug">{supabaseTestResult.message}</p>
                              {supabaseTestResult.latencyMs !== undefined && (
                                <p className="text-[11px] opacity-80 mt-0.5">
                                  Server Ping Latency: <strong>{supabaseTestResult.latencyMs} ms</strong>
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSupabaseTestResult(null)}
                            className="text-slate-400 hover:text-slate-600 text-xs shrink-0 cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>

                        {/* If tables are missing, show immediate 1-click action */}
                        {supabaseTestResult.tablesReady === false && (
                          <div className="pt-2 border-t border-amber-200/80 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={handleCopyMasterSql}
                              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            >
                              {sqlCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                                  <span>SQL Script Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Complete SQL Script</span>
                                </>
                              )}
                            </button>

                            <a
                              href="https://supabase.com/dashboard/project/spuaqghmkdtcblggvzqm/sql"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/50 font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                            >
                              <span>Open Supabase SQL Editor</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            <button
                              type="button"
                              onClick={() => setShowSqlModal(true)}
                              className="px-2.5 py-1.5 text-[11px] text-amber-800 hover:underline cursor-pointer"
                            >
                              View Script Details
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Save Confirmation */}
                    {supabaseSaveSuccess && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Supabase configuration updated and reloaded successfully!</span>
                      </div>
                    )}

                    {/* Supabase Parameters Display / Edit Form */}
                    {!isEditingSupabaseConfig ? (
                      <div className="space-y-2.5 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                          <span className="text-slate-600 font-medium">Project Endpoint (URL):</span>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono text-slate-800 select-all">
                              {supabaseConfig.url || 'Not configured'}
                            </code>
                            <button
                              type="button"
                              onClick={() => {
                                if (supabaseConfig.url) {
                                  navigator.clipboard.writeText(supabaseConfig.url);
                                }
                              }}
                              className="text-slate-500 hover:text-slate-700 p-1 rounded"
                              title="Copy URL"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                          <span className="text-slate-600 font-medium">Publishable / Anon API Key:</span>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono text-slate-800 select-all max-w-[280px] sm:max-w-[360px] truncate">
                              {supabaseConfig.anonKey
                                ? `${supabaseConfig.anonKey.substring(0, 20)}...${supabaseConfig.anonKey.slice(-10)}`
                                : 'Not configured'}
                            </code>
                            <button
                              type="button"
                              onClick={() => {
                                if (supabaseConfig.anonKey) {
                                  navigator.clipboard.writeText(supabaseConfig.anonKey);
                                }
                              }}
                              className="text-slate-500 hover:text-slate-700 p-1 rounded"
                              title="Copy Full Key"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveSupabaseConfig} className="space-y-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Supabase Project URL
                          </label>
                          <input
                            type="url"
                            value={customSupabaseUrlInput}
                            onChange={(e) => setCustomSupabaseUrlInput(e.target.value)}
                            placeholder="https://spuaqghmkdtcblggvzqm.supabase.co"
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Supabase Publishable / Anon Key
                          </label>
                          <input
                            type="text"
                            value={customSupabaseKeyInput}
                            onChange={(e) => setCustomSupabaseKeyInput(e.target.value)}
                            placeholder="sb_publishable_..."
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                            required
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={handleResetSupabaseConfig}
                            className="text-[11px] text-slate-500 hover:text-red-600 underline"
                          >
                            Reset to Default Credentials
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsEditingSupabaseConfig(false)}
                              className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
                            >
                              Save Supabase Settings
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {/* Master Database SQL Setup Section */}
                    <div className="bg-[#FAF8F5] border border-[#EFE8DC] p-3.5 rounded-lg space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
                          <FileCode className="w-4 h-4 text-emerald-700" />
                          <span>Supabase Database Schema &amp; Tables (15 Tables)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCopyMasterSql}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-[11px] font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                          >
                            {sqlCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-200" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Setup SQL</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSqlModal(!showSqlModal)}
                            className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-[11px] font-medium cursor-pointer"
                          >
                            {showSqlModal ? 'Hide SQL' : 'View SQL'}
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Aap ki website ka data (Orders, Measurements, Posters, Services, Reviews, Salaries, etc.) Supabase se synced hai. Agar Supabase par abhi tables nahi bani hain to <strong>&ldquo;Copy Setup SQL&rdquo;</strong> daba kar Supabase SQL Editor mein paste karein aur Run dabayein.
                      </p>

                      {showSqlModal && (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>PostgreSQL DDL (350+ lines)</span>
                            <a
                              href="https://supabase.com/dashboard/project/spuaqghmkdtcblggvzqm/sql"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
                            >
                              <span>Open Supabase SQL Editor</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[10px] font-mono max-h-60 overflow-y-auto whitespace-pre leading-relaxed select-all">
                            {BOUTIQUE_MASTER_SQL}
                          </pre>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                      <span>✓ Synchronized with <strong>spuaqghmkdtcblggvzqm.supabase.co</strong></span>
                      <a
                        href="https://supabase.com/dashboard/project/spuaqghmkdtcblggvzqm"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <span>Supabase Console</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* BOUTIQUE VIDEO SHOWCASE CONFIGURATION (HOMEPAGE) */}
                  <div className="bg-white border border-blue-100 rounded-xl p-5 space-y-4 shadow-2xs text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-blue-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                          <Film className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-blue-950">
                            Boutique Video Showcase Settings
                          </h5>
                          <p className="text-[11px] text-slate-500">
                            Configure the homepage video section (YouTube or direct MP4 stream).
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                          videoSettings.isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {videoSettings.isActive ? 'Active on Homepage' : 'Hidden'}
                      </span>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!isStaff && !isAdmin) {
                          alert('Only authorized administrators or staff may change video settings.');
                          return;
                        }
                        saveVideoConfig(videoSettings);
                        setVideoSaved(true);
                        setTimeout(() => setVideoSaved(false), 3000);
                      }}
                      className="space-y-4"
                    >
                      {/* Active Status Switch */}
                      <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                        <div>
                          <span className="text-xs font-semibold text-blue-950 block">
                            Display Video Section on Homepage
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Shows the &ldquo;Discover Our Boutique&rdquo; video showcase to website visitors.
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={videoSettings.isActive}
                            onChange={(e) =>
                              setVideoSettings({ ...videoSettings, isActive: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {/* Video URL */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">
                            Video Source URL (YouTube link or MP4 file)
                          </label>
                          {videoSettings.videoUrl && (
                            <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {getYouTubeVideoId(videoSettings.videoUrl)
                                ? `YouTube: ${getYouTubeVideoId(videoSettings.videoUrl)}`
                                : isDirectVideoUrl(videoSettings.videoUrl)
                                ? 'MP4 Video Stream'
                                : 'Custom Video Source'}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={videoSettings.videoUrl}
                          onChange={(e) =>
                            setVideoSettings({ ...videoSettings, videoUrl: e.target.value })
                          }
                          placeholder="e.g. https://www.youtube.com/watch?v=VIDEO_ID or /videos/boutique.mp4"
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          Insert your YouTube video link or direct MP4 stream URL. If empty, the boutique craftsmanship poster with 12 features will be showcased.
                        </p>
                      </div>

                      {/* Video Title */}
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Section Title (Optional Custom Override)
                        </label>
                        <input
                          type="text"
                          value={videoSettings.title}
                          onChange={(e) =>
                            setVideoSettings({ ...videoSettings, title: e.target.value })
                          }
                          placeholder="Discover Our Boutique"
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>

                      {/* Poster / Thumbnail URL */}
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Video Poster / Thumbnail Image URL
                        </label>
                        <input
                          type="text"
                          value={videoSettings.posterUrl}
                          onChange={(e) =>
                            setVideoSettings({ ...videoSettings, posterUrl: e.target.value })
                          }
                          placeholder="/src/assets/images/craftsmanship_custom_tailoring_1791431948318.jpg"
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-[11px]"
                        />
                      </div>

                      {/* Save & Feedback */}
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          {videoSaved ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1.5 text-xs">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Video settings updated &amp; synchronized!
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              Changes apply immediately to the website without rebuilding.
                            </span>
                          )}
                        </div>

                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Video Settings</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </main>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* ORDER SPECIFICATION DETAIL MODAL / DRAWER */}
      {/* ========================================================================= */}
      {detailOrder && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-4xl w-full max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden flex flex-col my-auto">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-blue-50 border-b border-blue-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-blue-600 text-blue-200 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-serif-display font-semibold text-blue-950">
                      {detailOrder.order_number}
                    </h3>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getStatusBadge(detailOrder.status)}`}>
                      {getStatusLabel(detailOrder.status)}
                    </span>
                  </div>
                  <p className="text-xs text-[#7A7163]">
                    Booked on {new Date(detailOrder.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="p-1.5 text-slate-500 hover:text-blue-950 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Order Details Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

              {/* Status Update Control Box */}
              <div className="p-4 bg-white border border-blue-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <span className="text-xs font-semibold text-blue-950">
                    {t('adminStatusUpdate')}
                  </span>
                  <p className="text-[11px] text-slate-600">
                    Updates customer status timeline in real-time.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={detailOrder.status}
                    onChange={(e) => handleStatusChange(detailOrder.id, e.target.value as OrderStatus)}
                    disabled={statusUpdating}
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-blue-200 rounded-lg text-[#2B2721] focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="new">01. New Request</option>
                    <option value="reviewing">02. Under Review</option>
                    <option value="confirmed">03. Confirmed</option>
                    <option value="in_progress">04. In Progress</option>
                    <option value="ready">05. Ready for Pickup</option>
                    <option value="completed">06. Completed</option>
                    <option value="cancelled">07. Cancelled</option>
                  </select>

                  {statusSuccess && (
                    <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Saved
                    </span>
                  )}
                </div>
              </div>

              {/* Customer & Garment Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Info Card */}
                <div className="p-4 bg-white border border-blue-100 rounded-xl space-y-2.5 text-xs">
                  <p className="font-semibold text-xs uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{t('adminCustomerInfo')}</span>
                  </p>
                  <div>
                    <span className="text-slate-600">Full Name:</span>
                    <strong className="block text-sm text-blue-950">{detailOrder.customer_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-600">Phone:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-medium text-[#2B2721]">{detailOrder.phone}</span>
                      <a
                        href={getCustomerDirectWhatsAppUrl(detailOrder.phone, formatStaffGeneralInquiryMessage(detailOrder))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                  {detailOrder.email && (
                    <div>
                      <span className="text-slate-600">Email:</span>
                      <span className="block font-medium text-[#2B2721]">{detailOrder.email}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-600">Audience:</span>
                    <span className="block capitalize font-medium text-[#2B2721]">{detailOrder.customer_type}</span>
                  </div>
                </div>

                {/* Garment Specs Card */}
                <div className="p-4 bg-white border border-blue-100 rounded-xl space-y-2.5 text-xs">
                  <p className="font-semibold text-xs uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5" />
                    <span>{t('adminGarmentSpecs')}</span>
                  </p>
                  <div>
                    <span className="text-slate-600">Service:</span>
                    <strong className="block text-sm text-blue-950">{detailOrder.service_type}</strong>
                  </div>
                  <div>
                    <span className="text-slate-600">Category / Cut:</span>
                    <span className="block font-medium text-[#2B2721]">{detailOrder.category}</span>
                  </div>
                  {detailOrder.special_instructions && (
                    <div>
                      <span className="text-slate-600">Special Customer Instructions:</span>
                      <div className="p-2.5 mt-1 bg-white border border-[#EBE2D4] rounded-lg text-[#3D352B] leading-relaxed">
                        {detailOrder.special_instructions}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tailoring Measurement Sheet */}
              {detailOrder.measurements && (
                <div className="p-4 bg-white border border-blue-100 rounded-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DC]">
                    <p className="font-semibold text-xs uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5" />
                      <span>{t('adminMeasurementsSheet')}</span>
                    </p>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-600 rounded border border-[#DECBB4]">
                      Unit: {detailOrder.measurements.unit || 'inches'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                    {detailOrder.measurements.kameez_length && (
                      <div className="p-2 bg-white rounded border border-[#EDE4D5]">
                        <span className="text-[10px] text-slate-600 block">Kameez Length</span>
                        <strong className="text-blue-950 text-sm">{detailOrder.measurements.kameez_length}</strong>
                      </div>
                    )}
                    {detailOrder.measurements.chest && (
                      <div className="p-2 bg-white rounded border border-[#EDE4D5]">
                        <span className="text-[10px] text-slate-600 block">Chest / Bust</span>
                        <strong className="text-blue-950 text-sm">{detailOrder.measurements.chest}</strong>
                      </div>
                    )}
                    {detailOrder.measurements.waist && (
                      <div className="p-2 bg-white rounded border border-[#EDE4D5]">
                        <span className="text-[10px] text-slate-600 block">Waist</span>
                        <strong className="text-blue-950 text-sm">{detailOrder.measurements.waist}</strong>
                      </div>
                    )}
                    {detailOrder.measurements.hips && (
                      <div className="p-2 bg-white rounded border border-[#EDE4D5]">
                        <span className="text-[10px] text-slate-600 block">Hips / Daman</span>
                        <strong className="text-blue-950 text-sm">{detailOrder.measurements.hips}</strong>
                      </div>
                    )}
                    {detailOrder.measurements.shoulder && (
                      <div className="p-2 bg-white rounded border border-[#EDE4D5]">
                        <span className="text-[10px] text-slate-600 block">Shoulder (Teera)</span>
                        <strong className="text-blue-950 text-sm">{detailOrder.measurements.shoulder}</strong>
                      </div>
                    )}
                    {detailOrder.measurements.armhole && (
                      <div className="p-2 bg-white rounded border border-[#EDE4D5]">
                        <span className="text-[10px] text-slate-600 block">Armhole</span>
                        <strong className="text-blue-950 text-sm">{detailOrder.measurements.armhole}</strong>
                      </div>
                    )}
                    {detailOrder.measurements.sleeve_length && (
                      <div className="p-2 bg-white rounded border border-[#EDE4D5]">
                        <span className="text-[10px] text-slate-600 block">Sleeve Length</span>
                        <strong className="text-blue-950 text-sm">{detailOrder.measurements.sleeve_length}</strong>
                      </div>
                    )}
                    {detailOrder.measurements.trouser_length && (
                      <div className="p-2 bg-white rounded border border-[#EDE4D5]">
                        <span className="text-[10px] text-slate-600 block">Trouser Length</span>
                        <strong className="text-blue-950 text-sm">{detailOrder.measurements.trouser_length}</strong>
                      </div>
                    )}
                    {detailOrder.measurements.shalwar_length && (
                      <div className="p-2 bg-white rounded border border-[#EDE4D5]">
                        <span className="text-[10px] text-slate-600 block">Shalwar Length</span>
                        <strong className="text-blue-950 text-sm">{detailOrder.measurements.shalwar_length}</strong>
                      </div>
                    )}
                  </div>

                  {detailOrder.measurements.additional_measurements && (
                    <div className="p-3 bg-white border border-[#E8DFD3] rounded-lg text-xs text-[#52493D]">
                      <strong>Fitting Preferences:</strong> {detailOrder.measurements.additional_measurements}
                    </div>
                  )}
                </div>
              )}

              {/* Customer Reference Design Image */}
              {previewImageUrl && (
                <div className="p-4 bg-white border border-blue-100 rounded-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DC]">
                    <p className="font-semibold text-xs uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Customer Reference Design</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setLightboxImage(previewImageUrl)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Zoom Image</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <img
                      src={previewImageUrl}
                      alt={detailOrder.reference_image_name || 'Design reference'}
                      onClick={() => setLightboxImage(previewImageUrl)}
                      className="w-24 h-24 object-cover rounded-lg border border-blue-200 cursor-pointer hover:opacity-90"
                    />
                    <div className="text-xs space-y-1">
                      <p className="font-medium text-blue-950">{detailOrder.reference_image_name || 'Attached Design Photo'}</p>
                      <p className="text-slate-600">Click image or zoom button to inspect fine embroidery / stitch detailing.</p>
                      <a
                        href={previewImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open original image</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Internal Staff Notes (Confidential) */}
              <div className="p-4 bg-white border border-blue-100 rounded-xl space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DC]">
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{t('adminInternalNotes')}</span>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {t('adminNotesConfidential')}
                    </p>
                  </div>
                </div>

                {/* New Note Form */}
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder={t('adminNotePlaceholder')}
                    className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingNote || !newNoteText.trim()}
                      className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg shadow-xs transition-colors"
                    >
                      {submittingNote ? 'Recording...' : t('adminSaveNote')}
                    </button>
                  </div>
                </form>

                {/* Notes History */}
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div key={note.id} className="p-2.5 bg-white border border-[#EAE1D3] rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[#8A7F70]">
                        <span className="font-semibold text-[#5C5243]">{note.author_name}</span>
                        <span>{new Date(note.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-[#2B2721] leading-relaxed">{note.note}</p>
                    </div>
                  ))}

                  {notes.length === 0 && (
                    <p className="text-xs text-[#8A7F70] italic">
                      No internal notes recorded for this order yet.
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-blue-50 border-t border-blue-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <a
                href={getCustomerDirectWhatsAppUrl(detailOrder.phone, formatStaffOrderConfirmationMessage(detailOrder))}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{t('adminWhatsAppContact')}</span>
              </a>

              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#3D3325] bg-blue-50/70 hover:bg-[#E5D7C2] rounded-lg transition-colors"
              >
                Close Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for Zoom Image Preview */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-70 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Zoomed Reference Design"
              className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-amber-300 font-bold text-sm"
            >
              Close Zoom (ESC)
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT ITEM WITH PRICE MODAL */}
      {/* ========================================================================= */}
      {isPriceItemModalOpen && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-lg w-full bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-serif-display font-bold text-blue-950">
                    {editingPriceItemId
                      ? formatText('Edit Item & Price', 'آئٹم اور قیمت تبدیل کریں', 'Edit Item & Price')
                      : formatText('Add New Item with Price', 'قیمت کے ساتھ نیا آئٹم شامل کریں', 'Add New Item with Price')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {formatText('Set title, clothing category, and prices in PKR', 'عنوان، کیٹیگری اور روپے میں قیمت درج کریں', 'Set title, category and PKR prices')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsPriceItemModalOpen(false);
                  setEditingPriceItemId(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePriceItem} className="p-4 sm:p-6 space-y-4">
              {priceItemError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{priceItemError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  {formatText('Item Title *', 'آئٹم کا نام *', 'Item Title *')}
                </label>
                <input
                  type="text"
                  required
                  value={priceItemTitle}
                  onChange={(e) => setPriceItemTitle(e.target.value)}
                  placeholder="e.g. Lawn Embroidered 3-Piece Festive Suit"
                  className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  {formatText('Category *', 'کیٹیگری *', 'Category *')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriceItemCategory('ladies')}
                    className={`py-2 px-3 text-xs rounded-lg font-medium border text-center transition-all ${
                      priceItemCategory === 'ladies'
                        ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Ladies Collection
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceItemCategory('kids')}
                    className={`py-2 px-3 text-xs rounded-lg font-medium border text-center transition-all ${
                      priceItemCategory === 'kids'
                        ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Kids Collection
                  </button>
                </div>
              </div>

              {/* Prices: Original and Sale Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    {formatText('Original Price (PKR) *', 'اصل قیمت (روپے) *', 'Original Price (PKR) *')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-mono text-slate-400">Rs.</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={priceItemOriginalPrice}
                      onChange={(e) => setPriceItemOriginalPrice(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-white border border-blue-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    {formatText('Sale Price (PKR) *', 'سیل قیمت (روپے) *', 'Sale Price (PKR) *')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-mono text-slate-400">Rs.</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={priceItemSalePrice}
                      onChange={(e) => setPriceItemSalePrice(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold bg-white border border-blue-200 rounded-lg text-emerald-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Live Discount Calculator Preview */}
              {(() => {
                const orig = parseFloat(priceItemOriginalPrice) || 0;
                const sale = parseFloat(priceItemSalePrice) || 0;
                if (orig > 0 && sale <= orig && sale >= 0) {
                  const discount = Math.round(((orig - sale) / orig) * 100);
                  const savings = orig - sale;
                  return (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                      <span className="text-emerald-800 font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Discount: <strong>{discount}% OFF</strong></span>
                      </span>
                      <span className="text-emerald-700 font-mono text-[11px]">
                        Customer saves: PKR {savings.toLocaleString()}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Preset Image Chooser */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  {formatText('Garment Photo (Select Preset or URL)', 'تصویر منتخب کریں', 'Garment Photo')}
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
                      onClick={() => setPriceItemImageUrl(imgSrc)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        priceItemImageUrl === imgSrc
                          ? 'border-blue-600 ring-2 ring-blue-300'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img src={imgSrc} alt="Preset garment" className="w-full h-full object-cover" />
                      {priceItemImageUrl === imgSrc && (
                        <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={priceItemImageUrl}
                  onChange={(e) => setPriceItemImageUrl(e.target.value)}
                  placeholder="Custom image URL..."
                  className="w-full px-3 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsPriceItemModalOpen(false);
                    setEditingPriceItemId(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  {formatText('Cancel', 'منسوخ', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={priceItemSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {priceItemSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingPriceItemId ? 'Update Item & Price' : 'Save Item & Price'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE ITEM CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {itemToDelete && (
        <div
          className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
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
                  {formatText('This action will permanently delete this item from the catalog.', 'یہ عمل اس آئٹم کو کیٹلاگ سے ہمیشہ کے لیے ڈیلیٹ کر دے گا۔', 'This action will delete this item from the catalog.')}
                </p>
              </div>
            </div>

            {/* Target Item Card Preview */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
              <img
                src={itemToDelete.image_url}
                alt={itemToDelete.title}
                className="w-12 h-12 rounded-lg object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{itemToDelete.title}</p>
                <p className="text-[11px] text-emerald-700 font-mono font-bold mt-0.5">
                  PKR {itemToDelete.sale_price.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeletingItem}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {formatText('Cancel', 'منسوخ', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleDeletePriceItem(itemToDelete.id)}
                disabled={isDeletingItem}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isDeletingItem ? (
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

    </div>
  );
};
