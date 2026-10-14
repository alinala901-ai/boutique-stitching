import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { StitchingOrder, OrderStatus, CustomerSavedMeasurements } from '../types';
import { fetchOrdersForUser } from '../lib/supabase';
import { OrderStatusTracker } from './OrderStatusTracker';
import { formatWhatsAppConsultationMessage, getWhatsAppUrl } from '../config/whatsapp';
import {
  X,
  User as UserIcon,
  Package,
  Ruler,
  Settings,
  LogOut,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  ChevronRight,
  Save,
  PlusCircle,
  Shield,
} from 'lucide-react';

interface CustomerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onNewOrder: () => void;
  onOpenMeasurementGuide?: () => void;
  onOpenAdminPortal?: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  isOpen,
  onClose,
  onNewOrder,
  onOpenMeasurementGuide,
  onOpenAdminPortal,
}) => {
  const { language, formatText, t } = useLanguage();
  const { user, profile, savedMeasurements, signOut, updateProfile, saveMeasurements, isStaff, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'orders' | 'measurements' | 'profile'>('orders');
  const [orders, setOrders] = useState<StitchingOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<StitchingOrder | null>(null);
  const [waCopied, setWaCopied] = useState(false);

  // Profile Edit State
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Saved Measurements State
  const [measCustomerType, setMeasCustomerType] = useState<'ladies' | 'kids'>('ladies');
  const [measUnit, setMeasUnit] = useState<'inches' | 'cm'>('inches');
  const [kameezLength, setKameezLength] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [shoulder, setShoulder] = useState('');
  const [armhole, setArmhole] = useState('');
  const [sleeveLength, setSleeveLength] = useState('');
  const [trouserLength, setTrouserLength] = useState('');
  const [shalwarLength, setShalwarLength] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [measSuccess, setMeasSuccess] = useState(false);

  // Populate state from user & profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    if (savedMeasurements) {
      setMeasCustomerType(savedMeasurements.customer_type || 'ladies');
      setMeasUnit(savedMeasurements.unit || 'inches');
      setKameezLength(savedMeasurements.kameez_length || '');
      setChest(savedMeasurements.chest || '');
      setWaist(savedMeasurements.waist || '');
      setHips(savedMeasurements.hips || '');
      setShoulder(savedMeasurements.shoulder || '');
      setArmhole(savedMeasurements.armhole || '');
      setSleeveLength(savedMeasurements.sleeve_length || '');
      setTrouserLength(savedMeasurements.trouser_length || '');
      setShalwarLength(savedMeasurements.shalwar_length || '');
      setAdditionalNotes(savedMeasurements.additional_measurements || '');
    }
  }, [savedMeasurements]);

  const loadUserOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const data = await fetchOrdersForUser(user.id);
      setOrders(data);
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      loadUserOrders();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(false);
    const res = await updateProfile({ full_name: fullName, phone });
    if (res.success) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2500);
    }
  };

  const handleSaveMeasurements = async (e: React.FormEvent) => {
    e.preventDefault();
    setMeasSuccess(false);
    const res = await saveMeasurements({
      customer_type: measCustomerType,
      unit: measUnit,
      kameez_length: kameezLength || undefined,
      chest: chest || undefined,
      waist: waist || undefined,
      hips: hips || undefined,
      shoulder: shoulder || undefined,
      armhole: armhole || undefined,
      sleeve_length: sleeveLength || undefined,
      trouser_length: trouserLength || undefined,
      shalwar_length: shalwarLength || undefined,
      additional_measurements: additionalNotes || undefined,
    });
    if (res.success) {
      setMeasSuccess(true);
      setTimeout(() => setMeasSuccess(false), 2500);
    }
  };

  const handleWhatsAppOrderInquiry = (order: StitchingOrder) => {
    const msg = formatWhatsAppConsultationMessage(order, order.measurements);
    const { url, isConfigured } = getWhatsAppUrl(msg);
    if (isConfigured && url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      navigator.clipboard.writeText(msg);
      setWaCopied(true);
      setTimeout(() => setWaCopied(false), 3000);
    }
  };

  const activeOrdersCount = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length;
  const completedOrdersCount = orders.filter((o) => o.status === 'completed').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-blue-950/80 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-w-4xl w-full bg-white rounded-xl shadow-2xl border border-blue-100 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        
        {/* Top Bar */}
        <div className="p-5 sm:p-6 bg-blue-50 border-b border-blue-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-blue-200 flex items-center justify-center font-serif-display font-semibold text-lg">
              {(profile?.full_name || user.email || 'C')[0].toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-serif-display font-semibold text-blue-950">
                {profile?.full_name || user.email?.split('@')[0]}
              </h3>
              <p className="text-xs text-blue-700 font-light">
                {user.email} · Customer Account
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-blue-950 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dashboard Tabs & Action Buttons */}
        <div className="px-6 py-2.5 bg-blue-50/70 border-b border-blue-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('orders');
                setSelectedOrder(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-blue-950'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>{formatText('My Orders', 'میرے آرڈرز', 'Mere Orders')} ({orders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('measurements');
                setSelectedOrder(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'measurements'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-blue-950'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>{formatText('Saved Measurements', 'محفوظ شدہ ناپ', 'Mehfooz Naap')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
                setSelectedOrder(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-blue-950'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{formatText('Profile Settings', 'پروفائل سیٹنگز', 'Profile Settings')}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isStaff && onOpenAdminPortal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminPortal();
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-800 hover:bg-blue-900 border border-blue-900 rounded flex items-center gap-1.5 shadow-xs transition-colors"
                title={formatText('Atelier Admin Dashboard', 'ایڈمن ڈیش بورڈ', 'Admin Dashboard')}
              >
                <Shield className="w-3.5 h-3.5 text-blue-300" />
                <span>{formatText('Admin Portal', 'ایڈمن پورٹل', 'Admin Portal')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onNewOrder();
              }}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-1 shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{formatText('New Order', 'نیا سوٹ بک کریں', 'Naya Suit Book Karein')}</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await signOut();
                onClose();
              }}
              className="p-1.5 text-slate-700 hover:text-red-700 rounded transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: MY ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-blue-100 rounded-lg">
                  <p className="text-[11px] uppercase tracking-wider text-blue-700 font-semibold">
                    Active Orders
                  </p>
                  <p className="text-2xl font-serif-display font-semibold text-blue-950 mt-1">
                    {activeOrdersCount}
                  </p>
                </div>
                <div className="p-4 bg-white border border-blue-100 rounded-lg">
                  <p className="text-[11px] uppercase tracking-wider text-blue-700 font-semibold">
                    Completed
                  </p>
                  <p className="text-2xl font-serif-display font-semibold text-blue-950 mt-1">
                    {completedOrdersCount}
                  </p>
                </div>
                <div className="p-4 bg-white border border-blue-100 rounded-lg">
                  <p className="text-[11px] uppercase tracking-wider text-blue-700 font-semibold">
                    Total Consultations
                  </p>
                  <p className="text-2xl font-serif-display font-semibold text-blue-950 mt-1">
                    {orders.length}
                  </p>
                </div>
              </div>

              {selectedOrder ? (
                /* Detailed Order Inspection View */
                <div className="bg-white border border-blue-100 rounded-xl p-6 space-y-6 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-4 border-b border-blue-100">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      ← Back to All Orders
                    </button>
                    <span className="text-xs font-mono font-bold text-blue-950">
                      {selectedOrder.order_number}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-serif-display font-semibold text-blue-950 mb-3">
                      Order Status &amp; Progress
                    </h4>
                    <OrderStatusTracker
                      status={selectedOrder.status}
                      updatedAt={selectedOrder.updated_at}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-white border border-blue-100 rounded-lg">
                      <p className="font-semibold text-blue-700 uppercase mb-1">
                        Garment &amp; Service
                      </p>
                      <p className="font-semibold text-sm text-blue-950">
                        {selectedOrder.service_type}
                      </p>
                      <p className="text-slate-600 mt-0.5">
                        Style: {selectedOrder.category} ({selectedOrder.customer_type === 'kids' ? 'Kids' : 'Ladies'})
                      </p>
                      <p className="text-slate-500 mt-1">
                        Ordered: {new Date(selectedOrder.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="p-4 bg-white border border-blue-100 rounded-lg">
                      <p className="font-semibold text-blue-700 uppercase mb-1">
                        Contact Details
                      </p>
                      <p className="font-semibold text-sm text-blue-950">
                        {selectedOrder.customer_name}
                      </p>
                      <p className="text-slate-600 mt-0.5 font-mono">
                        Phone: {selectedOrder.phone}
                      </p>
                      {selectedOrder.email && (
                        <p className="text-slate-600 mt-0.5">Email: {selectedOrder.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Measurements */}
                  {selectedOrder.measurements && (
                    <div className="p-4 bg-white border border-blue-100 rounded-lg">
                      <p className="font-semibold text-xs text-blue-700 uppercase mb-2">
                        Measurements for this Outfit ({selectedOrder.measurements.unit})
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        {selectedOrder.measurements.kameez_length && (
                          <span>• Kameez: {selectedOrder.measurements.kameez_length}</span>
                        )}
                        {selectedOrder.measurements.chest && (
                          <span>• Chest: {selectedOrder.measurements.chest}</span>
                        )}
                        {selectedOrder.measurements.waist && (
                          <span>• Waist: {selectedOrder.measurements.waist}</span>
                        )}
                        {selectedOrder.measurements.hips && (
                          <span>• Hips: {selectedOrder.measurements.hips}</span>
                        )}
                        {selectedOrder.measurements.shoulder && (
                          <span>• Shoulder: {selectedOrder.measurements.shoulder}</span>
                        )}
                        {selectedOrder.measurements.armhole && (
                          <span>• Armhole: {selectedOrder.measurements.armhole}</span>
                        )}
                        {selectedOrder.measurements.sleeve_length && (
                          <span>• Sleeves: {selectedOrder.measurements.sleeve_length}</span>
                        )}
                        {selectedOrder.measurements.trouser_length && (
                          <span>• Trouser: {selectedOrder.measurements.trouser_length}</span>
                        )}
                        {selectedOrder.measurements.shalwar_length && (
                          <span>• Shalwar: {selectedOrder.measurements.shalwar_length}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reference Image */}
                  {selectedOrder.reference_image_url && (
                    <div className="p-4 bg-white border border-blue-100 rounded-lg flex items-center gap-4">
                      <img
                        src={selectedOrder.reference_image_url}
                        alt="Design Reference"
                        className="w-16 h-16 object-cover rounded border"
                      />
                      <div>
                        <p className="text-xs font-semibold text-blue-950">
                          {selectedOrder.reference_image_name || 'Design Reference Photo'}
                        </p>
                        <a
                          href={selectedOrder.reference_image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <ExternalLink className="w-3 h-3" /> View Image
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
                    {waCopied ? (
                      <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md font-medium">
                        {formatText(
                          '✓ Order summary copied to clipboard!',
                          '✓ آرڈر کا خلاصہ کاپی ہو گیا!',
                          '✓ Order ka khulasa clipboard par copy ho gaya!'
                        )}
                      </span>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => handleWhatsAppOrderInquiry(selectedOrder)}
                      className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-blue-200" />
                      <span>{formatText('Inquire via WhatsApp', 'واٹس ایپ پر رابطہ کریں', 'WhatsApp Par Rabta Karein')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Orders List */
                <div className="space-y-3">
                  {loadingOrders ? (
                    <div className="p-12 text-center text-xs text-slate-500">
                      {formatText('Loading your orders...', 'آرڈرز لوڈ ہو رہے ہیں...', 'Aap kay orders load ho rahay hain...')}
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="p-12 text-center bg-white border border-blue-100 rounded-xl space-y-3">
                      <Package className="w-10 h-10 text-blue-300 mx-auto" />
                      <h4 className="text-base font-serif-display font-semibold text-blue-950">
                        {formatText('No Orders Placed Yet', 'ابھی تک کوئی آرڈر نہیں ہے', 'Abhi Tak Koi Order Nahi Hai')}
                      </h4>
                      <p className="text-xs text-slate-500 font-light max-w-sm mx-auto">
                        {formatText(
                          'Book your first bespoke tailoring consultation and track atelier craftsmanship in real time.',
                          'اپنی پہلی کسٹم سلائی بک کروائیں اور گھر بیٹھے اپنا آرڈر ٹریک کریں۔',
                          'Apni pehli custom silai ki booking karein aur ghar baithay apna order track karein.'
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNewOrder();
                        }}
                        className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded mt-2"
                      >
                        {t('bookCTA')}
                      </button>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="p-4 bg-white border border-blue-100 hover:border-[#9B7B4B] rounded-lg transition-all cursor-pointer shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-bold text-blue-950">
                              {order.order_number}
                            </span>
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-blue-950">
                            {order.service_type} ({order.customer_type === 'kids' ? 'Kids' : 'Ladies'})
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Style: {order.category}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                          <span className="p-1 rounded bg-white text-blue-600 group-hover:translate-x-1 transition-transform">
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVED MEASUREMENTS */}
          {activeTab === 'measurements' && (
            <div className="bg-white border border-blue-100 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-blue-100 gap-3">
                <div>
                  <h4 className="text-lg font-serif-display font-semibold text-blue-950">
                    {formatText('My Saved Measurements Profile', 'آپ کا محفوظ شدہ ناپ', 'Aap Ka Mehfooz Naap')}
                  </h4>
                  <p className="text-xs text-slate-500 font-light mt-0.5">
                    Save your body sizing once and reuse it for all future tailoring orders.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenMeasurementGuide && (
                    <button
                      type="button"
                      onClick={onOpenMeasurementGuide}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded"
                    >
                      Measurement Guide
                    </button>
                  )}

                  {/* Unit Selector */}
                  <div className="inline-flex p-0.5 bg-blue-50/70 rounded border border-blue-200">
                    <button
                      type="button"
                      onClick={() => setMeasUnit('inches')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded ${
                        measUnit === 'inches' ? 'bg-blue-600 text-white' : 'text-slate-500'
                      }`}
                    >
                      Inches
                    </button>
                    <button
                      type="button"
                      onClick={() => setMeasUnit('cm')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded ${
                        measUnit === 'cm' ? 'bg-blue-600 text-white' : 'text-slate-500'
                      }`}
                    >
                      cm
                    </button>
                  </div>
                </div>
              </div>

              {measSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-xs text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Measurements profile saved successfully! Ready to reuse on future bookings.</span>
                </div>
              )}

              <form onSubmit={handleSaveMeasurements} className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Kameez Length
                    </label>
                    <input
                      type="text"
                      value={kameezLength}
                      onChange={(e) => setKameezLength(e.target.value)}
                      placeholder="e.g. 38"
                      className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Chest / Bust
                    </label>
                    <input
                      type="text"
                      value={chest}
                      onChange={(e) => setChest(e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Waist
                    </label>
                    <input
                      type="text"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      placeholder="e.g. 18"
                      className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Hips / Daman
                    </label>
                    <input
                      type="text"
                      value={hips}
                      onChange={(e) => setHips(e.target.value)}
                      placeholder="e.g. 22"
                      className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Shoulder (Teera)
                    </label>
                    <input
                      type="text"
                      value={shoulder}
                      onChange={(e) => setShoulder(e.target.value)}
                      placeholder="e.g. 14.5"
                      className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Armhole
                    </label>
                    <input
                      type="text"
                      value={armhole}
                      onChange={(e) => setArmhole(e.target.value)}
                      placeholder="e.g. 8.5"
                      className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Sleeve Length
                    </label>
                    <input
                      type="text"
                      value={sleeveLength}
                      onChange={(e) => setSleeveLength(e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Trouser Length
                    </label>
                    <input
                      type="text"
                      value={trouserLength}
                      onChange={(e) => setTrouserLength(e.target.value)}
                      placeholder="e.g. 37"
                      className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Shalwar Length
                    </label>
                    <input
                      type="text"
                      value={shalwarLength}
                      onChange={(e) => setShalwarLength(e.target.value)}
                      placeholder="e.g. 38"
                      className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Fitting Notes / Special Preferences
                  </label>
                  <textarea
                    rows={2}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="e.g., Prefers loose fit around chest, paincha width 7 inches, deep neckline..."
                    className="w-full px-3.5 py-2 text-xs bg-white border border-blue-200 rounded-lg text-slate-900"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Measurements Profile</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-blue-100 rounded-xl p-6 max-w-lg space-y-6">
              <div className="pb-4 border-b border-blue-100">
                <h4 className="text-lg font-serif-display font-semibold text-blue-950">
                  Account Settings
                </h4>
                <p className="text-xs text-slate-500 font-light mt-0.5">
                  Update your contact details for tailor communications.
                </p>
              </div>

              {profileSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-xs text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-blue-200 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-blue-500">Managed by Supabase Auth</span>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-blue-200 rounded-lg text-slate-900"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Update Profile</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-blue-50 border-t border-blue-100 flex items-center justify-between text-xs text-slate-500">
          <span>Boutique Stitching · Sadiqabad</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-950 hover:bg-blue-100 rounded"
          >
            Close Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};
