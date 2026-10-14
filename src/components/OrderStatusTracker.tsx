import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { OrderStatus } from '../types';
import { CheckCircle2, Clock, Sparkles, Scissors, Check, XCircle, AlertCircle } from 'lucide-react';

interface OrderStatusTrackerProps {
  status: OrderStatus;
  updatedAt?: string;
}

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({ status, updatedAt }) => {
  const { language, formatText } = useLanguage();

  const steps = [
    {
      key: 'new',
      num: '01',
      label: 'New Request',
      labelUrdu: 'نئی درخواست',
      labelRoman: 'Nayi Darkhwast',
      desc: 'Received at atelier',
      descUrdu: 'ایٹیلیئر میں درخواست موصول ہوئی',
      descRoman: 'Atelier mein darkhwast masool ho gayi',
    },
    {
      key: 'reviewing',
      num: '02',
      label: 'Reviewing',
      labelUrdu: 'زیرِ جائزہ',
      labelRoman: 'Zair-e-Jaiza',
      desc: 'Master reviewing cut & fabric',
      descUrdu: 'ماسٹر کٹنگ اور فیبرک چیک کر رہے ہیں',
      descRoman: 'Master cutting aur fabric check kar rahay hain',
    },
    {
      key: 'confirmed',
      num: '03',
      label: 'Confirmed',
      labelUrdu: 'تصدیق شدہ',
      labelRoman: 'Order Confirmed',
      desc: 'Measurements & style approved',
      descUrdu: 'ناپ اور ڈیزائن کی تصدیق ہو گئی',
      descRoman: 'Naap aur design tasdeeq ho gaya',
    },
    {
      key: 'in_progress',
      num: '04',
      label: 'In Progress',
      labelUrdu: 'سلائی جاری ہے',
      labelRoman: 'Silai Jari Hai',
      desc: 'Bespoke tailoring in workshop',
      descUrdu: 'ورکشاپ میں نفاست سے سلائی ہو رہی ہے',
      descRoman: 'Workshop mein nafasat se silai ho rahi hai',
    },
    {
      key: 'ready',
      num: '05',
      label: 'Ready',
      labelUrdu: 'تیار ہے',
      labelRoman: 'Suit Tayar Hai',
      desc: 'Quality check completed',
      descUrdu: 'کوالٹی چیک مکمل ہو گیا ہے',
      descRoman: 'Quality check mukammal ho gaya',
    },
    {
      key: 'completed',
      num: '06',
      label: 'Completed',
      labelUrdu: 'مکمل و وصول',
      labelRoman: 'Delivered / Wasool',
      desc: 'Delivered or collected',
      descUrdu: 'سوٹ وصول کر لیا گیا ہے',
      descRoman: 'Suit wasool kar liya gaya',
    },
  ];

  if (status === 'cancelled') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 mx-auto flex items-center justify-center">
          <XCircle className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-red-900">
          {formatText('Order Cancelled', 'آرڈر منسوخ ہو گیا (Cancelled)', 'Order Mansookh (Cancelled)')}
        </h4>
        <p className="text-xs text-red-700 font-light max-w-sm mx-auto">
          {formatText(
            'This consultation has been cancelled upon customer request or consultation review.',
            'یہ سلائی آرڈر کسٹمر کی درخواست یا ماسٹر جائزے کے بعد کینسل ہو چکا ہے۔',
            'Ye silai order customer darkhwast ya master jaizay kay baad cancel ho chuka hai.'
          )}
        </p>
      </div>
    );
  }

  const statusOrder: OrderStatus[] = [
    'new',
    'reviewing',
    'confirmed',
    'in_progress',
    'ready',
    'completed',
  ];
  const currentIndex = statusOrder.indexOf(status);

  return (
    <div className="space-y-4">
      {/* Steps line on Desktop / Responsive vertical on mobile */}
      <div className="relative">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div
                key={step.key}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-blue-50 border-blue-600 shadow-md ring-1 ring-blue-600/20'
                    : isCompleted
                    ? 'bg-blue-50/40 border-blue-200'
                    : 'bg-white border-slate-200 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-blue-700">
                      {step.num}
                    </span>
                    {isCompleted ? (
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    ) : isCurrent ? (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-200" />
                    )}
                  </div>

                  <p
                    className={`text-xs font-semibold ${
                      isCurrent
                        ? 'text-blue-950 font-bold'
                        : isCompleted
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    } ${language === 'ur' ? 'font-urdu' : ''}`}
                  >
                    {formatText(step.label, step.labelUrdu, step.labelRoman)}
                  </p>
                </div>

                <p className={`text-[10px] text-slate-500 font-light mt-1.5 leading-tight ${language === 'ur' ? 'font-urdu' : ''}`}>
                  {formatText(step.desc, step.descUrdu, step.descRoman)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {updatedAt && (
        <p className="text-[11px] text-slate-500 text-end font-light">
          {formatText('Last Updated:', 'آخری اپ ڈیٹ:', 'Aakhri Update:')}{' '}
          {new Date(updatedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};
