import React, { useState } from 'react';
import { MOCK_GALLERY_IMAGES } from '../utils/mockData';
import { translations, LanguageType } from '../utils/translations';
import { Camera, Calendar, Compass, ArrowRight, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { CoverageType } from '../types';
import Logo from './Logo';
import GalleryCard from './GalleryCard';
import FeatureCard from './FeatureCard';

interface PublicPortalProps {
  lang: LanguageType;
  onJoinClick: () => void;
  onLoginClick: () => void;
}

export default function PublicPortal({ lang, onJoinClick, onLoginClick }: PublicPortalProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  // Contact Form State
  const [formData, setFormData] = useState({
    organizationName: '',
    contactPerson: '',
    email: '',
    phone: '',
    eventName: '',
    eventDate: '',
    location: '',
    coverageType: 'both' as CoverageType,
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationError) setValidationError(null);
    if (submitStatus !== 'idle') setSubmitStatus('idle');
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Basic Validation
    const org = formData.organizationName.trim();
    const contact = formData.contactPerson.trim();
    const email = formData.email.trim();
    const event = formData.eventName.trim();

    if (!org || !contact || !email || !event) {
      setValidationError(
        lang === 'en'
          ? 'Please fill in all required fields (Organization, Contact Person, Email, Event Name).'
          : 'يرجى ملء جميع الحقول الإلزامية (اسم المنظمة، الشخص المسؤول، البريد الإلكتروني، اسم الفعالية).'
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError(
        lang === 'en'
          ? 'Please enter a valid email address.'
          : 'يرجى إدخال عنوان بريد إلكتروني صالح.'
      );
      return;
    }

    // Length safety checks
    if (org.length > 200 || contact.length > 150 || event.length > 200 || formData.message.length > 2000) {
      setValidationError(
        lang === 'en'
          ? 'One or more fields exceed the maximum allowed length.'
          : 'أحد الحقول يتجاوز الحد الأقصى للطول المسموح به.'
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const { error } = await supabase
        .from('coverage_requests')
        .insert([
          {
            organization_name: org,
            contact_person: contact,
            email: email,
            phone: formData.phone.trim() || null,
            event_name: event,
            event_date: formData.eventDate || null,
            location: formData.location.trim() || null,
            coverage_type: formData.coverageType,
            message: formData.message.trim() || null,
            status: 'new'
          }
        ]);

      if (error) {
        console.error('Error submitting coverage request:', error);
        setSubmitStatus('error');
      } else {
        setSubmitStatus('success');
        setFormData({
          organizationName: '',
          contactPerson: '',
          email: '',
          phone: '',
          eventName: '',
          eventDate: '',
          location: '',
          coverageType: 'both',
          message: ''
        });
      }
    } catch (err) {
      console.error('Unexpected error during coverage request submission:', err);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex flex-col min-h-screen bg-editorial-bg text-editorial-ink font-sans ${isRtl ? 'rtl' : 'ltr'}`}>
      
      {/* 1. HERO SECTION */}
      <section className="relative bg-editorial-bg pt-12 pb-18 px-4 sm:px-6 lg:px-8 overflow-hidden text-center">
        {/* Subtle grid pattern background for editorial texture */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M60 0H0v60h60V0z' fill='none' stroke='%23121212' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }}
        />

        <div className="relative max-w-4xl mx-auto flex flex-col items-center gap-6">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-normal sm:tracking-tight leading-tight text-[#5C130F] max-w-3xl">
            {t.welcomeTitle}
          </h1>

          <p className="font-serif italic text-base sm:text-lg text-editorial-ink/80 max-w-2xl leading-relaxed">
            {t.welcomeDesc}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
            <button
              onClick={onJoinClick}
              className="px-7 py-3 bg-[#BA8332] hover:bg-[#a06e28] text-white font-sans text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer hover:shadow-md hover:-translate-y-0.5"
            >
              <span>{t.register}</span>
              <ArrowRight className={`w-4 h-4 text-white ${isRtl ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={onLoginClick}
              className="px-7 py-3 bg-white/70 hover:bg-[#5C130F] hover:text-[#FAF4E8] text-[#5C130F] font-sans text-xs sm:text-sm font-semibold border border-[#5C130F]/30 rounded-lg shadow-xs transition-all cursor-pointer hover:border-[#5C130F]"
            >
              {t.login}
            </button>
          </div>
        </div>
      </section>

      {/* 2. ABOUT AL MUSAWAREEN SECTION */}
      <section id="about" className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#BA8332] font-sans">
              {t.aboutEyebrow}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[40px] font-semibold text-[#5C130F] leading-tight">
              {t.aboutTitle}
            </h2>
            <div className="w-14 h-[2px] bg-[#BA8332] my-1" />
          </div>

          <div className={`lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-[#F6EDDA]/70 border border-[#5C130F]/12 relative shadow-2xs ${isRtl ? 'pr-8' : 'pl-8'}`}>
            <div className={`absolute top-0 ${isRtl ? 'right-0 rounded-r-2xl' : 'left-0 rounded-l-2xl'} w-1.5 h-full bg-[#BA8332]`} />
            <p className="font-sans text-sm sm:text-base text-[#3A1A14]/90 leading-relaxed">
              {t.aboutDesc}
            </p>
          </div>
        </div>
      </section>

      {/* EDITORIAL DOUBLE-LINE SEPARATOR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-3">
        <div className="flex flex-col gap-[3px] w-full">
          <div className="h-[1px] bg-[#5C130F]/70 w-full" />
          <div className="h-[1px] bg-[#5C130F]/20 w-full" />
        </div>
      </div>

      {/* 3. FEATURE / WHAT WE DO SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 flex flex-col items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#BA8332] font-sans">
            {t.whatWeDoEyebrow}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#5C130F]">
            {t.whatWeDoTitle}
          </h2>
          <div className="w-16 h-[2px] bg-[#BA8332] my-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <FeatureCard
            icon={<Camera className="w-7 h-7" />}
            title={t.card1Title}
            description={t.card1Desc}
          />

          <FeatureCard
            icon={<Compass className="w-7 h-7" />}
            title={t.card2Title}
            description={t.card2Desc}
          />

          <FeatureCard
            icon={<Calendar className="w-7 h-7" />}
            title={t.card3Title}
            description={t.card3Desc}
          />
        </div>
      </section>

      {/* 3. OUR WORK SECTION (Gallery) */}
      <section id="our-work" className="bg-editorial-bg border-y border-[#5C130F]/15 py-18 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-12 flex flex-col items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#BA8332] font-sans">
              {t.ourWorkEyebrow}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#5C130F]">
              {t.ourWorkTitle}
            </h2>
            <div className="w-16 h-[2px] bg-[#BA8332] my-1" />
            <p className="font-serif text-sm text-[#3A1A14]/80 italic">
              {t.gallerySubtitle}
            </p>
          </div>

          {/* Grid of photos using GalleryCard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {MOCK_GALLERY_IMAGES.map((img, index) => (
              <GalleryCard
                key={index}
                url={img.url}
                title={lang === 'en' ? img.titleEn : img.titleAr}
                location={img.location}
                credit={img.credit}
                capturedByLabel={t.capturedBy}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. CONTACT / REQUEST EVENT COVERAGE SECTION (Option 3: Split Heritage) */}
      <section id="contact" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full scroll-mt-24">
        {/* Outer Split Heritage Card */}
        <div className="rounded-[20px] md:rounded-[24px] border border-[#5C130F]/15 overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 bg-[#F9E2C9]">
          
          {/* LEFT PANEL: Deep Maroon Info Panel (35-40% desktop) */}
          <div className="lg:col-span-5 bg-[#5C130F] text-[#FAF4E8] p-6 sm:p-8 md:p-10 flex flex-col justify-between gap-8">
            <div className="flex flex-col gap-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#BA8332] font-sans">
                {t.contactEyebrow}
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#FAF4E8] leading-tight">
                {t.contactTitle}
              </h2>
              <div className="w-14 h-[2px] bg-[#BA8332] my-1" />
              <p className="font-sans text-sm sm:text-base text-[#FAF4E8]/85 leading-relaxed">
                {t.contactDesc}
              </p>
            </div>

            {/* Direct Inquiries Box */}
            <div 
              className="p-4 sm:p-5 rounded-[13px] flex flex-col gap-2"
              style={{
                backgroundColor: 'rgba(250, 244, 232, 0.08)',
                border: '1px solid rgba(250, 244, 232, 0.16)'
              }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#BA8332] font-sans">
                {t.directEmailLabel}
              </span>
              <a
                href={`mailto:${t.directEmail}`}
                className="inline-flex items-center gap-2.5 text-[#FAF4E8] hover:text-[#BA8332] font-sans font-medium text-sm transition-colors break-all"
              >
                <Mail className="w-4 h-4 text-[#BA8332] shrink-0" />
                <span>{t.directEmail}</span>
              </a>
            </div>
          </div>

          {/* RIGHT PANEL: Exact #F9E2C9 Beige Form Panel (60-65% desktop) */}
          <div className="lg:col-span-7 bg-[#F9E2C9] p-6 sm:p-8 md:p-10 flex flex-col justify-center">
            
            {/* Success State */}
            {submitStatus === 'success' && (
              <div className="p-7 sm:p-8 rounded-2xl bg-[#FFF9F2] border border-[#BA8332]/30 text-[#3A1A14] flex flex-col items-center text-center gap-3 shadow-xs animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-[#BA8332]/15 flex items-center justify-center text-[#BA8332]">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-[#5C130F]">
                  {lang === 'en' ? 'Request Submitted' : 'تم استلام الطلب'}
                </h3>
                <p className="font-sans text-sm text-[#3A1A14]/85 max-w-md leading-relaxed">
                  {t.contactSuccess}
                </p>
                <button
                  onClick={() => setSubmitStatus('idle')}
                  className="mt-3 px-6 py-2.5 text-xs font-semibold font-sans bg-[#BA8332] hover:bg-[#a06e28] text-white rounded-[10px] shadow-xs transition-colors cursor-pointer"
                >
                  {lang === 'en' ? 'Submit Another Request' : 'إرسال طلب آخر'}
                </button>
              </div>
            )}

            {/* Form Body */}
            {submitStatus !== 'success' && (
              <form onSubmit={handleSubmitRequest} className="flex flex-col gap-4">
                
                {/* Validation Error Banner */}
                {validationError && (
                  <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-sans flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Submission Error Banner */}
                {submitStatus === 'error' && (
                  <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-sans flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{t.contactError}</span>
                  </div>
                )}

                {/* Row 1: Organization Name & Contact Person */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="organizationName" className="block text-xs font-semibold text-[#3A1A14] font-sans mb-1.5">
                      {t.orgNameLabel} <span className="text-[#BA8332]">*</span>
                    </label>
                    <input
                      id="organizationName"
                      name="organizationName"
                      type="text"
                      required
                      value={formData.organizationName}
                      onChange={handleInputChange}
                      placeholder={t.orgNamePlaceholder}
                      className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#FFF9F2] border border-[#5C130F]/18 text-[#3A1A14] placeholder-[#3A1A14]/40 text-sm font-sans focus:outline-none focus:border-[#BA8332] focus:ring-1 focus:ring-[#BA8332] transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label htmlFor="contactPerson" className="block text-xs font-semibold text-[#3A1A14] font-sans mb-1.5">
                      {t.contactPersonLabel} <span className="text-[#BA8332]">*</span>
                    </label>
                    <input
                      id="contactPerson"
                      name="contactPerson"
                      type="text"
                      required
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      placeholder={t.contactPersonPlaceholder}
                      className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#FFF9F2] border border-[#5C130F]/18 text-[#3A1A14] placeholder-[#3A1A14]/40 text-sm font-sans focus:outline-none focus:border-[#BA8332] focus:ring-1 focus:ring-[#BA8332] transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                {/* Row 2: Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-[#3A1A14] font-sans mb-1.5">
                      {t.contactEmailLabel} <span className="text-[#BA8332]">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder={t.contactEmailPlaceholder}
                      className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#FFF9F2] border border-[#5C130F]/18 text-[#3A1A14] placeholder-[#3A1A14]/40 text-sm font-sans focus:outline-none focus:border-[#BA8332] focus:ring-1 focus:ring-[#BA8332] transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-xs font-semibold text-[#3A1A14] font-sans mb-1.5">
                      {t.contactPhoneLabel}
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder={t.contactPhonePlaceholder}
                      className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#FFF9F2] border border-[#5C130F]/18 text-[#3A1A14] placeholder-[#3A1A14]/40 text-sm font-sans focus:outline-none focus:border-[#BA8332] focus:ring-1 focus:ring-[#BA8332] transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                {/* Row 3: Event / Miqaat Name (Full Width) */}
                <div>
                  <label htmlFor="eventName" className="block text-xs font-semibold text-[#3A1A14] font-sans mb-1.5">
                    {t.eventNameLabel} <span className="text-[#BA8332]">*</span>
                  </label>
                  <input
                    id="eventName"
                    name="eventName"
                    type="text"
                    required
                    value={formData.eventName}
                    onChange={handleInputChange}
                    placeholder={t.eventNamePlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#FFF9F2] border border-[#5C130F]/18 text-[#3A1A14] placeholder-[#3A1A14]/40 text-sm font-sans focus:outline-none focus:border-[#BA8332] focus:ring-1 focus:ring-[#BA8332] transition-colors shadow-2xs"
                  />
                </div>

                {/* Row 4: Event Date & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="eventDate" className="block text-xs font-semibold text-[#3A1A14] font-sans mb-1.5">
                      {t.eventDateLabel}
                    </label>
                    <input
                      id="eventDate"
                      name="eventDate"
                      type="date"
                      value={formData.eventDate}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#FFF9F2] border border-[#5C130F]/18 text-[#3A1A14] placeholder-[#3A1A14]/40 text-sm font-sans focus:outline-none focus:border-[#BA8332] focus:ring-1 focus:ring-[#BA8332] transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-xs font-semibold text-[#3A1A14] font-sans mb-1.5">
                      {t.contactLocationLabel}
                    </label>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder={t.locationPlaceholder}
                      className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#FFF9F2] border border-[#5C130F]/18 text-[#3A1A14] placeholder-[#3A1A14]/40 text-sm font-sans focus:outline-none focus:border-[#BA8332] focus:ring-1 focus:ring-[#BA8332] transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                {/* Row 5: Coverage Required (Full Width) */}
                <div>
                  <label htmlFor="coverageType" className="block text-xs font-semibold text-[#3A1A14] font-sans mb-1.5">
                    {t.coverageRequiredLabel} <span className="text-[#BA8332]">*</span>
                  </label>
                  <select
                    id="coverageType"
                    name="coverageType"
                    value={formData.coverageType}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#FFF9F2] border border-[#5C130F]/18 text-[#3A1A14] text-sm font-sans focus:outline-none focus:border-[#BA8332] focus:ring-1 focus:ring-[#BA8332] transition-colors shadow-2xs cursor-pointer"
                  >
                    <option value="both">{t.coverageBoth}</option>
                    <option value="photography">{t.coveragePhoto}</option>
                    <option value="videography">{t.coverageVideo}</option>
                  </select>
                </div>

                {/* Row 6: Message (Full Width) */}
                <div>
                  <label htmlFor="message" className="block text-xs font-semibold text-[#3A1A14] font-sans mb-1.5">
                    {t.messageLabel}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder={t.messagePlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#FFF9F2] border border-[#5C130F]/18 text-[#3A1A14] placeholder-[#3A1A14]/40 text-sm font-sans focus:outline-none focus:border-[#BA8332] focus:ring-1 focus:ring-[#BA8332] transition-colors shadow-2xs resize-none"
                  />
                </div>

                {/* Row 7: Submit Button (Full Width Gold) */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 w-full h-[50px] px-6 rounded-[10px] bg-[#BA8332] hover:bg-[#a06e28] disabled:bg-[#BA8332]/60 text-white font-semibold font-sans text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{t.submittingRequest}</span>
                    </>
                  ) : (
                    <span>{t.sendRequestBtn}</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 5. SIMPLIFIED FOOTER */}
      <footer className="bg-editorial-ink text-editorial-bg/80 text-xs font-sans py-10 border-t border-editorial-border">
        <div className="max-w-7xl mx-auto px-4 text-center flex flex-col items-center gap-4">
          <Logo variant="reversed" className="h-10" />
          
          <a
            href={`mailto:${t.directEmail}`}
            className="text-[#BA8332] hover:underline font-medium"
          >
            {t.directEmail}
          </a>

          <p className="tracking-wide text-editorial-bg/60">
            {t.allRightsReserved}
          </p>
        </div>
      </footer>
    </div>
  );
}
