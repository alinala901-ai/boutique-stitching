import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import {
  Menu,
  X,
  Globe,
  Scissors,
  Ruler,
  User as UserIcon,
  Search,
  LogIn,
  LogOut,
  Package,
  Shield,
  ChevronDown,
  Check,
  LayoutDashboard,
} from 'lucide-react';

interface NavbarProps {
  onOpenBooking: () => void;
  onOpenMeasurementGuide?: () => void;
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
  onOpenDashboard?: () => void;
  onOpenOrderLookup?: () => void;
  onOpenAdminPortal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenBooking,
  onOpenMeasurementGuide,
  onOpenAuth,
  onOpenDashboard,
  onOpenOrderLookup,
  onOpenAdminPortal,
}) => {
  const { language, setLanguage, toggleLanguage, t, formatText } = useLanguage();
  const { user, profile, isStaff, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const languages: { code: Language; label: string; subLabel: string; isRtl: boolean }[] = [
    { code: 'en', label: 'English', subLabel: 'English', isRtl: false },
    { code: 'ur', label: 'اردو', subLabel: 'Urdu (رسم الخط)', isRtl: true },
    { code: 'roman_ur', label: 'Roman Urdu', subLabel: 'Aasan Roman Urdu', isRtl: false },
  ];

  const currentLanguageLabel =
    language === 'en' ? 'English' : language === 'ur' ? 'اردو' : 'Roman Urdu';

  const navLinks = [
    { href: '#price-dashboard', label: formatText('Rates', 'ریٹس', 'Rates') },
    { href: '#promotional-posters', label: formatText('Posters (5)', 'پوسٹرز (۵)', 'Posters (5)') },
    { href: '#boutique-video', label: formatText('Videos (4)', 'ویڈیوز (۴)', 'Videos (4)') },
    { href: '#services', label: t('navServices') },
    { href: '#ladies', label: t('navLadies') },
    { href: '#kids', label: t('navKids') },
    { href: '#contact', label: t('navContact') },
  ];

  const displayName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || t('navMyAccount');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Zone 1: Single Brand Title Element */}
          <a
            href="#"
            className="flex items-center gap-2.5 text-2xl font-serif-display font-semibold tracking-tight text-blue-950 hover:text-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <span className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Scissors className="w-4 h-4" />
            </span>
            <span className="font-bold tracking-tight">{t('brandName')}</span>
          </a>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-700"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-blue-700 hover:underline underline-offset-8 decoration-blue-600 font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}

            {onOpenMeasurementGuide && (
              <button
                type="button"
                onClick={onOpenMeasurementGuide}
                className="hover:text-blue-700 text-slate-700 transition-colors flex items-center gap-1 cursor-pointer font-medium"
              >
                <Ruler className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('navGuide')}</span>
              </button>
            )}
          </nav>

          {/* Zone 3: Actions (Track Order + Auth / Account + Language Switcher + Booking CTA) */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Track Order Quick Action */}
            {onOpenOrderLookup && (
              <button
                type="button"
                onClick={onOpenOrderLookup}
                title={t('navTrackOrder')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-900 bg-blue-50/70 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Search className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden xl:inline">{t('navTrackOrder')}</span>
              </button>
            )}

            {/* Customer Account or Sign In */}
            {user ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenDashboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-xs"
                  title={t('navMyAccount')}
                >
                  <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span className="max-w-[100px] truncate">{displayName}</span>
                </button>

                {isAdmin && onOpenAdminPortal && (
                  <button
                    type="button"
                    onClick={onOpenAdminPortal}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-all cursor-pointer"
                    title={formatText('Dashboard & Price Manager', 'ڈیش بورڈ اور قیمتیں', 'Dashboard & Price Manager')}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-white" />
                    <span className="font-bold">{formatText('Admin Dashboard', 'ایڈمن ڈیش بورڈ', 'Admin Dashboard')}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => onOpenAuth('signin')}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-700 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t('navSignIn')}</span>
                  </button>
                )}
              </div>
            )}

            {/* 3-Language Dropdown Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                aria-expanded={langDropdownOpen}
                aria-label={`Current language: ${currentLanguageLabel}. Click to switch between English, Urdu, and Roman Urdu.`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 shadow-2xs cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span className={language === 'ur' ? 'font-urdu' : ''}>{currentLanguageLabel}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {langDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setLangDropdownOpen(false)}
                  />
                  <div className="absolute end-0 mt-1.5 w-48 bg-white border border-blue-100 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in duration-100">
                    <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Language / زبان
                    </p>
                    {languages.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          setLanguage(item.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors text-start cursor-pointer ${
                          language === item.code
                            ? 'bg-blue-50 text-blue-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className={item.isRtl ? 'font-urdu text-sm' : 'font-medium'}>
                            {item.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {item.subLabel}
                          </span>
                        </div>
                        {language === item.code && (
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Primary CTA */}
            <button
              type="button"
              onClick={onOpenBooking}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-all shadow-md shadow-blue-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap cursor-pointer"
            >
              {t('bookCTA')}
            </button>
          </div>

          {/* Mobile Menu Button + Quick Language Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            {onOpenOrderLookup && (
              <button
                type="button"
                onClick={onOpenOrderLookup}
                aria-label={t('navTrackOrder')}
                className="p-1.5 text-slate-700 hover:text-blue-900 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <Search className="w-4 h-4 text-blue-600" />
              </button>
            )}

            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={`Cycle language. Current: ${currentLanguageLabel}`}
              className="px-2 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg flex items-center gap-1"
            >
              <Globe className="w-3 h-3 text-blue-600" />
              <span className={language === 'ur' ? 'font-urdu' : ''}>{currentLanguageLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              className="p-2 text-slate-800 hover:bg-blue-50 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-blue-100 bg-white px-4 pt-4 pb-6 shadow-xl animate-in fade-in duration-150">
          <nav className="flex flex-col space-y-2.5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}

            {onOpenMeasurementGuide && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenMeasurementGuide();
                }}
                className="px-3 py-2 text-base font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-left flex items-center gap-2"
              >
                <Ruler className="w-4 h-4 text-blue-600" />
                <span>{t('navGuide')}</span>
              </button>
            )}

            {onOpenOrderLookup && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenOrderLookup();
                }}
                className="px-3 py-2 text-base font-medium text-slate-700 hover:bg-blue-50 rounded-lg transition-colors text-left flex items-center gap-2"
              >
                <Package className="w-4 h-4 text-blue-600" />
                <span>{t('navTrackOrder')}</span>
              </button>
            )}

            {/* Mobile 3-Language Selector */}
            <div className="pt-3 pb-1 border-t border-blue-100">
              <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Language / زبان کا انتخاب
              </p>
              <div className="grid grid-cols-3 gap-1.5 px-3">
                {languages.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setLanguage(item.code);
                      setMobileMenuOpen(false);
                    }}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg text-center transition-all ${
                      language === item.code
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-blue-50 text-slate-700'
                    }`}
                  >
                    <span className={item.isRtl ? 'font-urdu' : ''}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-blue-100">
              {user ? (
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenDashboard?.();
                    }}
                    className="w-full px-3 py-2 text-base font-semibold text-blue-800 hover:bg-blue-50 rounded-lg transition-colors text-left flex items-center gap-2"
                  >
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    <span>{displayName} ({t('navMyAccount')})</span>
                  </button>

                  {isAdmin && onOpenAdminPortal && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAdminPortal();
                      }}
                      className="w-full px-3 py-2 text-sm font-semibold rounded-lg transition-colors text-left flex items-center gap-2 text-white bg-blue-800 hover:bg-blue-900 shadow-xs cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 text-blue-300" />
                      <span>{formatText('Admin Dashboard', 'ایڈمن ڈیش بورڈ', 'Admin Dashboard')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await signOut();
                    }}
                    className="w-full px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors text-left flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('navSignOut')}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuth?.('signin');
                      }}
                      className="flex-1 py-2 text-center text-sm font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200"
                    >
                      {t('navSignIn')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuth?.('signup');
                      }}
                      className="flex-1 py-2 text-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                    >
                      {t('navSignUp')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>
          <div className="mt-5 pt-3 border-t border-blue-100">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full py-3 text-center text-sm font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-600/20"
            >
              {t('bookCTA')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
