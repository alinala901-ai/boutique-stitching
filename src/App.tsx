import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { PriceDashboardSection } from './components/PriceDashboardSection';
import { PromotionalPostersSection } from './components/PromotionalPostersSection';
import { ServicesSection } from './components/ServicesSection';
import { BoutiqueVideoSection } from './components/BoutiqueVideoSection';
import { LadiesCollection } from './components/LadiesCollection';
import { KidsCollection } from './components/KidsCollection';
import { SaleSection } from './components/SaleSection';
import { GallerySection } from './components/GallerySection';
import { HowItWorks } from './components/HowItWorks';
import { WhyChooseUs } from './components/WhyChooseUs';
import { AboutSection } from './components/AboutSection';
import { BookingCTA } from './components/BookingCTA';
import { ContactSection } from './components/ContactSection';
import { SocialFollowSection } from './components/SocialFollowSection';
import { Footer } from './components/Footer';
import { BookingModal } from './components/BookingModal';
import { MeasurementGuide } from './components/MeasurementGuide';
import { AdminPortal } from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { CustomerDashboard } from './components/CustomerDashboard';
import { OrderLookupModal } from './components/OrderLookupModal';
import { BoutiqueAIChatbot } from './components/BoutiqueAIChatbot';
import { LayoutDashboard } from 'lucide-react';
import { useAuth } from './context/AuthContext';

function AppContent() {
  const { isAdmin } = useAuth();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isOrderLookupOpen, setIsOrderLookupOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('Pakistani Suits');

  const handleOpenBooking = (service?: string) => {
    if (service) {
      setSelectedService(service);
    }
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
  };

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* Top Admin & Price Dashboard Bar: STRICT PRIVACY - ONLY SHOWN TO OWNER/ADMIN */}
      {isAdmin && (
        <div className="bg-slate-900 text-white text-xs px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">
              Admin Mode (alinala901@gmail.com) · Atelier Dashboard &amp; Price Controls Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="#price-dashboard"
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-xs transition-colors"
            >
              Go to On-Page Rates
            </a>
            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              className="px-3.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer text-xs transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Open Full Admin Portal (Add / Delete / PKR)</span>
            </button>
          </div>
        </div>
      )}

          {/* Navigation */}
          <Navbar
            onOpenBooking={() => handleOpenBooking()}
            onOpenMeasurementGuide={() => setIsGuideOpen(true)}
            onOpenAuth={(mode) => handleOpenAuth(mode)}
            onOpenDashboard={() => setIsDashboardOpen(true)}
            onOpenOrderLookup={() => setIsOrderLookupOpen(true)}
            onOpenAdminPortal={isAdmin ? () => setIsAdminOpen(true) : undefined}
          />

          {/* Main Content Sections */}
          <main className="flex-1">
            {/* Hero */}
            <HeroSection onOpenBooking={() => handleOpenBooking()} />

            {/* DIRECT ON-PAGE DASHBOARD: LIVE PRICES IN PKR */}
            <PriceDashboardSection
              onOpenAdminPortal={isAdmin ? () => setIsAdminOpen(true) : undefined}
              onOpenBooking={(service) => handleOpenBooking(service)}
            />

            {/* Exclusive Campaign Posters & Promotional Banners */}
            <PromotionalPostersSection onOpenBooking={(campaign) => handleOpenBooking(campaign)} />

            {/* Services */}
            <ServicesSection onSelectService={(service) => handleOpenBooking(service)} />

            {/* Discover Our Boutique Video Section */}
            <BoutiqueVideoSection
              onOpenBooking={() => handleOpenBooking()}
              onOpenAdminSettings={isAdmin ? () => setIsAdminOpen(true) : undefined}
            />

            {/* Ladies Collection */}
            <LadiesCollection onSelectCategory={(cat) => handleOpenBooking(cat)} />

            {/* Kids Collection */}
            <KidsCollection onSelectCategory={(cat) => handleOpenBooking(cat)} />

            {/* Sale & Special Offers Section */}
            <SaleSection onOpenBooking={(service) => handleOpenBooking(service)} />

            {/* Our Designs / Gallery */}
            <GallerySection />

            {/* How It Works */}
            <HowItWorks />

            {/* Why Choose Us */}
            <WhyChooseUs />

            {/* About Us */}
            <AboutSection />

            {/* Booking Consultation CTA */}
            <BookingCTA onOpenBooking={() => handleOpenBooking()} />

            {/* Social Media Community */}
            <section className="py-12 bg-blue-50/30 border-b border-blue-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <SocialFollowSection />
              </div>
            </section>

            {/* Contact & Interactive Google Maps */}
            <ContactSection onOpenBooking={() => handleOpenBooking()} />
          </main>

          {/* Footer */}
          <Footer
            onOpenMeasurementGuide={() => setIsGuideOpen(true)}
            onOpenAdminPortal={isAdmin ? () => setIsAdminOpen(true) : undefined}
            onOpenOrderLookup={() => setIsOrderLookupOpen(true)}
            onOpenAuth={(mode) => handleOpenAuth(mode)}
            onOpenDashboard={() => setIsDashboardOpen(true)}
          />

          {/* Customer Consultation & Order Booking Modal (Phase 2 & 3) */}
          <BookingModal
            isOpen={isBookingOpen}
            onClose={handleCloseBooking}
            initialService={selectedService}
            onOpenMeasurementGuide={() => setIsGuideOpen(true)}
            onOpenDashboard={() => setIsDashboardOpen(true)}
            onOpenAuth={(mode) => handleOpenAuth(mode)}
          />

          {/* Visual Measurement Guide Dialog */}
          <MeasurementGuide
            isOpen={isGuideOpen}
            onClose={() => setIsGuideOpen(false)}
          />

          {/* Customer Authentication Modal (Supabase Auth) */}
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            initialMode={authMode}
          />

          {/* Customer Account & Order Tracking Dashboard */}
          <CustomerDashboard
            isOpen={isDashboardOpen}
            onClose={() => setIsDashboardOpen(false)}
            onNewOrder={() => {
              setIsDashboardOpen(false);
              handleOpenBooking();
            }}
            onOpenMeasurementGuide={() => setIsGuideOpen(true)}
            onOpenAdminPortal={isAdmin ? () => {
              setIsDashboardOpen(false);
              setIsAdminOpen(true);
            } : undefined}
          />

          {/* Order Reference Tracker & Lookup Modal */}
          <OrderLookupModal
            isOpen={isOrderLookupOpen}
            onClose={() => setIsOrderLookupOpen(false)}
          />

          {/* Atelier Staff / Admin Portal */}
          <AdminPortal
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
          />

          {/* Boutique AI Chatbot Assistant (Trained on Sadiqabad Atelier, Rates, Bridal, Delivery) */}
          <BoutiqueAIChatbot
            onOpenBooking={(service) => handleOpenBooking(service)}
            onOpenOrderLookup={() => setIsOrderLookupOpen(true)}
          />

          {/* Floating Quick Access Button to Dashboard & Prices: STRICT PRIVACY - ONLY SHOWN TO OWNER/ADMIN */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-2xl flex items-center gap-2 font-bold text-xs border-2 border-white/60 cursor-pointer hover:scale-105 transition-all animate-in fade-in"
              title="Open Dashboard (Add / Delete / Prices in PKR)"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </button>
          )}
        </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
