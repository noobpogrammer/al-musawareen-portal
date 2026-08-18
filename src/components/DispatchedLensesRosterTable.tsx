import React, { useState } from 'react';
import { UserProfile, getUserRoles, hasRole, formatRoleBadgeLabel } from '../types';
import { translations, LanguageType } from '../utils/translations';
import { Users, Search, Shield, Plus } from 'lucide-react';
import AvatarPlaceholder from './AvatarPlaceholder';

interface DispatchedLensesRosterTableProps {
  users: UserProfile[];
  lang: LanguageType;
  isSafarModeEnabled?: boolean;
  onQuickAssignUser?: (itsNumber: string) => void;
  onEditRolesPermissions?: (user: UserProfile) => void;
  canEditRoster?: boolean;
}

export default function DispatchedLensesRosterTable({
  users,
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
      formatRoleBadgeLabel(pv).toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full editorial-card-dense p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#5C130F]/20 pb-3">
        <h2 className="font-serif text-2xl font-bold text-[#5C130F] flex items-center gap-2">
          <Users className="w-6 h-6 text-[#BA8332]" />
          <span>{lang === 'en' ? 'Al Musawareen Active Dispatched Lenses' : 'عدسات المصورين المعتمدة النشطة'}</span>
        </h2>

        {/* Member Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#BA8332] absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={overviewSearchQuery}
            onChange={(e) => setOverviewSearchQuery(e.target.value)}
            placeholder={t.searchPeoplePlaceholder}
            className="w-full pl-9 pr-7 rtl:pl-7 rtl:pr-9 py-1.5 border border-[#5C130F]/30 bg-[#FDFAF3] text-xs font-serif text-[#3A1A14] focus:outline-none focus:border-[#5C130F] rounded-md"
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
            <tr className="border-b border-[#5C130F]/20 text-[#5C130F] uppercase tracking-wider pb-3 font-mono font-bold">
              <th className="py-3 pr-2 font-mono font-bold">{lang === 'en' ? 'Member' : 'العضو'}</th>
              <th className="py-3 px-2 font-mono font-bold">ITS</th>
              <th className="py-3 px-2 font-mono font-bold whitespace-nowrap min-w-[150px]">{lang === 'en' ? 'Role Tracks' : 'المسارات'}</th>

              {isSafarModeEnabled ? (
                <>
                  <th className="py-3 px-2 font-mono font-bold">{lang === 'en' ? 'Granted Raza' : 'الرضا الممنوحة'}</th>
                  <th className="py-3 px-2 font-mono font-bold">Sharaf Status</th>
                  <th className="py-3 px-2 font-mono font-bold">{lang === 'en' ? 'Mohalla' : 'المحلة'}</th>
                  <th className="py-3 px-2 font-mono font-bold">{lang === 'en' ? 'Equipment' : 'المعدات'}</th>
                  <th className="py-3 px-2 font-mono font-bold">{lang === 'en' ? 'Mobile' : 'الهاتف'}</th>
                </>
              ) : (
                <>
                  <th className="py-3 px-2 font-mono font-bold">{lang === 'en' ? 'Camera' : 'الكاميرا'}</th>
                  <th className="py-3 px-2 font-mono font-bold">{lang === 'en' ? 'Lenses' : 'العدسات'}</th>
                  <th className="py-3 px-2 font-mono font-bold">{lang === 'en' ? 'Mohalla' : 'المحلة'}</th>
                  <th className="py-3 px-2 font-mono font-bold">{lang === 'en' ? 'Email' : 'البريد'}</th>
                  <th className="py-3 px-2 font-mono font-bold">{lang === 'en' ? 'Mobile Number' : 'رقم الجوال'}</th>
                </>
              )}

              <th className="py-3 pl-2 font-mono font-bold text-right rtl:text-left">{lang === 'en' ? 'Action' : 'الإجراء'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#5C130F]/15">
            {filteredOverviewPVs.length === 0 ? (
              <tr>
                <td colSpan={isSafarModeEnabled ? 9 : 9} className="py-8 text-center text-[#3A1A14]/70 font-serif italic">
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
                const equipmentSummary = [cameraText !== '—' ? `Cam: ${cameraText}` : null, lensText !== '—' ? `Lens: ${lensText}` : null]
                  .filter(Boolean)
                  .join(' | ') || '—';

                return (
                  <tr key={pv.itsNumber} className="hover:bg-[#BA8332]/8 transition-colors">
                    <td className="py-3.5 flex items-center gap-3 pr-2 min-w-[180px]">
                      <AvatarPlaceholder src={pv.avatarUrl} alt={pv.fullName} sizeClassName="w-9 h-9" iconSizeClassName="w-4 h-4" />
                      <div>
                        <p className="font-serif font-bold text-[#3A1A14] text-sm leading-tight">{pv.fullName}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 font-mono text-[#3A1A14] font-bold">{pv.itsNumber}</td>
                    <td className="py-3.5 px-2 whitespace-nowrap min-w-[150px]">
                      <span className="px-2.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-[#5C130F]/10 text-[#5C130F] border border-[#5C130F]/20 whitespace-nowrap inline-block">
                        {formatRoleBadgeLabel(pv)}
                      </span>
                    </td>

                    {isSafarModeEnabled ? (
                      <>
                        <td className="py-3.5 px-2 font-mono text-xs font-bold text-[#5C130F]">{pv.cityRaza || '—'}</td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${
                            pv.sharafStatus === 'granted' ? 'bg-[#5C130F] !text-white' : 'bg-white/50 border border-[#5C130F]/20 text-[#5C130F]/60'
                          }`}>
                            {pv.sharafStatus === 'granted' ? (pv.sharafZone || 'Granted') : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 font-mono text-xs text-[#3A1A14]/80">{pv.mohalla || pv.cityDomicile || '—'}</td>
                        <td className="py-3.5 px-2 font-mono text-[11px] text-[#3A1A14]/75 truncate max-w-[160px]" title={equipmentSummary}>
                          {equipmentSummary}
                        </td>
                        <td className="py-3.5 px-2 font-mono text-xs text-[#3A1A14]/80">{pv.mobile || '—'}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-3.5 px-2 font-mono text-xs text-[#5C130F] max-w-[140px] truncate" title={cameraText}>
                          {cameraText}
                        </td>
                        <td className="py-3.5 px-2 font-mono text-xs text-[#3A1A14]/85 max-w-[140px] truncate" title={lensText}>
                          {lensText}
                        </td>
                        <td className="py-3.5 px-2 font-mono text-xs text-[#3A1A14]/80">{pv.mohalla || pv.cityDomicile || '—'}</td>
                        <td className="py-3.5 px-2 font-mono text-xs text-[#3A1A14]/80 max-w-[150px] truncate" title={pv.email}>
                          {pv.email || '—'}
                        </td>
                        <td className="py-3.5 px-2 font-mono text-xs text-[#3A1A14]/80 whitespace-nowrap">{pv.mobile || '—'}</td>
                      </>
                    )}

                    <td className="py-3.5 pl-2 text-right rtl:text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        {canEditRoster && onEditRolesPermissions && (
                          <button
                            onClick={() => onEditRolesPermissions(pv)}
                            className="px-2.5 py-1.5 bg-[#5C130F]/10 hover:bg-[#5C130F] active:bg-[#5C130F] rounded-md transition-colors border border-[#5C130F]/20 flex items-center gap-1 cursor-pointer whitespace-nowrap group"
                            title="Manage user roles & HR access permissions"
                          >
                            <Shield className="w-3 h-3 text-[#5C130F] group-hover:!text-[#F3E6D0] group-active:!text-[#F3E6D0] transition-colors" />
                            <span className="text-[#5C130F] group-hover:!text-[#F3E6D0] group-active:!text-[#F3E6D0] text-[10px] font-mono font-bold transition-colors">Roles & HR</span>
                          </button>
                        )}
                        {onQuickAssignUser && (
                          <button
                            onClick={() => onQuickAssignUser(pv.itsNumber)}
                            className="px-3 py-1.5 bg-[#BA8332] hover:bg-[#a06e28] text-white text-[10px] font-mono font-bold rounded-md transition-colors shadow-xs whitespace-nowrap cursor-pointer"
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
