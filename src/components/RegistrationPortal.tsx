import React, { useState } from 'react';
import Logo from './Logo';
import { translations, LanguageType } from '../utils/translations';
import { UserProfile, UserRole } from '../types';
import { Camera, Video, Shield, User, Info, CheckCircle2, Lock, Eye, EyeOff, MapPin, Phone, Mail, HelpCircle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

interface RegistrationPortalProps {
  lang: LanguageType;
  onRegisterSuccess: (newUser: UserProfile) => void;
  onNavigateLogin: () => void;
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

import { MOHALLA_OPTIONS as mohallaOptions } from '../utils/mockData';

export default function RegistrationPortal({ lang, onRegisterSuccess, onNavigateLogin }: RegistrationPortalProps) {
  // We use English translation per the user's instructions
  const t = translations['en'];

  const [itsNumber, setItsNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('photographer');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [cityRaza, setCityRaza] = useState('Karachi');
  const [mohalla, setMohalla] = useState(mohallaOptions[0]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Profile Picture (DP) Upload
  const [dpFile, setDpFile] = useState<File | null>(null);
  const [dpPreview, setDpPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Equipment Specific State
  const [selectedCameras, setSelectedCameras] = useState<string[]>([]);
  const [cameraDetails, setCameraDetails] = useState<Record<string, string>>({});
  
  const [selectedLenses, setSelectedLenses] = useState<string[]>([]);
  const [lensDetails, setLensDetails] = useState<Record<string, string>>({});
  
  const [otherEquipment, setOtherEquipment] = useState('');
  
  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakingField, setShakingField] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  // Compress image client-side before upload
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(blob || file);
          }, 'image/jpeg', 0.85);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: '', color: 'bg-gray-200' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, text: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, text: 'Medium', color: 'bg-yellow-500' };
    return { score, text: 'Strong', color: 'bg-green-500' };
  };

  const pwdStrength = getPasswordStrength(password);

  const triggerShake = (fieldName: string, errMsg: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: errMsg }));
    setShakingField(fieldName);
    setTimeout(() => setShakingField(null), 500);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    let valid = true;

    // Validate ITS
    const cleanIts = itsNumber.trim();
    if (!/^\d{8}$/.test(cleanIts)) {
      triggerShake('itsNumber', t.itsFormatError);
      valid = false;
    }

    // Validate Full Name
    if (fullName.trim().length < 3) {
      triggerShake('fullName', 'Please enter your full name as registered on ITS.');
      valid = false;
    }

    // Validate Email
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      triggerShake('email', 'Please enter a valid email address.');
      valid = false;
    }

    // Validate Password
    if (password.length < 6) {
      triggerShake('password', 'Password must be at least 6 characters.');
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

      // 1. Sign up user via Supabase Auth with metadata for the database trigger
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            its_id: cleanIts,
            full_name: fullName.trim(),
            role: role,
            mobile: mobile.trim(),
            city_raza: cityRaza,
            mohalla: mohalla,
            dp_url: null,
            cameras: (role === 'photographer' || role === 'videographer') ? formattedCameras : [],
            lenses: (role === 'photographer' || role === 'videographer') ? formattedLenses : [],
            other_equipment: (role === 'photographer' || role === 'videographer') ? otherEquipment.trim() : ''
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      const userId = signUpData.user?.id;
      if (!userId) {
        throw new Error('Failed to retrieve user ID.');
      }

      // 2. Compress and upload DP to Supabase Storage if provided
      let dpUrl = '';
      if (dpFile) {
        try {
          const compressedBlob = await compressImage(dpFile);
          const fileExt = dpFile.name.split('.').pop() || 'jpg';
          const fileName = `${userId}-${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('dp-uploads')
            .upload(fileName, compressedBlob, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (uploadError) {
            console.warn('Profile picture upload warning:', uploadError.message);
          } else {
            const { data: publicUrlData } = supabase.storage
              .from('dp-uploads')
              .getPublicUrl(fileName);
            dpUrl = publicUrlData.publicUrl;
          }
        } catch (uploadErr: any) {
          console.warn('Profile picture upload error:', uploadErr.message);
        }
      }

      // 3. Fallback client-side member record insert / update (if DB trigger isn't active or dpUrl was added)
      const { error: dbError } = await supabase.from('members').upsert({
        id: userId,
        its_id: cleanIts,
        full_name: fullName.trim(),
        dp_url: dpUrl || null,
        role: role,
        mobile: mobile.trim(),
        email: cleanEmail,
        city_raza: cityRaza,
        mohalla: mohalla,
        cameras: (role === 'photographer' || role === 'videographer') ? formattedCameras : [],
        lenses: (role === 'photographer' || role === 'videographer') ? formattedLenses : [],
        other_equipment: (role === 'photographer' || role === 'videographer') ? otherEquipment.trim() : '',
        created_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (dbError && dbError.code === '23505') {
        throw new Error('This ITS ID is already registered.');
      }

      const newUser: UserProfile = {
        itsNumber: cleanIts,
        fullName: fullName.trim(),
        role,
        mobile: mobile.trim(),
        email: cleanEmail,
        avatarUrl: dpUrl,
        cityRaza: cityRaza,
        status: 'pending',
        sharafStatus: 'none',
        createdAt: new Date().toISOString(),
        cameras: (role === 'photographer' || role === 'videographer') ? formattedCameras : [],
        lenses: (role === 'photographer' || role === 'videographer') ? formattedLenses : [],
        otherEquipment: (role === 'photographer' || role === 'videographer') ? otherEquipment.trim() : ''
      };

      setRegisteredSuccess(true);
      setTimeout(() => {
        onRegisterSuccess(newUser);
      }, 2500);

    } catch (err: any) {
      setErrors({ submit: err.message || 'Registration failed. Please check your credentials.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  if (registeredSuccess) {
    return (
      <div className="min-h-screen bg-editorial-bg flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md editorial-card p-8 text-center flex flex-col items-center gap-6">
          <div className="p-4 bg-editorial-bg rounded-none border border-editorial-border text-editorial-accent">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-editorial-ink">
            Application Submitted
          </h2>
          <p className="font-serif italic text-sm text-editorial-ink/75 leading-relaxed">
            Your registration with ITS Number {itsNumber} has been dispatched to Sheikh Ibrahim Bhai Lokhandwala for official onboarding and Sharaf authorization. You can now use your credentials to log in.
          </p>
          <div className="w-full h-1.5 bg-editorial-ink/10 rounded-none overflow-hidden mt-4">
            <div className="h-full bg-editorial-accent w-full animate-[pulse_1.5s_infinite]" />
          </div>
          <p className="text-[10px] font-mono text-editorial-accent font-bold tracking-widest uppercase">
            {t.loading}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-editorial-bg py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto editorial-card-light">
        
        {/* BRANDING HEADER */}
        <div className="relative bg-transparent card-divider py-8 px-8 text-center flex flex-col items-center">
          <Logo variant="primary" className="h-14" />
        </div>

        {/* REGISTRATION FORM BODY */}
        <form onSubmit={handleRegisterSubmit} className="p-8 sm:p-10 space-y-6">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-bold text-[#5c130f]">
              Onboarding & Registration
            </h2>
            <p className="font-serif text-xs text-[#F3E6D0]/70 italic mt-1">
              Become a certified Al Musawareen photographer, videographer, or HR coordinator
            </p>
          </div>

          {errors.submit && (
            <div className="bg-[#5C130F]/10 border border-[#5C130F]/30 text-[#5C130F] rounded-none p-3.5 text-xs flex items-start gap-2 mb-5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-editorial-accent" />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* 1. IDENTITY SECTION */}
          <div className="card-section-box space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#F3E6D0] border-b border-white/15 pb-2">
              1. ITS & Identity Verification
            </h3>

            {/* ITS Number */}
            <div className={`flex flex-col gap-1.5 ${shakingField === 'itsNumber' ? 'animate-shake' : ''}`}>
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-editorial-ink/80">
                {t.itsLabel}
              </label>
              <input
                type="text"
                maxLength={8}
                value={itsNumber}
                onChange={(e) => setItsNumber(e.target.value.replace(/\D/g, ''))}
                placeholder={t.itsPlaceholder}
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
                Full Name (English)
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

            {/* DP Upload */}
            <div className={`flex flex-col gap-1.5 ${shakingField === 'dp' ? 'animate-shake' : ''}`}>
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-editorial-ink/80">
                Profile Picture (DP) Upload
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setDpFile(file);
                      setDpPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="w-full px-4 py-2 bg-editorial-bg border border-editorial-border rounded-none text-sm focus:outline-none text-editorial-ink file:mr-4 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-mono file:font-bold file:bg-[#BA8332] file:text-white hover:file:bg-[#a06e28] file:cursor-pointer"
                />
                {dpPreview && (
                  <img
                    src={dpPreview}
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#BA8332]"
                  />
                )}
              </div>
              {errors.dp && (
                <p className="text-[10px] text-editorial-accent flex items-center gap-1 font-mono">
                  <Info className="w-3 h-3" /> {errors.dp}
                </p>
              )}
            </div>

            {/* Interactive Radio Cards: Role Track selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5C130F] mb-1">
                Choose Your Assignment Track
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Photographer */}
                <div
                  onClick={() => setRole('photographer')}
                  className={`p-4 rounded-none cursor-pointer transition-all flex flex-col gap-2 ${
                    role === 'photographer'
                      ? 'option-card-selected'
                      : 'option-card-unselected'
                  }`}
                >
                  <Camera className="w-5 h-5 text-[#5C130F]" />
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wide text-[#5C130F]">
                      Photographer
                    </h4>
                    <p className="text-[9px] mt-0.5 leading-tight text-[#3A1A14]/75">
                      Still images capture & preservation
                    </p>
                  </div>
                </div>

                {/* Videographer */}
                <div
                  onClick={() => setRole('videographer')}
                  className={`p-4 rounded-none cursor-pointer transition-all flex flex-col gap-2 ${
                    role === 'videographer'
                      ? 'option-card-selected'
                      : 'option-card-unselected'
                  }`}
                >
                  <Video className="w-5 h-5 text-[#5C130F]" />
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wide text-[#5C130F]">
                      Videographer
                    </h4>
                    <p className="text-[9px] mt-0.5 leading-tight text-[#3A1A14]/75">
                      Movement, audio, & cinematic records
                    </p>
                  </div>
                </div>

                {/* HR Coordinator */}
                <div
                  onClick={() => setRole('coordinator')}
                  className={`p-4 rounded-none cursor-pointer transition-all flex flex-col gap-2 ${
                    role === 'coordinator'
                      ? 'option-card-selected'
                      : 'option-card-unselected'
                  }`}
                >
                  <Shield className="w-5 h-5 text-[#5C130F]" />
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wide text-[#5C130F]">
                      HR Coordinator
                    </h4>
                    <p className="text-[9px] mt-0.5 leading-tight text-[#3A1A14]/75">
                      Logistics, monitoring, & dispatching
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* EQUIPMENT SECTION FOR PHOTOGRAPHER/VIDEOGRAPHER ONLY */}
          {(role === 'photographer' || role === 'videographer') && (
            <div className="card-section-box space-y-5">
              <h3 className="font-serif text-lg font-bold text-[#F3E6D0] border-b border-white/15 pb-2 flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#ce933e]" />
                <span>Equipment Specifications</span>
              </h3>
              <p className="text-xs text-[#F3E6D0]/70 italic font-serif">
                Please specify the cameras and lenses you will use during the Miqaat coverage. You may select multiple options.
              </p>

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
                                // Remove specific detail if unchecked
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
                        
                        {/* Inline specific model text field: rendered only when checked */}
                        {isChecked && (
                          <div className="pl-7 pr-1 pb-1 animate-fade-in">
                            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5C130F] block mb-1">
                              Specify camera model / manufacturer:
                            </label>
                            <input
                              type="text"
                              value={cameraDetails[cam] || ''}
                              onChange={(e) => setCameraDetails({
                                ...cameraDetails,
                                [cam]: e.target.value
                              })}
                              placeholder="e.g., Canon EOS R5, Sony FX3, DJI Pocket 3"
                              className="w-full px-3 py-1.5 bg-[#FDFAF3] border border-[#5C130F]/35 text-xs focus:outline-none focus:ring-1 focus:ring-[#5C130F] text-[#3A1A14] font-sans placeholder-gray-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {errors.cameras && (
                  <p className="text-[10px] text-[#5C130F] flex items-center gap-1 font-mono mt-1">
                    <Info className="w-3 h-3" /> {errors.cameras}
                  </p>
                )}
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
                                // Remove specific detail if unchecked
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
                        
                        {/* Inline specific lens text field: rendered only when checked */}
                        {isChecked && (
                          <div className="pl-7 pr-1 pb-1 animate-fade-in">
                            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-editorial-accent block mb-1">
                              Specify lens details:
                            </label>
                            <input
                              type="text"
                              value={lensDetails[lens] || ''}
                              onChange={(e) => setLensDetails({
                                ...lensDetails,
                                [lens]: e.target.value
                              })}
                              placeholder="e.g., Sony FE 24-70mm f/2.8 GM II, Canon RF 50mm f/1.2L"
                              className="w-full px-3 py-1.5 bg-white border border-editorial-border text-xs focus:outline-none focus:ring-1 focus:ring-editorial-accent focus:border-editorial-accent text-editorial-ink font-sans placeholder-gray-400"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {errors.lenses && (
                  <p className="text-[10px] text-editorial-accent flex items-center gap-1 font-mono mt-1">
                    <Info className="w-3 h-3" /> {errors.lenses}
                  </p>
                )}
              </div>

              {/* Other Equipment textarea */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-editorial-ink/80">
                  Other Equipment & Accessories (Gimbals, Tripods, Mics, Lights, etc.)
                </label>
                <textarea
                  rows={3}
                  value={otherEquipment}
                  onChange={(e) => setOtherEquipment(e.target.value)}
                  placeholder="e.g., DJI Ronin RSC2 Gimbal, Manfrotto Tripod, Rode Wireless Pro Mic, Godox V1 Flash, DJI Pocket 4"
                  className="w-full px-4 py-2.5 bg-editorial-bg border border-editorial-border rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-editorial-accent focus:border-editorial-accent text-editorial-ink font-sans resize-none"
                />
              </div>
            </div>
          )}

          {/* 2. CONTACT & LOCATION SECTION */}
          <div className="card-section-box space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#F3E6D0] border-b border-white/15 pb-2">
              2. Contact & Residential Records
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email Address */}
              <div className={`flex flex-col gap-1.5 ${shakingField === 'email' ? 'animate-shake' : ''}`}>
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#F3E6D0]/80 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#ce933e]" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., user@example.com"
                  className="w-full px-4 py-2.5 bg-[#faf4e8] border border-editorial-border rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-editorial-accent focus:border-editorial-accent text-editorial-ink font-sans"
                />
                {errors.email && (
                  <p className="text-[10px] text-editorial-accent flex items-center gap-1 font-mono">
                    <Info className="w-3 h-3" /> {errors.email}
                  </p>
                )}
              </div>

              {/* Mobile Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#F3E6D0]/80 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#ce933e]" />
                  <span>{t.mobileLabel}</span>
                </label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g., +92 300 1234567"
                  className="w-full px-4 py-2.5 bg-[#faf4e8] border border-editorial-border rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-editorial-accent focus:border-editorial-accent text-editorial-ink font-mono"
                />
              </div>
            </div>

            {/* Mohalla Zone Dropdown */}
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
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. PORTAL ACCESS PASSWORD & INTEGRITY */}
          <div className="card-section-box space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#F3E6D0] border-b border-white/15 pb-2">
              3. Portal Access & Security
            </h3>

            <div className={`flex flex-col gap-1.5 ${shakingField === 'password' ? 'animate-shake' : ''}`}>
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-editorial-ink/80">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 bg-editorial-bg border border-editorial-border rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-editorial-accent focus:border-editorial-accent text-editorial-ink font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-editorial-ink/40 hover:text-editorial-ink"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>

              {errors.password && (
                <p className="text-[10px] text-editorial-accent flex items-center gap-1 font-mono">
                  <Info className="w-3 h-3" /> {errors.password}
                </p>
              )}

              {/* Password Strength Meter */}
              {password && (
                <div className="space-y-1.5 mt-2">
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-editorial-ink/60">
                    <span>{t.strengthLabel}:</span>
                    <span className="font-bold text-editorial-accent">{pwdStrength.text}</span>
                  </div>
                  <div className="h-1.5 w-full bg-editorial-ink/10 rounded-none overflow-hidden flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-full flex-1 transition-all duration-300 ${
                          i < pwdStrength.score ? pwdStrength.color : 'bg-editorial-ink/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
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
            <span>{loading ? 'Submitting Application...' : t.submitOnboard}</span>
          </button>

          {/* Navigate back to Login */}
          <div className="text-center text-xs mt-4">
            <span className="text-[#3A1A14]/80">{t.alreadyHaveAccount} </span>
            <button
              type="button"
              onClick={onNavigateLogin}
              className="font-bold text-[#5C130F] hover:underline transition-colors font-mono text-[11px] uppercase tracking-wider cursor-pointer"
            >
              {t.loginHere}
            </button>
          </div>
        </form>

        {/* Flat aesthetic bottom bar */}
        <div className="bg-[#5C130F]/10 py-1.5 border-t border-[#5C130F]/15">
          <div className="h-[2px] bg-[#BA8332] w-1/3 mx-auto" />
        </div>
      </div>
    </div>
  );
}
