import React, { useState } from 'react';
import { UserProfile, Assignment, ShotReport, SharafAllocation, Zone, Topic, MiqaatDef, getUserRoles, hasRole, formatRoleBadgeLabel } from '../types';
import { translations, LanguageType } from '../utils/translations';
import { 
  Camera, Video, Link as LinkIcon, FileText, CheckCircle2, 
  AlertCircle, ExternalLink, Calendar, MapPin, Star, Award, Clock, ListFilter,
  Shield, Users, Check, Edit3, Plus, Search, RefreshCw
} from 'lucide-react';
import { calculateStarRating, calculateUserAverageRating } from '../utils/starRating';
import StarRatingDisplay from './StarRatingDisplay';
import StarOverrideModal from './StarOverrideModal';
import AvatarPlaceholder from './AvatarPlaceholder';
import DispatchedLensesRosterTable from './DispatchedLensesRosterTable';
import ShotReportSubmissionsView from './ShotReportSubmissionsView';
import CoverageAssignmentsView from './CoverageAssignmentsView';
import OnboardingApprovalsView from './OnboardingApprovalsView';
import { supabase } from '../utils/supabaseClient';

interface SubmissionPortalProps {
  lang: LanguageType;
  currentUser: UserProfile;
  users?: UserProfile[];
  assignments: Assignment[];
  submissions: ShotReport[];
  zones?: Zone[];
  topics?: Topic[];
  miqaats?: MiqaatDef[];
  onSubmitReport: (report: Omit<ShotReport, 'id' | 'timestamp' | 'userName'>) => void;
  onRespondAssignment?: (assignmentId: string, itsNumber: string, action: 'accepted' | 'declined', reason?: string) => void;
  onAddAssignment?: (assignment: Omit<Assignment, 'id'>) => void;
  onUpdateAssignment?: (assignment: Assignment) => void;
  onUpdateAvatar?: (its: string, avatarUrl: string) => void;
  onAddMiqaat?: (name: string) => void;
  onAddZone?: (name: string) => void;
  onBulkAddZones?: (names: string[]) => void;
  onAddTopic?: (name: string) => void;
  onBulkAddTopics?: (names: string[]) => void;
  onGradeSubmission?: (id: string, grade: ShotReport['grade']) => void;
  onSaveRatingOverride?: (reportId: string, goldStars: number, redStars: number, note: string, isOverride: boolean) => void;
  isSafarModeEnabled?: boolean;
  sharafAllocations?: SharafAllocation[];
  initialTab?: string;
}

export default function SubmissionPortal({
  lang,
  currentUser,
  users = [],
  assignments,
  submissions,
  zones = [],
  topics = [],
  miqaats = [],
  onSubmitReport,
  onRespondAssignment,
  onAddAssignment,
  onUpdateAssignment,
  onUpdateAvatar,
  onAddMiqaat,
  onAddZone,
  onBulkAddZones,
  onAddTopic,
  onBulkAddTopics,
  onGradeSubmission,
  onSaveRatingOverride,
  isSafarModeEnabled = false,
  sharafAllocations = [],
  initialTab = 'assigned'
}: SubmissionPortalProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const isHR = hasRole(currentUser, 'coordinator') || Boolean(currentUser.hrPermissions);
  const isPhotographerOrVideographer = hasRole(currentUser, 'photographer') || hasRole(currentUser, 'videographer');

  const canAssignCoverage = currentUser.hrPermissions?.assignCoverage ?? isHR;
  const canViewAssignments = currentUser.hrPermissions?.viewAssignments ?? isHR;
  const canReviewSubmissions = currentUser.hrPermissions?.reviewSubmissions ?? isHR;
  const canStarOverride = currentUser.hrPermissions?.starOverride ?? false;
  const canViewRoster = currentUser.hrPermissions?.viewRoster ?? isHR;

  const defaultTab = initialTab === 'sharaf' && isSafarModeEnabled 
    ? 'sharaf' 
    : (isPhotographerOrVideographer 
        ? (initialTab === 'submissions' ? 'submit_form' : initialTab || 'assigned')
        : (canAssignCoverage || canViewAssignments ? 'hr_assignments' : 'hr_submissions'));

  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // HR Assignment Creation local state (for HR tab inside Portal)
  const [hrAssignDate, setHrAssignDate] = useState('2026-07-21');
  const [hrAssignMiqaat, setHrAssignMiqaat] = useState(miqaats[0]?.name || 'Ashara Mubarakah 1448H');
  const [hrAssignZone, setHrAssignZone] = useState(zones[0]?.name || '');
  const [hrAssignTopics, setHrAssignTopics] = useState<string[]>(topics[0]?.name ? [topics[0].name] : []);
  const [hrAssignUsers, setHrAssignUsers] = useState<string[]>([]);
  const [hrAssignNotes, setHrAssignNotes] = useState('');
  const [hrSearchQuery, setHrSearchQuery] = useState('');

  // Star Override Modal State inside Portal
  const [portalOverrideReport, setPortalOverrideReport] = useState<ShotReport | null>(null);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [notes, setNotes] = useState('');
  const [completedTouchPoints, setCompletedTouchPoints] = useState<string[]>([]);
  
  // UX States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // State for Decline Task with required reason
  const [decliningAssignmentId, setDecliningAssignmentId] = useState<string | null>(null);
  const [declineCategory, setDeclineCategory] = useState<string>('Travel / Travel Conflict');
  const [declineNotes, setDeclineNotes] = useState<string>('');
  const [declineError, setDeclineError] = useState<string>('');

  // Filter assignments for this specific member
  const confirmedAssignments = assignments.filter(as => {
    if (!as.assignedUsers.includes(currentUser.itsNumber)) return false;
    const memberStatus = as.memberStatuses?.[currentUser.itsNumber];
    return !memberStatus || memberStatus === 'accepted';
  });

  const userAssignments = assignments.filter(as => 
    as.assignedUsers.includes(currentUser.itsNumber)
  );

  const mySubmissions = submissions.filter(sub => 
    sub.itsNumber === currentUser.itsNumber
  );

  // Compute pending responses count (events to accept/decline)
  const pendingResponsesCount = userAssignments.filter(as => 
    !as.memberStatuses?.[currentUser.itsNumber] || as.memberStatuses[currentUser.itsNumber] === 'pending'
  ).length;

  // Compute pending/due submissions count
  const submittedAssignmentIds = new Set(mySubmissions.map(s => s.assignmentId));
  const pendingSubmissionsCount = confirmedAssignments.filter(a => !submittedAssignmentIds.has(a.id)).length + mySubmissions.filter(s => s.grade === 'Pending').length;

  // Compute total Gold and Red Stars earned across all reports
  let totalGoldEarned = 0;
  let totalRedEarned = 0;
  mySubmissions.forEach(sub => {
    const as = assignments.find(a => a.id === sub.assignmentId);
    const r = calculateStarRating(sub, as, currentUser);
    totalGoldEarned += r.goldStars;
    totalRedEarned += r.redStars;
  });

  // User Sharaf allocations
  const mySharafAllocations = sharafAllocations.filter(a => a.itsNumber === currentUser.itsNumber);

  // Selected assignment & available touch points
  const selectedAssignment = assignments.find(a => a.id === selectedAssignmentId);

  const availableTouchPoints: string[] = React.useMemo(() => {
    if (!selectedAssignment) return [];
    if (Array.isArray(selectedAssignment.topics) && selectedAssignment.topics.length > 0) {
      return selectedAssignment.topics;
    }
    if (Array.isArray(selectedAssignment.topic) && selectedAssignment.topic.length > 0) {
      return selectedAssignment.topic;
    }
    if (typeof selectedAssignment.topic === 'string' && selectedAssignment.topic.trim().length > 0) {
      return selectedAssignment.topic.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [selectedAssignment]);

  // Auto-populate existing submission details and touch points when a task is selected in dropdown
  React.useEffect(() => {
    if (!selectedAssignmentId) {
      setDriveLink('');
      setNotes('');
      setCompletedTouchPoints([]);
      return;
    }
    const existingSub = mySubmissions.find(s => s.assignmentId === selectedAssignmentId);
    if (existingSub) {
      setDriveLink(existingSub.driveLink || '');
      setNotes(existingSub.notes || '');
      if (existingSub.completedTouchPoints) {
        setCompletedTouchPoints(existingSub.completedTouchPoints);
      } else {
        setCompletedTouchPoints(availableTouchPoints);
      }
    } else {
      setDriveLink('');
      setNotes('');
      setCompletedTouchPoints(availableTouchPoints);
    }
  }, [selectedAssignmentId, mySubmissions, availableTouchPoints]);

  const toggleTouchPoint = (tpName: string) => {
    setCompletedTouchPoints(prev => 
      prev.includes(tpName) ? prev.filter(t => t !== tpName) : [...prev, tpName]
    );
  };

  const handleSelectAllTouchPoints = () => {
    setCompletedTouchPoints(availableTouchPoints);
  };

  const handleDeselectAllTouchPoints = () => {
    setCompletedTouchPoints([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!selectedAssignmentId) {
      setError(lang === 'en' ? 'Please select your active coverage task.' : 'يرجى اختيار التكليف المنجز.');
      return;
    }

    if (!driveLink.trim()) {
      setError(lang === 'en' ? 'Google Drive link is required.' : 'رابط مجلد Google Drive مطلوب.');
      return;
    }

    if (!driveLink.toLowerCase().includes('drive.google.com')) {
      setError(lang === 'en' ? 'Please enter a valid Google Drive link.' : 'يرجى إدخال رابط Google Drive صحيح.');
      return;
    }

    // Find the assignment title to embed
    const matchedAssignment = assignments.find(a => a.id === selectedAssignmentId);
    const topicTitle = matchedAssignment 
      ? (Array.isArray(matchedAssignment.topics) && matchedAssignment.topics.length > 0
          ? matchedAssignment.topics.join(', ')
          : Array.isArray(matchedAssignment.topic) ? matchedAssignment.topic.join(', ') : matchedAssignment.topic)
      : 'Coverage Task';

    const title = matchedAssignment 
      ? `${matchedAssignment.miqaatName ? matchedAssignment.miqaatName + ' - ' : ''}${matchedAssignment.date} - ${matchedAssignment.zone} - ${topicTitle}`
      : 'Coverage Task';

    onSubmitReport({
      itsNumber: currentUser.itsNumber,
      assignmentId: selectedAssignmentId,
      assignmentTitle: title,
      driveLink: driveLink.trim(),
      notes: notes.trim(),
      completedTouchPoints: completedTouchPoints,
      grade: 'Pending'
    });

    setDriveLink('');
    setNotes('');
    setSelectedAssignmentId('');
    setCompletedTouchPoints([]);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setActiveTab('submission_logs'); // Auto switch to submission logs after submission
    }, 2000);
  };

  return (
    <div className={`min-h-screen bg-editorial-bg py-8 px-4 sm:px-6 lg:px-8 font-sans ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* 1. TOP HEADER BANNER (3-PANEL EDITORIAL TRANSLUCENT CARDS WITH ROUNDED CORNERS) */}
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-4">
          
          {/* Panel 1 — Role-Based Title Block */}
          <div
            className="flex-1 p-5 sm:p-6 flex items-center gap-4 transition-all rounded-[14px] overflow-hidden"
            style={{
              backgroundColor: 'rgba(246, 237, 218, 0.9)',
              border: '1px solid rgba(92, 19, 15, 0.15)',
              borderTop: '3px solid #5C130F',
              borderRadius: '14px',
              boxShadow: '0 4px 12px rgba(92, 19, 15, 0.08)'
            }}
          >
            <div className="w-12 h-12 rounded-full bg-[#5C130F] flex items-center justify-center text-[#BA8332] shrink-0 shadow-sm">
              {hasRole(currentUser, 'coordinator') ? (
                <Shield className="w-7 h-7 text-[#BA8332]" />
              ) : currentUser.role === 'videographer' ? (
                <Video className="w-7 h-7 text-[#BA8332]" />
              ) : (
                <Camera className="w-7 h-7 text-[#BA8332]" />
              )}
            </div>
            <div>
              <h1 className="font-serif text-lg sm:text-xl font-bold text-[#5C130F]">
                Al Musawareen Member Portal — {formatRoleBadgeLabel(currentUser)}
              </h1>
              <p className="font-serif text-xs text-[#5C130F]/80 italic mt-0.5">
                {lang === 'en'
                  ? 'Operations, coverage assignments, shot approvals & Sharaf allocation'
                  : 'إدارة العمليات، تكليفات التغطية، رفع التقارير وتخصيص مقاعد الشرف'}
              </p>
            </div>
          </div>

          {/* Panel 2 — Safar Mode Read-Only Status Block (No toggle for members) */}
          <div
            className="w-full lg:w-[240px] shrink-0 p-4 sm:p-5 flex flex-col justify-between gap-3 transition-all rounded-[14px] overflow-hidden"
            style={{
              backgroundColor: 'rgba(246, 237, 218, 0.9)',
              border: '1px solid rgba(92, 19, 15, 0.15)',
              borderTop: '3px solid #5C130F',
              borderRadius: '14px',
              boxShadow: '0 4px 12px rgba(92, 19, 15, 0.08)'
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5C130F]">
                {lang === 'en' ? 'SAFAR MODE STATUS' : 'حالة وضع السفر'}
              </span>
              <span className="text-[9px] font-mono text-[#5C130F]/70 font-bold uppercase">
                {lang === 'en' ? 'Read Only' : 'عرض فقط'}
              </span>
            </div>

            <div>
              {isSafarModeEnabled ? (
                <div className="space-[#5C130F]/5 space-y-1">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold px-2.5 py-1 bg-[#BA8332] text-white rounded-md uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {lang === 'en' ? "Moula's TUS Safar Mode Active" : 'وضع السفر مفعل'}
                  </span>
                  <p className="text-[10px] font-serif italic text-[#5C130F]/80">
                    {lang === 'en' ? 'Sharaf seating tab is unlocked' : 'ميزة مقاعد الشرف متاحة الآن'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold px-2.5 py-1 bg-[rgba(186,131,50,0.15)] text-[#5C130F] rounded-md uppercase tracking-wider inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5C130F]" />
                    {lang === 'en' ? 'Safar Mode Inactive' : 'وضع السفر غير مفعل'}
                  </span>
                  <p className="text-[10px] font-serif italic text-[#3A1A14]/70">
                    {lang === 'en' ? 'Normal operations — Sharaf seating off' : 'العمليات العادية — مقاعد الشرف مغلقة'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Panel 3 — User Profile Block */}
          <div
            className="w-full lg:w-[310px] shrink-0 p-4 sm:p-5 flex items-center justify-between gap-3.5 transition-all rounded-[14px] overflow-hidden"
            style={{
              backgroundColor: 'rgba(246, 237, 218, 0.9)',
              border: '1px solid rgba(92, 19, 15, 0.15)',
              borderTop: '3px solid #5C130F',
              borderRadius: '14px',
              boxShadow: '0 4px 12px rgba(92, 19, 15, 0.08)'
            }}
          >
            <div className="min-w-0 flex-1">
              <p className="font-serif text-sm sm:text-base font-bold text-[#5C130F] leading-tight break-words">
                {currentUser.fullName}
              </p>
              <p className="font-mono text-[10px] text-[#3A1A14]/80 font-bold mt-1">
                ITS: {currentUser.itsNumber}
              </p>
              <span className="text-[10px] bg-[#5C130F]/10 text-[#5C130F] font-mono font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider inline-block mt-1 text-center border border-[#5C130F]/20">
                {formatRoleBadgeLabel(currentUser)}
              </span>
            </div>

            <div className="relative group cursor-pointer shrink-0" title="Click camera button to upload/change profile photo (DP)">
              <AvatarPlaceholder
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                sizeClassName="w-16 h-16"
                iconSizeClassName="w-7 h-7"
                className="border-2 border-[#BA8332] shrink-0"
              />
              <label className="absolute -bottom-1 -right-1 bg-[#BA8332] hover:bg-[#a06e28] text-white p-1 rounded-full shadow-md cursor-pointer transition-transform hover:scale-110 border border-white flex items-center justify-center">
                {isUploadingDp ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Camera className="w-3 h-3" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadDpPhoto} disabled={isUploadingDp} />
              </label>
            </div>
          </div>

        </div>

        {/* 2. STAT CARD ROW (3 USER-RELEVANT CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 — Submissions Due */}
          <div className="editorial-card p-6 border-l-4 border-l-[#BA8332] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5C130F]">
                {lang === 'en' ? 'Submissions Due' : 'التقارير المطلوبة'}
              </span>
              <FileText className="w-5 h-5 text-[#BA8332]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-[#5C130F]">
                {pendingSubmissionsCount}
              </span>
              <span className="text-xs font-mono text-[#3A1A14]/70">
                {pendingSubmissionsCount === 1 ? 'Submission Pending' : 'Submissions Pending'}
              </span>
            </div>
          </div>

          {/* Card 2 — Events to Accept/Decline */}
          <div className="editorial-card p-6 border-l-4 border-l-[#5C130F] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5C130F]">
                {lang === 'en' ? 'Events to Respond' : 'تكليفات تحتاج رد'}
              </span>
              <Calendar className="w-5 h-5 text-[#5C130F]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-[#5C130F]">
                {pendingResponsesCount}
              </span>
              <span className="text-xs font-mono text-[#3A1A14]/70">
                {pendingResponsesCount > 0 ? 'Pending Accept / Decline' : 'All Confirmed'}
              </span>
            </div>
          </div>

          {/* Card 3 — Star Totals (Earned Gold & Red Stars) */}
          <div className="editorial-card p-6 border-l-4 border-l-[#BA8332] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5C130F]">
                {lang === 'en' ? 'Performance Star Totals' : 'إجمالي النجوم المكتسبة'}
              </span>
              <Star className="w-5 h-5 text-[#BA8332] fill-[#BA8332]" />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono font-bold text-2xl text-[#5C130F]">
                {totalGoldEarned} <span className="text-xs text-[#BA8332]">Gold</span>
              </span>
              <span className="text-gray-300 font-bold">·</span>
              <span className="font-mono font-bold text-2xl text-red-700">
                {totalRedEarned} <span className="text-xs text-red-600">Red</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3. TAB BAR (DYNAMIC MULTI-ROLE & PERMISSION BASED TABS) */}
        <div className="flex flex-wrap gap-3 border-b border-[#5C130F]/20 pb-3">
          {/* Photographer / Videographer Tabs */}
          {isPhotographerOrVideographer && (
            <>
              {/* Tab 1: Assigned Coverage Schedules */}
              <button
                type="button"
                onClick={() => setActiveTab('assigned')}
                className={`relative py-2.5 px-4 rounded-xl font-mono font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'assigned'
                    ? 'option-card-selected'
                    : 'option-card-unselected'
                }`}
              >
                <span>{lang === 'en' ? 'Assigned Coverage Schedules' : 'التكليفات المجدولة'}</span>
                {pendingResponsesCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 !text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-[#BA8332] animate-pulse">
                    {pendingResponsesCount}
                  </span>
                )}
              </button>

              {/* Tab 2: Submit Shot Report */}
              <button
                type="button"
                onClick={() => setActiveTab('submit_form')}
                className={`py-2.5 px-4 rounded-xl font-mono font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'submit_form'
                    ? 'option-card-selected'
                    : 'option-card-unselected'
                }`}
              >
                {lang === 'en' ? 'Submit Shot Report' : 'تقديم تقرير جديد'}
              </button>

              {/* Tab 3: Submission Log */}
              <button
                type="button"
                onClick={() => setActiveTab('submission_logs')}
                className={`py-2.5 px-4 rounded-xl font-mono font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'submission_logs'
                    ? 'option-card-selected'
                    : 'option-card-unselected'
                }`}
              >
                {lang === 'en' ? 'Submission Log' : 'سجل التسليمات'}
              </button>

              {/* Tab 4: Sharaf Pass */}
              {isSafarModeEnabled && (
                <button
                  type="button"
                  onClick={() => setActiveTab('sharaf')}
                  className={`py-2.5 px-4 rounded-xl font-mono font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
                    activeTab === 'sharaf'
                      ? 'option-card-selected'
                      : 'option-card-unselected'
                  }`}
                >
                  <span>{lang === 'en' ? 'Sharaf Pass' : 'مقاعد الشرف'}</span>
                </button>
              )}
            </>
          )}

          {/* HR Access Granted Tabs */}
          {isHR && (
            <>
              {(canAssignCoverage || canViewAssignments) && (
                <button
                  type="button"
                  onClick={() => setActiveTab('hr_assignments')}
                  className={`py-2.5 px-4 rounded-xl font-mono font-bold text-xs tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'hr_assignments'
                      ? 'option-card-selected'
                      : 'option-card-unselected'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-[#BA8332]" />
                  <span>{lang === 'en' ? 'Coverage & Zone Assignments' : 'إدارة التغطيات والمناطق'}</span>
                </button>
              )}

              {canReviewSubmissions && (
                <button
                  type="button"
                  onClick={() => setActiveTab('hr_submissions')}
                  className={`py-2.5 px-4 rounded-xl font-mono font-bold text-xs tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'hr_submissions'
                      ? 'option-card-selected'
                      : 'option-card-unselected'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-[#BA8332]" />
                  <span>{lang === 'en' ? 'Shot Report Audits' : 'تدقيق تقارير اللقطات'}</span>
                </button>
              )}

              {canViewRoster && (
                <button
                  type="button"
                  onClick={() => setActiveTab('hr_roster')}
                  className={`py-2.5 px-4 rounded-xl font-mono font-bold text-xs tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'hr_roster'
                      ? 'option-card-selected'
                      : 'option-card-unselected'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-[#BA8332]" />
                  <span>{lang === 'en' ? 'Team Roster' : 'سجل فريق العمل'}</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* 4. TAB CONTENTS */}

        {/* TAB 1: Assigned Coverage Schedules */}
        {activeTab === 'assigned' && (
          <div className="editorial-card p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-[#5C130F]/20 pb-3">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#5C130F] uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-6 h-6 text-[#BA8332]" />
                <span>{lang === 'en' ? 'Your Assigned Coverage Schedules' : 'مواعيد تكليفك المجدولة'}</span>
              </h3>
              <span className="bg-[#5C130F] text-white text-xs font-mono font-bold px-3 py-1">
                {userAssignments.length} Assigned
              </span>
            </div>

            {userAssignments.length === 0 ? (
              <p className="text-xs text-[#3A1A14]/80 bg-white/40 p-4 rounded-none border border-[#5C130F]/20 font-serif">
                {lang === 'en' ? 'No scheduled zone coverage assignments at this time. Standard ad-hoc submissions are authorized.' : 'لا توجد تكليفات حيوية مجدولة باسمك حالياً. يمكنك التقديم الفوري الحر.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userAssignments.map(as => {
                  const memberStatus = (as.memberStatuses && as.memberStatuses[currentUser.itsNumber]) || 'pending';

                  const touchPoints = Array.isArray(as.topics) && as.topics.length > 0
                    ? as.topics
                    : Array.isArray(as.topic) ? as.topic : (typeof as.topic === 'string' ? as.topic.split(',').map(s => s.trim()) : []);

                  return (
                    <div 
                      key={as.id} 
                      className={`p-5 border-2 rounded-xl space-y-4 transition-all bg-white/60 shadow-xs ${
                        memberStatus === 'accepted'
                          ? 'border-emerald-700'
                          : memberStatus === 'declined'
                          ? 'border-red-600 opacity-75'
                          : 'border-[#BA8332]'
                      }`}
                    >
                      {/* Header Row */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-[#5C130F] text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md">
                            {as.date}
                          </span>
                          {as.miqaatName && (
                            <span className="bg-[#BA8332] text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md">
                              {as.miqaatName}
                            </span>
                          )}
                        </div>

                        {/* Individual Member Status Badge */}
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                          memberStatus === 'accepted'
                            ? 'bg-emerald-700 text-white'
                            : memberStatus === 'declined'
                            ? 'bg-red-600 text-white'
                            : 'bg-[#BA8332] text-white animate-pulse'
                        }`}>
                          {memberStatus === 'accepted'
                            ? (lang === 'en' ? '✓ Confirmed' : '✓ مؤكد')
                            : memberStatus === 'declined'
                            ? (lang === 'en' ? '✕ Declined' : '✕ اعتذار')
                            : (lang === 'en' ? '● Pending Response' : '● قيد الانتظار')}
                        </span>
                      </div>

                      {/* Zone & Touch Points */}
                      <div className="space-y-1">
                        <p className="text-xs text-[#3A1A14]/80 flex items-center gap-1 font-serif">
                          <MapPin className="w-3.5 h-3.5 text-[#BA8332] shrink-0" />
                          <span className="font-bold text-[#5C130F]">{as.zone}</span>
                        </p>

                        {touchPoints.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {touchPoints.map((tp, idx) => (
                              <span key={idx} className="bg-[#BA8332]/15 text-[#5C130F] border border-[#BA8332]/30 text-[10px] font-serif font-bold px-2 py-0.5 rounded-md">
                                {tp}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Notes/Directives */}
                      {as.notes && (
                        <p className="text-xs text-[#3A1A14]/85 bg-white/70 p-3 border border-[#5C130F]/15 font-serif italic rounded-md">
                          "{as.notes}"
                        </p>
                      )}

                      {/* Accept / Decline Action Buttons (When Pending) */}
                      {memberStatus === 'pending' && onRespondAssignment && (
                        <div className="pt-2 border-t border-[#5C130F]/15 space-y-3">
                          {decliningAssignmentId === as.id ? (
                            /* Required Decline Reason Inline Form */
                            <div className="p-3 bg-red-50/90 border border-red-200 rounded-md space-y-2 text-xs font-sans">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-red-800 uppercase tracking-wider text-[10px]">
                                  {lang === 'en' ? 'Decline Task — Reason Required' : 'سبب الاعتذار - مطلوب'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDecliningAssignmentId(null);
                                    setDeclineError('');
                                  }}
                                  className="text-[10px] font-mono text-red-700 hover:underline cursor-pointer"
                                >
                                  {lang === 'en' ? 'Cancel' : 'إلغاء'}
                                </button>
                              </div>

                              {declineError && (
                                <p className="text-[11px] text-red-700 font-mono font-bold">
                                  ⚠️ {declineError}
                                </p>
                              )}

                              <div>
                                <label className="block text-[10px] font-mono font-bold text-[#5C130F] mb-1">
                                  {lang === 'en' ? 'Decline Category:' : 'فئة الاعتذار:'}
                                </label>
                                <select
                                  value={declineCategory}
                                  onChange={(e) => setDeclineCategory(e.target.value)}
                                  className="w-full p-1.5 bg-white border border-red-300 rounded-md text-xs font-sans text-[#3A1A14]"
                                >
                                  <option value="Travel / Travel Conflict">Travel / Travel Conflict</option>
                                  <option value="Health / Personal Emergency">Health / Personal Emergency</option>
                                  <option value="Equipment / Lens Failure">Equipment / Lens Failure</option>
                                  <option value="Prior Work / Duty Conflict">Prior Work / Duty Conflict</option>
                                  <option value="Other Specific Reason">Other Specific Reason</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono font-bold text-[#5C130F] mb-1">
                                  {lang === 'en' ? 'Specific Details / Reason (Required):' : 'التفاصيل / السبب (مطلوب):'}
                                </label>
                                <textarea
                                  rows={2}
                                  value={declineNotes}
                                  onChange={(e) => {
                                    setDeclineNotes(e.target.value);
                                    if (e.target.value.trim().length > 0) setDeclineError('');
                                  }}
                                  placeholder={lang === 'en' ? 'e.g. Flight scheduled during coverage hours, pre-approved travel...' : 'أدخل سبب الاعتذار بالتفصيل...'}
                                  className="w-full p-2 bg-white border border-red-300 rounded-md text-xs font-sans text-[#3A1A14] focus:outline-none focus:border-red-600"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  if (!declineNotes.trim()) {
                                    setDeclineError(lang === 'en' ? 'Decline reason is required before confirming.' : 'يرجى كتابة سبب الاعتذار قبل التأكيد.');
                                    return;
                                  }
                                  const fullReason = `${declineCategory}: ${declineNotes.trim()}`;
                                  onRespondAssignment(as.id, currentUser.itsNumber, 'declined', fullReason);
                                  setDecliningAssignmentId(null);
                                  setDeclineNotes('');
                                  setDeclineError('');
                                }}
                                className="w-full py-2 bg-red-700 hover:bg-red-800 text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors text-center rounded-md shadow-xs"
                              >
                                {lang === 'en' ? 'Submit Decline & Notify Admin' : 'تأكيد الاعتذار وإبلاغ الإدارة'}
                              </button>
                            </div>
                          ) : (
                            /* Initial Accept / Decline Buttons */
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => onRespondAssignment(as.id, currentUser.itsNumber, 'accepted')}
                                className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs transition-colors text-center rounded-md"
                              >
                                {lang === 'en' ? 'Accept Assignment' : 'قبول التكليف'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDecliningAssignmentId(as.id);
                                  setDeclineNotes('');
                                  setDeclineError('');
                                }}
                                className="flex-1 py-2 border border-red-600 text-red-700 hover:bg-red-50 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors text-center rounded-md"
                              >
                                {lang === 'en' ? 'Decline Task' : 'اعتذار عن التغطية'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {memberStatus === 'accepted' && (
                        <p className="text-[11px] font-serif text-emerald-800 bg-emerald-50 p-2 border border-emerald-200 rounded-md">
                          {lang === 'en' ? 'You have confirmed this assignment. Please upload your shot report upon completion.' : 'لقد قمت بتأكيد التكليف بنجاح. يرجى رفع التقارير فور الانتهاء.'}
                        </p>
                      )}

                      {memberStatus === 'declined' && (
                        <div className="text-[11px] font-serif text-red-800 bg-red-50 p-2.5 border border-red-200 space-y-1 rounded-md">
                          <p className="font-bold">
                            {lang === 'en' ? 'You have declined this coverage assignment.' : 'لقد قدمت اعتذارك عن هذه التغطية.'}
                          </p>
                          {as.memberDeclineReasons?.[currentUser.itsNumber] && (
                            <p className="italic font-sans text-red-950">
                              Reason submitted: "{as.memberDeclineReasons[currentUser.itsNumber]}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Shot Report Submissions (DEDICATED NEW SHOT REPORT FORM ONLY) */}
        {activeTab === 'submit_form' && (
          <div className="max-w-3xl mx-auto">
            <div className="editorial-card p-6 sm:p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-[#5C130F]/20 pb-3">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#5C130F] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-6 h-6 text-[#BA8332]" />
                  <span>{lang === 'en' ? 'Dispatch New Shot Report' : 'إرسال تقرير تغطية جديد'}</span>
                </h3>
                <span className="bg-[#BA8332] text-white text-xs font-mono font-bold px-3 py-1 rounded-md">
                  {confirmedAssignments.length} Confirmed Tasks
                </span>
              </div>

              {error && (
                <div className="bg-[#5C130F]/10 border border-[#5C130F] text-[#5C130F] p-3.5 rounded-md text-xs flex items-start gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-[#5C130F] border border-[#BA8332] !text-white p-4 rounded-md text-xs flex items-start gap-2 font-serif shadow-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#BA8332]" />
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-[#BA8332]">
                      {lang === 'en' ? 'Shot Report Submitted Successfully!' : 'تم إرسال التقرير بنجاح!'}
                    </p>
                    <p className="!text-white/90">
                      {lang === 'en' ? 'Your report has been dispatched to Sheikh Ibrahim Bhai Lokhandwala for rating evaluation. Redirecting to logs...' : 'تم إرسال التقرير بنجاح للشيخ إبراهيم بهائي لوكهند والا للتصديق...'}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 text-xs font-sans">
                {/* Select Task (Confirmed Assignments Only) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">
                    {t.selectTask}
                  </label>

                  {confirmedAssignments.length === 0 ? (
                    <div className="p-4 bg-[#BA8332]/10 border border-[#BA8332]/35 text-[#5C130F] font-serif text-xs leading-relaxed rounded-md space-y-1">
                      <p className="font-bold text-sm">
                        {lang === 'en' ? 'No Confirmed Assignments Available' : 'لا توجد تكليفات مؤكدة متاحة'}
                      </p>
                      <p>
                        {lang === 'en'
                          ? 'Please accept an assigned coverage task from the "Assigned Coverage Schedules" tab first before submitting a report.'
                          : 'يرجى قبول تكليف من تبويب "التكليفات المجدولة" أولاً قبل تقديم التقرير.'}
                      </p>
                    </div>
                  ) : (
                    <select
                      value={selectedAssignmentId}
                      onChange={(e) => setSelectedAssignmentId(e.target.value)}
                      className="w-full px-3.5 py-3 border border-[#5C130F]/35 rounded-md bg-[#FDFAF3] text-[#3A1A14] font-serif text-sm focus:border-[#5C130F] focus:outline-none"
                    >
                      <option value="">-- {lang === 'en' ? 'Choose Confirmed Assignment' : 'اختر التكليف المؤكد'} --</option>
                      {confirmedAssignments.map(as => {
                        const existingSub = mySubmissions.find(s => s.assignmentId === as.id);
                        const topicTitle = Array.isArray(as.topics) && as.topics.length > 0
                          ? as.topics.join(', ')
                          : Array.isArray(as.topic) ? as.topic.join(', ') : (as.topic || '');

                        return (
                          <option key={as.id} value={as.id}>
                            {as.date} - {as.zone} ({topicTitle}) {existingSub ? (lang === 'en' ? '— [Submitted • Select to Update]' : '— [تم التقديم • اختر للتحديث]') : ''}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                {/* Touch Point Checklist Section (Appears dynamically when task is selected) */}
                {selectedAssignment && availableTouchPoints.length > 0 && (
                  <div className="p-4 bg-[#FAF4E8] border border-[#5C130F]/20 rounded-lg space-y-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#5C130F]/15 pb-2">
                      <div>
                        <label className="text-xs font-mono font-bold uppercase text-[#5C130F] flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[#BA8332]" />
                          <span>Touch-Point Completion Checklist (Required)</span>
                        </label>
                        <p className="text-[11px] font-serif italic text-[#3A1A14]/75 mt-0.5">
                          Mark which assigned touch points were covered in your submitted media.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono font-bold">
                        <button
                          type="button"
                          onClick={handleSelectAllTouchPoints}
                          className="px-2 py-1 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 transition-colors cursor-pointer"
                        >
                          Select All ({availableTouchPoints.length})
                        </button>
                        <button
                          type="button"
                          onClick={handleDeselectAllTouchPoints}
                          className="px-2 py-1 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors cursor-pointer"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    {/* Touch Point Checkboxes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {availableTouchPoints.map((tp, idx) => {
                        const isChecked = completedTouchPoints.includes(tp);
                        return (
                          <div
                            key={`tp-check-${idx}`}
                            onClick={() => toggleTouchPoint(tp)}
                            className={`p-2.5 rounded-md border text-xs font-serif flex items-center justify-between gap-2 cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900 shadow-xs'
                                : 'bg-white/80 border-[#5C130F]/15 text-[#3A1A14]/70 hover:bg-[#5C130F]/5'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-4 h-4 text-emerald-700 rounded border-gray-300 focus:ring-emerald-600 cursor-pointer"
                              />
                              <span className={`truncate font-semibold ${isChecked ? 'text-emerald-900' : 'text-[#3A1A14]/80'}`}>
                                {tp}
                              </span>
                            </div>

                            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-xs shrink-0 ${
                              isChecked
                                ? 'bg-emerald-700 text-white'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {isChecked ? '✓ Covered' : '✕ Not Covered'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] font-mono text-[#5C130F] border-t border-[#5C130F]/15">
                      <span>
                        Status: <strong>{completedTouchPoints.length} of {availableTouchPoints.length}</strong> touch points covered
                      </span>
                      <span className="font-bold text-[#BA8332]">
                        Est. Base Gold: {
                          (completedTouchPoints.length / availableTouchPoints.length) >= 1 ? '3.0★ (100% complete)' :
                          (completedTouchPoints.length / availableTouchPoints.length) >= 0.75 ? '2.0★ (75%+ complete)' :
                          (completedTouchPoints.length / availableTouchPoints.length) >= 0.5 ? '1.0★ (50%+ complete)' :
                          (completedTouchPoints.length / availableTouchPoints.length) >= 0.25 ? '0.5★ (25%+ complete)' : '0.0★ (<25% complete)'
                        }
                      </span>
                    </div>
                  </div>
                )}

                {/* Drive Link */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">
                    {t.driveLinkLabel}
                  </label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${isRtl ? 'left-auto right-0 pr-3.5' : ''}`}>
                      <LinkIcon className="h-4 w-4 text-[#5C130F]/60" />
                    </div>
                    <input
                      type="url"
                      value={driveLink}
                      onChange={(e) => setDriveLink(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className={`block w-full pl-10 pr-3.5 py-3 bg-[#FDFAF3] border border-[#5C130F]/35 rounded-md text-xs text-[#3A1A14] focus:border-[#5C130F] focus:outline-none ${
                        isRtl ? 'pl-3.5 pr-10' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">
                    {t.submissionNotes}
                  </label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={lang === 'en' ? 'Include file counts or selection reasons...' : 'اكتب عدد الملفات أو تفاصيل اللقطات...'}
                    className="w-full px-3.5 py-3 border border-[#5C130F]/35 rounded-md bg-[#FDFAF3] text-xs text-[#3A1A14] focus:border-[#5C130F] focus:outline-none font-serif"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#BA8332] hover:bg-[#a06e28] !text-white font-mono font-bold rounded-md text-xs uppercase tracking-widest shadow-sm transition-colors cursor-pointer"
                >
                  {t.submitReport}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: Submission Log (DEDICATED SUBMISSION HISTORY LOGS ONLY) */}
        {activeTab === 'submission_logs' && (
          <div className="editorial-card p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-[#5C130F]/20 pb-3">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#5C130F] uppercase tracking-wider flex items-center gap-2">
                <ListFilter className="w-6 h-6 text-[#BA8332]" />
                <span>{lang === 'en' ? 'Shot Submission Logs' : 'سجل تقارير التغطية المقدمة'}</span>
              </h3>
              <span className="bg-[#5C130F] text-white text-xs font-mono font-bold px-3 py-1 rounded-md">
                {mySubmissions.length} Cataloged Logged
              </span>
            </div>

            {mySubmissions.length === 0 ? (
              <div className="py-16 text-center text-[#3A1A14]/60 flex flex-col items-center gap-3 bg-white/40 border border-[#5C130F]/20 p-8 rounded-xl">
                <FileText className="w-12 h-12 text-[#BA8332]" />
                <p className="text-sm font-serif font-bold text-[#5C130F]">
                  {lang === 'en' ? 'No submission logs recorded yet.' : 'لم تقم بتقديم أي تقارير لقطات مؤخراً.'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('submit_form')}
                  className="mt-2 px-4 py-2 bg-[#BA8332] text-white font-mono text-xs font-bold uppercase rounded-md shadow-xs hover:bg-[#a06e28] transition-colors"
                >
                  {lang === 'en' ? 'Submit Your First Shot Report' : 'إرسال أول تقرير الآن'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {mySubmissions.map(sub => {
                  const assignment = assignments.find(a => a.id === sub.assignmentId);
                  const rating = calculateStarRating(sub, assignment, currentUser);

                  return (
                    <div key={sub.id} className="p-5 border border-[#5C130F]/20 rounded-xl space-y-4 bg-white/60 hover:bg-[#BA8332]/10 transition-colors shadow-xs">
                      {/* Log Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#5C130F]/15 pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-[#5C130F] !text-white text-[10px] font-mono px-2.5 py-0.5 rounded-md font-bold">
                            DATE: {new Date(sub.timestamp).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-SA')}
                          </span>
                          <span className="bg-[#BA8332]/20 text-[#5C130F] border border-[#BA8332]/40 text-[10px] font-mono px-2.5 py-0.5 rounded-md font-bold">
                            ITS: {sub.itsNumber}
                          </span>
                        </div>
                        <span className="text-xs font-serif italic text-[#3A1A14]/75">
                          Submitted by: <strong className="text-[#5C130F] font-semibold">{currentUser.fullName}</strong>
                        </span>
                      </div>

                      {/* Assignment Title */}
                      <h4 className="font-serif text-lg font-bold text-[#5C130F] leading-tight">
                        {sub.assignmentTitle}
                      </h4>

                      {/* Automated Star Rating Display */}
                      <div className="bg-[#FAF4E8] p-3.5 rounded-lg border border-[#5C130F]/15">
                        <StarRatingDisplay rating={rating} showSubtext={true} size="sm" />
                      </div>

                      {/* Notes / Description */}
                      {sub.notes && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-mono font-bold uppercase text-[#5C130F]">
                            Description / Notes:
                          </p>
                          <p className="text-xs text-[#3A1A14]/85 italic font-serif bg-white/70 p-3 border border-[#5C130F]/15 rounded-md">
                            "{sub.notes}"
                          </p>
                        </div>
                      )}

                      {/* Google Drive Link Action */}
                      <div className="pt-2 flex items-center justify-between border-t border-[#5C130F]/15">
                        <a 
                          href={sub.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-white border border-[#5C130F]/30 rounded-md text-xs text-[#5C130F] font-mono font-bold hover:bg-[#5C130F] hover:text-white transition-colors flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Access Google Drive Link</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Sharaf Allocation (ONLY visible when Safar Mode is ON) */}
        {activeTab === 'sharaf' && isSafarModeEnabled && (
          <div className="editorial-card p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-[#5C130F]/20 pb-3">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#5C130F] uppercase tracking-wider flex items-center gap-2">
                <Award className="w-6 h-6 text-[#BA8332]" />
                <span>{lang === 'en' ? "Moula's TUS Sharaf Allocation" : 'مقاعد الشرف وسجل التخصيص'}</span>
              </h3>
              <span className="bg-[#BA8332] text-white text-xs font-mono font-bold px-3 py-1 rounded-md">
                {mySharafAllocations.length} Allocated
              </span>
            </div>

            {mySharafAllocations.length === 0 ? (
              <div className="py-12 text-center text-[#3A1A14]/60 flex flex-col items-center gap-2 bg-white/40 border border-[#5C130F]/20 p-6 rounded-xl">
                <Award className="w-12 h-12 text-[#BA8332]" />
                <p className="font-serif text-sm font-bold text-[#5C130F]">
                  {lang === 'en' ? 'No active Sharaf seating allocated to your profile for current events.' : 'لا توجد مقاعد شرف مخصصة لملفك الشخصي في المناسبات الحالية.'}
                </p>
                <p className="text-xs font-sans text-[#3A1A14]/75">
                  {lang === 'en' ? 'Sharaf allocations are assigned by Sheikh Ibrahim Bhai Lokhandwala during Moula\'s TUS Safar Mode.' : 'يتم تخصيص مقاعد الشرف من قبل الإدارة أثناء وضع السفر.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mySharafAllocations.map(alloc => (
                  <div key={alloc.id} className="p-6 border-2 border-[#BA8332] bg-gradient-to-br from-[#FAF4E8] to-[#FDFAF3] rounded-xl space-y-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <span className="bg-[#5C130F] text-white font-mono text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider rounded-md">
                        {alloc.eventType}
                      </span>
                      <span className="bg-emerald-700 text-white font-mono text-[9px] font-bold px-2 py-0.5 uppercase rounded-md">
                        {lang === 'en' ? 'GRANTED' : 'ممنوح'}
                      </span>
                    </div>

                    {alloc.eventType.toLowerCase() === 'waaz' ? (
                      <div>
                        <p className="text-xs text-[#3A1A14]/70 font-mono uppercase font-bold">Waaz Seating Zone:</p>
                        <h4 className="font-serif text-lg font-bold text-[#5C130F] flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-4 h-4 text-[#BA8332]" />
                          <span>{alloc.waazZone || 'Main Sehan'}</span>
                        </h4>
                        {alloc.mohalla && (
                          <p className="text-xs text-[#3A1A14]/80 font-serif italic mt-1">
                            Mohalla: {alloc.mohalla}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-[#3A1A14]/70 font-mono uppercase font-bold">Event Location:</p>
                          <h4 className="font-serif text-lg font-bold text-[#5C130F] flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-4 h-4 text-[#BA8332]" />
                            <span>{alloc.location || 'Designated Venue'}</span>
                          </h4>
                        </div>
                        {(alloc.fromTime || alloc.toTime) && (
                          <p className="text-xs text-[#3A1A14]/80 font-mono flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#BA8332]" />
                            <span>Time Window: {alloc.fromTime} – {alloc.toTime}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HR TAB 1: Coverage & Zone Assignments */}
        {activeTab === 'hr_assignments' && isHR && (canAssignCoverage || canViewAssignments) && (
          <CoverageAssignmentsView
            assignments={assignments}
            users={users}
            zones={zones}
            topics={topics}
            miqaats={miqaats}
            lang={lang}
            canAssignCoverage={canAssignCoverage}
            onAddAssignment={onAddAssignment}
            onUpdateAssignment={onUpdateAssignment}
            onAddMiqaat={onAddMiqaat}
            onAddZone={onAddZone}
            onBulkAddZones={onBulkAddZones}
            onAddTopic={onAddTopic}
            onBulkAddTopics={onBulkAddTopics}
          />
        )}

        {/* HR TAB 2: Shot Report Audits */}
        {activeTab === 'hr_submissions' && isHR && canReviewSubmissions && (
          <ShotReportSubmissionsView
            submissions={submissions}
            assignments={assignments}
            users={users}
            lang={lang}
            canStarOverride={canStarOverride}
            onSaveRatingOverride={onSaveRatingOverride}
          />
        )}

        {/* HR TAB 3: Team Roster */}
        {activeTab === 'hr_roster' && isHR && canViewRoster && (
          <DispatchedLensesRosterTable
            users={users}
            lang={lang}
            isSafarModeEnabled={isSafarModeEnabled}
            canEditRoster={currentUser.hrPermissions?.editRoster ?? false}
          />
        )}

      </div>
    </div>
  );
}
