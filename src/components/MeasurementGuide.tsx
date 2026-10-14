import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, Ruler, HelpCircle, CheckCircle2, Info } from 'lucide-react';

interface MeasurementGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MeasurementGuide: React.FC<MeasurementGuideProps> = ({ isOpen, onClose }) => {
  const { t, language, formatText } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<'all' | 'kameez' | 'bottom'>('all');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const points = [
    {
      id: 'kameez_length',
      category: 'kameez',
      name: 'Kameez Length',
      nameUrdu: 'Kameez Ki Lambai',
      point: '01',
      instruction:
        'Place measuring tape at the highest point of the shoulder near the neck and measure straight down to your desired length (below knee, calf, or ankle).',
      instructionUrdu:
        'Inchi tape ko gardan kay paas kandhay kay oopar rakhain aur seedha neechay apni matlooba lambai (ghutnay se neechay ya takhno tak) naapain.',
      tip: 'Stand straight and avoid bending while measuring.',
      tipUrdu: 'Naap letay waqt bilkul seedhay kharay rahain aur jhuknay se guraiz karain.',
    },
    {
      id: 'chest',
      category: 'kameez',
      name: 'Chest / Bust',
      nameUrdu: 'Chhati / Chest Ka Naap',
      point: '02',
      instruction:
        'Measure around the fullest part of the chest, keeping the measuring tape parallel to the floor with comfortable room.',
      instructionUrdu:
        'Chhati kay sab se broad hissay kay gird inchi tape lapait kar naapain, tape aaram-deh aur zameen kay barabar ho.',
      tip: 'Keep one finger between the measuring tape and your body for ease.',
      tipUrdu: 'Munasib khushadgi kay liye inchi tape aur jism kay darmiyan aik ungli ka fasla rakhain.',
    },
    {
      id: 'waist',
      category: 'kameez',
      name: 'Waist',
      nameUrdu: 'Kamar Ka Gherao',
      point: '03',
      instruction:
        'Measure around the natural waistline, typically situated right above the belly button where the shirt curves.',
      instructionUrdu:
        'Qudrati kamar kay gherao ka naap lain, jahan kameez ki curve aur fitting banti hai.',
      tip: 'Do not hold your breath or pull the tape too tightly.',
      tipUrdu: 'Saans andar na kheenchain aur inchi tape ko zaroorat se ziyada sakht na pakrain.',
    },
    {
      id: 'hips',
      category: 'kameez',
      name: 'Hips / Daman Base',
      nameUrdu: 'Hips Aur Daman Ka Base',
      point: '04',
      instruction:
        'Measure around the fullest part of the hips. This determines the chaak and daman opening.',
      instructionUrdu:
        'Hips kay sab se chohray hissay kay gird naapain taakeh chaak aur daaman ki fitting bilkul theek aaye.',
      tip: 'Essential for Pakistani A-line or straight kurti silhouettes.',
      tipUrdu: 'Seedhi kameez aur A-line kurti kay liye ye naap nihayat ahem hai.',
    },
    {
      id: 'shoulder',
      category: 'kameez',
      name: 'Shoulder (Teera)',
      nameUrdu: 'Teera (Shoulder)',
      point: '05',
      instruction:
        'Measure across the back from the edge of one shoulder bone across the curve of the neck to the other shoulder bone.',
      instructionUrdu:
        'Pusht ki taraf aik kandhay ki haddi kay siray se gardan kay neechay se doosray kandhay ki haddi tak naapain.',
      tip: 'Ensure measuring tape follows natural contour across upper back.',
      tipUrdu: 'Inchi tape pusht ki qudrati banawat kay sath seedha rakhain.',
    },
    {
      id: 'armhole',
      category: 'kameez',
      name: 'Armhole',
      nameUrdu: 'Armhole (Kandha)',
      point: '06',
      instruction:
        'Wrap tape comfortably around the armhole from the top of the shoulder down under the armpit and back up.',
      instructionUrdu:
        'Kandhay kay oopar se baghal kay neechay ghuma kar wapis oopar tak golai mein aaram se naapain.',
      tip: 'Keep tape relaxed so movement is comfortable.',
      tipUrdu: 'Tape ko thora dheela rakhain taakeh baazu hilane mein tangi na ho.',
    },
    {
      id: 'sleeve_length',
      category: 'kameez',
      name: 'Sleeve Length',
      nameUrdu: 'Aasteen Ki Lambai',
      point: '07',
      instruction:
        'Measure from the tip of the shoulder bone down the outer arm to your desired wrist or elbow length.',
      instructionUrdu:
        'Kandhay ki haddi se baazu kay bahir ki taraf kalai ya matlooba lambai tak naapain.',
      tip: 'Specify if you prefer full sleeve, 3/4th, or half sleeve.',
      tipUrdu: 'Full sleeve, 3/4th ya half sleeve ki apni pasand wazeh farmayein.',
    },
    {
      id: 'trouser_length',
      category: 'bottom',
      name: 'Trouser / Pant Length',
      nameUrdu: 'Trouser / Pant Ki Lambai',
      point: '08',
      instruction:
        'Measure from where you tie your waistband straight down the side of your leg to the ankle bone.',
      instructionUrdu:
        'Jahan aap trouser ya pant baandhtay hain, wahan se taang kay bahir rukh takhney ki haddi tak naapain.',
      tip: 'Wear shoes of regular heel height if wearing heeled footwear.',
      tipUrdu: 'Agar aap regular heel pehantay hain toh us ko mad-e-nazar rakh kar naap lain.',
    },
    {
      id: 'shalwar_length',
      category: 'bottom',
      name: 'Shalwar Length & Paincha',
      nameUrdu: 'Shalwar Lambai Aur Paincha',
      point: '09',
      instruction:
        'Measure from waistband to top of the foot. Also note preferred paincha width (e.g. 6.5" or 7").',
      instructionUrdu:
        'Naaf / waistband se paon kay oopri hissay tak naapain. Painchay ki matlooba chohrai bhi note karain (maslan 6.5 ya 7 inch).',
      tip: 'Traditional Pakistani shalwar generally sits slightly loose above the ankle.',
      tipUrdu: 'Riwayati shalwar mein paincha takhney kay paas aaram-deh aur munasib chohra rakha jata hai.',
    },
  ];

  const filteredPoints =
    activeCategory === 'all'
      ? points
      : points.filter((p) => p.category === activeCategory);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/80 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
    >
      <div className="relative max-w-3xl w-full bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-6 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Ruler className="w-5 h-5" />
            </span>
            <div>
              <h3 id="guide-modal-title" className="text-xl font-serif-display font-semibold text-blue-950">
                {formatText('Visual Measurement Guide', 'سلائی کے ناپ کی مکمل گائیڈ', 'Silai Naap Ki Mukammal Guide')}
              </h3>
              <p className="text-xs text-blue-700 mt-0.5 font-light">
                {formatText(
                  'How to take accurate tailor measurements for Pakistani ladies & kids clothing',
                  'گھر بیٹھے خواتین اور بچوں کا درزی ناپ لینے کا آسان طریقہ',
                  'Ghar baithay apna perfect darzi naap lenay kay aasan tareeqay'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-blue-950 rounded-lg transition-colors cursor-pointer"
            aria-label={t('closeModal')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Bar & Helpful Tip */}
        <div className="p-6 pb-2 border-b border-blue-50 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-slate-700 hover:bg-blue-100 border border-blue-100'
              }`}
            >
              {formatText('All Points', 'تمام پوائنٹس', 'Tamam Points')}
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('kameez')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeCategory === 'kameez'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-slate-700 hover:bg-blue-100 border border-blue-100'
              }`}
            >
              {formatText('Kameez & Shirt', 'قمیض اور شرٹ', 'Kameez & Shirt')}
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('bottom')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeCategory === 'bottom'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-slate-700 hover:bg-blue-100 border border-blue-100'
              }`}
            >
              {formatText('Shalwar & Trouser', 'شلوار اور ٹراؤزر', 'Shalwar & Trouser')}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>{formatText('Standard in Inches', 'انچ (Inches) میں ناپیں', 'Inches (Inch) Mein Naapain')}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-950 leading-relaxed">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              {formatText(
                'Pro Tailor Tip: You can either measure yourself directly using a flexible tailor tape or measure your best-fitting stitched Pakistani suit laid flat on a smooth surface.',
                'درزی کا مشورہ: ناپ لیتے وقت پہلے سے بہترین فٹنگ والا سوٹ ہموار جگہ پر رکھ کر بھی ناپ سکتے ہیں، یا انچی ٹیپ سے براہِ راست ناپ لیں۔',
                'Mashwara: Naap letay waqt pehle se perfect fitting wala suit hamwaar jagah par rakh kar bhi naap saktay hain, ya inchi tape se direct naap lain.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPoints.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-blue-100 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {item.point}
                    </span>
                    <span className="text-[11px] text-blue-600 uppercase tracking-wider font-semibold">
                      {item.category === 'kameez' ? 'Top' : 'Bottom'}
                    </span>
                  </div>

                  <h4 className="text-base font-serif-display font-semibold text-blue-950 mb-1">
                    {language === 'en' ? item.name : item.nameUrdu}
                  </h4>
                  <p className="text-xs text-blue-600 mb-2 font-medium">
                    {language === 'en' ? item.nameUrdu : item.name}
                  </p>

                  <p className="text-xs text-slate-600 leading-relaxed font-light mb-3">
                    {language === 'en' ? item.instruction : item.instructionUrdu}
                  </p>
                </div>

                <div className="pt-3 border-t border-blue-50 flex items-center gap-1.5 text-[11px] text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="italic">
                    {language === 'en' ? item.tip : item.tipUrdu}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-blue-50/50 border-t border-blue-100 flex items-center justify-between">
          <span className="text-xs text-blue-700 font-medium">
            Boutique Stitching · Sadiqabad
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            {formatText('Got It, Return to Form', 'ٹھیک ہے، فارم پر واپس جائیں', 'Theek Hai, Form Par Wapis Jayein')}
          </button>
        </div>

      </div>
    </div>
  );
};
