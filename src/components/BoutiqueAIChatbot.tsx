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

PRIMARY LANGUAGE REQUIREMENT (USER & OWNER MANDATE):
You MUST ALWAYS CHAT IN POLITE, PROFESSIONAL, AND CLEAR ENGLISH.
Even if a customer greets or types in Urdu or Roman Urdu, provide your main comprehensive response in English with courteous hospitality ("Assalam-o-Alaikum", "Welcome to Boutique Stitching Sadiqabad").

KEY BOUTIQUE DETAILS:
- Name: Boutique Stitching Sadiqabad
- Address: Main Bazar / Katchery Road, Sadiqabad, District Rahim Yar Khan, Punjab, Pakistan.
- Shop Timings: Open Monday to Sunday, 10:00 AM to 10:00 PM (Friday prayer break: 1:00 PM to 2:30 PM).
- Master Craftsmen: Master Tariq & team of senior artisan tailors, pattern cutters, and hand embroiderers.
- Contact / WhatsApp: 0301-2345678 / 0333-9876543.

STITCHING RATES & PRICING (PKR):
- Ladies Simple Suit (Lawn / Cotton / Latha): PKR 1,800
- Ladies 3-Piece Designer Stitched Suit (Lace work, Piping, Cutwork, Daman organza): PKR 2,200 - PKR 2,800
- Luxury Party Wear / Festive Fancy Suit: PKR 3,500 - PKR 5,400
- Royal Bridal Couture (Lehenga Choli, Maxi, Gharara with hand zardozi & dabka): PKR 8,000 - PKR 18,000
- Kids Stitched Kurta Pajama / Frock: PKR 1,200 - PKR 2,850
- Minor Alterations & Fitting Adjustments: PKR 500 - PKR 800
- Express 48-Hour Urgent Delivery: Normal rate + PKR 600 - PKR 1,000 urgent surcharge.
- Special Offer: Mid-Season 25% Off stitching discount is currently active on the live rates dashboard!

DELIVERY TIME:
- Standard Delivery: 4 to 7 working days.
- Express Urgent: 48 Hours guaranteed with precision fitting.
- Bridal & Heavy Embroidery: 15 to 25 working days.

FABRIC & SERVICES:
- Customers can bring their own unstitched cloth OR pick designer fabrics & lace trims directly from our boutique.
- We provide premium, itch-free soft inner cotton lining (astar), high-grade threads, invisible zips, and canvas interlining.
- Female staff available for ladies' measurements in our private fitting studio.
- Customers can also send their best-fitting sample suit or use the online measurement guide.
- Online Order Tracking is available using the Order Reference Number.

TONE & STYLE:
- Extremely warm, respectful, Pakistani hospitality in clear English ("Assalam-o-Alaikum", "Welcome", "Certainly!").
- Clear, helpful, concise answers with specific PKR prices and timelines.
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

  // English-first friendly welcoming message
  const initialWelcomeText =
    'Assalam-o-Alaikum & Welcome! I am your Boutique Stitching AI Assistant. How can I help you today with our stitching rates in PKR, bridal couture, delivery timelines, measurement guide, or tracking your order? Feel free to ask anything in English!';

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
      label: 'Stitching Rates (PKR)',
      prompt: 'What are your complete stitching rates for ladies and kids suits in PKR?',
    },
    {
      label: 'Bridal & Lehenga',
      prompt: 'What are the charges and timelines for bridal lehenga choli and fancy festive suits?',
    },
    {
      label: 'Delivery Timelines',
      prompt: 'How many days does normal stitching take, and do you offer 48-hour express service?',
    },
    {
      label: 'Boutique Location',
      prompt: 'Where is your boutique located in Sadiqabad and what are your opening hours?',
    },
    {
      label: 'Measurement Guide',
      prompt: 'How can I provide my measurements or send a sample suit?',
    },
    {
      label: 'Track My Order',
      prompt: 'How can I check the live status of my stitching order with my reference number?',
    },
  ];

  // Scroll to bottom whenever messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  // Offline deterministic fallback knowledge engine (Guaranteed English answers for any question!)
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
      q.includes('cost') ||
      q.includes('خرچہ')
    ) {
      if (q.includes('bridal') || q.includes('برائیڈل') || q.includes('لہنگا') || q.includes('lehenga')) {
        return {
          text: `👰 **Bridal & Festive Lehenga Choli Stitching Rates:**\n\n- **Simple Bridal Suit / Gharara:** Starting from PKR 8,000\n- **Royal Zardozi & Hand Dabka Lehenga Choli / Maxi:** PKR 12,000 to PKR 18,000\n- **Premium Inclusions:** Soft volume can-can, itch-free pure cotton lining (astar), padded bust cups, and customized designer latkans/tassels.\n- **Delivery Timeline:** 15 to 25 working days with trial fitting.`,
          action: { type: 'booking', label: 'Book Bridal Consultation' },
        };
      }
      if (q.includes('kid') || q.includes('بچوں') || q.includes('baby') || q.includes('bachon') || q.includes('child')) {
        return {
          text: `👶 **Kids Custom Tailoring Rates:**\n\n- **Kids Simple Kurta Pajama / Shalwar Kameez:** PKR 1,200\n- **Festive Frocks, Lehengas & Waistcoat Sets:** PKR 1,800 to PKR 2,850\n- **Comfort Guarantee:** Ultra-soft, breathable cotton lining to ensure itch-free comfort for baby and children's skin.`,
          action: { type: 'rates', label: 'View Kids Catalog' },
        };
      }
      return {
        text: `💰 **Official Boutique Stitching Rates (PKR):**\n\n1. **Ladies Simple Suit (Lawn / Cotton / Latha):** PKR 1,800\n2. **Designer 3-Piece Stitched Suit (Lace work, Piping, Cutwork, Organza Daman):** PKR 2,200 to PKR 2,800\n3. **Luxury Party Wear & Festive Fancy Suits:** PKR 3,500 to PKR 5,400\n4. **Royal Bridal Lehenga Choli / Maxi:** PKR 8,000 to PKR 18,000\n5. **Kids Traditional & Frocks:** PKR 1,200 to PKR 2,850\n6. **Fitting & Alterations:** PKR 500 to PKR 800\n\n⚡ *Special Promotion:* Mid-Season 25% Off stitching discount is currently live on our pricing dashboard!`,
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
      q.includes('when') ||
      q.includes('waqt')
    ) {
      return {
        text: `⏱️ **Delivery Timelines & Express Service:**\n\n- **Standard Stitching:** 4 to 7 working days.\n- **48-Hour Urgent Express:** Ready in 48 hours guaranteed with precision master fitting (+PKR 600 to PKR 1,000 express fee).\n- **Bridal & Heavy Hand Embroidery:** 15 to 25 working days.\n\nNeed a dress urgently for an upcoming event or wedding? Click below to book our 48-Hour Express service!`,
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
      q.includes('where') ||
      q.includes('sadiqabad') ||
      q.includes('صادق آباد') ||
      q.includes('timing') ||
      q.includes('hours') ||
      q.includes('ٹائم') ||
      q.includes('open') ||
      q.includes('بند')
    ) {
      return {
        text: `📍 **Boutique Location & Atelier Hours:**\n\n- **Address:** Main Bazar / Katchery Road, Sadiqabad, District Rahim Yar Khan, Punjab, Pakistan.\n- **Opening Hours:** Monday to Sunday, 10:00 AM to 10:00 PM.\n- **Friday Prayer Break:** 1:00 PM to 2:30 PM.\n- **Phone / WhatsApp:** 0301-2345678 / 0333-9876543\n\nVisit our private fitting studio in person — dedicated female staff is available for ladies' measurements.`,
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
        text: `✂️ **3 Easy Ways to Provide Your Measurements:**\n\n1. **Visit Boutique Studio:** In-person measurement by female tailoring staff in our private fitting studio.\n2. **Send a Sample Suit:** Courier or send your best-fitting suit to our Sadiqabad shop, and Master Tariq will replicate the exact fit.\n3. **Online Visual Guide:** Use our step-by-step interactive guide on this website to input your shoulder, chest, waist, and length measurements online.`,
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
        text: `📦 **Live Order Tracking:**\n\nWhen your booking is confirmed, you receive an Order Reference Number (e.g., BS-1001).\nClick the 'Lookup Order Now' button below or enter your contact phone number to view live real-time progress (Pattern Cutting, Stitching, Hand Embroidery, Quality Inspection, Ready for Pickup).`,
        action: { type: 'track', label: 'Lookup Order Now' },
      };
    }

    // 6. Fabric / Cloth
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
        text: `👗 **Fabric & Premium Materials Policy:**\n\n- **Bring Your Own Cloth:** You can bring or courier your own unstitched designer lawn, chiffon, velvet, or silk.\n- **In-Boutique Selection:** We offer a curated collection of seasonal designer prints and imported trims.\n- **Lining & Quality:** We exclusively use skin-friendly, breathable pure cotton astar (lining) and German interlining canvas.`,
        action: { type: 'booking', label: 'Consult with Master Tailor' },
      };
    }

    // 7. General friendly answer
    return {
      text: `Hello and thank you for contacting Boutique Stitching Sadiqabad! We specialize in custom ladies and kids stitching, designer 3-piece suites, luxury bridal lehengas, and 48-hour express tailoring.\n\nHow can I help you today? You can ask about our stitching rates in PKR, book a consultation, or track an existing order!`,
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
                  <span>Boutique AI Assistant</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-bold text-emerald-200 rounded">
                    English Chat Active
                  </span>
                  <span className="text-[10px] text-blue-100">· Sadiqabad Atelier</span>
                </div>
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
              placeholder="Ask anything in English (rates, bridal, delivery, address)..."
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
