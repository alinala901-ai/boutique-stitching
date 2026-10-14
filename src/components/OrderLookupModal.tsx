import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { lookupOrderByReferenceAndPhone } from '../lib/supabase';
import { OrderLookupResult } from '../types';
import { OrderStatusTracker } from './OrderStatusTracker';
import { formatWhatsAppConsultationMessage, getWhatsAppUrl } from '../config/whatsapp';
import {
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Scissors,
  MessageCircle,
  ArrowRight,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface OrderLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderLookupModal: React.FC<OrderLookupModalProps> = ({ isOpen, onClose }) => {
  const { t, language, formatText } = useLanguage();

  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<OrderLookupResult | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resetAndClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOrderResult(null);

    if (!orderNumber.trim() || !phone.trim()) {
      setError(
        formatText(
          'Please enter both Order Reference and Phone Number.',
          'براہِ کرم آرڈر ریفرنس اور فون نمبر دونوں درج کریں۔',
          'Barah-e-karam Order Reference aur Phone Number dono darj karein.'
        )
      );
      return;
    }

    setLoading(true);
    try {
      const res = await lookupOrderByReferenceAndPhone(orderNumber, phone);
      if (res.error) {
        setError(res.error);
      } else if (res.order) {
        setOrderResult(res.order);
      }
    } catch {
      setError('An unexpected error occurred while searching for your order.');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setOrderNumber('');
    setPhone('');
    setError(null);
    setOrderResult(null);
    onClose();
  };

  const handleWhatsAppContact = () => {
    if (!orderResult) return;
    const msg = formatWhatsAppConsultationMessage({
      order_number: orderResult.order_number,
      customer_name: orderResult.customer_name,
      service_type: orderResult.service_type,
      category: orderResult.category,
      special_instructions: orderResult.special_instructions,
    });
    const { url, isConfigured } = getWhatsAppUrl(msg);
    if (isConfigured && url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      navigator.clipboard.writeText(msg);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 3000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-blue-950/80 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lookup-modal-title"
    >
      <div className="relative max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden my-4 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-blue-50 border-b border-blue-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Search className="w-5 h-5" />
            </span>
            <div>
              <h3 id="lookup-modal-title" className="text-xl font-serif-display font-semibold text-blue-950">
                {formatText('Track Your Stitching Order', 'آرڈر ٹریکنگ کی معلومات', 'Order Tracking Maloomat')}
              </h3>
              <p className="text-xs text-blue-700 mt-0.5 font-light">
                {formatText(
                  'Enter your order reference code and phone number for live atelier status',
                  'اپنا آرڈر ریفرنس اور فون نمبر درج کر کے لائیو سلائی اسٹیٹس چیک کریں',
                  'Apna order reference aur phone number darj kar kay silai status check karein'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-2 text-slate-500 hover:text-blue-950 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Lookup Input Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  {formatText('Order Reference', 'آرڈر ریفرنس کوڈ', 'Order Reference Code')} *
                </label>
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. BS-2026-ABCD"
                  className="w-full px-4 py-2.5 text-sm font-mono bg-white border border-blue-200 rounded-lg uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  {formatText('Phone Number', 'رابطہ فون نمبر', 'Rabta Phone Number')} *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0300-1234567"
                  className="w-full px-4 py-2.5 text-sm bg-white border border-blue-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {loading ? (
                <span>{formatText('Searching...', 'تلاش جاری ہے...', 'Talash Jari Hai...')}</span>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>{formatText('Track Order', 'آرڈر تلاش کریں', 'Order Talash Karein')}</span>
                </>
              )}
            </button>
          </form>

          {/* Results Card */}
          {orderResult && (
            <div className="pt-6 border-t border-blue-50 space-y-6">
              {/* Order Banner */}
              <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div>
                  <span className="text-xs uppercase tracking-widest text-blue-700 font-bold">
                    {orderResult.service_type} ({orderResult.customer_type === 'kids' ? 'Kids' : 'Ladies'})
                  </span>
                  <h4 className="text-xl font-mono font-bold text-blue-950 mt-0.5">
                    {orderResult.order_number}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Customer: <span className="font-semibold text-slate-900">{orderResult.customer_name}</span> · Style: {orderResult.category}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">
                    Received: {new Date(orderResult.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Visual Tracker */}
              <div>
                <h5 className="text-xs uppercase font-bold text-blue-900 mb-3">
                  {formatText('Tailoring Progress', 'سلائی کے مراحل', 'Silai Kay Marahal')}
                </h5>
                <OrderStatusTracker
                  status={orderResult.status}
                  updatedAt={orderResult.updated_at}
                />
              </div>

              {/* Reference Design if present */}
              {orderResult.reference_image_url && (
                <div className="p-4 bg-white border border-blue-100 rounded-xl flex items-center gap-4">
                  <img
                    src={orderResult.reference_image_url}
                    alt="Customer Reference"
                    className="w-16 h-16 object-cover rounded-lg border border-blue-100"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      {orderResult.reference_image_name || formatText('Design Reference Photo', 'ڈیزائن ریفرنس تصویر', 'Design Reference Photo')}
                    </p>
                    <a
                      href={orderResult.reference_image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {formatText('View Image', 'تصویر دیکھیں', 'Tasveer Dekhein')}
                    </a>
                  </div>
                </div>
              )}

              {/* WhatsApp Atelier Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
                {copiedFeedback ? (
                  <span className="text-xs text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-md font-medium">
                    {formatText(
                      '✓ Order details copied to clipboard!',
                      '✓ آرڈر کی تفصیلات کاپی ہو گئیں!',
                      '✓ Order ki tafseelat clipboard par copy ho gayin!'
                    )}
                  </span>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={handleWhatsAppContact}
                  className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 text-blue-200" />
                  <span>
                    {formatText('Inquire via WhatsApp', 'واٹس ایپ پر رابطہ کریں', 'WhatsApp Par Rabta Karein')}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-blue-50/50 border-t border-blue-100 flex items-center justify-between text-xs text-slate-500">
          <span>Boutique Stitching · Sadiqabad</span>
          <button
            type="button"
            onClick={resetAndClose}
            className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
          >
            {t('closeModal')}
          </button>
        </div>

      </div>
    </div>
  );
};
