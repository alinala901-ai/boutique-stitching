import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Scissors,
  Clock,
  MapPin,
  Phone,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  action?: {
    type: 'booking' | 'rates' | 'track' | 'whatsapp';
    label: string;
  };
}

interface BoutiqueAIChatbotProps {
  onOpenBooking: (serviceName?: string) => void;
  onOpenOrderLookup?: () => void;
}

const BOUTIQUE_KNOWLEDGE_BASE = `
You are the official AI Assistant of "Boutique Stitching" located in Sadiqabad, Punjab, Pakistan.
Your goal is to answer ANY customer question with extreme politeness, expertise, and precision in Urdu, Roman Urdu, or English based on the customer's language.

KEY BOUTIQUE DETAILS:
- Name: Boutique Stitching Sadiqabad (بوتیک سلائی سٹوڈیو صادق آباد)
- Address: Main Bazar / Katchery Road, Sadiqabad, District Rahim Yar Khan, Punjab, Pakistan.
- Shop Timings: Open Monday to Sunday, 10:00 AM to 10:00 PM (Friday break: 1:00 PM to 2:30 PM).
- Master Craftsmen: Master Tariq & team of senior artisan cutters and embroiderers.
- Contact / WhatsApp: 0301-2345678 / 0333-9876543.

STITCHING RATES & PRICING (PKR):
- Ladies Simple Suit (Lawn / Cotton / Latha): Rs. 1,800
- Ladies 3-Piece Designer Stitched Suit (Lace work, Piping, Cutwork, Daman organza): Rs. 2,200 - Rs. 2,800
- Luxury Party Wear / Festive Fancy Suit: Rs. 3,500 - Rs. 5,400
- Royal Bridal Couture (Lehenga Choli, Maxi, Gharara with hand zardozi & dabka): Rs. 8,000 - Rs. 18,000
- Kids Stitched Kurta Pajama / Frock: Rs. 1,200 - Rs. 2,850
- Minor Alterations & Fitting Adjustments: Rs. 500 - Rs. 800
- Express 48-Hour Urgent Delivery: Normal rate + Rs. 600 - Rs. 1,000 extra.

DELIVERY TIME:
- Normal Suits: 4 to 7 working days.
- Express Urgent: 48 Hours guaranteed.
- Bridal & Heavy Embroidery: 15 to 25 working days.

FABRIC & SERVICES:
- Customers can bring their own unstitched cloth OR pick designer fabric & lace trims directly from our boutique.
- We provide high-quality itch-free inner cotton lining (astar), high-grade threads, zips, buttons, and canvas interlining.
- Female staff available for ladies' measurements in our private fitting studio.
- Customers can also send their best-fitting sample suit or use the online measurement guide.
- Online Order Tracking is available using the Order Reference Number.

TONE & STYLE:
- Extremely warm, respectful, Pakistani hospitality ("السلام علیکم", "خوش آمدید", "جی بالکل").
- Clear, helpful, concise answers with specific prices and timelines.
`;

export const BoutiqueAIChatbot: React.FC<BoutiqueAIChatbotProps> = ({
  onOpenBooking,
  onOpenOrderLookup,
}) => {
  const { language, formatText } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialWelcomeText =
    language === 'ur'
      ? 'السلام علیکم! خوش آمدید! میں بوتیک سلائی سٹوڈیو صادق آباد کا باضابطہ اے آئی اسسٹنٹ ہوں۔ آپ مجھ سے سلائی کے ریٹس، برائیڈل سوٹس، ڈیلیوری کے وقت، ناپ دینے کے طریقے یا آرڈر ٹریک کرنے کے بارے میں کوئی بھی سوال پوچھ سکتے ہیں!'
      : language === 'roman_ur'
      ? 'Assalam-o-Alaikum! Khush amdeed! Main Boutique Stitching Sadiqabad ka official AI Assistant hoon. Aap mujh se silai ke rates, bridal suits, delivery time, naap dene ka tareeqa ya order track karne ke mutaliq koi bhi sawal pooch sakte hain!'
      : 'Assalam-o-Alaikum & Welcome! I am the official AI Assistant for Boutique Stitching Sadiqabad. Ask me anything about our stitching rates, bridal wear, delivery timelines, measurement guide, or tracking your order!';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: initialWelcomeText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts = [
    {
      label: formatText('Stitching Rates', 'سلائی کے ریٹس کیا ہیں؟', 'Silai Ke Rates?'),
      prompt: 'سلائی کے تمام ریٹس کیا ہیں؟ (What are the stitching rates in PKR?)',
    },
    {
      label: formatText('Bridal Stitching', 'برائیڈل اور لہنگا سلائی؟', 'Bridal Silai?'),
      prompt: 'برائیڈل لہنگا چولی اور زردوزی سوٹ کی سلائی کتنے میں ہوتی ہے؟',
    },
    {
      label: formatText('Delivery Time', 'سوٹ کتنے دن میں تیار ہوگا؟', 'Delivery Time?'),
      prompt: 'سوٹ تیار ہونے میں کتنے دن لگتے ہیں اور کیا ارجنٹ سلائی دستیاب ہے؟',
    },
    {
      label: formatText('Boutique Location', 'دکان کا پتہ اور ٹائمنگ؟', 'Dukan Ka Pata?'),
      prompt: 'صادق آباد میں بوتیک کا ایڈریس اور ٹائمنگ کیا ہے؟',
    },
    {
      label: formatText('Measurement Guide', 'ناپ کیسے دینا ہے؟', 'Naap Kaise Dein?'),
      prompt: 'لیڈیز اور بچوں کا ناپ (measurements) دینے کا کیا طریقہ ہے؟',
    },
    {
      label: formatText('Track My Order', 'میرا آرڈر ٹریک کریں', 'Track Order?'),
      prompt: 'میں اپنے سلے ہوئے سوٹ کا اسٹیٹس کیسے چیک کروں؟',
    },
  ];

  // Scroll to bottom whenever messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  // Offline deterministic fallback knowledge engine (Guaranteed answer for any question!)
  const getOfflineSmartAnswer = (query: string): { text: string; action?: Message['action'] } => {
    const q = query.toLowerCase().trim();

    // 1. Rates & Pricing
    if (
      q.includes('rate') ||
      q.includes('price') ||
      q.includes('قیمت') ||
      q.includes('کتنے') ||
      q.includes('کتنا') ||
      q.includes('rupee') ||
      q.includes('pkr') ||
      q.includes('charges') ||
      q.includes('خرچہ')
    ) {
      if (q.includes('bridal') || q.includes('برائیڈل') || q.includes('لہنگا') || q.includes('lehenga')) {
        return {
          text: `👰 **برائیڈل اور لہنگا چولی سلائی ریٹس:**\n- سادہ برائیڈل سوٹ: 8,000 روپے سے شروع\n- فل زردوزی، کورا دبکہ اور ہاتھ کی کڑھائی والا لہنگا چولی/میکسی: 12,000 تا 18,000 روپے\n- خصوصی برائیڈل کین کین، ڈبل استر اور ٹسلز شامل ہیں۔ ڈیلیوری وقت: 15 سے 25 دن۔`,
          action: { type: 'booking', label: 'Book Bridal Consultation' },
        };
      }
      if (q.includes('kid') || q.includes('بچوں') || q.includes('baby') || q.includes('bachon')) {
        return {
          text: `👶 **بچوں کے سوٹس کی سلائی:**\n- بچوں کا سادہ کرتا پاجامہ / شلوار قمیض: 1,200 روپے\n- فینسی کڑھائی اور فیسٹیو فراک/واسکٹ سیٹ: 1,800 تا 2,850 روپے\n- بچوں کے لیے چبھن سے پاک نرم سوتی استر لگایا جاتا ہے۔`,
          action: { type: 'rates', label: 'View Kids Catalog' },
        };
      }
      return {
        text: `💰 **بوتیک سلائی سٹوڈیو کے باضابطہ ریٹس (PKR):**\n\n1. **سادہ لیڈیز سوٹ (لان/کاٹن/لتھا):** 1,800 روپے\n2. **ڈیزائنر 3-پیس سوٹ (لیس، پائپنگ، کٹ ورک، دامن آرگنزا):** 2,200 تا 2,800 روپے\n3. **پارٹی ویئر و فینسی فیسٹیو سوٹس:** 3,500 تا 5,400 روپے\n4. **برائیڈل لہنگا چولی / میکسی:** 8,000 تا 18,000 روپے\n5. **بچوں کی سلائی:** 1,200 تا 2,850 روپے\n6. **فٹنگ اور آلٹریشن:** 500 تا 800 روپے\n\n⚡ *نوٹ: فی الحال ویب سائٹ پر مڈ سیزن 25% سیل بھی فعال ہے!*`,
        action: { type: 'rates', label: 'View Price Dashboard' },
      };
    }

    // 2. Delivery Time & Urgency
    if (
      q.includes('delivery') ||
      q.includes('time') ||
      q.includes('تیار') ||
      q.includes('دن') ||
      q.includes('urgent') ||
      q.includes('ارجنٹ') ||
      q.includes('express') ||
      q.includes('کتنے دن') ||
      q.includes('waqt')
    ) {
      return {
        text: `⏱️ **ڈلیوری ٹائم شیڈول:**\n\n- **نارمل ڈیلیوری:** 4 سے 7 کام کے دن۔\n- **ایکسپریس ارجنٹ سروس (48 گھنٹے):** صرف 48 گھنٹوں میں مکمل پرفیکٹ فٹنگ کی گارنٹی کے ساتھ تیار (+600 تا 1000 روپے ارجنٹ فیس)۔\n- **برائیڈل اور ہیوی کڑھائی:** 15 سے 25 دن درکار ہوتے ہیں۔\n\nاگر آپ کو کسی شادی یا تقریب کے لیے فوری سوٹ چاہیے تو ہم 48 گھنٹے ایکسپریس سروس فراہم کرتے ہیں!`,
        action: { type: 'booking', label: 'Book Urgent Express' },
      };
    }

    // 3. Location, Address, Timings
    if (
      q.includes('address') ||
      q.includes('location') ||
      q.includes('پتہ') ||
      q.includes('ایڈریس') ||
      q.includes('کہاں') ||
      q.includes('sadiqabad') ||
      q.includes('صادق آباد') ||
      q.includes('timing') ||
      q.includes('ٹائم') ||
      q.includes('open') ||
      q.includes('بند')
    ) {
      return {
        text: `📍 **ہمارا پتہ اور اوقات کار:**\n\n- **پتہ:** مین بازار / کچہری روڈ، صادق آباد، ضلع رحیم یار خان، پنجاب، پاکستان۔\n- **اوقات:** پیر تا اتوار صبح 10:00 بجے سے رات 10:00 بجے تک۔\n- **جمعہ کا وقفہ:** 1:00 بجے سے 2:30 بجے تک (نماز جمعہ)۔\n- **فون / واٹس ایپ:** 0301-2345678 / 0333-9876543\n\nآپ دکان پر تشریف لا سکتے ہیں جہاں خواتین کے ناپ کے لیے لیڈیز سٹاف موجود ہے۔`,
        action: { type: 'whatsapp', label: 'Contact on WhatsApp' },
      };
    }

    // 4. Measurements (Naap)
    if (
      q.includes('measurement') ||
      q.includes('naap') ||
      q.includes('ناپ') ||
      q.includes('سائز') ||
      q.includes('size') ||
      q.includes('fitting') ||
      q.includes('فٹنگ')
    ) {
      return {
        text: `✂️ **ناپ (Measurements) دینے کے ۳ آسان طریقے:**\n\n1. **بوتیک سٹوڈیو کا وزٹ:** ہماری شاپ پر خواتین کے لیے پرائیویٹ فٹنگ روم اور فیمل سٹاف دستیاب ہے۔\n2. **سیمپل سوٹ بھیجیں:** آپ اپنا پہلے سے بالکل فٹ سلا ہوا سوٹ کوریئر یا ہوم پک اپ کے ذریعے بھجوا سکتے ہیں۔\n3. **آن لائن میژرمنٹ گائیڈ:** ہماری ویب سائٹ پر انٹرایکٹو ناپ گائیڈ موجود ہے جہاں سے آپ قمیض کی لمبائی، سینہ، کمر اور شلوار کا ناپ آن لائن جمع کرا سکتے ہیں۔`,
        action: { type: 'booking', label: 'Open Measurement Guide' },
      };
    }

    // 5. Order Tracking
    if (
      q.includes('track') ||
      q.includes('order') ||
      q.includes('آرڈر') ||
      q.includes('ٹریک') ||
      q.includes('status') ||
      q.includes('اسٹیٹس') ||
      q.includes('نمبر')
    ) {
      return {
        text: `📦 **اپنے آرڈر کی لائیو ٹریکنگ:**\n\nجب آپ آرڈر بک کرواتے ہیں تو آپ کو ایک یونیک آرڈر ریفرنس نمبر دیا جاتا ہے (جیسے کہ BS-1001)۔\nآپ نیچے دیے گئے 'Track Order' بٹن پر کلک کر کے اپنا ریفرنس نمبر یا فون نمبر درج کر کے اپنے سوٹ کا موجودہ مرحلہ (کٹنگ، سلائی، فنشنگ یا ریڈی) لائیو دیکھ سکتے ہیں!`,
        action: { type: 'track', label: 'Lookup Order Now' },
      };
    }

    // 6. Fabric / Kapra
    if (
      q.includes('fabric') ||
      q.includes('cloth') ||
      q.includes('کپڑا') ||
      q.includes('لان') ||
      q.includes('lawn') ||
      q.includes('silk') ||
      q.includes('chiffon') ||
      q.includes('شفون') ||
      q.includes('astar') ||
      q.includes('استر')
    ) {
      return {
        text: `👗 **فیبرک اور میٹریل کی سہولیات:**\n\n- آپ اپنا ان سٹچڈ کپڑا خود لا سکتے ہیں، یا ہماری بوتیک سے فینسی برانڈڈ لان، شفون، اور سلک کے کپڑے منتخب کر سکتے ہیں۔\n- اندر لگنے والا استر (Astar) ہم بہترین کوالٹی کا بغیر کھجلی والا سوتی میٹریل لگاتے ہیں۔\n- لیسیں، پائپنگ، ٹسلز اور کٹ ورک کی وسیع ورائٹی ہمارے پاس موجود ہے۔`,
        action: { type: 'booking', label: 'Consult with Master Tailor' },
      };
    }

    // 7. General friendly answer
    return {
      text: `جی بہت شکریہ! بوتیک سلائی سٹوڈیو صادق آباد میں ہم لیڈیز اور کڈز سلائی، برائیڈل لہنگا چولی، پاکستانی 3-پیس سوٹس اور 48 گھنٹے ایکسپریس کٹنگ کی مکمل سہولت فراہم کرتے ہیں۔\n\nآپ کسی بھی خاص ڈیزائن کی سلائی کے لیے آن لائن بکنگ کر سکتے ہیں یا ہم سے براہ راست واٹس ایپ پر رابطہ فرما سکتے ہیں!`,
      action: { type: 'booking', label: 'Book Custom Stitching' },
    };
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // 1. Try Gemini API first if configured
      const apiKey =
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
        (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
        '';

      let replyText = '';
      let replyAction: Message['action'] | undefined = undefined;

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: userText.trim(),
            config: {
              systemInstruction: BOUTIQUE_KNOWLEDGE_BASE,
            },
          });
          if (response.text) {
            replyText = response.text.trim();
          }
        } catch (apiErr) {
          console.warn('Gemini API call failed, using high-precision offline boutique knowledge engine:', apiErr);
        }
      }

      // 2. If Gemini API not available or errored, use comprehensive offline engine
      if (!replyText) {
        const fallback = getOfflineSmartAnswer(userText);
        replyText = fallback.text;
        replyAction = fallback.action;
      }

      const botReply: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: replyAction,
      };

      setMessages((prev) => [...prev, botReply]);

      // Speak aloud if speech is enabled
      if (isSpeechEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          const plainText = replyText.replace(/[*_#]/g, '');
          const utterance = new SpeechSynthesisUtterance(plainText.substring(0, 200));
          utterance.lang = language === 'ur' ? 'ur-PK' : 'en-US';
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      const fallback = getOfflineSmartAnswer(userText);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: fallback.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: fallback.action,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(formatText('Speech recognition not supported in this browser.', 'آپ کا براؤزر وائس ان پٹ سپورٹ نہیں کرتا۔', 'Voice input not supported.'));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ur' ? 'ur-PK' : 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsVoiceActive(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = () => {
        setIsVoiceActive(false);
      };

      recognition.onend = () => {
        setIsVoiceActive(false);
      };

      recognition.start();
    } catch (err) {
      setIsVoiceActive(false);
    }
  };

  const handleActionClick = (action: Message['action']) => {
    if (!action) return;
    if (action.type === 'booking') {
      onOpenBooking();
    } else if (action.type === 'rates') {
      const el = document.getElementById('price-dashboard');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    } else if (action.type === 'track') {
      if (onOpenOrderLookup) onOpenOrderLookup();
    } else if (action.type === 'whatsapp') {
      window.open('https://wa.me/923012345678?text=Assalam-o-Alaikum%20Boutique%20Stitching', '_blank');
    }
  };

  return (
    <>
      {/* FLOATING LAUNCHER BUTTON */}
      {!isOpen && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setHasUnread(false);
            }}
            className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white rounded-full shadow-2xl hover:shadow-blue-500/30 border-2 border-white/80 cursor-pointer transform hover:scale-105 active:scale-95 transition-all"
            aria-label="Open Boutique AI Chatbot"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-amber-300" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-blue-700 animate-ping" />
              )}
            </div>

            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold leading-tight flex items-center gap-1">
                <span>Boutique AI</span>
                <Sparkles className="w-3 h-3 text-amber-300" />
              </div>
              <div className="text-[10px] text-blue-100 font-medium">
                {formatText('Ask Any Question', 'کوئی بھی سوال پوچھیں', 'Poochhein Kuch Bhi')}
              </div>
            </div>

            <span className="sm:hidden text-xs font-bold">AI Chat</span>
          </button>
        </div>
      )}

      {/* CHATBOT WINDOW DIALOG */}
      {isOpen && (
        <div
          className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] max-w-[440px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-blue-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
          dir={language === 'ur' ? 'rtl' : 'ltr'}
          role="dialog"
          aria-label="Boutique AI Chat Assistant"
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
                <Bot className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <span>{formatText('Boutique AI Assistant', 'بوتیک اے آئی اسسٹنٹ', 'Boutique AI Assistant')}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[11px] text-blue-100 flex items-center gap-1">
                  <span>{formatText('Trained on Sadiqabad Atelier', 'صادق آباد بوتیک کے تمام معلومات پر تیار', '24/7 Live Support')}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-white/90">
              {/* Text-to-Speech Audio Voice Toggle */}
              <button
                type="button"
                onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
                className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${isSpeechEnabled ? 'text-amber-300' : 'text-white/70'}`}
                title={isSpeechEnabled ? 'Mute voice audio' : 'Enable voice responses'}
              >
                {isSpeechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Reset Chat */}
              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: 'welcome',
                      sender: 'bot',
                      text: initialWelcomeText,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    },
                  ])
                }
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                title="Reset Conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white"
                aria-label="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2.5 bg-blue-50/70 border-b border-blue-100 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(qp.prompt)}
                className="px-2.5 py-1 bg-white hover:bg-blue-600 hover:text-white text-blue-900 text-[11px] font-semibold rounded-lg border border-blue-200 shrink-0 transition-colors cursor-pointer shadow-2xs"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
                >
                  <div
                    className={`relative max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                    }`}
                  >
                    {/* Message Header */}
                    <div className="flex items-center justify-between gap-2 mb-1 text-[10px] opacity-75">
                      <span className="font-bold flex items-center gap-1">
                        {isUser ? (
                          <>
                            <User className="w-3 h-3" />
                            <span>You</span>
                          </>
                        ) : (
                          <>
                            <Bot className="w-3 h-3 text-blue-600" />
                            <span>Boutique Assistant</span>
                          </>
                        )}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Message Body */}
                    <div className="whitespace-pre-line select-text font-sans">
                      {msg.text}
                    </div>

                    {/* Action Button if attached */}
                    {msg.action && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleActionClick(msg.action)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Scissors className="w-3 h-3" />
                          <span>{msg.action.label}</span>
                        </button>
                      </div>
                    )}

                    {/* Copy action on bot responses */}
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.text, msg.id)}
                        className="absolute bottom-1 right-2 p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3.5 py-2 rounded-2xl w-fit shadow-2xs">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-[11px] font-medium">Boutique AI is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            {/* Voice Input Button */}
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                isVoiceActive
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                  : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border-slate-200'
              }`}
              title="Voice Input (Speech recognition in Urdu/English)"
            >
              {isVoiceActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={formatText(
                'Ask any question (rates, bridal, delivery, address)...',
                'سلائی، ریٹس، برائیڈل یا پتہ کے بارے میں کوئی بھی سوال پوچھیں...',
                'Koi bhi sawal poochhein (rates, delivery, address)...'
              )}
              className="flex-1 py-2.5 px-3.5 text-xs sm:text-sm bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 transition-all"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
