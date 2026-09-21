import React, { useState } from 'react';
import Logo from './Logo';
import { translations, LanguageType } from '../utils/translations';
import { UserRole } from '../types';
import { Camera, Video, Shield, Info, MapPin, Phone, Mail, UserCheck } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { MOHALLA_OPTIONS as mohallaOptions } from '../utils/mockData';

interface OAuthOnboardingPortalProps {
  lang: LanguageType;
  authUserId: string;
  authEmail: string;
  authFullName?: string;
  authAvatarUrl?: string;
  onComplete: () => void;
  onCancel: () => void;
}

const cameraOptions = [
  'DSLR Camera (e.g., Canon 5D, Nikon D850)',
  'Mirrorless Camera (e.g., Sony A7IV, Canon R5, Nikon Z6)',
  'Compact / DJI Pocket Camera (e.g., Pocket 2/3/4, Action 4)',
  'Cinema Camera (e.g., Blackmagic Pocket 4K/6K, Sony FX3)',
  'Medium Format Camera (e.g., Fujifilm GFX)',
  'Action / Drone Camera (e.g., Mavic 3, GoPro Hero)'
];

const lensOptions = [
  'Prime Lens (e.g., 35mm, 50mm, 85mm)',
  'Wide-Angle Zoom Lens (e.g., 16-35mm)',
  'Standard Zoom Lens (e.g., 24-70mm)',
  'Telephoto Zoom Lens (e.g., 70-200mm)',
  'Macro / Specialized Lens'
];

export default function OAuthOnboardingPortal({
  lang,
  authUserId,
  authEmail,
  authFullName = '',
  authAvatarUrl = '',
  onComplete,
  onCancel
}: OAuthOnboardingPortalProps) {
  const t = translations[lang] || translations['en'];
  const isRtl = lang === 'ar';

  const [itsNumber, setItsNumber] = useState('');
  const [fullName, setFullName] = useState(authFullName);
  const [role, setRole] = useState<UserRole>('photographer');
  const [mobile, setMobile] = useState('');
  const [cityRaza, setCityRaza] = useState('Karachi');
  const [mohalla, setMohalla] = useState(mohallaOptions[0]);

  // Equipment Specific State
  const [selectedCameras, setSelectedCameras] = useState<string[]>([]);
  const [cameraDetails, setCameraDetails] = useState<Record<string, string>>({});
  const [selectedLenses, setSelectedLenses] = useState<string[]>([]);
  const [lensDetails, setLensDetails] = useState<Record<string, string>>({});
  const [otherEquipment, setOtherEquipment] = useState('');

  // Validation & Submission States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakingField, setShakingField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const triggerShake = (fieldName: string, errMsg: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: errMsg }));
    setShakingField(fieldName);
    setTimeout(() => setShakingField(null), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    let valid = true;

    const cleanIts = itsNumber.trim();
    if (!/^\d{8}$/.test(cleanIts)) {
      triggerShake('itsNumber', 'Please enter a valid 8-digit ITS number.');
      valid = false;
    }

    if (fullName.trim().length < 3) {
      triggerShake('fullName', 'Please enter your full name as registered on ITS.');
      valid = false;
    }

    if (!valid) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      const formattedCameras = selectedCameras.map(cam => {
        const specific = cameraDetails[cam]?.trim();
        return specific ? `${cam} (${specific})` : cam;
      });

      const formattedLenses = selectedLenses.map(lens => {
        const specific = lensDetails[lens]?.trim();
        return specific ? `${lens} (${specific})` : lens;
      });

      // Insert or upsert member profile with status explicitly set to 'pending'
      const { error: dbError } = await supabase.from('members').upsert({
        id: authUserId,
        its_id: cleanIts,
        full_name: fullName.trim(),
        dp_url: authAvatarUrl || null,
        role: role,
        roles: [role],
        mobile: mobile.trim(),
        email: authEmail.trim().toLowerCase(),
        city_raza: cityRaza,
        mohalla: mohalla,
        status: 'pending',
        sharaf_status: 'none',
        cameras: (role === 'photographer' || role === 'videographer') ? formattedCameras : [],
        lenses: (role === 'photographer' || role === 'videographer') ? formattedLenses : [],
        other_equipment: (role === 'photographer' || role === 'videographer') ? otherEquipment.trim() : '',
        created_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (dbError) {
        if (dbError.code === '23505') {
          throw new Error('This ITS ID is already associated with another account.');
        }
        throw new Error(dbError.message || 'Failed to complete registration profile.');
      }

      // Sign out auth session so unapproved OAuth account does not remain logged in
      await supabase.auth.signOut();

      onComplete();
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to save profile. Please try again.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-editorial-bg py-12 px-4 sm:px-6 lg:px-8 font-sans ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="max-w-2xl mx-auto editorial-card-light">
        {/* BRANDING HEADER */}
        <div className="relative bg-transparent card-divider py-8 px-8 text-center flex flex-col items-center">
          <Logo variant="primary" className="h-14" />
        </div>

        {/* ONBOARDING FORM BODY */}
        <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#BA8332]/10 border border-[#BA8332]/30 text-[#BA8332] text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Google Identity Verified</span>
            </div>
            <h2 className="font-serif text-3xl font-bold text-[#5c130f]">
              Complete Your Member Profile
            </h2>
            <p className="font-serif text-xs text-[#3A1A14]/70 italic mt-1">
              Link your 8-digit ITS number and technical assignment track to complete Al Musawareen onboarding.
            </p>
          </div>

          {errors.submit && (
            <div className="bg-[#5C130F]/10 border border-[#5C130F]/30 text-[#5C130F] rounded-none p-3.5 text-xs flex items-start gap-2 mb-5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#5C130F]" />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* 1. IDENTITY & ITS */}
          <div className="card-section-box space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#F3E6D0] border-b border-white/15 pb-2">
              1. Identity & ITS Verification
            </h3>

            {/* Email (Readonly from Google OAuth) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#F3E6D0]/80 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#ce933e]" />
                <span>Verified Google Email</span>
              </label>
              <input
                type="email"
                disabled
                value={authEmail}
                className="w-full px-4 py-2.5 bg-white/20 border border-white/30 rounded-none text-sm text-[#F3E6D0] font-mono cursor-not-allowed"
              />
            </div>

            {/* ITS Number */}
            <div className={`flex flex-col gap-1.5 ${shakingField === 'itsNumber' ? 'animate-shake' : ''}`}>
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-editorial-ink/80">
                8-Digit ITS Number (Required)
              </label>
              <input
                type="text"
                maxLength={8}
                value={itsNumber}
                onChange={(e) => setItsNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g., 50412345"
                className="w-full px-4 py-2.5 bg-editorial-bg border border-editorial-border rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-editorial-accent focus:border-editorial-accent font-mono text-editorial-ink"
              />
              {errors.itsNumber && (
                <p className="text-[10px] text-editorial-accent flex items-center gap-1 font-mono">
                  <Info className="w-3 h-3" /> {errors.itsNumber}
                </p>
              )}
            </div>

            {/* Full Name */}
            <div className={`flex flex-col gap-1.5 ${shakingField === 'fullName' ? 'animate-shake' : ''}`}>
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-editorial-ink/80">
                Full Name (As on ITS Records)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Taher Bhai Kotwala"
                className="w-full px-4 py-2.5 bg-editorial-bg border border-editorial-border rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-editorial-accent focus:border-editorial-accent font-sans text-editorial-ink"
              />
              {errors.fullName && (
                <p className="text-[10px] text-editorial-accent flex items-center gap-1 font-mono">
                  <Info className="w-3 h-3" /> {errors.fullName}
                </p>
              )}
            </div>

            {/* Track Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5C130F] mb-1">
                Requested Assignment Track
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  onClick={() => setRole('photographer')}
                  className={`p-4 rounded-none cursor-pointer transition-all flex flex-col gap-2 ${
                    role === 'photographer' ? 'option-card-selected' : 'option-card-unselected'
                  }`}
                >
                  <Camera className="w-5 h-5 text-[#5C130F]" />
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wide text-[#5C130F]">Photographer</h4>
                    <p className="text-[9px] mt-0.5 leading-tight text-[#3A1A14]/75">Still images capture</p>
                  </div>
                </div>

                <div
                  onClick={() => setRole('videographer')}
                  className={`p-4 rounded-none cursor-pointer transition-all flex flex-col gap-2 ${
                    role === 'videographer' ? 'option-card-selected' : 'option-card-unselected'
                  }`}
                >
                  <Video className="w-5 h-5 text-[#5C130F]" />
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wide text-[#5C130F]">Videographer</h4>
                    <p className="text-[9px] mt-0.5 leading-tight text-[#3A1A14]/75">Cinematic & motion</p>
                  </div>
                </div>

                <div
                  onClick={() => setRole('coordinator')}
                  className={`p-4 rounded-none cursor-pointer transition-all flex flex-col gap-2 ${
                    role === 'coordinator' ? 'option-card-selected' : 'option-card-unselected'
                  }`}
                >
                  <Shield className="w-5 h-5 text-[#5C130F]" />
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wide text-[#5C130F]">HR Coordinator</h4>
                    <p className="text-[9px] mt-0.5 leading-tight text-[#3A1A14]/75">Logistics & dispatch</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. EQUIPMENT SECTION FOR PHOTOGRAPHER/VIDEOGRAPHER */}
          {(role === 'photographer' || role === 'videographer') && (
            <div className="card-section-box space-y-5">
              <h3 className="font-serif text-lg font-bold text-[#F3E6D0] border-b border-white/15 pb-2 flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#ce933e]" />
                <span>Equipment Specifications</span>
              </h3>

              {/* Cameras Checkboxes */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-editorial-ink/80 block">
                  What camera do you have? (Select all that apply)
                </label>
                <div className="grid grid-cols-1 gap-3.5 mt-2">
                  {cameraOptions.map((cam) => {
                    const isChecked = selectedCameras.includes(cam);
                    return (
                      <div key={cam} className={`flex flex-col gap-2 p-3 transition-all ${isChecked ? 'option-card-selected' : 'option-card-unselected'}`}>
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedCameras(selectedCameras.filter(c => c !== cam));
                                const newDetails = { ...cameraDetails };
                                delete newDetails[cam];
                                setCameraDetails(newDetails);
                              } else {
                                setSelectedCameras([...selectedCameras, cam]);
                              }
                            }}
                            className="mt-0.5 h-4 w-4 text-[#BA8332] focus:ring-[#BA8332] border-[#5C130F]/30 rounded-none accent-[#BA8332]"
                          />
                          <span className="text-xs font-medium text-[#5C130F] leading-tight">{cam}</span>
                        </label>
                        {isChecked && (
                          <div className="pl-7 pr-1 pb-1 animate-fade-in">
                            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5C130F] block mb-1">
                              Specify camera model / manufacturer:
                            </label>
                            <input
                              type="text"
                              value={cameraDetails[cam] || ''}
                              onChange={(e) => setCameraDetails({ ...cameraDetails, [cam]: e.target.value })}
                              placeholder="e.g., Canon EOS R5, Sony FX3, DJI Pocket 3"
                              className="w-full px-3 py-1.5 bg-[#FDFAF3] border border-[#5C130F]/35 text-xs focus:outline-none focus:ring-1 focus:ring-[#5C130F] text-[#3A1A14] font-sans placeholder-gray-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lenses Checkboxes */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5C130F] block">
                  What lenses do you have? (Select all that apply)
                </label>
                <div className="grid grid-cols-1 gap-3.5 mt-2">
                  {lensOptions.map((lens) => {
                    const isChecked = selectedLenses.includes(lens);
                    return (
                      <div key={lens} className={`flex flex-col gap-2 p-3 transition-all ${isChecked ? 'option-card-selected' : 'option-card-unselected'}`}>
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedLenses(selectedLenses.filter(l => l !== lens));
                                const newDetails = { ...lensDetails };
                                delete newDetails[lens];
                                setLensDetails(newDetails);
                              } else {
                                setSelectedLenses([...selectedLenses, lens]);
                              }
                            }}
                            className="mt-0.5 h-4 w-4 text-editorial-accent focus:ring-editorial-accent border-editorial-border rounded-none accent-editorial-accent"
                          />
                          <span className="text-xs font-medium text-editorial-ink leading-tight">{lens}</span>
                        </label>
                        {isChecked && (
                          <div className="pl-7 pr-1 pb-1 animate-fade-in">
                            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-editorial-accent block mb-1">
                              Specify lens details:
                            </label>
                            <input
                              type="text"
                              value={lensDetails[lens] || ''}
                              onChange={(e) => setLensDetails({ ...lensDetails, [lens]: e.target.value })}
                              placeholder="e.g., Sony FE 24-70mm f/2.8 GM II, Canon RF 50mm f/1.2L"
                              className="w-full px-3 py-1.5 bg-white border border-editorial-border text-xs focus:outline-none focus:ring-1 focus:ring-editorial-accent focus:border-editorial-accent text-editorial-ink font-sans placeholder-gray-400"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Other Equipment */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-editorial-ink/80">
                  Other Equipment & Accessories
                </label>
                <textarea
                  rows={3}
                  value={otherEquipment}
                  onChange={(e) => setOtherEquipment(e.target.value)}
                  placeholder="e.g., DJI Ronin RSC2 Gimbal, Manfrotto Tripod, Godox V1 Flash"
                  className="w-full px-4 py-2.5 bg-editorial-bg border border-editorial-border rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-editorial-accent focus:border-editorial-accent text-editorial-ink font-sans resize-none"
                />
              </div>
            </div>
          )}

          {/* 3. CONTACT & RESIDENTIAL RECORDS */}
          <div className="card-section-box space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#F3E6D0] border-b border-white/15 pb-2">
              3. Contact & Residential Records
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#F3E6D0]/80 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#ce933e]" />
                  <span>Mobile Number (WhatsApp)</span>
                </label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g., +92 300 1234567"
                  className="w-full px-4 py-2.5 bg-[#faf4e8] border border-editorial-border rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-editorial-accent focus:border-editorial-accent text-editorial-ink font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#F3E6D0]/80 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#ce933e]" />
                  <span>Mohalla (Zone of Residence)</span>
                </label>
                <select
                  value={mohalla}
                  onChange={(e) => setMohalla(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#faf4e8] border border-editorial-border rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-editorial-accent focus:border-editorial-accent text-editorial-ink font-mono"
                >
                  {mohallaOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#BA8332] hover:bg-[#a06e28] disabled:bg-gray-400 !text-white font-mono text-xs font-bold uppercase tracking-widest shadow-sm transition-colors border border-[#BA8332] rounded-none cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              <span>{loading ? 'Submitting Application...' : 'Submit Profile for Admin Approval'}</span>
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 bg-transparent hover:bg-black/5 text-[#5C130F] font-mono text-xs uppercase tracking-wider transition-colors border border-[#5C130F]/20 cursor-pointer"
            >
              Cancel & Return to Login
            </button>
          </div>
        </form>

        <div className="bg-[#5C130F]/10 py-1.5 border-t border-[#5C130F]/15">
          <div className="h-[2px] bg-[#BA8332] w-1/3 mx-auto" />
        </div>
      </div>
    </div>
  );
}
