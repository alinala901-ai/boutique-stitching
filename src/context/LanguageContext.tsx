import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Direction } from '../types';
import { translations } from '../i18n/translations';

type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  direction: Direction;
  isRTL: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
  formatText: (en: string, ur: string, roman_ur?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('boutique_lang');
      if (saved === 'en' || saved === 'ur' || saved === 'roman_ur') return saved as Language;
    }
    return 'en';
  });

  // Text Direction:
  // - English: LTR
  // - Urdu (اردو script): RTL
  // - Roman Urdu (Latin script): LTR
  const direction: Direction = language === 'ur' ? 'rtl' : 'ltr';
  const isRTL = direction === 'rtl';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('boutique_lang', lang);
    }
  };

  const toggleLanguage = () => {
    // Cycle between all 3 languages: en -> ur -> roman_ur -> en
    if (language === 'en') {
      setLanguage('ur');
    } else if (language === 'ur') {
      setLanguage('roman_ur');
    } else {
      setLanguage('en');
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (language === 'ur') {
        document.documentElement.lang = 'ur';
        document.documentElement.dir = 'rtl';
        document.body.classList.add('font-urdu');
      } else if (language === 'roman_ur') {
        document.documentElement.lang = 'ur-Latn';
        document.documentElement.dir = 'ltr';
        document.body.classList.remove('font-urdu');
      } else {
        document.documentElement.lang = 'en';
        document.documentElement.dir = 'ltr';
        document.body.classList.remove('font-urdu');
      }
    }
  }, [language, direction]);

  const t = (key: TranslationKey): string => {
    const langDict = (translations as Record<string, Record<string, any>>)[language] || translations.en;
    const value = langDict[key] ?? translations.en[key] ?? key;
    return typeof value === 'string' ? value : String(value);
  };

  const formatText = (en: string, ur: string, roman_ur?: string): string => {
    if (language === 'ur') return ur;
    if (language === 'roman_ur') return roman_ur || ur;
    return en;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        direction,
        isRTL,
        setLanguage,
        toggleLanguage,
        t,
        formatText,
      }}
    >
      <div dir={direction} className={isRTL ? 'font-urdu' : ''}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

