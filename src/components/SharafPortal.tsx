import React from 'react';
import { UserProfile, SharafAllocation } from '../types';
import { translations, LanguageType } from '../utils/translations';
import { Award, MapPin, Clock, Bookmark } from 'lucide-react';

interface SharafPortalProps {
  lang: LanguageType;
  currentUser: UserProfile;
  sharafAllocations?: SharafAllocation[];
}

export default function SharafPortal({ lang, currentUser, sharafAllocations = [] }: SharafPortalProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const myAllocations = sharafAllocations.filter(a => a.itsNumber === currentUser.itsNumber);
  const hasSharaf = myAllocations.length > 0;

  return (
    <div className={`min-h-screen bg-editorial-bg py-8 px-4 sm:px-6 lg:px-8 font-sans ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* BRANDING HEADER RIBBON */}
        <div className="editorial-card p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-none bg-[#5c130f] flex items-center justify-center text-white">
              <Award className="w-8 h-8 text-[#BA8332]" />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#5c130f]">
                {t.sharafBanner}
              </h1>
              <p className="text-xs text-[#3A1A14]/80 mt-1 font-sans">
                {t.sharafDesc}
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-[#5C130F] bg-white/40 border border-[#5C130F]/20 rounded-none px-4 py-1.5">
            ITS: {currentUser.itsNumber}
          </span>
        </div>

        {/* DETAILS SECTION ROWS */}
        <div className="editorial-card p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-semibold text-[#5C130F] border-b border-[#5C130F]/20 pb-2 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#BA8332]" />
              <span>{t.sharafStatusLabel}</span>
            </h3>

            {hasSharaf ? (
              <div className="space-y-4 font-sans">
                <div className="p-4 bg-[#5C130F] !text-white border border-[#BA8332] rounded-none flex items-start gap-3">
                  <Award className="w-6 h-6 text-[#BA8332] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-sans font-semibold uppercase tracking-wider !text-white">
                      {lang === 'en' ? 'Sharaf Allocated' : 'تم منح الشرف والمقعد الميداني'}
                    </p>
                    <p className="text-xs !text-white/90 mt-0.5 leading-relaxed font-sans">
                      {lang === 'en'
                        ? 'Your Sharaf has been allocated for the events listed below. Please ensure you check in with your coordinator before your duties.'
                        : 'تم اعتماد تصاريح القرب الميداني الخاصة بك للمناسبات التالية. يرجى مراجعة المشرف المباشر قبل بدء التغطية.'}
                    </p>
                  </div>
                </div>

                {/* Allocated Events List */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-sans font-semibold uppercase text-[#5C130F] tracking-wider block">
                    {t.sharafLabelCard}:
                  </span>
                  {myAllocations.map(alloc => (
                    <div
                      key={alloc.id}
                      className="p-4 border border-[#5C130F]/20 rounded-none bg-white/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <span className="bg-[#5C130F] !text-white text-xs font-sans font-semibold px-2.5 py-0.5 rounded-none uppercase inline-block">
                          {alloc.eventType}
                        </span>
                        
                        <div className="text-xs font-sans space-y-1 pt-1">
                          <p>
                            <span className="text-[#3A1A14]/70 font-sans font-semibold text-[10px] uppercase">LOCATION: </span>
                            <strong className="text-[#5C130F] font-semibold">
                              {alloc.location || <span className="text-amber-800 italic text-[11px]">Location not set</span>}
                            </strong>
                          </p>
                          {alloc.zone && (
                            <p>
                              <span className="text-[#3A1A14]/70 font-sans font-semibold text-[10px] uppercase">ZONE: </span>
                              <span className="text-[#3A1A14] font-medium">{alloc.zone}</span>
                            </p>
                          )}
                          {(alloc.fromTime || alloc.toTime) && (
                            <p className="text-[11px] font-mono text-[#3A1A14]/70 flex items-center gap-1 pt-0.5">
                              <Clock className="w-3 h-3 text-[#BA8332]" />
                              <span>{alloc.fromTime || '—'} – {alloc.toTime || '—'}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] font-sans font-semibold bg-[#BA8332]/15 text-[#5C130F] border border-[#BA8332]/30 px-2 py-1 uppercase self-start sm:self-center shrink-0">
                        Allocated
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-5 bg-white/40 border border-[#5C130F]/20 rounded-none flex items-start gap-3 text-[#3A1A14]">
                  <Award className="w-6 h-6 text-[#BA8332] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-sans font-semibold uppercase tracking-wider text-[#5C130F]">
                      {lang === 'en' ? 'Not Yet Allocated' : 'لم يتم التخصيص بعد'}
                    </p>
                    <p className="text-xs text-[#3A1A14]/80 mt-1 leading-relaxed font-sans">
                      {t.notAllocated} {lang === 'en' 
                        ? 'Sharaf allocations are assigned based on attendance and assignment reviews.'
                        : 'يتم توزيع المقاعد من قبل الشيخ إبراهيم بهائي لوكهند والا بناءً على التزام الحضور ومستوى تقييم تسليمات اللقطات الميدانية.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Respectful closing text */}
          <div className="bg-white/40 p-4 rounded-none border border-[#5C130F]/20 flex items-start gap-2.5 text-[11px] text-[#3A1A14]/85 leading-relaxed font-sans">
            <span className="w-1.5 h-1.5 rounded-none bg-[#BA8332] mt-1.5 shrink-0" />
            <span>
              {lang === 'en'
                ? 'All Al Musawareen Khidmat operates under the guidance of Al-Dawat-ush-Sharifah, with humility, respect and dedication.'
                : 'تخضع كافة عمليات المصورين للضوابط الإدارية والروحانية المعتمدة لدى الدعوة الشريفة، مع الالتزام بأقصى درجات الأدب والاحترافية والوقار.'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
