import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { submitStitchingConsultation } from '../lib/supabase';
import { formatWhatsAppConsultationMessage, getWhatsAppUrl } from '../config/whatsapp';
import { StitchingOrder } from '../types';
import {
  X,
  Ruler,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Scissors,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  MessageCircle,
  Copy,
  Edit2,
  Trash2,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: string;
  onOpenMeasurementGuide?: () => void;
  onOpenDashboard?: () => void;
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  initialService,
  onOpenMeasurementGuide,
  onOpenDashboard,
  onOpenAuth,
}) => {
  const { t, language } = useLanguage();
  const { user, profile, savedMeasurements, saveMeasurements } = useAuth();

  // Multi-step state: 1 to 6
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [customerType, setCustomerType] = useState<'ladies' | 'kids'>('ladies');
  const [serviceType, setServiceType] = useState<string>(initialService || 'Pakistani Suits');
  const [category, setCategory] = useState<string>('3 Piece');

  const [customerName, setCustomerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [saveToProfile, setSaveToProfile] = useState<boolean>(true);

  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');
  const [kameezLength, setKameezLength] = useState<string>('');
  const [chest, setChest] = useState<string>('');
  const [waist, setWaist] = useState<string>('');
  const [hips, setHips] = useState<string>('');
  const [shoulder, setShoulder] = useState<string>('');
  const [armhole, setArmhole] = useState<string>('');
  const [sleeveLength, setSleeveLength] = useState<string>('');
  const [trouserLength, setTrouserLength] = useState<string>('');
  const [shalwarLength, setShalwarLength] = useState<string>('');
  const [additionalMeasurements, setAdditionalMeasurements] = useState<string>('');

  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState<string | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  // UI / Submission state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<StitchingOrder | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState<boolean>(false);

  useEffect(() => {
    if (initialService) {
      setServiceType(initialService);
    }
  }, [initialService]);

  // Pre-fill customer details from profile/auth if available
  useEffect(() => {
    if (user) {
      if (!customerName && profile?.full_name) {
        setCustomerName(profile.full_name);
      }
      if (!phone && profile?.phone) {
        setPhone(profile.phone);
      }
      if (!email && user.email) {
        setEmail(user.email);
      }
    }
  }, [user, profile]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resetFormAndClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  // Validation routines per step
  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!customerName.trim()) {
      errs.customerName = t('errNameRequired');
    }

    // Phone validation (Accepts standard Pakistani 03XX-XXXXXXX or international +923XXXXXXXXX)
    const phoneClean = phone.replace(/[\s-]/g, '');
    const phoneRegex = /^((\+92)|(0092)|(92)|(0))?3[0-9]{9}$/;
    if (!phoneClean || (!phoneRegex.test(phoneClean) && phoneClean.length < 10)) {
      errs.phone = t('errPhoneRequired');
    }

    // Email validation (if provided)
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errs.email = t('errEmailInvalid');
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, file: t('errFileType') }));
      return;
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, file: t('errFileSize') }));
      return;
    }

    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.file;
      return copy;
    });

    setReferenceFile(file);
    setReferencePreviewUrl(URL.createObjectURL(file));
  };

  const removeReferenceFile = () => {
    setReferenceFile(null);
    if (referencePreviewUrl) {
      URL.revokeObjectURL(referencePreviewUrl);
      setReferencePreviewUrl(null);
    }
  };

  const nextStep = () => {
    if (currentStep === 2 && !validateStep2()) {
      return;
    }
    setSubmissionError(null);
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setSubmissionError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent duplicate clicks
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const result = await submitStitchingConsultation({
        user_id: user?.id || null,
        customer_name: customerName,
        phone,
        email: email || undefined,
        customer_type: customerType,
        service_type: serviceType,
        category,
        special_instructions: specialInstructions || undefined,
        measurements: {
          kameez_length: kameezLength || undefined,
          chest: chest || undefined,
          waist: waist || undefined,
          hips: hips || undefined,
          shoulder: shoulder || undefined,
          armhole: armhole || undefined,
          sleeve_length: sleeveLength || undefined,
          trouser_length: trouserLength || undefined,
          shalwar_length: shalwarLength || undefined,
          additional_measurements: additionalMeasurements || undefined,
          unit,
        },
        reference_file: referenceFile,
      });

      if (result.error) {
        setSubmissionError(result.error);
        setIsSubmitting(false);
        return;
      }

      // If customer is logged in and opted to save measurements to their profile:
      if (user && saveToProfile) {
        try {
          await saveMeasurements({
            customer_type: customerType,
            unit,
            kameez_length: kameezLength || undefined,
            chest: chest || undefined,
            waist: waist || undefined,
            hips: hips || undefined,
            shoulder: shoulder || undefined,
            armhole: armhole || undefined,
            sleeve_length: sleeveLength || undefined,
            trouser_length: trouserLength || undefined,
            shalwar_length: shalwarLength || undefined,
            additional_measurements: additionalMeasurements || undefined,
          });
        } catch (saveErr) {
          console.warn('Could not auto-save measurements to profile:', saveErr);
        }
      }

      if (result.order) {
        setConfirmedOrder(result.order);
        setCurrentStep(6); // Step 6 = Confirmation
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred during submission.';
      setSubmissionError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFormAndClose = () => {
    setCurrentStep(1);
    setCustomerName('');
    setPhone('');
    setEmail('');
    setKameezLength('');
    setChest('');
    setWaist('');
    setHips('');
    setShoulder('');
    setArmhole('');
    setSleeveLength('');
    setTrouserLength('');
    setShalwarLength('');
    setAdditionalMeasurements('');
    setSpecialInstructions('');
    removeReferenceFile();
    setConfirmedOrder(null);
    setErrors({});
    setSubmissionError(null);
    onClose();
  };

  const handleWhatsAppAction = () => {
    if (!confirmedOrder) return;
    const msg = formatWhatsAppConsultationMessage(confirmedOrder, confirmedOrder.measurements);
    const { url, isConfigured } = getWhatsAppUrl(msg);

    if (isConfigured && url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      navigator.clipboard.writeText(msg);
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-blue-950/80 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="relative max-w-2xl w-full bg-white rounded-xl shadow-2xl border border-blue-100 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="p-5 sm:p-6 bg-blue-50 border-b border-blue-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Scissors className="w-5 h-5" />
            </span>
            <div>
              <h3 id="booking-modal-title" className="text-xl font-serif-display font-semibold text-blue-950">
                {t('modalTitle')}
              </h3>
              <p className="text-xs text-blue-700 mt-0.5 font-light">
                {currentStep <= 5 ? (
                  <span>
                    {t('stepIndicator')} {currentStep} {t('stepOf')} 5
                  </span>
                ) : (
                  <span>{t('successTitle')}</span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetFormAndClose}
            className="p-2 text-slate-500 hover:text-blue-950 rounded-md transition-colors"
            aria-label={t('closeModal')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar (Steps 1–5) */}
        {currentStep <= 5 && (
          <div className="w-full bg-blue-100 h-1.5 shrink-0">
            <div
              className="bg-blue-600 h-1.5 transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        )}

        {/* Scrollable Form Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          {submissionError && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submissionError}</span>
            </div>
          )}

          {/* STEP 1: Select Service & Category */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-serif-display font-semibold text-blue-950">
                  {t('step1Title')}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 font-light">
                  {t('step1Desc')}
                </p>
              </div>

              {/* Target Type Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  {t('labelTargetType')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerType('ladies');
                      setCategory('3 Piece');
                    }}
                    className={`py-3 px-4 rounded-lg text-sm font-semibold border transition-all ${
                      customerType === 'ladies'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    {t('optLadies')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerType('kids');
                      setCategory('Girls Frock');
                    }}
                    className={`py-3 px-4 rounded-lg text-sm font-semibold border transition-all ${
                      customerType === 'kids'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    {t('optKids')}
                  </button>
                </div>
              </div>

              {/* Stitching Service Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  {t('labelSelectService')}
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-blue-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Pakistani Suits">Pakistani Suits</option>
                  <option value="Ladies Stitching">Ladies Stitching</option>
                  <option value="Kids Stitching">Kids Stitching</option>
                  <option value="Bridal Wear">Bridal Wear</option>
                  <option value="Party Wear">Party Wear</option>
                  <option value="Daily Wear">Daily Wear</option>
                  <option value="Custom Design">Custom Design</option>
                  <option value="Alterations">Alterations</option>
                </select>
              </div>

              {/* Outfit Style Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  {t('labelSelectStyle')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(customerType === 'ladies'
                    ? [
                        '2 Piece',
                        '3 Piece',
                        'Formal Kurti',
                        'Party Wear',
                        'Bridal Couture',
                        'Maxi / Anarkali',
                        'Gharara / Sharara',
                        'Custom Pattern',
                      ]
                    : [
                        'Girls Frock',
                        'Girls Peplum',
                        'Boys Kurta Pajama',
                        'Boys Waistcoat Suit',
                        'Kids Traditional',
                        'Kids Party Wear',
                      ]
                  ).map((styleName) => (
                    <button
                      key={styleName}
                      type="button"
                      onClick={() => setCategory(styleName)}
                      className={`p-2.5 rounded text-xs font-medium border text-center transition-colors ${
                        category === styleName
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-blue-200 hover:bg-blue-50'
                      }`}
                    >
                      {styleName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Customer Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-serif-display font-semibold text-blue-950">
                  {t('step2Title')}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 font-light">
                  {t('step2Desc')}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t('labelName')} *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  className={`w-full px-4 py-2.5 text-sm bg-white border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    errors.customerName ? 'border-red-400 bg-red-50/30' : 'border-blue-200'
                  }`}
                />
                {errors.customerName && (
                  <p className="text-xs text-red-600 mt-1">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t('labelPhone')} *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('phonePlaceholderInput')}
                  className={`w-full px-4 py-2.5 text-sm bg-white border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    errors.phone ? 'border-red-400 bg-red-50/30' : 'border-blue-200'
                  }`}
                />
                {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                <p className="text-[11px] text-slate-500 mt-1">
                  {language === 'ur'
                    ? 'Sadiqabad ya Pakistan kay kisi bhi shehar ka active number darj karein taakeh order confirm ho sakay.'
                    : 'Active number in Pakistan for order confirmation & coordination.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t('labelEmail')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholderInput')}
                  className={`w-full px-4 py-2.5 text-sm bg-white border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    errors.email ? 'border-red-400 bg-red-50/30' : 'border-blue-200'
                  }`}
                />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>
            </div>
          )}

          {/* STEP 3: Measurements */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Profile Saved Measurements Alert / 1-Click Apply */}
              {savedMeasurements && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-[#E8D6BF] flex items-center justify-center text-blue-600 shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-blue-950">
                        {t('savedMeasNotice')}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {savedMeasurements.customer_type === 'ladies' ? 'Ladies' : 'Kids'} · {savedMeasurements.unit}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (savedMeasurements.unit) setUnit(savedMeasurements.unit);
                      if (savedMeasurements.kameez_length) setKameezLength(savedMeasurements.kameez_length);
                      if (savedMeasurements.chest) setChest(savedMeasurements.chest);
                      if (savedMeasurements.waist) setWaist(savedMeasurements.waist);
                      if (savedMeasurements.hips) setHips(savedMeasurements.hips);
                      if (savedMeasurements.shoulder) setShoulder(savedMeasurements.shoulder);
                      if (savedMeasurements.armhole) setArmhole(savedMeasurements.armhole);
                      if (savedMeasurements.sleeve_length) setSleeveLength(savedMeasurements.sleeve_length);
                      if (savedMeasurements.trouser_length) setTrouserLength(savedMeasurements.trouser_length);
                      if (savedMeasurements.shalwar_length) setShalwarLength(savedMeasurements.shalwar_length);
                      if (savedMeasurements.additional_measurements) setAdditionalMeasurements(savedMeasurements.additional_measurements);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-white hover:bg-blue-50/30 border border-blue-300 rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
                  >
                    {t('applySavedMeas')}
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-lg font-serif-display font-semibold text-blue-950">
                    {t('step3Title')}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 font-light">
                    {t('step3Desc')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenMeasurementGuide && (
                    <button
                      type="button"
                      onClick={onOpenMeasurementGuide}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>{t('btnOpenGuide')}</span>
                    </button>
                  )}

                  {/* Unit Toggle */}
                  <div className="inline-flex p-0.5 bg-blue-50 rounded border border-blue-200">
                    <button
                      type="button"
                      onClick={() => setUnit('inches')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded ${
                        unit === 'inches'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-500 hover:text-blue-950'
                      }`}
                    >
                      {t('unitInches')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnit('cm')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded ${
                        unit === 'cm'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-500 hover:text-blue-950'
                      }`}
                    >
                      {t('unitCm')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid of Measurements */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {t('measKameez')}
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
                    {t('measChest')}
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
                    {t('measWaist')}
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
                    {t('measHips')}
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
                    {t('measShoulder')}
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
                    {t('measArmhole')}
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
                    {t('measSleeves')}
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
                    {t('measTrouser')}
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
                    {t('measShalwar')}
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t('measAdditional')}
                </label>
                <textarea
                  rows={2}
                  value={additionalMeasurements}
                  onChange={(e) => setAdditionalMeasurements(e.target.value)}
                  placeholder={t('measAdditionalPlaceholder')}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-blue-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Checkbox to save measurements to profile */}
              {user && (
                <label className="flex items-center gap-2.5 p-3 bg-white border border-blue-100 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveToProfile}
                    onChange={(e) => setSaveToProfile(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-blue-300 focus:ring-blue-600"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    {t('saveMeasToProfile')}
                  </span>
                </label>
              )}
            </div>
          )}

          {/* STEP 4: Reference Design Upload */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-serif-display font-semibold text-blue-950">
                  {t('step4Title')}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 font-light">
                  {t('step4Desc')}
                </p>
              </div>

              {/* Upload Box */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  {t('uploadLabel')}
                </label>

                {referenceFile ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {referencePreviewUrl ? (
                        <img
                          src={referencePreviewUrl}
                          alt="Preview"
                          className="w-14 h-14 object-cover rounded border border-blue-100"
                        />
                      ) : (
                        <FileText className="w-8 h-8 text-blue-600" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-blue-950 truncate max-w-xs">
                          {referenceFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {(referenceFile.size / 1024 / 1024).toFixed(2)} MB · {referenceFile.type}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={removeReferenceFile}
                      className="p-1.5 text-red-700 hover:bg-red-100 rounded transition-colors"
                      title={t('removeFile')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-blue-100 rounded-xl p-6 text-center bg-blue-50/50 hover:bg-blue-50 transition-colors relative cursor-pointer">
                    <input
                      type="file"
                      id="consultation-file-input"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <Upload className="w-8 h-8 text-blue-600 mb-2" />
                      <p className="text-xs font-medium text-[#2B2721]">
                        {t('uploadDragDrop')}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 font-light">
                        {t('uploadHint')}
                      </p>
                    </div>
                  </div>
                )}

                {errors.file && <p className="text-xs text-red-600 mt-1.5">{errors.file}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t('labelInstructions')}
                </label>
                <textarea
                  rows={3}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder={t('instructionsPlaceholder')}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-blue-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Order Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-serif-display font-semibold text-blue-950">
                  {t('step5Title')}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 font-light">
                  {t('step5Desc')}
                </p>
              </div>

              {/* Review Sections */}
              <div className="space-y-4 text-xs">
                {/* Customer Info Card */}
                <div className="p-4 bg-white border border-blue-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold uppercase tracking-wider text-blue-700">
                      {t('reviewCustomer')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Edit2 className="w-3 h-3" /> {t('btnEdit')}
                    </button>
                  </div>
                  <p className="font-semibold text-sm text-blue-950">{customerName}</p>
                  <p className="text-slate-600 mt-0.5">Phone: {phone}</p>
                  {email && <p className="text-slate-600">Email: {email}</p>}
                </div>

                {/* Garment Details Card */}
                <div className="p-4 bg-white border border-blue-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold uppercase tracking-wider text-blue-700">
                      {t('reviewGarment')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Edit2 className="w-3 h-3" /> {t('btnEdit')}
                    </button>
                  </div>
                  <p className="font-semibold text-blue-950">
                    {serviceType} ({customerType === 'kids' ? t('optKids') : t('optLadies')})
                  </p>
                  <p className="text-slate-600 mt-0.5">Style: {category}</p>
                </div>

                {/* Measurements Summary Card */}
                <div className="p-4 bg-white border border-blue-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold uppercase tracking-wider text-blue-700">
                      {t('reviewMeasurements')} ({unit})
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Edit2 className="w-3 h-3" /> {t('btnEdit')}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-700">
                    {kameezLength && <span>• Kameez: {kameezLength}</span>}
                    {chest && <span>• Chest: {chest}</span>}
                    {waist && <span>• Waist: {waist}</span>}
                    {hips && <span>• Hips: {hips}</span>}
                    {shoulder && <span>• Shoulder: {shoulder}</span>}
                    {armhole && <span>• Armhole: {armhole}</span>}
                    {sleeveLength && <span>• Sleeves: {sleeveLength}</span>}
                    {trouserLength && <span>• Trouser: {trouserLength}</span>}
                    {shalwarLength && <span>• Shalwar: {shalwarLength}</span>}
                  </div>

                  {additionalMeasurements && (
                    <p className="mt-2 pt-2 border-t border-[#EDE4D4] text-slate-600 italic">
                      "{additionalMeasurements}"
                    </p>
                  )}
                </div>

                {/* Reference & Instructions Card */}
                <div className="p-4 bg-white border border-blue-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold uppercase tracking-wider text-blue-700">
                      {t('reviewReference')} &amp; {t('reviewInstructions')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Edit2 className="w-3 h-3" /> {t('btnEdit')}
                    </button>
                  </div>

                  {referenceFile ? (
                    <div className="flex items-center gap-3 mb-2">
                      {referencePreviewUrl && (
                        <img
                          src={referencePreviewUrl}
                          alt="Reference"
                          className="w-12 h-12 object-cover rounded border"
                        />
                      )}
                      <div>
                        <p className="font-medium text-blue-950">{referenceFile.name}</p>
                        <p className="text-[11px] text-slate-500">
                          Ready for Supabase Storage
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic mb-2">{t('noReferenceUploaded')}</p>
                  )}

                  {specialInstructions ? (
                    <p className="text-slate-700 bg-white p-2 rounded border border-[#EDE4D4]">
                      {specialInstructions}
                    </p>
                  ) : (
                    <p className="text-slate-500 italic">{t('noInstructions')}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Confirmation Screen */}
          {currentStep === 6 && confirmedOrder && (
            <div className="py-6 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-2xl font-serif-display font-semibold text-blue-950">
                  {t('successTitle')}
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed font-light mt-1.5">
                  {t('successMsg')}
                </p>
              </div>

              {/* Order Reference Box */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 max-w-sm mx-auto text-center space-y-1">
                <p className="text-xs uppercase tracking-wider text-blue-700 font-semibold">
                  {t('orderRefLabel')}
                </p>
                <p className="text-2xl font-mono font-bold text-blue-950">
                  {confirmedOrder.order_number}
                </p>
                <div className="pt-1">
                  <span className="text-[11px] px-2.5 py-0.5 bg-blue-600 text-white rounded font-medium">
                    {t('statusBadgeNew')}
                  </span>
                </div>
              </div>

              {/* Reassuring Next Steps Notice */}
              <div className="p-4 bg-white border border-blue-100 rounded-lg text-left text-xs text-slate-600 max-w-md mx-auto space-y-2">
                <p className="font-semibold text-blue-950 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-blue-600" />
                  What happens next?
                </p>
                <p className="leading-relaxed font-light text-slate-600">
                  {t('nextStepsNotice')}
                </p>
              </div>

              {/* WhatsApp Action */}
              <div className="pt-2 max-w-md mx-auto space-y-2">
                <button
                  type="button"
                  onClick={handleWhatsAppAction}
                  className="w-full py-3 px-4 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2 shadow"
                >
                  <MessageCircle className="w-4 h-4 text-blue-200" />
                  <span>{t('btnWhatsAppShare')}</span>
                </button>
                {copiedWhatsApp && (
                  <p className="text-xs text-blue-600 font-medium flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Consultation summary copied to clipboard!
                  </p>
                )}
                <p className="text-[11px] text-blue-500">
                  {t('whatsAppNotice')}
                </p>
              </div>

              {/* Reset / Dashboard / Book Another */}
              <div className="pt-4 border-t border-blue-100 flex flex-wrap items-center justify-center gap-3">
                {user && onOpenDashboard ? (
                  <button
                    type="button"
                    onClick={() => {
                      resetFormAndClose();
                      onOpenDashboard();
                    }}
                    className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-blue-950 bg-blue-50 hover:bg-[#E5D7C2] border border-blue-200 rounded transition-colors"
                  >
                    {t('viewInMyAccount')}
                  </button>
                ) : (
                  onOpenAuth && (
                    <button
                      type="button"
                      onClick={() => {
                        resetFormAndClose();
                        onOpenAuth('signup');
                      }}
                      className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-blue-950 bg-blue-50 hover:bg-[#E5D7C2] border border-blue-200 rounded transition-colors"
                    >
                      {t('createAccountToTrack')}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={resetFormAndClose}
                  className="px-6 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 bg-blue-50 hover:bg-[#E3D8C8] rounded transition-colors"
                >
                  {t('btnNewBooking')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Controls (Steps 1–5) */}
        {currentStep <= 5 && (
          <div className="p-4 sm:p-5 bg-blue-50 border-t border-blue-100 flex items-center justify-between shrink-0">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2.5 text-xs font-semibold text-blue-950 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className={`w-3.5 h-3.5 ${language === 'ur' ? 'rotate-180' : ''}`} />
                <span>{t('btnBack')}</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow"
              >
                <span>{t('btnNext')}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${language === 'ur' ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-7 py-3 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-[#9B7B4B] disabled:bg-gray-400 rounded-lg transition-colors flex items-center gap-2 shadow"
              >
                {isSubmitting ? (
                  <span>{t('btnSubmitting')}</span>
                ) : (
                  <>
                    <span>{t('btnSubmitConsultation')}</span>
                    <ArrowRight className={`w-3.5 h-3.5 ${language === 'ur' ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
