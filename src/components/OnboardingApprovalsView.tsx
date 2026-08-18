import React, { useState } from 'react';
import { UserProfile, HRPermissions, DEFAULT_HR_PERMISSIONS, hasRole, formatRoleBadgeLabel } from '../types';
import { translations, LanguageType } from '../utils/translations';
import { ShieldCheck, Shield, ShieldAlert, Check, X } from 'lucide-react';
import AvatarPlaceholder from './AvatarPlaceholder';

interface OnboardingApprovalsViewProps {
  users: UserProfile[];
  lang: LanguageType;
  onApproveUser: (itsNumber: string, hrPermissions?: HRPermissions) => void;
  onRejectUser: (itsNumber: string) => void;
}

export default function OnboardingApprovalsView({
  users,
  lang,
  onApproveUser,
  onRejectUser
}: OnboardingApprovalsViewProps) {
  const t = translations[lang];
  const pendingUsers = users.filter(u => u.status === 'pending');
  const [hrApprovalPermsMap, setHrApprovalPermsMap] = useState<Record<string, HRPermissions>>({});

  return (
    <div className="editorial-card-dense p-6 sm:p-8 space-y-6">
      <h2 className="font-serif text-2xl font-bold text-[#5C130F] border-b border-[#5C130F]/20 pb-3 uppercase tracking-wider">
        {t.pendingApprovals}
      </h2>

      {pendingUsers.length === 0 ? (
        <div className="py-12 text-center text-[#3A1A14]/60">
          <ShieldCheck className="w-12 h-12 text-[#BA8332] mx-auto mb-3 animate-pulse" />
          <p className="text-sm font-serif font-bold">
            {lang === 'en' ? 'All registrations certified and approved.' : 'تم الانتهاء من مراجعة وتصديق كافة الطلبات.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((user) => {
            const isHRApplicant = user.role === 'coordinator' || hasRole(user, 'coordinator');
            
            const getPendingHRPermissions = (its: string): HRPermissions => {
              return hrApprovalPermsMap[its] || DEFAULT_HR_PERMISSIONS;
            };

            const setPendingHRPermission = (its: string, key: keyof HRPermissions, val: boolean) => {
              setHrApprovalPermsMap(prev => ({
                ...prev,
                [its]: {
                  ...(prev[its] || DEFAULT_HR_PERMISSIONS),
                  [key]: val
                }
              }));
            };

            return (
              <div key={user.itsNumber} className="p-5 border border-[#5C130F]/20 rounded-xl flex flex-col gap-4 bg-white/60 shadow-xs">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex gap-4">
                    <AvatarPlaceholder src={user.avatarUrl} alt={user.fullName} sizeClassName="w-12 h-12" iconSizeClassName="w-6 h-6" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif text-base font-bold text-[#5C130F]">{user.fullName}</h4>
                        <span className="text-[10px] font-mono font-bold bg-[#5C130F]/10 text-[#5C130F] px-2 py-0.5 rounded-md">
                          {formatRoleBadgeLabel(user)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold text-[#3A1A14]/80 mt-1 font-mono">
                        <span>ITS: {user.itsNumber}</span>
                        <span>•</span>
                        <span>Mobile: {user.mobile}</span>
                        <span>•</span>
                        <span>Email: {user.email}</span>
                      </div>
                      <div className="flex gap-4 text-[10px] font-bold text-[#5C130F] mt-2 font-mono">
                        <span>Raza Granted: <strong>{user.cityRaza}</strong></span>
                        <span>Mohalla: <strong>{user.mohalla || user.cityDomicile}</strong></span>
                        {user.dateArrival && (
                          <span>Arrival: <strong>{user.dateArrival}</strong></span>
                        )}
                      </div>

                      {((user.cameras && user.cameras.length > 0) || (user.lenses && user.lenses.length > 0) || user.otherEquipment) && (
                        <div className="mt-2.5 p-2 bg-white/80 border border-[#5C130F]/20 text-[10px] space-y-1 font-sans rounded-md">
                          <span className="font-mono font-bold text-[9px] text-[#5C130F] uppercase tracking-wider block">Equipment Specs:</span>
                          {user.cameras && user.cameras.length > 0 && (
                            <p className="text-[#3A1A14]"><span className="font-bold">Cameras:</span> {user.cameras.join(', ')}</p>
                          )}
                          {user.lenses && user.lenses.length > 0 && (
                            <p className="text-[#3A1A14]"><span className="font-bold">Lenses:</span> {user.lenses.join(', ')}</p>
                          )}
                          {user.otherEquipment && (
                            <p className="text-[#3A1A14]/70 italic"><span className="font-bold">Other:</span> {user.otherEquipment}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Standard Photographer/Videographer Approval buttons */}
                  {!isHRApplicant && (
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => onApproveUser(user.itsNumber)}
                        className="px-4 py-1.5 bg-[#BA8332] hover:bg-[#a06e28] text-white text-xs font-mono font-bold rounded-md flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>{t.approveBtn}</span>
                      </button>
                      <button
                        onClick={() => onRejectUser(user.itsNumber)}
                        className="px-4 py-1.5 bg-white/40 hover:bg-[#5C130F] active:bg-[#5C130F] rounded-md flex items-center gap-1.5 transition-colors border border-[#5C130F]/30 cursor-pointer group"
                      >
                        <X className="w-4 h-4 text-[#5C130F] group-hover:!text-[#F3E6D0] group-active:!text-[#F3E6D0] transition-colors" />
                        <span className="text-[#5C130F] group-hover:!text-[#F3E6D0] group-active:!text-[#F3E6D0] text-xs font-mono font-bold transition-colors">{t.rejectBtn}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Granular HR Approval Configuration for HR Coordinator Applicants */}
                {isHRApplicant && (
                  <div className="p-4 bg-[#FDFAF3] border-2 border-[#5C130F]/20 rounded-xl space-y-4 w-full">
                    <div className="flex items-center justify-between border-b border-[#5C130F]/15 pb-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[#5C130F]" />
                        <div>
                          <h5 className="font-serif font-bold text-sm text-[#5C130F]">
                            HR Coordinator Onboarding Access Level Setup
                          </h5>
                          <p className="text-[10px] text-[#3A1A14]/75 font-sans">
                            Assign specific access levels for this HR applicant before confirming onboarding approval.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-[#BA8332]/20 text-[#5C130F] px-2.5 py-0.5 rounded-md border border-[#BA8332]/40">
                        HR Track Approval
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* 1. Assign Coverage */}
                      <label className="flex items-start gap-2.5 p-2.5 bg-white/80 border border-[#5C130F]/15 rounded-lg cursor-pointer hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          checked={getPendingHRPermissions(user.itsNumber).assignCoverage ?? true}
                          onChange={(e) => setPendingHRPermission(user.itsNumber, 'assignCoverage', e.target.checked)}
                          className="mt-0.5 accent-[#BA8332] w-4 h-4"
                        />
                        <div>
                          <span className="text-xs font-mono font-bold text-[#5C130F] block">Coverage Assignments</span>
                          <span className="text-[10px] text-[#3A1A14]/70 block leading-tight">Assign team to schedules & zones</span>
                        </div>
                      </label>

                      {/* 2. View Assignments */}
                      <label className="flex items-start gap-2.5 p-2.5 bg-white/80 border border-[#5C130F]/15 rounded-lg cursor-pointer hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          checked={getPendingHRPermissions(user.itsNumber).viewAssignments ?? true}
                          onChange={(e) => setPendingHRPermission(user.itsNumber, 'viewAssignments', e.target.checked)}
                          className="mt-0.5 accent-[#BA8332] w-4 h-4"
                        />
                        <div>
                          <span className="text-xs font-mono font-bold text-[#5C130F] block">Assignment Status</span>
                          <span className="text-[10px] text-[#3A1A14]/70 block leading-tight">Follow up on coverage rosters</span>
                        </div>
                      </label>

                      {/* 3. Review Submissions */}
                      <label className="flex items-start gap-2.5 p-2.5 bg-white/80 border border-[#5C130F]/15 rounded-lg cursor-pointer hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          checked={getPendingHRPermissions(user.itsNumber).reviewSubmissions ?? true}
                          onChange={(e) => setPendingHRPermission(user.itsNumber, 'reviewSubmissions', e.target.checked)}
                          className="mt-0.5 accent-[#BA8332] w-4 h-4"
                        />
                        <div>
                          <span className="text-xs font-mono font-bold text-[#5C130F] block">Shot Report Auditing</span>
                          <span className="text-[10px] text-[#3A1A14]/70 block leading-tight">Review shot reports (View-only)</span>
                        </div>
                      </label>

                      {/* 4. Star Override */}
                      <label className="flex items-start gap-2.5 p-2.5 bg-white/80 border border-[#5C130F]/15 rounded-lg cursor-pointer hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          checked={getPendingHRPermissions(user.itsNumber).starOverride ?? false}
                          onChange={(e) => setPendingHRPermission(user.itsNumber, 'starOverride', e.target.checked)}
                          className="mt-0.5 accent-[#BA8332] w-4 h-4"
                        />
                        <div>
                          <span className="text-xs font-mono font-bold text-[#5C130F] block">Star Rating Override</span>
                          <span className="text-[10px] text-[#3A1A14]/70 block leading-tight">Override gold/red star ratings</span>
                        </div>
                      </label>

                      {/* 5. View Roster */}
                      <label className="flex items-start gap-2.5 p-2.5 bg-white/80 border border-[#5C130F]/15 rounded-lg cursor-pointer hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          checked={getPendingHRPermissions(user.itsNumber).viewRoster ?? true}
                          onChange={(e) => setPendingHRPermission(user.itsNumber, 'viewRoster', e.target.checked)}
                          className="mt-0.5 accent-[#BA8332] w-4 h-4"
                        />
                        <div>
                          <span className="text-xs font-mono font-bold text-[#5C130F] block">View Team Roster</span>
                          <span className="text-[10px] text-[#3A1A14]/70 block leading-tight">View Active Dispatched Lenses (Read-Only)</span>
                        </div>
                      </label>

                      {/* 6. Edit Roster */}
                      <label className="flex items-start gap-2.5 p-2.5 bg-white/80 border border-[#5C130F]/15 rounded-lg cursor-pointer hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          checked={getPendingHRPermissions(user.itsNumber).editRoster ?? false}
                          onChange={(e) => setPendingHRPermission(user.itsNumber, 'editRoster', e.target.checked)}
                          className="mt-0.5 accent-[#BA8332] w-4 h-4"
                        />
                        <div>
                          <span className="text-xs font-mono font-bold text-[#5C130F] block">Edit Team Roster</span>
                          <span className="text-[10px] text-[#3A1A14]/70 block leading-tight">Edit member details and permissions</span>
                        </div>
                      </label>

                      {/* 7. Approve Onboarding */}
                      <label className="flex items-start gap-2.5 p-2.5 bg-[#5C130F]/5 border border-[#5C130F]/20 rounded-lg cursor-pointer hover:bg-[#5C130F]/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={getPendingHRPermissions(user.itsNumber).approveOnboarding ?? false}
                          onChange={(e) => setPendingHRPermission(user.itsNumber, 'approveOnboarding', e.target.checked)}
                          className="mt-0.5 accent-[#BA8332] w-4 h-4"
                        />
                        <div>
                          <span className="text-xs font-mono font-bold text-[#5C130F] flex items-center gap-1">
                            Approve Onboarding <ShieldAlert className="w-3 h-3 text-[#BA8332]" />
                          </span>
                          <span className="text-[10px] text-[#3A1A14]/70 block leading-tight">Approve / reject new registrations</span>
                        </div>
                      </label>

                      {/* 8. Manage Sharaf */}
                      <label className="flex items-start gap-2.5 p-2.5 bg-[#5C130F]/5 border border-[#5C130F]/20 rounded-lg cursor-pointer hover:bg-[#5C130F]/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={getPendingHRPermissions(user.itsNumber).manageSharaf ?? false}
                          onChange={(e) => setPendingHRPermission(user.itsNumber, 'manageSharaf', e.target.checked)}
                          className="mt-0.5 accent-[#BA8332] w-4 h-4"
                        />
                        <div>
                          <span className="text-xs font-mono font-bold text-[#5C130F] flex items-center gap-1">
                            Manage Sharaf <ShieldAlert className="w-3 h-3 text-[#BA8332]" />
                          </span>
                          <span className="text-[10px] text-[#3A1A14]/70 block leading-tight">Allocate Sharaf seating passes</span>
                        </div>
                      </label>

                      {/* 9. System Settings */}
                      <label className="flex items-start gap-2.5 p-2.5 bg-[#5C130F]/5 border border-[#5C130F]/20 rounded-lg cursor-pointer hover:bg-[#5C130F]/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={getPendingHRPermissions(user.itsNumber).systemSettings ?? false}
                          onChange={(e) => setPendingHRPermission(user.itsNumber, 'systemSettings', e.target.checked)}
                          className="mt-0.5 accent-[#BA8332] w-4 h-4"
                        />
                        <div>
                          <span className="text-xs font-mono font-bold text-[#5C130F] flex items-center gap-1">
                            System Settings <ShieldAlert className="w-3 h-3 text-[#BA8332]" />
                          </span>
                          <span className="text-[10px] text-[#3A1A14]/70 block leading-tight">Manage zones, topics & Safar mode</span>
                        </div>
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#5C130F]/15">
                      <button
                        onClick={() => onRejectUser(user.itsNumber)}
                        className="px-4 py-1.5 bg-white hover:bg-[#5C130F] active:bg-[#5C130F] rounded-md transition-colors border border-[#5C130F]/30 cursor-pointer group"
                      >
                        <span className="text-[#5C130F] group-hover:!text-[#F3E6D0] group-active:!text-[#F3E6D0] text-xs font-mono font-bold transition-colors">Reject Application</span>
                      </button>
                      <button
                        onClick={() => onApproveUser(user.itsNumber, getPendingHRPermissions(user.itsNumber))}
                        className="px-5 py-2 bg-[#BA8332] hover:bg-[#a06e28] text-white text-xs font-mono font-bold rounded-md flex items-center gap-2 transition-colors shadow-md cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Approve HR & Grant Selected Permissions</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
