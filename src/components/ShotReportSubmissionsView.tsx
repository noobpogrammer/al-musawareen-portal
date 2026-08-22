import React, { useState } from 'react';
import { UserProfile, Assignment, ShotReport } from '../types';
import { translations, LanguageType } from '../utils/translations';
import { calculateStarRating } from '../utils/starRating';
import StarRatingDisplay from './StarRatingDisplay';
import StarOverrideModal from './StarOverrideModal';
import { FileText, Link as LinkIcon, Edit3 } from 'lucide-react';

interface ShotReportSubmissionsViewProps {
  submissions: ShotReport[];
  assignments: Assignment[];
  users: UserProfile[];
  lang: LanguageType;
  canStarOverride?: boolean;
  onSaveRatingOverride?: (reportId: string, goldStars: number, redStars: number, note: string, isOverride: boolean) => void;
}

export default function ShotReportSubmissionsView({
  submissions,
  assignments,
  users,
  lang,
  canStarOverride = true,
  onSaveRatingOverride
}: ShotReportSubmissionsViewProps) {
  const t = translations[lang];
  const [overrideModalReport, setOverrideModalReport] = useState<ShotReport | null>(null);

  return (
    <div className="editorial-card-dense p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#5C130F]/20 pb-3">
        <h2 className="font-serif text-2xl font-bold text-[#5C130F] uppercase tracking-wider">
          {t.recentSubmissions}
        </h2>
        <span className="bg-[#BA8332] text-white text-xs font-mono font-bold px-3 py-1 rounded-md self-start sm:self-auto">
          {submissions.length} Total Submissions
        </span>
      </div>

      {submissions.length === 0 ? (
        <div className="py-12 text-center text-[#3A1A14]/60">
          <FileText className="w-12 h-12 text-[#BA8332] mx-auto mb-3" />
          <p className="text-sm font-serif font-bold">
            {lang === 'en' ? 'No media submissions cataloged yet.' : 'لا توجد تسليمات مسجلة بعد.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const subUser = users.find(u => u.itsNumber === sub.itsNumber);
            const assignment = assignments.find(a => a.id === sub.assignmentId);
            const rating = calculateStarRating(sub, assignment, subUser);

            return (
              <div key={sub.id} className="p-5 border border-[#5C130F]/20 rounded-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-[#BA8332]/10 transition-colors bg-white/40">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="bg-[#5C130F] !text-white text-[10px] font-mono px-2 py-0.5 rounded-md font-bold">
                      {new Date(sub.timestamp).toLocaleString(lang === 'en' ? 'en-US' : 'ar-SA')}
                    </span>
                  </div>

                  <h4 className="font-serif text-lg font-bold text-[#5C130F] mt-2">
                    {sub.assignmentTitle}
                  </h4>

                  <p className="text-xs text-[#3A1A14]/80 font-serif">
                    {lang === 'en' ? 'Submitted by' : 'مرسل من قبل'}: <strong className="text-[#5C130F]">{subUser?.fullName || sub.userName}</strong> (ITS: {sub.itsNumber})
                  </p>

                  {sub.notes && (
                    <p className="text-xs text-[#3A1A14]/85 bg-white/60 p-2.5 rounded-md border border-[#5C130F]/20 inline-block mt-2 font-serif">
                      {sub.notes}
                    </p>
                  )}

                  <div className="pt-2">
                    <a
                      href={sub.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#5C130F] font-mono font-bold hover:underline"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Open Google Drive Folder' : 'فتح مجلد Google Drive'}</span>
                    </a>
                  </div>
                </div>

                {/* Automated Star Rating & Star Override Control Box */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 self-stretch bg-[#FAF4E8]/90 p-4 rounded-xl border border-[#5C130F]/20 shadow-xs">
                  <StarRatingDisplay rating={rating} showSubtext={true} size="md" />

                  {canStarOverride && (
                    <button
                      type="button"
                      onClick={() => setOverrideModalReport(sub)}
                      className="px-3.5 py-2 bg-[#5C130F] hover:bg-[#3A1A14] active:bg-[#3A1A14] !text-[#F3E6D0] text-xs font-mono font-bold rounded-md transition-colors shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer group"
                      title="Override Star Rating"
                    >
                      <Edit3 className="w-3.5 h-3.5 !text-[#F3E6D0]" />
                      <span className="!text-[#F3E6D0]">Override Rating</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Override Star Rating Modal */}
      {overrideModalReport && (
        <StarOverrideModal
          isOpen={Boolean(overrideModalReport)}
          report={overrideModalReport}
          assignment={assignments.find(a => a.id === overrideModalReport.assignmentId)}
          user={users.find(u => u.itsNumber === overrideModalReport.itsNumber)}
          onClose={() => setOverrideModalReport(null)}
          onSaveOverride={(reportId, goldStars, redStars, note, isOverride) => {
            if (onSaveRatingOverride) {
              onSaveRatingOverride(reportId, goldStars, redStars, note, isOverride);
            }
            setOverrideModalReport(null);
          }}
        />
      )}
    </div>
  );
}
