import React, { useState } from 'react';
import Logo from './Logo';
import { translations, LanguageType } from '../utils/translations';
import { UserProfile } from '../types';
import { Key, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

interface LoginPortalProps {
  lang: LanguageType;
  onLoginSuccess: (user: UserProfile) => void;
  onNavigateRegister: () => void;
}

export default function LoginPortal({ lang, onLoginSuccess, onNavigateRegister }: LoginPortalProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedId = identifier.trim();
    if (!trimmedId || !password.trim()) {
      triggerError(t.allFieldsError);
      return;
    }

    setLoading(true);

    try {
      // 1. Resolve ITS ID or Email
      let resolvedEmail = trimmedId;
      if (!trimmedId.includes('@')) {
        const { data: emailData, error: lookupError } = await supabase
          .rpc('get_email_by_its_id', { target_its_id: trimmedId });

        if (lookupError) {
          console.error('Supabase RPC get_email_by_its_id error:', lookupError);
          throw new Error(`ITS Lookup Error: ${lookupError.message || 'Function get_email_by_its_id failed'}`);
        }
        if (!emailData || emailData.length === 0) {
          throw new Error('ITS ID is not registered.');
        }
        resolvedEmail = emailData[0].email;
      }

      // 2. Authenticate using resolved email
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });

      if (authError) {
        throw authError;
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
        throw new Error(dbError ? `Database Profile Error: ${dbError.message}` : 'Profile record not found in members table.');
      }

      // Enforce strict Admin Approval check: non-admin users must have status 'approved'
      if (memberProfile.role !== 'admin') {
        if (memberProfile.status === 'pending') {
          throw new Error('Your registration is pending official approval by Sheikh Ibrahim Bhai Lokhandwala. You will be able to log in once approved.');
        }
        if (memberProfile.status === 'rejected') {
          throw new Error('Your registration request was declined by Administration.');
        }
      }

      const loggedUser: UserProfile = {
        itsNumber: memberProfile.its_id,
        fullName: memberProfile.full_name,
        fullNameAr: memberProfile.full_name_ar,
        role: memberProfile.role,
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

  const triggerError = (msg: string) => {
    setError(msg);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const fillDemoCreds = (role: 'admin' | 'photographer') => {
    if (role === 'admin') {
      setIdentifier('40486680'); // Shk Ibrahim Bhai Lokhandwala
      setPassword('admin_pass_123');
    } else {
      setIdentifier('50412345'); // Taher Kotwala
      setPassword('taher_pass_123');
    }
    setError('');
  };

  return (
    <div className={`min-h-screen bg-editorial-bg py-16 px-4 flex items-center justify-center font-sans ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Container simulating official card motif */}
      <div 
        className={`w-full max-w-md editorial-card transition-all ${
          shaking ? 'animate-shake' : ''
        }`}
      >
        {/* Ribbon Header: Unified translucent card top section */}
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
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5C130F]">
                {t.password}
              </label>
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
              disabled={loading}
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

        {/* Flat aesthetic bottom bar */}
        <div className="bg-[#5C130F]/10 py-1.5 border-t border-[#5C130F]/15">
          <div className="h-[2px] bg-[#BA8332] w-1/3 mx-auto" />
        </div>
      </div>
    </div>
  );
}
