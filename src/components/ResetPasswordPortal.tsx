import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import { LanguageType } from '../utils/translations';
import { Key, CheckCircle2, AlertCircle, Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { cleanAuthUrlParams } from '../utils/authHelpers';

interface ResetPasswordPortalProps {
  lang: LanguageType;
  onNavigateLogin: () => void;
  onNavigateForgotPassword?: () => void;
  onResetSuccess?: () => void;
}

export default function ResetPasswordPortal({
  lang,
  onNavigateLogin,
  onNavigateForgotPassword,
  onResetSuccess
}: ResetPasswordPortalProps) {
  const isRtl = lang === 'ar';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);

  // Check if active recovery session exists
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsSessionValid(true);
      } else {
        setIsSessionValid(false);
      }
    });
  }, []);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: '', color: 'bg-gray-200' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, text: lang === 'en' ? 'Weak' : 'ضعيفة', color: 'bg-red-500' };
    if (score <= 4) return { score, text: lang === 'en' ? 'Medium' : 'متوسطة', color: 'bg-yellow-500' };
    return { score, text: lang === 'en' ? 'Strong' : 'قوية', color: 'bg-green-500' };
  };

  const pwdStrength = getPasswordStrength(newPassword);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError(lang === 'en' ? 'Password must be at least 6 characters long.' : 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(lang === 'en' ? 'Passwords do not match.' : 'كلمات المرور غير متطابقة.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      cleanAuthUrlParams();

      // Sign out recovery session after password reset
      await supabase.auth.signOut();
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || (lang === 'en' ? 'Failed to update password. Your recovery link may have expired.' : 'فشل تحديث كلمة المرور. قد يكون الرابط منتهي الصلاحية.'));
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
            <h2 className="font-serif text-2xl font-bold text-[#5c130f]">
              {lang === 'en' ? 'Create New Password' : 'تعيين كلمة مرور جديدة'}
            </h2>
            <p className="font-serif text-xs text-[#3A1A14]/70 italic mt-1">
              {lang === 'en'
                ? 'Choose a strong, secure password for your Al Musawareen account.'
                : 'اختر كلمة مرور قوية وآمنة لحسابك في منصة المصورين.'}
            </p>
          </div>

          {isSessionValid === false && !success ? (
            <div className="space-y-6 text-center animate-fadeIn">
              <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-none flex items-start gap-3 text-left rtl:text-right">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs leading-relaxed font-serif">
                  <p className="font-bold text-amber-950 font-sans uppercase tracking-wider text-[11px]">
                    {lang === 'en' ? 'Recovery Link Expired or Invalid' : 'رابط الاستعادة غير صالح أو منتهي'}
                  </p>
                  <p>
                    {lang === 'en'
                      ? 'Your password reset link is invalid or has expired. Please request a new recovery link.'
                      : 'رابط استعادة كلمة المرور الخاص بك غير صالح أو انتهت صلاحيته. يرجى طلب رابط جديد.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={onNavigateForgotPassword}
                  className="w-full bg-[#BA8332] hover:bg-[#a06e28] !text-white font-mono text-xs font-bold py-3 rounded-none uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                >
                  {lang === 'en' ? 'Request New Reset Link' : 'طلب رابط استعادة جديد'}
                </button>

                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="w-full border border-[#5C130F]/30 text-[#5C130F] font-mono text-xs font-bold py-2.5 rounded-none uppercase tracking-wider hover:bg-[#5C130F]/5 transition-colors cursor-pointer"
                >
                  {lang === 'en' ? 'Back to Sign In' : 'العودة لتسجيل الدخول'}
                </button>
              </div>
            </div>
          ) : success ? (
            <div className="space-y-6 text-center animate-fadeIn">
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-none flex items-start gap-3 text-left rtl:text-right">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs leading-relaxed font-serif">
                  <p className="font-bold text-emerald-900 font-sans uppercase tracking-wider text-[11px]">
                    {lang === 'en' ? 'Password Successfully Updated' : 'تم تحديث كلمة المرور بنجاح'}
                  </p>
                  <p>
                    {lang === 'en'
                      ? 'Your new credentials have been safely configured. You may now log in to the portal.'
                      : 'تم تعيين كلمة المرور الجديدة بنجاح. يمكنك الآن تسجيل الدخول إلى البوابة.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onNavigateLogin}
                className="w-full bg-[#BA8332] hover:bg-[#a06e28] !text-white font-mono text-xs font-bold py-3 rounded-none uppercase tracking-wider shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{lang === 'en' ? 'Proceed to Sign In' : 'المتابعة لتسجيل الدخول'}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              {error && (
                <div className="bg-[#5C130F]/10 border border-[#5C130F]/30 text-[#5C130F] rounded-none p-3 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5C130F]">
                  {lang === 'en' ? 'New Password' : 'كلمة المرور الجديدة'}
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${isRtl ? 'left-auto right-0 pr-3' : ''}`}>
                    <Key className="h-4.5 w-4.5 text-[#5C130F]/50" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    minLength={6}
                    className={`block w-full pl-10 pr-10 py-2.5 bg-[#FDFAF3] border border-[#5C130F]/35 rounded-none text-sm placeholder-gray-400 focus:outline-none focus:border-[#5C130F] font-sans text-[#3A1A14] ${
                      isRtl ? 'pl-10 pr-10' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute inset-y-0 right-0 pr-3 flex items-center text-[#5C130F]/60 hover:text-[#5C130F] ${isRtl ? 'right-auto left-0 pl-3 pr-0' : ''}`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 flex-grow bg-gray-200 rounded-none overflow-hidden flex gap-0.5">
                      <div className={`h-full ${pwdStrength.color} ${pwdStrength.score >= 1 ? 'w-1/3' : 'w-0'}`} />
                      <div className={`h-full ${pwdStrength.color} ${pwdStrength.score >= 3 ? 'w-1/3' : 'w-0'}`} />
                      <div className={`h-full ${pwdStrength.color} ${pwdStrength.score >= 5 ? 'w-1/3' : 'w-0'}`} />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#5C130F]">
                      {pwdStrength.text}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5C130F]">
                  {lang === 'en' ? 'Confirm New Password' : 'تأكيد كلمة المرور الجديدة'}
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${isRtl ? 'left-auto right-0 pr-3' : ''}`}>
                    <Lock className="h-4.5 w-4.5 text-[#5C130F]/50" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    minLength={6}
                    className={`block w-full pl-10 pr-3 py-2.5 bg-[#FDFAF3] border border-[#5C130F]/35 rounded-none text-sm placeholder-gray-400 focus:outline-none focus:border-[#5C130F] font-sans text-[#3A1A14] ${
                      isRtl ? 'pl-3 pr-10' : ''
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#BA8332] hover:bg-[#a06e28] disabled:bg-gray-400 !text-white font-mono text-xs font-bold py-3 rounded-none uppercase tracking-wider shadow-sm transition-colors mt-6 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <span>{loading ? (lang === 'en' ? 'Updating...' : 'جاري التحديث...') : (lang === 'en' ? 'Set New Password' : 'تعيين كلمة المرور الجديدة')}</span>
              </button>

              <div className="mt-6 text-center text-xs pt-2">
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="font-bold text-[#5C130F] hover:underline transition-colors focus:outline-none font-mono text-[11px] uppercase tracking-wider cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                  <span>{lang === 'en' ? 'Cancel & Return to Sign In' : 'إلغاء والعودة لتسجيل الدخول'}</span>
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
