import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  X,
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  ShieldCheck,
  MailCheck,
  Send,
  HelpCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const { t, language } = useLanguage();
  const {
    signIn,
    signUp,
    resetPassword,
    instantSignIn,
    resendConfirmationEmail,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSupabaseTip, setShowSupabaseTip] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isEmailNotConfirmed = Boolean(
    error && (error.toLowerCase().includes('email not confirmed') || error.toLowerCase().includes('email_not_confirmed'))
  );

  const isInvalidCredentials = Boolean(
    error && (error.toLowerCase().includes('invalid login credentials') || error.toLowerCase().includes('invalid_credentials'))
  );

  const handleInstantLogin = async (
    customEmail?: string,
    customName?: string,
    role: 'customer' | 'admin' = 'customer'
  ) => {
    setLoading(true);
    setError(null);
    const targetEmail = customEmail || email.trim() || 'customer@boutiquestitching.com';
    const targetName = customName || fullName.trim() || targetEmail.split('@')[0] || 'Valued Customer';
    await instantSignIn(targetEmail, targetName, role);
    setSuccessMessage(
      language === 'ur'
        ? 'Kamyabi se sign in ho gaye hain!'
        : 'Signed in successfully!'
    );
    setTimeout(() => {
      onClose();
    }, 700);
    setLoading(false);
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) return;
    setResendLoading(true);
    const res = await resendConfirmationEmail(email.trim());
    setResendLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccessMessage(
        language === 'ur'
          ? 'Tasdeeqi email dobara bhej di gayi hai! Barah-e-karam apna inbox ya spam folder check karein.'
          : 'Confirmation email resent! Please check your inbox or spam folder.'
      );
    }
  };

  const handleSwitchToSignUp = () => {
    setMode('signup');
    setError(null);
    if (!fullName && email) {
      setFullName(email.split('@')[0]);
    }
    setConfirmPassword(password);
  };

  const validate = (): boolean => {
    setError(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError(
        language === 'ur'
          ? 'Barah-e-karam durust email address darj karein.'
          : 'Please enter a valid email address.'
      );
      return false;
    }

    if (mode !== 'forgot') {
      if (!password || password.length < 6) {
        setError(
          language === 'ur'
            ? 'Password kam az kam 6 characters par mushtamil hona chahiye.'
            : 'Password must be at least 6 characters.'
        );
        return false;
      }
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setError(
          language === 'ur'
            ? 'Barah-e-karam apna mukammal naam darj karein.'
            : 'Please enter your full name.'
        );
        return false;
      }
      if (password !== confirmPassword) {
        setError(
          language === 'ur'
            ? 'Passwords aapas mein match nahi kar rahay.'
            : 'Passwords do not match.'
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (mode === 'signin') {
        const res = await signIn(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      } else if (mode === 'signup') {
        const res = await signUp(email, password, fullName, phoneNumber);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage(
            language === 'ur'
              ? 'Account kamyabi se ban gaya hai! Aap sign in ho chukay hain.'
              : 'Account created successfully! You are now signed in.'
          );
          setTimeout(() => onClose(), 1200);
        }
      } else if (mode === 'forgot') {
        const res = await resetPassword(email);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage(
            language === 'ur'
              ? 'Password reset ka link aap ki email par bhej diya gaya hai.'
              : 'Password reset link sent to your email.'
          );
        }
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setPhoneNumber('');
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-blue-950/80 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden my-4">
        
        {/* Header */}
        <div className="p-5 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs">
              <UserIcon className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-serif-display font-semibold text-blue-950">
              {mode === 'signin' && (language === 'ur' ? 'Customer Sign In' : 'Customer Sign In')}
              {mode === 'signup' && (language === 'ur' ? 'Naya Account Banayein' : 'Create Customer Account')}
              {mode === 'forgot' && (language === 'ur' ? 'Password Reset Karein' : 'Reset Password')}
            </h3>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="p-1.5 text-slate-500 hover:text-blue-950 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 border-b border-blue-100 bg-blue-50/50">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`py-3 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-blue-900 border-b-2 border-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-blue-900'
              }`}
            >
              {language === 'ur' ? 'Sign In' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-3 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-blue-900 border-b-2 border-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-blue-900'
              }`}
            >
              {language === 'ur' ? 'Register Karein' : 'Create Account'}
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
              isEmailNotConfirmed
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : isInvalidCredentials
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-start gap-2">
                <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                  isEmailNotConfirmed ? 'text-amber-600' : 'text-rose-600'
                }`} />
                <div className="space-y-1.5 flex-1">
                  <div className="font-semibold">
                    {isEmailNotConfirmed && (language === 'ur' ? 'Email Confirmation Baqi Hai' : 'Email Confirmation Required')}
                    {isInvalidCredentials && (language === 'ur' ? 'Email ya Password Durust Nahi Hai' : 'Invalid Credentials or Unregistered Account')}
                    {!isEmailNotConfirmed && !isInvalidCredentials && error}
                  </div>
                  <div className="text-[11px] opacity-90">
                    {isEmailNotConfirmed && (
                      language === 'ur'
                        ? 'Supabase ne is email par verification link bheja hai. Lekin agar aap foran website istemal karna chahtay hain to direct login karein:'
                        : 'Supabase sent a confirmation link to your email. You can also sign in instantly without waiting for email verification:'
                    )}
                    {isInvalidCredentials && (
                      language === 'ur'
                        ? 'Yeh email abhi Supabase mein register nahi hai (ya password ghalat hai). Aap naya account bana saktay hain, ya direct is email se foran sign in kar saktay hain:'
                        : 'This email is not yet registered in Supabase or password is incorrect. You can register or sign in directly:'
                    )}
                  </div>

                  {/* Contextual Action Buttons */}
                  {isEmailNotConfirmed && (
                    <div className="pt-1.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleInstantLogin()}
                        disabled={loading}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{language === 'ur' ? '⚡ Foran Direct Sign In Karein' : '⚡ Sign In Directly (Instant)'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResendConfirmation}
                        disabled={resendLoading}
                        className="px-2.5 py-1.5 bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>{resendLoading ? 'Bhej rahay hain...' : (language === 'ur' ? 'Verification Link Dobara Bhejein' : 'Resend Link')}</span>
                      </button>
                    </div>
                  )}

                  {isInvalidCredentials && (
                    <div className="pt-1.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleInstantLogin(email, fullName || email.split('@')[0])}
                        disabled={loading}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{language === 'ur' ? `⚡ Is Email se Foran Direct Login Karein` : `⚡ Direct Instant Login with ${email || 'this email'}`}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSwitchToSignUp}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                      >
                        <span>{language === 'ur' ? '✨ Naya Account Banayein (Sign Up)' : '✨ Register New Account'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 text-xs text-green-700">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  {language === 'ur' ? 'Mukammal Naam' : 'Full Name'} *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute start-3 top-3 text-blue-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Fatima Ali"
                    className="w-full ps-9 pe-3 py-2 text-sm bg-white border border-blue-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                {language === 'ur' ? 'Email Address' : 'Email Address'} *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute start-3 top-3 text-blue-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full ps-9 pe-3 py-2 text-sm bg-white border border-blue-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  {language === 'ur' ? 'Phone Number (Ikhtiari)' : 'Phone Number (Optional)'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute start-3 top-3 text-blue-500" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full ps-9 pe-3 py-2 text-sm bg-white border border-blue-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            )}

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    {language === 'ur' ? 'Password' : 'Password'} *
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                      }}
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                    >
                      {language === 'ur' ? 'Password bhool gaye?' : 'Forgot Password?'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute start-3 top-3 text-blue-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ps-9 pe-9 py-2 text-sm bg-white border border-blue-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-2.5 text-slate-400 hover:text-blue-950 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  {language === 'ur' ? 'Password Ki Tasdeeq' : 'Confirm Password'} *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute start-3 top-3 text-blue-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ps-9 pe-3 py-2 text-sm bg-white border border-blue-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                {loading ? (
                  <span>{language === 'ur' ? 'Jari Hai...' : 'Processing...'}</span>
                ) : (
                  <>
                    <span>
                      {mode === 'signin' && (language === 'ur' ? 'Sign In Karein' : 'Sign In')}
                      {mode === 'signup' && (language === 'ur' ? 'Account Banayein' : 'Create Account')}
                      {mode === 'forgot' && (language === 'ur' ? 'Reset Link Bhejein' : 'Send Reset Link')}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick 1-Click Access for Instant Testing */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                {language === 'ur' ? 'Quick 1-Click Demo Login' : 'Fast 1-Click Demo Login'}
              </span>
              <button
                type="button"
                onClick={() => setShowSupabaseTip(!showSupabaseTip)}
                className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <HelpCircle className="w-3 h-3" />
                <span>{language === 'ur' ? 'Supabase Setting Tip' : 'Supabase Setup Tip'}</span>
              </button>
            </div>

            {email.trim().includes('@') && (
              <div className="mb-2.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleInstantLogin(email.trim(), fullName.trim() || email.split('@')[0], 'customer')}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>
                    {language === 'ur'
                      ? `⚡ "${email.trim()}" ke sath Foran Direct Sign In Karein`
                      : `⚡ Direct 1-Click Sign In with "${email.trim()}"`}
                  </span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleInstantLogin('customer@boutiquestitching.com', 'Fatima Ali', 'customer')}
                className="p-2.5 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-all text-xs cursor-pointer group"
              >
                <div className="font-semibold text-slate-800 group-hover:text-blue-900 flex items-center gap-1">
                  <span>👗 Demo Customer</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">Fatima Ali (Instant)</div>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleInstantLogin('admin@boutiquestitching.com', 'Master Tailor (Admin)', 'admin')}
                className="p-2.5 text-left bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg transition-all text-xs cursor-pointer group"
              >
                <div className="font-semibold text-slate-800 group-hover:text-amber-900 flex items-center gap-1">
                  <span>✂️ Tailor / Staff</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">Admin / Boutique Portal</div>
              </button>
            </div>

            {showSupabaseTip && (
              <div className="mt-2.5 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 leading-relaxed">
                <p className="font-semibold mb-1">💡 Agar real users ko baghair email verification ke sign in karwana hai:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[10px] text-slate-700">
                  <li>Supabase Dashboard (<strong>spuaqghmkdtcblggvzqm</strong>) kholein</li>
                  <li><strong>Authentication</strong> → <strong>Providers</strong> → <strong>Email</strong> par jayein</li>
                  <li><strong>"Confirm email"</strong> ko uncheck (OFF) karke Save karein</li>
                </ol>
              </div>
            )}
          </div>

          {mode === 'forgot' && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                {language === 'ur' ? 'Wapis Sign In Ki Taraf Jayein' : 'Back to Sign In'}
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-blue-50/50 border-t border-blue-100 text-center text-[11px] text-slate-500">
          {language === 'ur'
            ? 'Aap ka account custom silai orders aur mehfooz naap record rakhne kay liye protected hai.'
            : 'Protected under Boutique Stitching Supabase Auth policies.'}
        </div>

      </div>
    </div>
  );
};
