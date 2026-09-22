import React, { useState } from 'react';
import Logo from './Logo';
import { translations, LanguageType } from '../utils/translations';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { getAppBaseUrl } from '../utils/authHelpers';

interface ForgotPasswordPortalProps {
  lang: LanguageType;
  onNavigateLogin: () => void;
  onNavigateHome?: () => void;
}

export default function ForgotPasswordPortal({ lang, onNavigateLogin, onNavigateHome }: ForgotPasswordPortalProps) {
  const isRtl = lang === 'ar';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError(lang === 'en' ? 'Please enter a valid email address.' : 'يرجى إدخال عنوان بريد إلكتروني صحيح.');
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${getAppBaseUrl()}/?auth=recovery`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl
      });

      if (resetError) {
        console.warn('Supabase resetPasswordForEmail notice:', resetError.message);
      }

      // Neutral success state to prevent user enumeration
      setSubmitted(true);
    } catch (err: any) {
      console.error('Password recovery error:', err);
      // Still show neutral message unless network error
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-editorial-bg py-16 px-4 flex items-center justify-center font-sans ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="w-full max-w-md editorial-card transition-all">
        {/* Header Ribbon */}
        <div className="relative bg-transparent card-divider py-8 px-6 text-center flex flex-col items-center">
          <Logo variant="primary" className="h-14" />
        </div>

        {/* Form Body */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="font-serif text-2xl font-semibold text-[#5c130f]">
              {lang === 'en' ? 'Reset Password' : 'استعادة كلمة المرور'}
            </h2>
            <p className="font-sans text-xs text-[#3A1A14]/75 italic mt-1">
              {lang === 'en'
                ? 'Enter your registered email address to receive recovery instructions.'
                : 'أدخل بريدك الإلكتروني المسجل لتلقي تعليمات استعادة كلمة المرور.'}
            </p>
          </div>

          {submitted ? (
            <div className="space-y-6 text-center animate-fadeIn">
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-none flex items-start gap-3 text-left rtl:text-right">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs leading-relaxed font-sans">
                  <p className="font-bold text-emerald-900 font-sans text-xs">
                    {lang === 'en' ? 'Recovery Email Sent' : 'تم إرسال رابط الاستعادة'}
                  </p>
                  <p>
                    {lang === 'en'
                      ? 'If an account exists for this email address, password recovery instructions have been sent. Please check your inbox and spam folder.'
                      : 'إذا كان هناك حساب مسجل بهذا البريد الإلكتروني، فقد تم إرسال تعليمات الاستعادة. يرجى مراجعة صندوق الوارد والبريد غير الهام.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onNavigateLogin}
                className="w-full bg-[#BA8332] hover:bg-[#a06e28] !text-white font-sans text-xs font-semibold py-3 rounded-none shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                <span>{lang === 'en' ? 'Back to Sign In' : 'العودة لتسجيل الدخول'}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              {error && (
                <div className="bg-[#5C130F]/10 border border-[#5C130F]/30 text-[#5C130F] rounded-none p-3 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans font-semibold text-[#5C130F]">
                  {lang === 'en' ? 'Registered Email Address' : 'البريد الإلكتروني المسجل'}
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${isRtl ? 'left-auto right-0 pr-3' : ''}`}>
                    <Mail className="h-4.5 w-4.5 text-[#5C130F]/50" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., delegate@almusawareen.org"
                    required
                    className={`block w-full pl-10 pr-3 py-2.5 bg-[#FDFAF3] border border-[#5C130F]/35 rounded-none text-sm placeholder-gray-400 focus:outline-none focus:border-[#5C130F] font-sans text-[#3A1A14] ${
                      isRtl ? 'pl-3 pr-10' : ''
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#BA8332] hover:bg-[#a06e28] disabled:bg-gray-400 !text-white font-sans text-xs font-semibold py-3 rounded-none shadow-xs transition-colors mt-6 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <span>{loading ? (lang === 'en' ? 'Sending...' : 'جاري الإرسال...') : (lang === 'en' ? 'Send Recovery Instructions' : 'إرسال تعليمات الاستعادة')}</span>
              </button>

              <div className="mt-6 text-center text-xs pt-2">
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="font-semibold text-[#5C130F] hover:underline transition-colors focus:outline-none font-sans text-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                  <span>{lang === 'en' ? 'Back to Sign In' : 'العودة لتسجيل الدخول'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Flat aesthetic bottom bar */}
        <div className="bg-[#5C130F]/10 py-1.5 border-t border-[#5C130F]/15">
          <div className="h-[2px] bg-[#BA8332] w-1/3 mx-auto" />
        </div>
      </div>
    </div>
  );
}
