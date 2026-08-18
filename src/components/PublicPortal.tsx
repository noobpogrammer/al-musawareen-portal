import React from 'react';
import { MOCK_GALLERY_IMAGES } from '../utils/mockData';
import { translations, LanguageType } from '../utils/translations';
import { Camera, Calendar, Compass, Eye, Heart, ArrowRight } from 'lucide-react';
import Logo from './Logo';

interface PublicPortalProps {
  lang: LanguageType;
  onJoinClick: () => void;
  onLoginClick: () => void;
}

import GalleryCard from './GalleryCard';
import FeatureCard from './FeatureCard';

export default function PublicPortal({ lang, onJoinClick, onLoginClick }: PublicPortalProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  return (
    <div className={`flex flex-col min-h-screen bg-editorial-bg text-editorial-ink font-sans ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* 1. HERO SECTION: Newspaper style front page cover */}
      <section className="relative bg-editorial-bg py-20 px-4 sm:px-6 lg:px-8 overflow-hidden text-center border-b-4 border-double border-editorial-ink">
        {/* Subtle grid line background for editorial depth */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M60 0H0v60h60V0z' fill='none' stroke='%23121212' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }}
        />

        <div className="relative max-w-4xl mx-auto flex flex-col items-center gap-6">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-editorial-ink max-w-3xl">
            {t.welcomeTitle}
          </h1>

          <p className="font-serif italic text-base sm:text-lg text-editorial-ink/80 max-w-2xl leading-relaxed">
            {t.welcomeDesc}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <button
              onClick={onJoinClick}
              className="px-6 py-3 bg-[#BA8332] hover:bg-[#a06e28] !text-white font-mono text-xs font-bold tracking-wider uppercase border border-[#BA8332] transition-all flex items-center gap-2 rounded-none cursor-pointer"
            >
              <span className="!text-white">{t.register}</span>
              <ArrowRight className={`w-4 h-4 !text-white ${isRtl ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={onLoginClick}
              className="px-6 py-3 bg-white/40 hover:bg-[#5C130F] hover:text-white text-[#5C130F] font-mono text-xs font-bold tracking-wider uppercase border border-[#5C130F]/40 transition-all rounded-none cursor-pointer"
            >
              {t.login}
            </button>
          </div>
        </div>

        {/* Decorative thin double line break */}
        <div className="absolute bottom-1 inset-x-0 h-[1px] bg-[#5C130F]/15" />
      </section>

      {/* 2. THREE-PILLAR CORE MISSION (Feature Cards) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <FeatureCard
            icon={<Camera className="w-8 h-8 text-[#BA8332]" />}
            title={lang === 'en' ? 'Professional Preservation' : 'حفظ بصري احترافي'}
            description={
              lang === 'en'
                ? 'High-resolution image capturing with optimized color correction and spiritual framing, ensuring archival durability.'
                : 'التقاط صور عالية الدقة مع تصحيح احترافي للألوان وتأطير روحي مميز، لضمان استمرارية الأرشيف للأجيال القادمة.'
            }
          />

          <FeatureCard
            icon={<Compass className="w-8 h-8 text-[#BA8332]" />}
            title={lang === 'en' ? 'Structured Logistics' : 'إدارة لوجستية متكاملة'}
            description={
              lang === 'en'
                ? 'Strategic distribution of 168+ certified lenses across dynamic miqaat coverage zones under admin guidance.'
                : 'توزيع استراتيجي لأكثر من ١٦٨ عدسة معتمدة في مختلف مناطق التغطية الحيوية وتحت إشراف مباشر للجنة الإدارة.'
            }
          />

          <FeatureCard
            icon={<Calendar className="w-8 h-8 text-[#BA8332]" />}
            title={lang === 'en' ? 'Spiritual Archive' : 'أرشيف روحاني مبارك'}
            description={
              lang === 'en'
                ? 'Documenting the historic Waaz assemblies, prayer arrays, and deep devotion of Mumineen worldwide.'
                : 'توثيق مجالس الوعظ التاريخية، وصفوف المصلين الخاشعة، ومشاعر الولاء الصادقة للمؤمنين في كل مكان.'
            }
          />
        </div>
      </section>

      {/* 3. CORE ARCHIVAL PORTFOLIO SHOWCASE (Gallery Cards) */}
      <section className="bg-editorial-bg border-y border-[#5C130F]/20 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-12 flex flex-col items-center gap-2">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#5C130F]">
              {t.galleryTitle}
            </h2>
            <div className="w-20 h-[2px] bg-[#BA8332] my-2" />
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

      {/* 4. ACTIVE CONTEXT BANNER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
        <h2 className="font-serif text-3xl font-bold text-[#5C130F]">
          {t.featuredTitle}
        </h2>
        <p className="font-serif text-sm text-[#3A1A14]/80 leading-relaxed max-w-2xl italic">
          {t.featuredDesc} {lang === 'en' 
            ? 'Registered members must log in to dispatch shot report folders, check spatial proximity zones, and access honorific seating coordinate certificates.'
            : 'يجب على الأعضاء المعتمدين تسجيل الدخول لإرسال روابط التغطية اليومية، وتفقد مناطق التكليف الميداني، وطباعة بطاقات شرف المقاعد والتصاريح الأمنية.'}
        </p>

        <div className="flex gap-4">
          <button
            onClick={onJoinClick}
            className="px-6 py-2.5 bg-[#BA8332] !text-white hover:bg-[#a06e28] font-mono text-xs font-bold tracking-wider uppercase border border-[#BA8332] transition-colors rounded-none cursor-pointer"
          >
            {t.register}
          </button>
          <button
            onClick={onLoginClick}
            className="px-6 py-2.5 bg-white/40 text-[#5C130F] hover:bg-[#5C130F] hover:text-white font-mono text-xs font-bold tracking-wider uppercase border border-[#5C130F]/40 transition-colors rounded-none cursor-pointer"
          >
            {t.login}
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-editorial-ink text-editorial-bg/80 text-[10px] font-mono py-8 border-t border-editorial-border">
        <div className="max-w-7xl mx-auto px-4 text-center flex flex-col items-center gap-3">
          <Logo variant="reversed" className="h-10" />
          <p className="tracking-wide">
            {t.allRightsReserved}
          </p>
        </div>
      </footer>
    </div>
  );
}
