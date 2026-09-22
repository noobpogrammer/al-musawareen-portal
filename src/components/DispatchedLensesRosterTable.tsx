import React, { useState, useMemo } from 'react';
import { UserProfile, getUserRoles, hasRole, formatRoleBadgeLabel, Assignment, ShotReport } from '../types';
import { translations, LanguageType } from '../utils/translations';
import { Users, Search, Shield, Plus, Star } from 'lucide-react';
import AvatarPlaceholder from './AvatarPlaceholder';
import { calculateUserAverageRating } from '../utils/starRating';

interface DispatchedLensesRosterTableProps {
  users: UserProfile[];
  assignments?: Assignment[];
  submissions?: ShotReport[];
  lang: LanguageType;
  isSafarModeEnabled?: boolean;
  onQuickAssignUser?: (itsNumber: string) => void;
  onEditRolesPermissions?: (user: UserProfile) => void;
  canEditRoster?: boolean;
}

export default function DispatchedLensesRosterTable({
  users,
  assignments = [],
  submissions = [],
  lang,
  isSafarModeEnabled = true,
  onQuickAssignUser,
  onEditRolesPermissions,
  canEditRoster = false
}: DispatchedLensesRosterTableProps) {
  const t = translations[lang];
  const [overviewSearchQuery, setOverviewSearchQuery] = useState('');

  const approvedPVs = users.filter(u => u.status === 'approved' && !hasRole(u, 'admin'));

  const filteredOverviewPVs = approvedPVs.filter(pv => {
    if (!overviewSearchQuery.trim()) return true;
    const q = overviewSearchQuery.toLowerCase().trim();
    return (
      pv.fullName.toLowerCase().includes(q) ||
      pv.itsNumber.includes(q) ||
      (pv.mohalla && pv.mohalla.toLowerCase().includes(q)) ||
      (pv.cityRaza && pv.cityRaza.toLowerCase().includes(q)) ||
      formatRoleBadgeLabel(pv).toLowerCase().includes(q)
    );
  });

  const ratingsByUser = useMemo(() => {
    const map: Record<string, { averageGold: number; totalRedStars: number; reportsCount: number; redStarBreakdown: string[] }> = {};
    approvedPVs.forEach(pv => {
      map[pv.itsNumber] = calculateUserAverageRating(submissions, assignments, pv);
    });
    return map;
  }, [approvedPVs, submissions, assignments]);

  return (
    <div className="w-full editorial-card-dense p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#5C130F]/20 pb-3">
        <h2 className="font-serif text-2xl font-bold text-[#5C130F] flex items-center gap-2">
          <Users className="w-6 h-6 text-[#BA8332]" />
          <span>{lang === 'en' ? 'Active Members & Team Roster' : 'عدسات المصورين المعتمدة النشطة'}</span>
        </h2>

        {/* Member Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#BA8332] absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={overviewSearchQuery}
            onChange={(e) => setOverviewSearchQuery(e.target.value)}
            placeholder={t.searchPeoplePlaceholder}
            className="w-full pl-9 pr-7 rtl:pl-7 rtl:pr-9 py-1.5 border border-[#5C130F]/30 bg-[#FDFAF3] text-xs font-sans text-[#3A1A14] focus:outline-none focus:border-[#5C130F] rounded-md"
          />
          {overviewSearchQuery && (
            <button
              onClick={() => setOverviewSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rtl:right-auto rtl:left-2.5 text-xs text-[#5C130F] font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left rtl:text-right text-xs font-sans border-collapse">
          <thead>
            <tr className="border-b border-[#5C130F]/20 text-[#5C130F] uppercase tracking-wider pb-3 font-sans font-semibold text-[11px]">
              <th className="py-3 pr-2 font-sans font-semibold w-[18%] min-w-[150px]">{lang === 'en' ? 'Member' : 'العضو'}</th>
              <th className="py-3 px-2 font-sans font-semibold w-[8%]">ITS</th>
              <th className="py-3 px-2 font-sans font-semibold whitespace-nowrap w-[10%]">{lang === 'en' ? 'Role' : (t.role || 'الدور')}</th>
              <th className="py-3 px-2 font-sans font-semibold whitespace-nowrap w-[8%]">{lang === 'en' ? 'Rating' : 'التقييم'}</th>
              <th className="py-3 px-2 font-sans font-semibold w-[11%]">{lang === 'en' ? 'Mohalla' : 'المحلة'}</th>
              <th className="py-3 px-2 font-sans font-semibold w-[16%]">{lang === 'en' ? 'Equipment' : 'المعدات'}</th>
              <th className="py-3 px-2 font-sans font-semibold w-[15%]">{lang === 'en' ? 'Contact' : 'التواصل'}</th>

              {isSafarModeEnabled && (
                <th className="py-3 px-2 font-sans font-semibold whitespace-nowrap w-[10%]">{lang === 'en' ? 'Safar' : 'السفر'}</th>
              )}

              <th className="py-3 pl-2 font-sans font-semibold text-right rtl:text-left whitespace-nowrap">{lang === 'en' ? 'Action' : 'الإجراء'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#5C130F]/15">
            {filteredOverviewPVs.length === 0 ? (
              <tr>
                <td colSpan={isSafarModeEnabled ? 9 : 8} className="py-8 text-center text-[#3A1A14]/70 font-sans italic">
                  {t.noMembersFound}
                </td>
              </tr>
            ) : (
              filteredOverviewPVs.map((pv) => {
                const cameraText = pv.cameras && pv.cameras.length > 0
                  ? pv.cameras.map(c => c.split(' (')[0]).join(', ')
                  : '—';
                const lensText = pv.lenses && pv.lenses.length > 0
                  ? pv.lenses.map(l => l.split(' (')[0]).join(', ')
                  : '—';
                const equipmentFullTooltip = `Camera: ${cameraText} | Lens: ${lensText}`;

                const rating = ratingsByUser[pv.itsNumber] || { averageGold: 0, totalRedStars: 0, reportsCount: 0, redStarBreakdown: [] };
                const ratingTooltip = rating.reportsCount > 0
                  ? `Average Gold: ${rating.averageGold} | Red Stars: ${rating.totalRedStars} | Reports: ${rating.reportsCount}`
                  : (lang === 'en' ? 'No reports submitted yet' : 'لم يتم تقديم أي تقارير بعد');

                const contactTooltip = `Mobile: ${pv.mobile || '—'} | Email: ${pv.email || '—'}`;

                return (
                  <tr key={pv.itsNumber} className="hover:bg-[#BA8332]/8 transition-colors">
                    {/* 1. Member */}
                    <td className="py-3 flex items-center gap-2.5 pr-2 min-w-[150px]">
                      <AvatarPlaceholder src={pv.avatarUrl} alt={pv.fullName} sizeClassName="w-8 h-8" iconSizeClassName="w-3.5 h-3.5" />
                      <div className="truncate max-w-[160px]">
                        <p className="font-serif font-bold text-[#3A1A14] text-xs sm:text-sm leading-tight truncate" title={pv.fullName}>{pv.fullName}</p>
                      </div>
                    </td>

                    {/* 2. ITS */}
                    <td className="py-3 px-2 font-mono text-[#3A1A14] font-bold whitespace-nowrap">{pv.itsNumber}</td>

                    {/* 3. Role */}
                    <td className="py-3 px-2 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-sans font-semibold uppercase tracking-wider bg-[#5C130F]/10 text-[#5C130F] border border-[#5C130F]/20 whitespace-nowrap inline-block">
                        {formatRoleBadgeLabel(pv)}
                      </span>
                    </td>

                    {/* 4. Rating */}
                    <td className="py-3 px-2 text-xs whitespace-nowrap" title={ratingTooltip}>
                      {rating.reportsCount === 0 ? (
                        <span className="text-[#3A1A14]/40 font-bold">—</span>
                      ) : (
                        <div className="inline-flex items-center gap-2 font-mono">
                          <span className="inline-flex items-center gap-1 font-bold text-[#BA8332]">
                            <Star className="w-3.5 h-3.5 fill-[#BA8332] text-[#BA8332]" />
                            <span>{rating.averageGold.toFixed(1).replace(/\.0$/, '')}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 font-bold text-red-600">
                            <Star className="w-3.5 h-3.5 fill-red-600 text-red-600" />
                            <span>{rating.totalRedStars}</span>
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 5. Mohalla */}
                    <td className="py-3 px-2 text-xs text-[#3A1A14]/80 max-w-[120px] truncate" title={pv.mohalla || pv.cityDomicile || '—'}>
                      {pv.mohalla || pv.cityDomicile || '—'}
                    </td>

                    {/* 6. Equipment */}
                    <td className="py-3 px-2 text-xs max-w-[160px]" title={equipmentFullTooltip}>
                      <div className="text-[#5C130F] font-medium truncate">{cameraText}</div>
                      <div className="text-[#3A1A14]/75 text-[11px] truncate">{lensText}</div>
                    </td>

                    {/* 7. Contact */}
                    <td className="py-3 px-2 text-xs max-w-[150px]" title={contactTooltip}>
                      <div className="text-[#3A1A14] font-mono font-medium truncate">{pv.mobile || '—'}</div>
                      <div className="text-[#3A1A14]/65 text-[11px] truncate" title={pv.email}>{pv.email || '—'}</div>
                    </td>

                    {/* 8. Safar (Only when Safar Mode is ON) */}
                    {isSafarModeEnabled && (
                      <td className="py-3 px-2 text-xs max-w-[130px]">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 truncate" title={`Raza City: ${pv.cityRaza || '—'}`}>
                            <span className="text-[9px] uppercase text-[#3A1A14]/60 font-semibold font-sans">RAZA:</span>
                            <span className="font-semibold text-[#5C130F] text-[11px] truncate">{pv.cityRaza || '—'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] uppercase text-[#3A1A14]/60 font-semibold font-sans">SHARAF:</span>
                            <span className={`px-1.5 py-0.2 rounded-xs text-[9px] font-semibold uppercase font-sans ${
                              pv.sharafStatus === 'granted'
                                ? 'bg-[#5C130F] !text-white'
                                : 'bg-white/50 border border-[#5C130F]/20 text-[#5C130F]/70'
                            }`}>
                              {pv.sharafStatus === 'granted' ? 'Granted' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* 9. Action */}
                    <td className="py-3 pl-2 text-right rtl:text-left whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {canEditRoster && onEditRolesPermissions && (
                          <button
                            onClick={() => onEditRolesPermissions(pv)}
                            className="px-2 py-1 bg-[#5C130F]/10 hover:bg-[#5C130F] active:bg-[#5C130F] rounded-md transition-colors border border-[#5C130F]/20 flex items-center gap-1 cursor-pointer whitespace-nowrap group"
                            title="Manage user roles & HR access permissions"
                          >
                            <Shield className="w-3 h-3 text-[#5C130F] group-hover:!text-[#F3E6D0] group-active:!text-[#F3E6D0] transition-colors" />
                            <span className="text-[#5C130F] group-hover:!text-[#F3E6D0] group-active:!text-[#F3E6D0] text-[10px] font-sans font-semibold transition-colors">Roles & HR</span>
                          </button>
                        )}
                        {onQuickAssignUser && (
                          <button
                            onClick={() => onQuickAssignUser(pv.itsNumber)}
                            className="px-2.5 py-1 bg-[#BA8332] hover:bg-[#a06e28] text-white text-[10px] font-sans font-semibold rounded-md transition-colors shadow-xs whitespace-nowrap cursor-pointer"
                          >
                            + {t.assignTaskBtn}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
