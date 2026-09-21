import React, { useState } from 'react';
import Logo from './Logo';
import { translations, LanguageType } from '../utils/translations';
import { UserProfile } from '../types';
import { Key, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { getAppBaseUrl } from '../utils/authHelpers';

interface LoginPortalProps {
  lang: LanguageType;
  onLoginSuccess: (user: UserProfile) => void;
  onNavigateRegister: () => void;
  onNavigateForgotPassword: () => void;
}

export default function LoginPortal({
  lang,
  onLoginSuccess,
  onNavigateRegister,
  onNavigateForgotPassword
}: LoginPortalProps) {
  const t = translations[lang] || translations['en'];
  const isRtl = lang === 'ar';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedId = identifier.trim();
    if (!trimmedId || !password.trim()) {
      triggerError(t.allFieldsError || 'Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      // 1. Resolve ITS ID or Email
      let resolvedEmail = trimmedId;
      if (!trimmedId.includes('@')) {
        const { data: emailData, error: lookupError } = await supabase
          .rpc('get_email_by_its_id', { target_its_id: trimmedId });

        if (lookupError || !emailData || emailData.length === 0) {
          console.error('ITS Lookup Error:', lookupError);
          throw new Error('Invalid credentials. Please check your ITS ID or password.');
        }
        resolvedEmail = emailData[0].email;
      }

      // 2. Authenticate using resolved email
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });

      if (authError) {
        throw new Error('Invalid email/ITS ID or password.');
      }

      const userId = data.user?.id;
      if (!userId) {
        throw new Error('User session not found.');
      }

      // Fetch user profile from members table
      const { data: memberProfile, error: dbError } = await supabase
        .from('members')
        .select('*')
        .eq('id', userId)
        .single();

      if (dbError || !memberProfile) {
        throw new Error('Account profile not found. Please contact administration.');
      }

      // Enforce strict Admin Approval check: non-admin users must have status 'approved'
      if (memberProfile.role !== 'admin') {
        if (memberProfile.status === 'pending') {
          await supabase.auth.signOut();
          throw new Error('Your registration is pending official approval by Sheikh Ibrahim Bhai Lokhandwala. You will be able to log in once approved.');
        }
        if (memberProfile.status === 'rejected') {
          await supabase.auth.signOut();
          throw new Error('Your registration request was declined by Administration.');
        }
      }

      const loggedUser: UserProfile = {
        itsNumber: memberProfile.its_id,
        fullName: memberProfile.full_name,
        fullNameAr: memberProfile.full_name_ar,
        role: memberProfile.role,
        roles: memberProfile.roles || (memberProfile.role ? [memberProfile.role] : undefined),
        hrPermissions: memberProfile.hr_permissions,
        mobile: memberProfile.mobile,
        email: memberProfile.email,
        avatarUrl: memberProfile.dp_url,
        cityRaza: memberProfile.city_raza,
        mohalla: memberProfile.mohalla,
        status: memberProfile.status,
        sharafStatus: memberProfile.sharaf_status,
        sharafZone: memberProfile.sharaf_zone,
        sharafSeat: memberProfile.sharaf_seat,
        createdAt: memberProfile.created_at,
        cameras: memberProfile.cameras,
        lenses: memberProfile.lenses,
        otherEquipment: memberProfile.other_equipment
      };

      onLoginSuccess(loggedUser);
    } catch (err: any) {
      console.error('Supabase Authentication Error:', err);
      triggerError(err.message || 'Invalid credentials or authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setOauthLoading(true);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getAppBaseUrl()}/?auth=oauth`
        }
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err: any) {
      console.error('Google OAuth Error:', err);
      triggerError(err.message || 'Unable to connect to Google authentication.');
      setOauthLoading(false);
    }
  };

  const triggerError = (msg: string) => {
    setError(msg);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  return (
    <div className={`min-h-screen bg-editorial-bg py-16 px-4 flex items-center justify-center font-sans ${isRtl ? 'rtl' : 'ltr'}`}>
      <div 
        className={`w-full max-w-md editorial-card transition-all ${
          shaking ? 'animate-shake' : ''
        }`}
      >
        {/* Ribbon Header */}
        <div className="relative bg-transparent card-divider py-8 px-6 text-center flex flex-col items-center">
          <Logo variant="primary" className="h-14" />
        </div>

        {/* Form Body */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="font-serif text-2xl font-bold text-[#5c130f]">
              {t.loginTitle}
            </h2>
            <p className="font-serif text-xs text-[#3A1A14]/70 italic mt-1">
              {t.loginSubtitle}
            </p>
          </div>

          {error && (
            <div className="bg-[#5C130F]/10 border border-[#5C130F]/30 text-[#5C130F] rounded-none p-3.5 text-xs flex items-start gap-2 mb-5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            disabled={loading || oauthLoading}
            onClick={handleGoogleSignIn}
            className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-100 text-[#3A1A14] border border-[#5C130F]/25 font-mono text-xs font-bold py-2.5 rounded-none uppercase tracking-wider shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-3 mb-5"
          >
            {oauthLoading ? (
              <svg className="animate-spin h-4 w-4 text-[#5C130F]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{oauthLoading ? 'Redirecting to Google...' : (isRtl ? 'المتابعة باستخدام Google' : 'Continue with Google')}</span>
          </button>

          <div className="relative flex py-2 items-center mb-5">
            <div className="flex-grow border-t border-[#5C130F]/20"></div>
            <span className="flex-shrink mx-3 text-[10px] font-mono uppercase tracking-widest text-[#3A1A14]/60">
              {isRtl ? 'أو عبر البريد / ITS' : 'or with ITS / Email'}
            </span>
            <div className="flex-grow border-t border-[#5C130F]/20"></div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* ID or Email field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5C130F]">
                {t.itsOrEmail}
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${isRtl ? 'left-auto right-0 pr-3' : ''}`}>
                  <Mail className="h-4.5 w-4.5 text-[#5C130F]/50" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={lang === 'en' ? 'e.g., 50412345 or email@address.com' : 'مثال: 50412345 أو بريد إلكتروني'}
                  className={`block w-full pl-10 pr-3 py-2.5 bg-[#FDFAF3] border border-[#5C130F]/35 rounded-none text-sm placeholder-gray-400 focus:outline-none focus:border-[#5C130F] font-sans text-[#3A1A14] ${
                    isRtl ? 'pl-3 pr-10' : ''
                  }`}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5C130F]">
                  {t.password}
                </label>
                <button
                  type="button"
                  onClick={onNavigateForgotPassword}
                  className="text-[11px] font-mono text-[#BA8332] hover:underline cursor-pointer focus:outline-none"
                >
                  {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                </button>
              </div>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${isRtl ? 'left-auto right-0 pr-3' : ''}`}>
                  <Key className="h-4.5 w-4.5 text-[#5C130F]/50" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`block w-full pl-10 pr-3 py-2.5 bg-[#FDFAF3] border border-[#5C130F]/35 rounded-none text-sm placeholder-gray-400 focus:outline-none focus:border-[#5C130F] font-sans text-[#3A1A14] ${
                    isRtl ? 'pl-3 pr-10' : ''
                  }`}
                />
              </div>
            </div>

            {/* Login Action Button */}
            <button
              type="submit"
              disabled={loading || oauthLoading}
              className="w-full bg-[#BA8332] hover:bg-[#a06e28] disabled:bg-gray-400 !text-white font-mono text-xs font-bold py-3 rounded-none uppercase tracking-wider shadow-sm transition-colors mt-6 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              <span>{loading ? 'Authenticating...' : t.loginBtn}</span>
            </button>
          </form>

          {/* Register Redirect Link */}
          <div className="mt-6 text-center text-xs">
            <span className="text-[#3A1A14]/80">{t.noAccount} </span>
            <button
              onClick={onNavigateRegister}
              className="font-bold text-[#5C130F] hover:underline transition-colors focus:outline-none font-mono text-[11px] uppercase tracking-wider cursor-pointer"
            >
              {t.registerLink}
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="bg-[#5C130F]/10 py-1.5 border-t border-[#5C130F]/15">
          <div className="h-[2px] bg-[#BA8332] w-1/3 mx-auto" />
        </div>
      </div>
    </div>
  );
}
