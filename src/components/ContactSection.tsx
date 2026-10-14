import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { createContactInquiry } from '../lib/supabase';
import { getSocialPlatforms } from '../config/social';
import { renderSocialIcon } from './SocialIcons';
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ContactSectionProps {
  onOpenBooking: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onOpenBooking }) => {
  const { t, language, formatText } = useLanguage();
  const socialPlatforms = getSocialPlatforms();

  // Contact Inquiry Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      setSubmitError(
        formatText(
          'Please provide your name, phone number, and message.',
          'براہ کرم اپنا نام، فون نمبر اور پیغام درج کریں۔',
          'Baraye meherbani apna naam, phone number aur paigham darj karein.'
        )
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await createContactInquiry({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        message: message.trim(),
      });

      if (res.success) {
        setSubmitSuccess(true);
        setName('');
        setPhone('');
        setEmail('');
        setMessage('');
        setTimeout(() => setSubmitSuccess(false), 6000);
      } else {
        setSubmitError(
          res.error ||
            formatText(
              'Failed to submit inquiry. Please try again.',
              'پیغام بھیجنے میں مسئلہ پیش آیا۔ دوبارہ کوشش کریں۔',
              'Inquiry submit nahi ho saki. Dobara koshish karein.'
            )
        );
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Error sending inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 md:py-28 bg-white" dir={language === 'ur' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs uppercase tracking-widest text-blue-700 font-bold mb-2">
            {formatText('Visit & Inquire', 'رابطہ و ملاقات', 'Rabta Aur Mulaqat')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif-display font-medium text-blue-950 tracking-tight">
            {t('contactTitle')}
          </h2>
          <div className="w-16 h-1 bg-blue-600 rounded-full mx-auto mt-3 mb-4" />
          <p className="text-base text-slate-600 leading-relaxed font-light">
            {t('contactSubtitle')}
          </p>
        </div>

        {/* 2-Column Layout: Details + Inquiry Form (Left) & Map (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column 1: Info Card + Inquiry Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Contact Details Card */}
            <div className="bg-white border border-blue-100 rounded-xl p-6 sm:p-7 shadow-xs hover:border-blue-300 transition-colors">
              <h3 className="text-lg font-serif-display font-semibold text-blue-950 mb-4">
                {formatText('Atelier Contact & Location', 'بوتیک کی معلومات و پتہ', 'Atelier Ki Maloomat Aur Pata')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Location */}
                <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100/80">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                      {t('locationLabel')}
                    </p>
                    <p className="text-xs font-semibold text-slate-900 mt-0.5">
                      {t('locationValue')}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {t('locationNotice')}
                    </p>
                  </div>
                </div>

                {/* WhatsApp & Booking */}
                <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100/80">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      {t('whatsappLabel')}
                    </p>
                    <p className="text-xs text-slate-700 mt-0.5 font-medium">
                      {formatText('Available on appointment', 'بذریعہ اپائنٹمنٹ دستیاب', 'Appointment par dastiyab')}
                    </p>
                    <button
                      type="button"
                      onClick={onOpenBooking}
                      className="text-[11px] text-blue-700 font-bold hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>{t('bookCTA')} &rarr;</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Social Channels Strip */}
              <div className="mt-4 pt-4 border-t border-blue-100 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-semibold text-slate-600">
                  {t('socialTitle')}:
                </span>
                <div className="flex items-center gap-2">
                  {socialPlatforms.map((p) =>
                    p.isConfigured ? (
                      <a
                        key={p.id}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={p.name}
                        title={p.name}
                        className="w-7 h-7 rounded-full bg-blue-100 hover:bg-blue-600 text-blue-700 hover:text-white flex items-center justify-center transition-all hover:scale-105"
                      >
                        {renderSocialIcon(p.id, 'w-3.5 h-3.5')}
                      </a>
                    ) : (
                      <span
                        key={p.id}
                        title={`${p.name} (Coming soon)`}
                        className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center cursor-not-allowed"
                      >
                        {renderSocialIcon(p.id, 'w-3.5 h-3.5')}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Interactive Contact Inquiry Form */}
            <div className="bg-white border border-blue-100 rounded-xl p-6 sm:p-7 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Send className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-base sm:text-lg font-serif-display font-semibold text-blue-950">
                  {formatText('Send Us an Inquiry', 'ہمیں اپنا پیغام بھیجیں', 'Humein Apna Paigham Bhejein')}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                {formatText(
                  'Have a question about custom stitching, bridal wear, or measurements? Send us a message and our master tailors will contact you.',
                  'سلائی، ناپ یا برائیڈل ملبوسات سے متعلق کوئی سوال ہے؟ پیغام بھیجیں، ہماری ٹیم جلد رابطہ کرے گی۔',
                  'Silai, naap ya bridal libaas ke baray mein sawal hai? Paigham bhejein, hamari team jald rabta karegi.'
                )}
              </p>

              {submitSuccess && (
                <div className="p-3.5 mb-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {formatText(
                      'Your inquiry has been received! Our atelier team will get in touch shortly.',
                      'آپ کا پیغام موصول ہو چکا ہے! ہماری ٹیم جلد آپ سے رابطہ کرے گی۔',
                      'Aap ka paigham mil gaya hai! Hamari team jald rabta karegi.'
                    )}
                  </span>
                </div>
              )}

              {submitError && (
                <div className="p-3.5 mb-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitInquiry} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {formatText('Your Full Name *', 'آپ کا پورا نام *', 'Aap Ka Pura Naam *')}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Fatima Zahra"
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {formatText('Phone / WhatsApp *', 'فون / واٹس ایپ نمبر *', 'Phone / WhatsApp *')}
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0300-1234567"
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {formatText('Email Address (Optional)', 'ای میل ایڈریس (اختیاری)', 'Email Address (Ikhtiari)')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {formatText('Your Message / Inquired Stitching Service *', 'آپ کا پیغام / درکار سلائی سروس *', 'Aap Ka Paigham / Darkaar Silai Service *')}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Inquiring about bridal dress stitching timeframe and fabric selection..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {submitting
                        ? formatText('Sending...', 'بھیجا جا رہا ہے...', 'Bheja ja raha hai...')
                        : formatText('Submit Inquiry', 'پیغام ارسال کریں', 'Inquiry Bhejein')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenBooking}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t('bookCTA')}</span>
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* Column 2: Google Maps (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-blue-100 rounded-xl overflow-hidden shadow-xs flex flex-col h-full min-h-[480px]">
            <div className="p-4 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-950">
                  {t('mapTitle')}
                </span>
              </div>
              <span className="text-xs text-blue-700 font-medium">
                {t('locationValue')}
              </span>
            </div>

            <div className="relative w-full flex-1 min-h-[420px] bg-blue-50/30">
              <iframe
                title="Boutique Stitching Location Map - Sadiqabad, Punjab, Pakistan"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3512.851771864592!2d70.1225884!3d28.302813999999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39374100207d4e0b%3A0x6c2e2ef25234bcf2!2sTHE%20INSPIRE%20BUSINESS%20ACADEMY%20SADIQABAD!5e0!3m2!1sen!2s!4v1791431643011!5m2!1sen!2s!4v1791431643011!5m2!1sen!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                className="w-full h-full absolute inset-0"
              />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
