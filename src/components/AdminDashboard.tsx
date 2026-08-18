import React, { useState, useEffect } from 'react';
import { UserProfile, Assignment, ShotReport, Zone, Topic, SharafEventDef, SharafAllocation, MiqaatDef, HRPermissions, UserRole, DEFAULT_HR_PERMISSIONS, getUserRoles, hasRole, formatRoleBadgeLabel } from '../types';
import { translations, LanguageType } from '../utils/translations';
import Logo from './Logo';
import { 
  Users, Calendar, FileText, BarChart2, ShieldCheck, 
  Check, X, Plus, Sparkles, MapPin, Link as LinkIcon, 
  Award, RefreshCw, Layers, Server, Activity, UserPlus, Search,
  Settings, Upload, Clock, Trash2, AlertTriangle, CheckCircle2, ToggleLeft, ToggleRight,
  Star, Edit3, Shield, Key, UserCheck, ShieldAlert
} from 'lucide-react';
import AvatarPlaceholder from './AvatarPlaceholder';
import BulkAddModal from './BulkAddModal';
import { MOHALLA_OPTIONS } from '../utils/mockData';
import { calculateStarRating } from '../utils/starRating';
import StarRatingDisplay from './StarRatingDisplay';
import StarOverrideModal from './StarOverrideModal';
import DispatchedLensesRosterTable from './DispatchedLensesRosterTable';
import ShotReportSubmissionsView from './ShotReportSubmissionsView';
import CoverageAssignmentsView from './CoverageAssignmentsView';
import OnboardingApprovalsView from './OnboardingApprovalsView';

interface AdminDashboardProps {
  lang: LanguageType;
  currentUser: UserProfile;
  users: UserProfile[];
  assignments: Assignment[];
  submissions: ShotReport[];
  zones: Zone[];
  topics: Topic[];
  miqaats?: MiqaatDef[];
  onApproveUser: (its: string, permissions?: HRPermissions) => void;
  onRejectUser: (its: string) => void;
  onUpdateUserPermissions?: (its: string, roles: UserRole[], permissions?: HRPermissions) => void;
  onAddAssignment?: (assignment: Omit<Assignment, 'id'>) => void;
  onUpdateAssignment?: (assignment: Assignment) => void;
  onReassignSlot?: (assignmentId: string, oldIts: string, newIts: string) => void;
  onGradeSubmission: (id: string, grade: ShotReport['grade']) => void;
  onAllocateSharaf: (its: string, zone: string, seat: string) => void;
  // Moula's Tus Safar Mode & Sharaf Props
  isSafarModeEnabled?: boolean;
  onToggleSafarMode?: (enabled: boolean) => void;
  sharafEvents?: SharafEventDef[];
  sharafAllocations?: SharafAllocation[];
  onAddSharafAllocation?: (alloc: Omit<SharafAllocation, 'id'>) => void;
  onRemoveSharafAllocation?: (id: string) => void;
  onBulkAssignSharaf?: (allocs: Omit<SharafAllocation, 'id'>[]) => void;
  onCreateCustomEvent?: (name: string) => void;
  onDeleteCustomEvent?: (id: string) => void;
  // Miqaat, Zone, and Touch Point Handlers
  onAddMiqaat?: (name: string) => void;
  onAddZone?: (name: string) => void;
  onBulkAddZones?: (names: string[]) => void;
  onAddTopic?: (name: string) => void;
  onBulkAddTopics?: (names: string[]) => void;
  onSaveRatingOverride?: (reportId: string, goldStars: number, redStars: number, note: string, isOverride: boolean) => void;
}

export default function AdminDashboard({
  lang,
  currentUser,
  users,
  assignments,
  submissions,
  zones,
  topics,
  miqaats = [],
  onApproveUser,
  onRejectUser,
  onUpdateUserPermissions,
  onAddAssignment,
  onUpdateAssignment,
  onReassignSlot,
  onGradeSubmission,
  onAllocateSharaf,
  isSafarModeEnabled = true,
  onToggleSafarMode,
  sharafEvents = [],
  sharafAllocations = [],
  onAddSharafAllocation,
  onRemoveSharafAllocation,
  onBulkAssignSharaf,
  onCreateCustomEvent,
  onDeleteCustomEvent,
  onAddMiqaat,
  onAddZone,
  onBulkAddZones,
  onAddTopic,
  onBulkAddTopics,
  onSaveRatingOverride
}: AdminDashboardProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'assignments' | 'submissions' | 'sharaf' | 'monitoring'>('overview');

  // Star Rating Override Modal State
  const [overrideModalReport, setOverrideModalReport] = useState<ShotReport | null>(null);

  // Reassignment state
  const [reassignTarget, setReassignTarget] = useState<{ assignmentId: string; oldIts: string } | null>(null);
  const [replacementIts, setReplacementIts] = useState('');

  // Local Form States
  const [assignDate, setAssignDate] = useState('2026-07-21');
  const [assignMiqaatName, setAssignMiqaatName] = useState(miqaats[0]?.name || 'Ashara Mubarakah 1448H');
  const [isAddingInlineMiqaat, setIsAddingInlineMiqaat] = useState(false);
  const [inlineMiqaatName, setInlineMiqaatName] = useState('');

  const [assignZone, setAssignZone] = useState(zones[0]?.name || '');
  const [zoneSearchQuery, setZoneSearchQuery] = useState('');
  const [isAddingInlineZone, setIsAddingInlineZone] = useState(false);
  const [inlineZoneName, setInlineZoneName] = useState('');
  const [isBulkAddZonesOpen, setIsBulkAddZonesOpen] = useState(false);

  const [assignTopics, setAssignTopics] = useState<string[]>(topics[0]?.name ? [topics[0].name] : []);
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [isAddingInlineTopic, setIsAddingInlineTopic] = useState(false);
  const [inlineTopicName, setInlineTopicName] = useState('');
  const [isBulkAddTopicsOpen, setIsBulkAddTopicsOpen] = useState(false);
  const [expandedCardTopics, setExpandedCardTopics] = useState<Record<string, boolean>>({});

  const [assignMode, setAssignMode] = useState<'individual' | 'mohalla'>('individual');
  const [selectedMohalla, setSelectedMohalla] = useState(MOHALLA_OPTIONS[0]);
  const [selectedMohallaPVs, setSelectedMohallaPVs] = useState<string[]>([]);
  const [assignPVs, setAssignPVs] = useState<string[]>([]);
  const [assignNotes, setAssignNotes] = useState('');

  // Member Search state variables
  const [pvSearchQuery, setPvSearchQuery] = useState('');
  const [overviewSearchQuery, setOverviewSearchQuery] = useState('');

  // HR Permission Management States
  const [hrApprovalPermsMap, setHrApprovalPermsMap] = useState<Record<string, HRPermissions>>({});
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<UserProfile | null>(null);
  const [editingUserRoles, setEditingUserRoles] = useState<UserRole[]>([]);
  const [editingHRPermissions, setEditingHRPermissions] = useState<HRPermissions>(DEFAULT_HR_PERMISSIONS);

  // Sharaf state allocation
  const [sharafUserIts, setSharafUserIts] = useState('');
  const [sharafZone, setSharafZone] = useState('Hazrat Aliyah');
  const [sharafSeat, setSharafSeat] = useState('Row A - Seat 5');

  // Enhanced Sharaf System Local States
  const [sharafMemberIts, setSharafMemberIts] = useState('');
  const [sharafMemberSearchQuery, setSharafMemberSearchQuery] = useState('');
  const [sharafEventType, setSharafEventType] = useState('Waaz');
  const [inlineCustomEventName, setInlineCustomEventName] = useState('');
  const [isAddingInlineEvent, setIsAddingInlineEvent] = useState(false);
  const [waazZone, setWaazZone] = useState('Masjid Sehan');
  const [waazMohalla, setWaazMohalla] = useState(MOHALLA_OPTIONS[0]);
  const [customWaazZone, setCustomWaazZone] = useState('');
  const [nonWaazLocation, setNonWaazLocation] = useState('Hazrat Aliyah Stage');
  const [fromTime, setFromTime] = useState('09:00 AM');
  const [toTime, setToTime] = useState('12:00 PM');
  const [sharafSearchQuery, setSharafSearchQuery] = useState('');

  // Modals state
  const [isNewAssignmentModalOpen, setIsNewAssignmentModalOpen] = useState(false);
  const [isManageEventsOpen, setIsManageEventsOpen] = useState(false);
  const [newCustomEventName, setNewCustomEventName] = useState('');

  // CSV Upload State & Handlers
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvRowCount, setCsvRowCount] = useState<number | null>(null);
  const [csvFileError, setCsvFileError] = useState<string | null>(null);
  const [isDraggingCsv, setIsDraggingCsv] = useState(false);
  const csvFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [csvPreview, setCsvPreview] = useState<{
    valid: Omit<SharafAllocation, 'id'>[];
    errors: { row: number; reason: string; raw: string }[];
  } | null>(null);

  const handleProcessCsvFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      setCsvFileError(lang === 'en' ? 'Please upload a valid .csv file.' : 'يرجى تحميل ملف .csv صحيح.');
      setCsvFile(null);
      setCsvPreview(null);
      setCsvFileName('');
      setCsvRowCount(null);
      return;
    }

    setCsvFileError(null);
    setCsvFile(file);
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const rowsDetected = lines.length > 0 && (lines[0].toLowerCase().includes('its_id') || lines[0].toLowerCase().includes('its'))
          ? lines.length - 1
          : lines.length;
        setCsvRowCount(Math.max(0, rowsDetected));
        parseAndValidateCsv(text);
      }
    };
    reader.readAsText(file);
  };

  const handleResetCsvUpload = () => {
    setCsvFile(null);
    setCsvFileName('');
    setCsvRowCount(null);
    setCsvFileError(null);
    setCsvPreview(null);
    if (csvFileInputRef.current) {
      csvFileInputRef.current.value = '';
    }
  };

  const handleSingleSharafSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharafMemberIts) {
      alert(lang === 'en' ? 'Please select a team member.' : 'يرجى اختيار عضو الفريق.');
      return;
    }
    if (!onAddSharafAllocation) return;

    let targetEventType = sharafEventType;

    // Check if creating inline custom event upon form submit
    if (isAddingInlineEvent || sharafEventType === '+ Add new event') {
      const trimmed = inlineCustomEventName.trim();
      if (!trimmed) {
        alert(lang === 'en' ? 'Please enter a name for the new event type.' : 'يرجى إدخال اسم نوع المناسبة الجديدة.');
        return;
      }
      if (onCreateCustomEvent) {
        onCreateCustomEvent(trimmed);
      }
      targetEventType = trimmed;
      setSharafEventType(trimmed);
      setIsAddingInlineEvent(false);
      setInlineCustomEventName('');
    }

    if (targetEventType.toLowerCase() === 'waaz') {
      const finalZone = waazZone === '+ Add custom zone' ? customWaazZone : waazZone;
      if (!finalZone) {
        alert(lang === 'en' ? 'Please specify the Waaz zone.' : 'يرجى تحديد منطقة مجالس الوعظ.');
        return;
      }
      onAddSharafAllocation({
        itsNumber: sharafMemberIts,
        eventType: 'Waaz',
        waazZone: finalZone,
        mohalla: waazZone === 'Relay Center' ? waazMohalla : undefined,
        isCustomZone: waazZone === '+ Add custom zone'
      });
    } else {
      if (!nonWaazLocation) {
        alert(lang === 'en' ? 'Please specify the location.' : 'يرجى تحديد الموقع.');
        return;
      }
      onAddSharafAllocation({
        itsNumber: sharafMemberIts,
        eventType: targetEventType,
        location: nonWaazLocation,
        fromTime,
        toTime
      });
    }

    setSharafMemberIts('');
    setSharafMemberSearchQuery('');
    alert(lang === 'en' ? `Sharaf allocated for ${targetEventType} successfully!` : `تم تخصيص شرف ${targetEventType} بنجاح!`);
  };

  // CSV Parsing & Validation Function
  const parseAndValidateCsv = (text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setCsvPreview(null);
      return;
    }

    const validRows: Omit<SharafAllocation, 'id'>[] = [];
    const errorRows: { row: number; reason: string; raw: string }[] = [];

    // Header check
    let startIdx = 0;
    if (lines[0].toLowerCase().includes('its_id') || lines[0].toLowerCase().includes('its')) {
      startIdx = 1;
    }

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      const rowNum = i + 1;

      if (parts.length < 2) {
        errorRows.push({ row: rowNum, reason: 'Row contains insufficient columns (at least ITS_ID and Event_Type required).', raw: line });
        continue;
      }

      const its = parts[0];
      const eventName = parts[1];

      // Validate Member ITS
      const memberExists = approvedPVs.some(u => u.itsNumber === its);
      if (!memberExists) {
        errorRows.push({ row: rowNum, reason: `ITS ID "${its}" was not found or is not approved.`, raw: line });
        continue;
      }

      // Validate Event Type
      const matchedEvent = sharafEvents.find(e => e.name.toLowerCase() === eventName.toLowerCase());
      if (!matchedEvent) {
        errorRows.push({ row: rowNum, reason: `Event type "${eventName}" is unrecognized.`, raw: line });
        continue;
      }

      if (matchedEvent.name.toLowerCase() === 'waaz') {
        const zone = parts[2] || 'Masjid Sehan';
        const mohalla = parts[3] || undefined;
        validRows.push({
          itsNumber: its,
          eventType: 'Waaz',
          waazZone: zone,
          mohalla: zone.toLowerCase().includes('relay') ? mohalla : undefined
        });
      } else {
        const location = parts[4] || parts[2] || 'Main Venue';
        const fTime = parts[5] || parts[3] || '09:00 AM';
        const tTime = parts[6] || parts[4] || '12:00 PM';
        validRows.push({
          itsNumber: its,
          eventType: matchedEvent.name,
          location,
          fromTime: fTime,
          toTime: tTime
        });
      }
    }

    setCsvPreview({ valid: validRows, errors: errorRows });
  };

  // Backward Compatible Helper: Extracts Touch Points array from Assignment
  const getAssignmentTouchPoints = (as: Assignment): string[] => {
    if (Array.isArray(as.topics) && as.topics.length > 0) return as.topics;
    if (Array.isArray(as.topic)) return as.topic;
    if (typeof as.topic === 'string' && as.topic.trim()) {
      return as.topic.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  // Stats Counters
  const pendingUsers = users.filter(u => u.status === 'pending');
  const approvedPVs = users.filter(u => u.status === 'approved' && !hasRole(u, 'admin'));
  const totalUploadsGb = submissions.length * 15.4; // simulated GBs

  // Filter members matching selected mohalla
  const mohallaPVs = approvedPVs.filter(u => 
    u.mohalla === selectedMohalla || 
    (u.mohalla && selectedMohalla && u.mohalla.toLowerCase().includes(selectedMohalla.toLowerCase())) ||
    (u.mohalla && selectedMohalla && selectedMohalla.toLowerCase().includes(u.mohalla.toLowerCase()))
  );

  // Filter members matching search query for individual assignment
  const filteredAssignPVs = approvedPVs.filter(pv => {
    if (!pvSearchQuery.trim()) return true;
    const q = pvSearchQuery.toLowerCase().trim();
    return (
      pv.fullName.toLowerCase().includes(q) ||
      pv.itsNumber.includes(q) ||
      (pv.mohalla && pv.mohalla.toLowerCase().includes(q)) ||
      pv.role.toLowerCase().includes(q)
    );
  });

  // Filter members matching search query for overview hub table
  const filteredOverviewPVs = approvedPVs.filter(pv => {
    if (!overviewSearchQuery.trim()) return true;
    const q = overviewSearchQuery.toLowerCase().trim();
    return (
      pv.fullName.toLowerCase().includes(q) ||
      pv.itsNumber.includes(q) ||
      (pv.mohalla && pv.mohalla.toLowerCase().includes(q)) ||
      pv.role.toLowerCase().includes(q)
    );
  });

  // Helper to quick-assign a specific member directly from anywhere
  const handleQuickAssignUser = (itsNumber: string) => {
    if (!assignPVs.includes(itsNumber)) {
      setAssignPVs(prev => [...prev, itsNumber]);
    }
    setAssignMode('individual');
    setActiveTab('assignments');
  };

  // Auto-sync Mohalla member selection when selectedMohalla or approvedPVs changes
  useEffect(() => {
    const currentMohallaMembers = approvedPVs.filter(u => 
      u.mohalla === selectedMohalla || 
      (u.mohalla && selectedMohalla && u.mohalla.toLowerCase().includes(selectedMohalla.toLowerCase())) ||
      (u.mohalla && selectedMohalla && selectedMohalla.toLowerCase().includes(u.mohalla.toLowerCase()))
    ).map(u => u.itsNumber);
    setSelectedMohallaPVs(currentMohallaMembers);
  }, [selectedMohalla, users]);

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    let targetPVs: string[] = [];

    if (assignMode === 'individual') {
      targetPVs = assignPVs;
      if (targetPVs.length === 0) {
        alert(lang === 'en' ? 'Please select at least one Photographer.' : 'يرجى اختيار مصور واحد على الأقل.');
        return;
      }
    } else {
      targetPVs = selectedMohallaPVs;
      if (targetPVs.length === 0) {
        alert(
          lang === 'en'
            ? `Please select at least one member from "${selectedMohalla}".`
            : `يرجى اختيار عضو واحد على الأقل من محلة "${selectedMohalla}".`
        );
        return;
      }
    }

    if (assignTopics.length === 0) {
      alert(lang === 'en' ? 'Please select at least one Touch Point.' : 'يرجى اختيار نقطة تغطية واحدة على الأقل.');
      return;
    }

    onAddAssignment({
      date: assignDate,
      miqaatName: assignMiqaatName,
      zone: assignZone,
      topic: assignTopics.join(', '),
      topics: assignTopics,
      assignedUsers: targetPVs,
      notes: assignMode === 'mohalla' 
        ? `[Mohalla Dispatch: ${selectedMohalla}] ${assignNotes}`.trim()
        : assignNotes,
      status: 'active'
    });

    setAssignNotes('');
    if (assignMode === 'individual') {
      setAssignPVs([]);
    }
    setIsNewAssignmentModalOpen(false);
    alert(
      lang === 'en' 
        ? `Operational assignment dispatched to ${targetPVs.length} team member(s) successfully!` 
        : `تم إرسال التكليف إلى ${targetPVs.length} من الأعضاء بنجاح!`
    );
  };

  const handleAllocateSharafSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharafUserIts) {
      alert(lang === 'en' ? 'Please select a photographer.' : 'يرجى اختيار المصور.');
      return;
    }
    onAllocateSharaf(sharafUserIts, sharafZone, sharafSeat);
    setSharafUserIts('');
    alert(lang === 'en' ? 'Sharaf coordinate seating allocated!' : 'تم تخصيص إحداثيات الشرف بنجاح!');
  };

  // Generate dynamic batch coverage schedule template
  const handleBatchGenerate = () => {
    const dates = ['2026-07-22', '2026-07-23', '2026-07-24'];
    let count = 0;
    
    dates.forEach((d) => {
      // Pick a random zone and topic, assign a random approved PV
      const randomZone = zones[Math.floor(Math.random() * zones.length)]?.name;
      const randomTopic = topics[Math.floor(Math.random() * topics.length)]?.name;
      const randomPV = approvedPVs[Math.floor(Math.random() * approvedPVs.length)];

      if (randomZone && randomTopic && randomPV) {
        onAddAssignment({
          date: d,
          zone: randomZone,
          topic: randomTopic,
          assignedUsers: [randomPV.itsNumber],
          notes: 'Auto-generated via Al Musawareen Batch Matrix Scheduler.',
          status: 'active'
        });
        count++;
      }
    });

    alert(lang === 'en' ? `Generated ${count} coverage matrices successfully!` : `تم إنشاء ${count} من مصفوفات التغطية التلقائية بنجاح!`);
  };

  return (
    <div className={`min-h-screen bg-editorial-bg py-8 px-4 sm:px-6 lg:px-8 font-sans ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* TOP HEADER BANNER (3-PANEL EDITORIAL TRANSLUCENT CARDS WITH ROUNDED CORNERS) */}
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-4">
          
          {/* Panel 1 — Brand/Title Block */}
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
              <ShieldCheck className="w-7 h-7 text-[#BA8332]" />
            </div>
            <div>
              <h1 className="font-serif text-lg sm:text-xl font-bold text-[#5C130F]">
                {t.adminTitle}
              </h1>
              <p className="font-serif text-xs text-[#5C130F]/80 italic mt-0.5">
                {t.adminSubtitle}
              </p>
            </div>
          </div>

          {/* Panel 2 — Safar Mode Block */}
          <div
            className="w-full lg:w-[220px] shrink-0 p-4 sm:p-5 flex flex-col justify-between gap-3 transition-all rounded-[14px] overflow-hidden"
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
                {t.safarModeToggleLabel}
              </span>
              <button
                type="button"
                onClick={() => onToggleSafarMode && onToggleSafarMode(!isSafarModeEnabled)}
                className={`w-[40px] h-[22px] rounded-full p-0.5 transition-colors cursor-pointer focus:outline-none ${
                  isSafarModeEnabled ? 'bg-[#BA8332]' : 'bg-[#5C130F]/20'
                }`}
                title={isSafarModeEnabled ? 'Turn Safar Mode OFF' : 'Turn Safar Mode ON'}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm ${
                    isSafarModeEnabled ? 'translate-x-[18px]' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div>
              {isSafarModeEnabled ? (
                <span className="text-[9px] sm:text-[10px] font-mono font-bold px-2.5 py-1 bg-[#BA8332] text-white rounded-md uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {t.safarModeStatusOn}
                </span>
              ) : (
                <span className="text-[9px] sm:text-[10px] font-mono font-bold px-2.5 py-1 bg-[rgba(186,131,50,0.15)] text-[#5C130F] rounded-md uppercase tracking-wider inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5C130F]" />
                  Inactive — Moula's TUS
                </span>
              )}
            </div>
          </div>

          {/* Panel 3 — Admin Profile Block */}
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
              <span className="text-[9px] bg-[#BA8332] text-white font-mono font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider inline-block mt-1 text-center">
                {lang === 'en' ? 'Administrator' : 'الشيخ المدير'}
              </span>
            </div>

            {/* Admin Profile avatar: real uploaded photo when available, square shape with rounded corners (~10px), 1.5-2x size (w-16 h-16) */}
            <AvatarPlaceholder
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              sizeClassName="w-16 h-16"
              iconSizeClassName="w-7 h-7"
              className="border-2 border-[#BA8332]"
            />
          </div>

        </div>

        {/* METRICS SUMMARY ROWS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="editorial-card p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#5C130F] uppercase tracking-wider font-mono font-bold">{lang === 'en' ? 'Active Photographers' : 'المصورين النشطين'}</p>
              <p className="text-2xl font-mono font-bold text-[#5C130F] mt-1">{approvedPVs.length}</p>
            </div>
            <div className="p-3 bg-white/40 border border-[#BA8332]/30 text-[#BA8332]">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="editorial-card p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#5C130F] uppercase tracking-wider font-mono font-bold">{lang === 'en' ? 'Coverage Schedule' : 'التكليفات المجدولة'}</p>
              <p className="text-2xl font-mono font-bold text-[#5C130F] mt-1">{assignments.length}</p>
            </div>
            <div className="p-3 bg-white/40 border border-[#BA8332]/30 text-[#BA8332]">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="editorial-card p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#5C130F] uppercase tracking-wider font-mono font-bold">{lang === 'en' ? 'Submissions Received' : 'تقارير التسليمات'}</p>
              <p className="text-2xl font-mono font-bold text-[#5C130F] mt-1">{submissions.length}</p>
            </div>
            <div className="p-3 bg-white/40 border border-[#BA8332]/30 text-[#BA8332]">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="editorial-card p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#5C130F] uppercase tracking-wider font-mono font-bold">{lang === 'en' ? 'Archived Media Space' : 'الحجم الكلي للمواد'}</p>
              <p className="text-2xl font-mono font-bold text-[#5C130F] mt-1">{totalUploadsGb.toFixed(1)} GB</p>
            </div>
            <div className="p-3 bg-white/40 border border-[#BA8332]/30 text-[#BA8332]">
              <Server className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ADMIN NAV GRID CARDS OR SUB-TABS (DYNAMIC DENSITY) */}
        <div className={`grid grid-cols-2 ${isSafarModeEnabled ? 'md:grid-cols-6' : 'md:grid-cols-5'} gap-3`}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 rounded-md font-mono font-bold text-xs tracking-wider uppercase transition-all focus:outline-none focus:ring-2 focus:ring-[#5C130F] ${
              activeTab === 'overview'
                ? 'option-card-selected'
                : 'option-card-unselected'
            }`}
          >
            {lang === 'en' ? 'Hub' : 'الرئيسية'}
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`relative py-3 px-4 rounded-md font-mono font-bold text-xs tracking-wider uppercase transition-all focus:outline-none focus:ring-2 focus:ring-[#5C130F] ${
              activeTab === 'approvals'
                ? 'option-card-selected'
                : 'option-card-unselected'
            }`}
          >
            <span>{lang === 'en' ? 'Approvals' : 'الموافقات'}</span>
            {pendingUsers.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#5C130F] !text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-[#BA8332]">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`py-3 px-4 rounded-md font-mono font-bold text-xs tracking-wider uppercase transition-all focus:outline-none focus:ring-2 focus:ring-[#5C130F] ${
              activeTab === 'assignments'
                ? 'option-card-selected'
                : 'option-card-unselected'
            }`}
          >
            {t.assignmentTitle}
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`py-3 px-4 rounded-md font-mono font-bold text-xs tracking-wider uppercase transition-all focus:outline-none focus:ring-2 focus:ring-[#5C130F] ${
              activeTab === 'submissions'
                ? 'option-card-selected'
                : 'option-card-unselected'
            }`}
          >
            {t.submissionTitle}
          </button>

          {isSafarModeEnabled && (
            <button
              onClick={() => setActiveTab('sharaf')}
              className={`py-3 px-4 rounded-md font-mono font-bold text-xs tracking-wider uppercase transition-all focus:outline-none focus:ring-2 focus:ring-[#5C130F] ${
                activeTab === 'sharaf'
                  ? 'option-card-selected'
                  : 'option-card-unselected'
              }`}
            >
              {lang === 'en' ? 'Sharaf Allocate' : 'تخصيص الشرف'}
            </button>
          )}

          <button
            onClick={() => setActiveTab('monitoring')}
            className={`py-3 px-4 rounded-md font-mono font-bold text-xs tracking-wider uppercase transition-all focus:outline-none focus:ring-2 focus:ring-[#5C130F] ${
              activeTab === 'monitoring'
                ? 'option-card-selected'
                : 'option-card-unselected'
            }`}
          >
            {t.monitoringTitle}
          </button>
        </div>

        {/* ----------------- SUB-TABS VIEWS ----------------- */}

        {/* VIEW 1: OVERVIEW & ACTIVE TEAM (FULL-WIDTH HUB PAGE) */}
        {activeTab === 'overview' && (
          <DispatchedLensesRosterTable
            users={users}
            lang={lang}
            isSafarModeEnabled={isSafarModeEnabled}
            onQuickAssignUser={handleQuickAssignUser}
            onEditRolesPermissions={(pv) => {
              setEditingPermissionsUser(pv);
              setEditingUserRoles(getUserRoles(pv));
              setEditingHRPermissions(pv.hrPermissions || DEFAULT_HR_PERMISSIONS);
            }}
            canEditRoster={true}
          />
        )}

        {/* VIEW 2: PENDING APPROVALS */}
        {activeTab === 'approvals' && (
          <OnboardingApprovalsView
            users={users}
            lang={lang}
            onApproveUser={onApproveUser}
            onRejectUser={onRejectUser}
          />
        )}

        {/* VIEW 3: DISPATCH COVERAGE ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <CoverageAssignmentsView
            assignments={assignments}
            users={users}
            zones={zones}
            topics={topics}
            miqaats={miqaats}
            lang={lang}
            canAssignCoverage={true}
            onAddAssignment={onAddAssignment}
            onUpdateAssignment={onUpdateAssignment}
            onReassignSlot={onReassignSlot}
            onAddMiqaat={onAddMiqaat}
            onAddZone={onAddZone}
            onBulkAddZones={onBulkAddZones}
            onAddTopic={onAddTopic}
            onBulkAddTopics={onBulkAddTopics}
          />
        )}

        {/* VIEW 4: SUBMISSIONS & REVIEW GRADING */}
        {activeTab === 'submissions' && (
          <ShotReportSubmissionsView
            submissions={submissions}
            assignments={assignments}
            users={users}
            lang={lang}
            canStarOverride={true}
            onSaveRatingOverride={onSaveRatingOverride}
          />
        )}

        {/* VIEW 5: SHARAF SEATING & EVENT ALLOCATION SYSTEM */}
        {activeTab === 'sharaf' && isSafarModeEnabled && (
          <div className="space-y-8 font-sans">
            
            {/* Header Ribbon & Toolbar */}
            <div className="editorial-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5C130F] flex items-center gap-2 uppercase tracking-wider">
                  <Award className="w-7 h-7 text-[#BA8332]" />
                  <span>{t.sharafEventsTitle}</span>
                </h2>
                <p className="text-xs text-[#3A1A14]/80 font-serif mt-1">
                  {lang === 'en'
                    ? "Moula's Tus Safar Mode — Allocate event-based Sharaf clearances across Waaz, Qadambosi, Nikah, Misaq, Ziyafat, and custom miqaats."
                    : 'نمط سفر المولى (ط.ع) — توزيع تصاريح الشرف الميدانية لمجالس الوعظ، القدمبوسي، النكاح، الميثاق، والضيافة.'}
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(true)}
                  className="px-3.5 py-2 bg-[#BA8332] hover:bg-[#a06e28] text-white font-mono text-xs font-bold rounded-none flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{t.bulkAssignCsvBtn}</span>
                </button>
              </div>
            </div>

            {/* Main Form & Allocations Log Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Sharaf Event Allocation Form */}
              <div className="editorial-card p-6 sm:p-8 space-y-6">
                <h3 className="font-serif text-xl font-bold text-[#5C130F] border-b border-[#5C130F]/20 pb-2 uppercase tracking-wider">
                  {t.allocateSharafBtn}
                </h3>

                <form onSubmit={handleSingleSharafSubmit} className="space-y-4 text-xs font-sans">
                  {/* Select Photographer/Videographer with Live Search */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">
                        {lang === 'en' ? 'Select Member' : 'اختر المصور المعتمد'}
                      </label>
                      {sharafMemberIts && (
                        <span className="text-[10px] font-mono font-bold text-[#BA8332] bg-[#BA8332]/10 px-2 py-0.5 border border-[#BA8332]/30">
                          ITS: {sharafMemberIts}
                        </span>
                      )}
                    </div>

                    {/* Member Search Bar */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#BA8332] absolute left-2.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-2.5" />
                      <input
                        type="text"
                        value={sharafMemberSearchQuery}
                        onChange={(e) => setSharafMemberSearchQuery(e.target.value)}
                        placeholder={t.searchPeoplePlaceholder}
                        className="w-full pl-8 pr-7 rtl:pl-7 rtl:pr-8 py-1.5 border border-[#5C130F]/35 bg-[#FDFAF3] text-xs font-serif text-[#3A1A14] focus:outline-none focus:border-[#5C130F]"
                      />
                      {sharafMemberSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setSharafMemberSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rtl:right-auto rtl:left-2 text-xs text-[#5C130F] font-bold hover:scale-110 transition-transform"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Filtered Member Select Dropdown */}
                    <select
                      value={sharafMemberIts}
                      onChange={(e) => setSharafMemberIts(e.target.value)}
                      className="w-full px-3 py-2 border border-[#5C130F]/35 rounded-none bg-[#FDFAF3] text-[#3A1A14] focus:outline-none focus:border-[#5C130F] font-serif text-xs"
                    >
                      <option value="">-- {lang === 'en' ? 'Choose Member' : 'اختر العضو'} --</option>
                      {approvedPVs
                        .filter(pv => {
                          if (!sharafMemberSearchQuery.trim()) return true;
                          const q = sharafMemberSearchQuery.toLowerCase().trim();
                          return pv.fullName.toLowerCase().includes(q) || pv.itsNumber.includes(q);
                        })
                        .map(pv => (
                          <option key={pv.itsNumber} value={pv.itsNumber}>
                            {pv.fullName} (ITS: {pv.itsNumber})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Sharaf Event Type Radio Selector with Inline "+ Add new event" */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">{t.eventTypeLabel}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {sharafEvents.map(ev => {
                        const isSelected = !isAddingInlineEvent && sharafEventType.toLowerCase() === ev.name.toLowerCase();
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => {
                              setIsAddingInlineEvent(false);
                              setSharafEventType(ev.name);
                            }}
                            className={`py-2 px-2.5 text-center font-mono text-xs font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#5C130F] !text-white border-[#5C130F]'
                                : 'bg-white/40 text-[#5C130F] border-[#5C130F]/25 hover:bg-[#5C130F]/10'
                            }`}
                          >
                            {ev.name}
                          </button>
                        );
                      })}

                      {/* "+ Add new event" Inline Toggle Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingInlineEvent(true);
                          setSharafEventType('+ Add new event');
                        }}
                        className={`py-2 px-2.5 text-center font-mono text-xs font-bold border transition-all cursor-pointer ${
                          isAddingInlineEvent || sharafEventType === '+ Add new event'
                            ? 'bg-[#BA8332] !text-white border-[#BA8332]'
                            : 'bg-white/40 text-[#BA8332] border-[#BA8332]/50 hover:bg-[#BA8332]/10'
                        }`}
                      >
                        + Add new event
                      </button>
                    </div>

                    {/* Inline Text Input revealed when "+ Add new event" is selected */}
                    {(isAddingInlineEvent || sharafEventType === '+ Add new event') && (
                      <div className="space-y-2 p-3 bg-white/60 border border-[#BA8332]/40 rounded-none animate-fadeIn mt-2 font-sans">
                        <label className="text-[11px] font-mono font-bold uppercase text-[#5C130F] block">
                          {lang === 'en' ? 'New Event Name' : 'اسم المناسبة الجديدة'}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={inlineCustomEventName}
                            onChange={(e) => setInlineCustomEventName(e.target.value)}
                            placeholder="e.g. Majlis, Bethak, Darees..."
                            className="flex-1 px-3 py-1.5 border border-[#5C130F]/35 bg-[#FDFAF3] text-xs font-serif text-[#3A1A14] focus:outline-none focus:border-[#5C130F]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const trimmed = inlineCustomEventName.trim();
                              if (!trimmed) {
                                alert(lang === 'en' ? 'Please enter an event name.' : 'يرجى إدخال اسم المناسبة.');
                                return;
                              }
                              if (onCreateCustomEvent) {
                                onCreateCustomEvent(trimmed);
                              }
                              setSharafEventType(trimmed);
                              setIsAddingInlineEvent(false);
                              setInlineCustomEventName('');
                            }}
                            className="px-3 py-1.5 bg-[#BA8332] hover:bg-[#a06e28] !text-white font-mono text-xs font-bold uppercase rounded-none shrink-0 cursor-pointer shadow-sm"
                          >
                            Save & Select
                          </button>
                        </div>
                        <p className="text-[10px] text-[#3A1A14]/70 italic font-serif">
                          {lang === 'en'
                            ? 'Saved globally and automatically synced with Manage Events panel.'
                            : 'تتم إضافتها عالمياً ومزامنتها تلقائياً مع لوحة إدارة المناسبات.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Conditional Form Fields Based on Event Type */}
                  {sharafEventType.toLowerCase() === 'waaz' ? (
                    /* WAAZ SPECIFIC LOGIC */
                    <div className="space-y-3 p-3 bg-white/40 border border-[#5C130F]/20 rounded-none">
                      <span className="text-[10px] font-mono font-bold text-[#5C130F] uppercase tracking-wider block border-b border-[#5C130F]/15 pb-1">
                        Waaz Special Proximity Zone Parameters
                      </span>

                      {/* Zone Select */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">{t.waazZoneLabel}</label>
                        <select
                          value={waazZone}
                          onChange={(e) => setWaazZone(e.target.value)}
                          className="w-full px-3 py-2 border border-[#5C130F]/35 rounded-none bg-[#FDFAF3] text-[#3A1A14] focus:outline-none focus:border-[#5C130F] font-serif"
                        >
                          <option value="Masjid Sehan">Masjid Sehan</option>
                          <option value="Bairoon Masjid">Bairoon Masjid</option>
                          <option value="Mawaid">Mawaid</option>
                          <option value="Relay Center">Relay Center</option>
                          <option value="+ Add custom zone">+ Add custom zone</option>
                        </select>
                      </div>

                      {/* Conditional Mohalla Field if Relay Center */}
                      {waazZone === 'Relay Center' && (
                        <div className="flex flex-col gap-1.5 animate-fadeIn">
                          <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">{t.whichMohallaLabel}</label>
                          <select
                            value={waazMohalla}
                            onChange={(e) => setWaazMohalla(e.target.value)}
                            className="w-full px-3 py-2 border border-[#5C130F]/35 rounded-none bg-[#FDFAF3] text-[#3A1A14] focus:outline-none focus:border-[#5C130F] font-serif"
                          >
                            {MOHALLA_OPTIONS.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Conditional Custom Zone Text Field */}
                      {waazZone === '+ Add custom zone' && (
                        <div className="flex flex-col gap-1.5 animate-fadeIn">
                          <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">{t.customZoneLabel}</label>
                          <input
                            type="text"
                            value={customWaazZone}
                            onChange={(e) => setCustomWaazZone(e.target.value)}
                            placeholder="e.g. Dalan North Balcony"
                            className="w-full px-3 py-2 border border-[#5C130F]/35 rounded-none bg-[#FDFAF3] font-serif text-[#3A1A14] focus:outline-none focus:border-[#5C130F]"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    /* NON-WAAZ LOGIC (Qadambosi, Nikah, Misaq, Ziyafat, Custom) */
                    <div className="space-y-3 p-3 bg-white/40 border border-[#5C130F]/20 rounded-none">
                      <span className="text-[10px] font-mono font-bold text-[#5C130F] uppercase tracking-wider block border-b border-[#5C130F]/15 pb-1">
                        {sharafEventType} Location & Time Parameters
                      </span>

                      {/* Location Input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">{t.locationLabel}</label>
                        <input
                          type="text"
                          value={nonWaazLocation}
                          onChange={(e) => setNonWaazLocation(e.target.value)}
                          placeholder="e.g., Hazrat Aliyah Stage / VIP Hall"
                          className="w-full px-3 py-2 border border-[#5C130F]/35 rounded-none bg-[#FDFAF3] text-[#3A1A14] focus:outline-none focus:border-[#5C130F] font-serif"
                        />
                      </div>

                      {/* Time Range Inputs */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">{t.fromTimeLabel}</label>
                          <input
                            type="text"
                            value={fromTime}
                            onChange={(e) => setFromTime(e.target.value)}
                            placeholder="09:00 AM"
                            className="w-full px-2.5 py-1.5 border border-[#5C130F]/35 rounded-none bg-[#FDFAF3] text-[#3A1A14] font-mono text-xs focus:outline-none focus:border-[#5C130F]"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">{t.toTimeLabel}</label>
                          <input
                            type="text"
                            value={toTime}
                            onChange={(e) => setToTime(e.target.value)}
                            placeholder="12:00 PM"
                            className="w-full px-2.5 py-1.5 border border-[#5C130F]/35 rounded-none bg-[#FDFAF3] text-[#3A1A14] font-mono text-xs focus:outline-none focus:border-[#5C130F]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#BA8332] hover:bg-[#a06e28] !text-white font-mono font-bold rounded-none text-xs uppercase tracking-widest shadow-sm transition-colors cursor-pointer"
                  >
                    {t.allocateSharafBtn}
                  </button>
                </form>
              </div>

              {/* Right Column: Active Sharaf Allocations Log */}
              <div className="lg:col-span-2 editorial-card-dense p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#5C130F]/20 pb-3">
                  <h3 className="font-serif text-2xl font-bold text-[#5C130F] uppercase tracking-wider">
                    {lang === 'en' ? 'Active Sharaf Allocations Log' : 'سجل تخصيصات الشرف الممنوحة'}
                  </h3>

                  {/* Search input for allocations */}
                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 text-[#BA8332] absolute left-2.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-2.5" />
                    <input
                      type="text"
                      value={sharafSearchQuery}
                      onChange={(e) => setSharafSearchQuery(e.target.value)}
                      placeholder={t.searchPeoplePlaceholder}
                      className="w-full pl-8 pr-6 rtl:pl-6 rtl:pr-8 py-1.5 border border-[#5C130F]/30 bg-[#FDFAF3] text-xs font-serif text-[#3A1A14] focus:outline-none focus:border-[#5C130F]"
                    />
                    {sharafSearchQuery && (
                      <button
                        onClick={() => setSharafSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rtl:right-auto rtl:left-2 text-xs text-[#5C130F] font-bold"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Sharaf Allocations Cards */}
                <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-1">
                  {sharafAllocations.length === 0 ? (
                    <div className="py-12 text-center text-[#3A1A14]/60 space-y-2">
                      <Award className="w-10 h-10 text-[#BA8332] mx-auto opacity-50" />
                      <p className="text-sm font-serif font-bold">
                        {lang === 'en' ? 'No Sharaf allocations dispatched yet.' : 'لم يتم تسجيل أي تخصيصات شرف بعد.'}
                      </p>
                    </div>
                  ) : (
                    sharafAllocations
                      .filter(alloc => {
                        if (!sharafSearchQuery.trim()) return true;
                        const q = sharafSearchQuery.toLowerCase().trim();
                        const user = approvedPVs.find(u => u.itsNumber === alloc.itsNumber);
                        return (
                          alloc.itsNumber.includes(q) ||
                          alloc.eventType.toLowerCase().includes(q) ||
                          (user && user.fullName.toLowerCase().includes(q)) ||
                          (alloc.waazZone && alloc.waazZone.toLowerCase().includes(q)) ||
                          (alloc.location && alloc.location.toLowerCase().includes(q))
                        );
                      })
                      .map(alloc => {
                        const user = approvedPVs.find(u => u.itsNumber === alloc.itsNumber);
                        return (
                          <div
                            key={alloc.id}
                            className="p-4 border border-[#5C130F]/20 rounded-none bg-white/40 hover:bg-[#BA8332]/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <AvatarPlaceholder src={user?.avatarUrl} alt={user?.fullName} sizeClassName="w-10 h-10" iconSizeClassName="w-5 h-5" />
                              <div>
                                <h4 className="font-serif font-bold text-[#5C130F] text-sm leading-tight">
                                  {user ? user.fullName : `ITS: ${alloc.itsNumber}`}
                                </h4>
                                <p className="text-[10px] text-[#3A1A14]/70 font-mono">ITS: {alloc.itsNumber}</p>
                              </div>
                            </div>

                            {/* Details & Event Badge */}
                            <div className="flex flex-col sm:items-end gap-1">
                              <span className="inline-flex items-center gap-1 bg-[#5C130F] !text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-none uppercase">
                                <Award className="w-3 h-3 text-[#BA8332]" />
                                <span className="!text-white">{alloc.eventType}</span>
                              </span>

                              {alloc.eventType.toLowerCase() === 'waaz' ? (
                                <p className="text-xs text-[#3A1A14] font-serif font-bold">
                                  Zone: <strong className="text-[#5C130F]">{alloc.waazZone}</strong>
                                  {alloc.mohalla && <span className="text-[10px] font-mono text-[#3A1A14]/75 block sm:inline sm:ml-1">({alloc.mohalla})</span>}
                                </p>
                              ) : (
                                <div className="text-right text-xs">
                                  <p className="font-serif font-bold text-[#3A1A14]">
                                    Location: <strong className="text-[#5C130F]">{alloc.location}</strong>
                                  </p>
                                  {(alloc.fromTime || alloc.toTime) && (
                                    <p className="text-[10px] font-mono text-[#3A1A14]/70 flex items-center gap-1 justify-end mt-0.5">
                                      <Clock className="w-3 h-3 text-[#BA8332]" />
                                      <span>{alloc.fromTime} – {alloc.toTime}</span>
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Remove action button */}
                            {onRemoveSharafAllocation && (
                              <button
                                type="button"
                                onClick={() => onRemoveSharafAllocation(alloc.id)}
                                className="p-1.5 text-[#5C130F]/60 hover:text-[#5C130F] hover:bg-[#5C130F]/10 rounded-none transition-colors self-end sm:self-center"
                                title="Revoke Allocation"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

            </div>

            {/* MODAL 1: MANAGE SHARAF EVENTS */}
            {isManageEventsOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#FDFAF3] border-2 border-[#5C130F] w-full max-w-md p-6 space-y-5 shadow-2xl relative">
                  <div className="flex justify-between items-center border-b border-[#5C130F]/20 pb-3">
                    <h3 className="font-serif text-xl font-bold text-[#5C130F] flex items-center gap-2 uppercase">
                      <Settings className="w-5 h-5 text-[#BA8332]" />
                      <span>{t.manageEventsBtn}</span>
                    </h3>
                    <button
                      onClick={() => setIsManageEventsOpen(false)}
                      className="text-[#5C130F] hover:font-bold font-mono text-base"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Add New Custom Event Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newCustomEventName.trim() && onCreateCustomEvent) {
                        onCreateCustomEvent(newCustomEventName.trim());
                        setNewCustomEventName('');
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={newCustomEventName}
                      onChange={(e) => setNewCustomEventName(e.target.value)}
                      placeholder="New Sharaf Event Name (e.g. Majlis)..."
                      className="flex-1 px-3 py-2 border border-[#5C130F]/35 bg-white text-xs font-serif focus:outline-none focus:border-[#5C130F]"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-[#5C130F] !text-white font-mono text-xs font-bold rounded-none uppercase shrink-0"
                    >
                      + Add
                    </button>
                  </form>

                  {/* Active Event Types List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5C130F] block">Active Sharaf Event Types:</span>
                    {sharafEvents.map(ev => (
                      <div key={ev.id} className="flex justify-between items-center p-2.5 bg-white border border-[#5C130F]/15">
                        <span className="font-serif font-bold text-xs text-[#5C130F]">{ev.name}</span>
                        {ev.isDefault ? (
                          <span className="text-[9px] font-mono font-bold bg-[#BA8332]/20 text-[#5C130F] px-2 py-0.5 border border-[#BA8332]/40 uppercase">
                            Default Protected
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onDeleteCustomEvent && onDeleteCustomEvent(ev.id)}
                            className="text-xs text-red-700 hover:underline font-mono font-bold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 text-right">
                    <button
                      onClick={() => setIsManageEventsOpen(false)}
                      className="px-4 py-1.5 bg-[#5C130F] !text-white font-mono text-xs font-bold rounded-none uppercase"
                    >
                      Close Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL 2: BULK ASSIGN VIA CSV */}
            {isCsvModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#FDFAF3] border-2 border-[#5C130F] w-full max-w-2xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-[#5C130F]/20 pb-3">
                    <h3 className="font-serif text-xl font-bold text-[#5C130F] flex items-center gap-2 uppercase">
                      <Upload className="w-5 h-5 text-[#BA8332]" />
                      <span>{t.csvUploadTitle}</span>
                    </h3>
                    <button
                      onClick={() => {
                        handleResetCsvUpload();
                        setIsCsvModalOpen(false);
                      }}
                      className="text-[#5C130F] hover:font-bold font-mono text-base cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* CSV Header Guide */}
                  <div className="p-3 bg-white/70 border border-[#5C130F]/20 text-[11px] font-mono space-y-1">
                    <span className="font-bold text-[#5C130F] block uppercase">Suggested CSV Format Header:</span>
                    <code className="text-[10px] text-[#3A1A14] block bg-[#FDFAF3] p-1.5 border border-[#5C130F]/15">
                      ITS_ID, Event_Type, Zone, Mohalla, Location, From_Time, To_Time
                    </code>
                    <p className="text-[10px] text-[#3A1A14]/70 italic pt-1">
                      Example: 50412345, Waaz, Masjid Sehan,,, or 30498765, Nikah,,, Hazrat Aliyah Stage, 10:00 AM, 12:00 PM
                    </p>
                  </div>

                  {/* Native Hidden File Input */}
                  <input
                    type="file"
                    ref={csvFileInputRef}
                    accept=".csv"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleProcessCsvFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {/* File Drag & Drop Zone or Selected File Confirmation */}
                  {!csvFile ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingCsv(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingCsv(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingCsv(false);
                        const droppedFile = e.dataTransfer.files?.[0];
                        if (droppedFile) {
                          handleProcessCsvFile(droppedFile);
                        }
                      }}
                      onClick={() => csvFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-none p-8 text-center space-y-3 cursor-pointer transition-all ${
                        isDraggingCsv
                          ? 'border-[#BA8332] bg-[#BA8332]/10 scale-[1.01]'
                          : 'border-[#5C130F]/35 bg-white/40 hover:bg-[#5C130F]/5'
                      }`}
                    >
                      <Upload className="w-10 h-10 text-[#BA8332] mx-auto animate-bounce" />
                      <div>
                        <p className="font-serif font-bold text-[#5C130F] text-sm uppercase tracking-wider">
                          {lang === 'en' ? 'Drag & Drop your .csv file here' : 'سحب وإسقاط ملف .csv هنا'}
                        </p>
                        <p className="text-xs text-[#3A1A14]/70 font-mono mt-1">
                          {lang === 'en' ? 'or click to browse from your computer' : 'أو انقر للتصفح من جهازك'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          csvFileInputRef.current?.click();
                        }}
                        className="px-4 py-2 bg-[#5C130F] !text-white font-mono text-xs font-bold rounded-none uppercase tracking-wider shadow-sm cursor-pointer hover:bg-[#3A1A14]"
                      >
                        Browse / Select File
                      </button>
                    </div>
                  ) : (
                    /* Selected File Details Confirmation Card */
                    <div className="p-4 bg-white border border-[#5C130F]/30 rounded-none flex items-center justify-between gap-4 font-mono text-xs">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
                        <div>
                          <p className="font-bold text-[#5C130F] truncate max-w-md">{csvFileName}</p>
                          <p className="text-[11px] text-[#3A1A14]/70">
                            {csvRowCount !== null ? `${csvRowCount} rows detected` : 'File loaded'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleResetCsvUpload}
                        className="px-3 py-1.5 border border-[#5C130F]/30 text-[#5C130F] font-bold text-[11px] hover:bg-[#5C130F]/10 rounded-none uppercase"
                      >
                        Choose Different File
                      </button>
                    </div>
                  )}

                  {/* Clear Error Message if Invalid File Type */}
                  {csvFileError && (
                    <div className="p-3.5 bg-red-50 border border-red-300 text-red-800 text-xs font-mono flex items-center gap-2 rounded-none">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{csvFileError}</span>
                    </div>
                  )}

                  {/* Validation Preview Section */}
                  {csvPreview && (
                    <div className="space-y-3 font-sans border-t border-[#5C130F]/15 pt-3">
                      <div className="flex items-center gap-4 text-xs font-mono font-bold">
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          {csvPreview.valid.length} Valid Row(s)
                        </span>
                        {csvPreview.errors.length > 0 && (
                          <span className="text-red-700 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            {csvPreview.errors.length} Error Row(s)
                          </span>
                        )}
                      </div>

                      {/* Error details list if any */}
                      {csvPreview.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 p-3 max-h-36 overflow-y-auto space-y-1.5 text-[11px] font-mono">
                          <span className="font-bold text-red-800 uppercase block">Validation Errors:</span>
                          {csvPreview.errors.map((err, i) => (
                            <div key={i} className="text-red-700">
                              <strong>Row {err.row}:</strong> {err.reason}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 border-t border-[#5C130F]/20 pt-3">
                    <button
                      onClick={() => {
                        handleResetCsvUpload();
                        setIsCsvModalOpen(false);
                      }}
                      className="px-4 py-2 border border-[#5C130F]/30 text-[#5C130F] font-mono text-xs font-bold rounded-none uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                    {csvPreview && csvPreview.valid.length > 0 && (
                      <button
                        onClick={() => {
                          if (onBulkAssignSharaf) {
                            onBulkAssignSharaf(csvPreview.valid);
                            alert(lang === 'en' ? `Successfully bulk assigned ${csvPreview.valid.length} Sharaf records!` : `تم تخصيص ${csvPreview.valid.length} من سجلات الشرف بنجاح!`);
                            handleResetCsvUpload();
                            setIsCsvModalOpen(false);
                          }
                        }}
                        className="px-5 py-2 bg-[#BA8332] hover:bg-[#a06e28] text-white font-mono text-xs font-bold rounded-none uppercase shadow-sm cursor-pointer"
                      >
                        {t.confirmBulkAssign} ({csvPreview.valid.length})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* VIEW 6: COVERAGE REAL-TIME MONITORING */}
        {activeTab === 'monitoring' && (
          <div className="editorial-card-dense p-6 sm:p-8 space-y-6">
            <h2 className="font-serif text-2xl font-bold text-[#5C130F] border-b border-[#5C130F]/20 pb-3 uppercase tracking-wider">
              {t.monitoringBanner}
            </h2>

            {/* Quick dashboard metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Metric 1 */}
              <div className="p-5 bg-white/40 border border-[#5C130F]/20 rounded-none text-center space-y-1">
                <p className="text-[10px] text-[#5C130F] font-mono font-bold uppercase tracking-wider">{t.monActiveCams}</p>
                <p className="text-4xl font-mono font-bold text-[#5C130F]">12 / {approvedPVs.length}</p>
                <p className="text-[10px] text-[#3A1A14]/80 font-serif">{lang === 'en' ? 'Dispatched to primary locations' : 'موزعون على المواقع الرئيسية'}</p>
              </div>

              {/* Metric 2 */}
              <div className="p-5 bg-white/40 border border-[#5C130F]/20 rounded-none text-center space-y-1">
                <p className="text-[10px] text-[#5C130F] font-mono font-bold uppercase tracking-wider">{t.monCoverageRate}</p>
                <p className="text-4xl font-mono font-bold text-[#5C130F]">84%</p>
                <p className="text-[10px] text-[#3A1A14]/80 font-serif">{lang === 'en' ? 'All dynamic zones completed daily' : 'جميع المناطق الحيوية مغطاة يومياً'}</p>
              </div>

              {/* Metric 3 */}
              <div className="p-5 bg-white/40 border border-[#5C130F]/20 rounded-none text-center space-y-1">
                <p className="text-[10px] text-[#5C130F] font-mono font-bold uppercase tracking-wider">{t.monReportedShots}</p>
                <p className="text-4xl font-mono font-bold text-[#5C130F]">138.4 GB</p>
                <p className="text-[10px] text-[#3A1A14]/80 font-serif">{lang === 'en' ? 'Ingested content in cloud pool' : 'المساحة الكلية للمواد المستلمة'}</p>
              </div>
            </div>

            {/* Monitoring graphical simulator representing zones */}
            <div className="space-y-4 pt-4">
              <h3 className="font-serif text-xl font-bold text-[#5C130F] uppercase tracking-wider">{lang === 'en' ? 'Active Coverage Status across Miqaat Zones' : 'حالة التغطية النشطة عبر مناطق الميقات'}</h3>

              <div className="space-y-3.5">
                {zones.map((z, idx) => {
                  // Simulate progress percentage based on index
                  const percentages = [90, 80, 50, 100, 70, 95, 30];
                  const progress = percentages[idx % percentages.length];
                  
                  return (
                    <div key={z.id} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-serif font-bold text-[#5C130F]">{z.name}</span>
                        <span className="font-mono text-[#5C130F] font-bold">{progress}% Covered</span>
                      </div>
                      <div className="h-3 w-full bg-white/40 rounded-none border border-[#5C130F]/20 overflow-hidden flex">
                        <div 
                          className="h-full bg-[#5C130F] transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        />
                        <div 
                          className="h-full bg-[#BA8332] opacity-40"
                          style={{ width: `${Math.max(0, 100 - progress)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: SCHEDULE NEW ZONE COVERAGE (WIDE HORIZONTAL DESKTOP MODAL) */}
        {isNewAssignmentModalOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsNewAssignmentModalOpen(false);
              }
            }}
          >
            <div className="bg-[#FDFAF3] border-2 border-[#5C130F] w-full max-w-4xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              {/* Header Ribbon */}
              <div className="flex justify-between items-center border-b border-[#5C130F]/20 pb-3">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#5C130F] flex items-center gap-2 uppercase tracking-wider">
                  <Calendar className="w-6 h-6 text-[#BA8332]" />
                  <span>{t.newAssignment}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsNewAssignmentModalOpen(false)}
                  className="text-[#5C130F] hover:font-bold font-mono text-base cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateAssignment} className="space-y-6 text-xs font-sans">
                
                {/* ROW 1: Miqaat Name | Miqaat Date (2 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white/40 border border-[#5C130F]/18 rounded-none">
                  {/* Miqaat Name */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">
                        {t.miqaatName}
                      </label>
                      {!isAddingInlineMiqaat && (
                        <button
                          type="button"
                          onClick={() => setIsAddingInlineMiqaat(true)}
                          className="text-[10px] font-mono font-bold text-[#BA8332] hover:underline cursor-pointer"
                        >
                          + Add new
                        </button>
                      )}
                    </div>

                    {isAddingInlineMiqaat ? (
                      <div className="flex items-center gap-1.5 animate-fadeIn">
                        <input
                          type="text"
                          value={inlineMiqaatName}
                          onChange={(e) => setInlineMiqaatName(e.target.value)}
                          placeholder="New Miqaat Name..."
                          className="flex-1 px-2.5 py-1.5 border border-[#5C130F]/35 bg-[#FDFAF3] text-xs font-serif text-[#3A1A14] focus:outline-none focus:border-[#5C130F]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = inlineMiqaatName.trim();
                            if (trimmed) {
                              if (onAddMiqaat) onAddMiqaat(trimmed);
                              setAssignMiqaatName(trimmed);
                            }
                            setInlineMiqaatName('');
                            setIsAddingInlineMiqaat(false);
                          }}
                          className="px-3 py-1.5 bg-[#BA8332] hover:bg-[#a06e28] text-white font-mono text-xs font-bold uppercase shrink-0 cursor-pointer shadow-sm"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <select
                        value={assignMiqaatName}
                        onChange={(e) => setAssignMiqaatName(e.target.value)}
                        className="w-full px-3 py-2 border border-[#5C130F]/35 rounded-none bg-[#FDFAF3] font-serif text-xs text-[#3A1A14] focus:outline-none focus:border-[#5C130F]"
                      >
                        {miqaats.map(m => (
                          <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Miqaat Date */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">{t.date}</label>
                    <input
                      type="date"
                      value={assignDate}
                      onChange={(e) => setAssignDate(e.target.value)}
                      className="w-full px-3 py-2 border border-[#5C130F]/35 rounded-none bg-[#FDFAF3] font-mono text-xs text-[#3A1A14] focus:outline-none focus:border-[#5C130F]"
                    />
                  </div>
                </div>

                {/* ROW 2: Coverage Zone | Touch Point (2 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white/40 border border-[#5C130F]/18 rounded-none">
                  {/* Coverage Zone Field */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between border-b border-[#5C130F]/15 pb-1.5">
                      <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">
                        {t.zone}
                      </label>
                      <div className="flex items-center gap-2 text-[10px] font-mono font-bold">
                        <button
                          type="button"
                          onClick={() => setIsAddingInlineZone(!isAddingInlineZone)}
                          className="text-[#BA8332] hover:underline cursor-pointer"
                        >
                          + Inline Add
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setIsBulkAddZonesOpen(true)}
                          className="text-[#5C130F] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <Layers className="w-3 h-3 text-[#BA8332]" />
                          <span>Bulk Add</span>
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#BA8332] absolute left-2.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-2.5" />
                      <input
                        type="text"
                        value={zoneSearchQuery}
                        onChange={(e) => setZoneSearchQuery(e.target.value)}
                        placeholder="Search zones..."
                        className="w-full pl-8 pr-7 rtl:pl-7 rtl:pr-8 py-1.5 border border-[#5C130F]/35 bg-[#FDFAF3] text-xs font-serif text-[#3A1A14] focus:outline-none focus:border-[#5C130F]"
                      />
                      {zoneSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setZoneSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rtl:right-auto rtl:left-2 text-xs text-[#5C130F] font-bold"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {isAddingInlineZone && (
                      <div className="flex items-center gap-1.5 animate-fadeIn pt-1">
                        <input
                          type="text"
                          value={inlineZoneName}
                          onChange={(e) => setInlineZoneName(e.target.value)}
                          placeholder="New zone name..."
                          className="flex-1 px-2.5 py-1.5 border border-[#5C130F]/35 bg-[#FDFAF3] text-xs font-serif focus:outline-none focus:border-[#5C130F]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = inlineZoneName.trim();
                            if (trimmed) {
                              if (onAddZone) onAddZone(trimmed);
                              setAssignZone(trimmed);
                            }
                            setInlineZoneName('');
                            setIsAddingInlineZone(false);
                          }}
                          className="px-3 py-1.5 bg-[#BA8332] hover:bg-[#a06e28] text-white font-mono text-xs font-bold uppercase shrink-0 cursor-pointer shadow-sm"
                        >
                          Save
                        </button>
                      </div>
                    )}

                    <select
                      value={assignZone}
                      onChange={(e) => setAssignZone(e.target.value)}
                      className="w-full px-3 py-2 border border-[#5C130F]/35 rounded-none bg-[#FDFAF3] font-serif text-xs text-[#3A1A14] focus:outline-none focus:border-[#5C130F]"
                    >
                      {zones
                        .filter(z => {
                          if (!zoneSearchQuery.trim()) return true;
                          return z.name.toLowerCase().includes(zoneSearchQuery.toLowerCase().trim());
                        })
                        .map(z => (
                          <option key={z.id} value={z.name}>{z.name}</option>
                        ))}
                    </select>
                  </div>

                  {/* Multi-Select Touch Point Field */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between border-b border-[#5C130F]/15 pb-1.5">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">
                          {t.touchPoint}
                        </label>
                        <span className="text-[10px] font-mono font-bold text-[#BA8332] bg-[#BA8332]/10 px-2 py-0.5 border border-[#BA8332]/30">
                          {assignTopics.length} {lang === 'en' ? 'Selected' : 'محدد'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono font-bold">
                        <button
                          type="button"
                          onClick={() => setIsAddingInlineTopic(!isAddingInlineTopic)}
                          className="text-[#BA8332] hover:underline cursor-pointer"
                        >
                          + Inline Add
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setIsBulkAddTopicsOpen(true)}
                          className="text-[#5C130F] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <Layers className="w-3 h-3 text-[#BA8332]" />
                          <span>Bulk Add</span>
                        </button>
                      </div>
                    </div>

                    {/* Active Selected Chips List */}
                    {assignTopics.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-[#5C130F]/20 rounded-none max-h-28 overflow-y-auto">
                        {assignTopics.map((tpName) => (
                          <span
                            key={tpName}
                            className="inline-flex items-center gap-1.5 bg-[#BA8332] text-white text-xs font-serif font-bold px-2 py-0.5 rounded-none shadow-xs"
                          >
                            <span>{tpName}</span>
                            <button
                              type="button"
                              onClick={() => setAssignTopics(assignTopics.filter(t => t !== tpName))}
                              className="hover:text-red-200 font-mono font-bold text-xs cursor-pointer ml-0.5"
                              title="Remove touch point"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] font-serif text-[#3A1A14]/60 italic bg-white p-2 border border-[#5C130F]/20">
                        {lang === 'en' ? 'No touch points selected yet. Select from below:' : 'لم يتم تحديد أي نقاط تغطية بعد. اختر من القائمة أدناه:'}
                      </p>
                    )}

                    {/* Search Input Bar */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#BA8332] absolute left-2.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-2.5" />
                      <input
                        type="text"
                        value={topicSearchQuery}
                        onChange={(e) => setTopicSearchQuery(e.target.value)}
                        placeholder="Search touch points to toggle..."
                        className="w-full pl-8 pr-7 rtl:pl-7 rtl:pr-8 py-1.5 border border-[#5C130F]/35 bg-[#FDFAF3] text-xs font-serif text-[#3A1A14] focus:outline-none focus:border-[#5C130F]"
                      />
                      {topicSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setTopicSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rtl:right-auto rtl:left-2 text-xs text-[#5C130F] font-bold"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Inline Add Input Field */}
                    {isAddingInlineTopic && (
                      <div className="flex items-center gap-1.5 animate-fadeIn pt-1">
                        <input
                          type="text"
                          value={inlineTopicName}
                          onChange={(e) => setInlineTopicName(e.target.value)}
                          placeholder="New touch point name..."
                          className="flex-1 px-2.5 py-1.5 border border-[#5C130F]/35 bg-[#FDFAF3] text-xs font-serif focus:outline-none focus:border-[#5C130F]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = inlineTopicName.trim();
                            if (trimmed) {
                              if (onAddTopic) onAddTopic(trimmed);
                              setAssignTopics(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
                            }
                            setInlineTopicName('');
                            setIsAddingInlineTopic(false);
                          }}
                          className="px-3 py-1.5 bg-[#BA8332] hover:bg-[#a06e28] text-white font-mono text-xs font-bold uppercase shrink-0 cursor-pointer shadow-sm"
                        >
                          Save & Select
                        </button>
                      </div>
                    )}

                    {/* Multi-Select List Box */}
                    <div className="border border-[#5C130F]/20 p-2 max-h-36 overflow-y-auto space-y-1 bg-white/70">
                      {topics
                        .filter(tp => {
                          if (!topicSearchQuery.trim()) return true;
                          return tp.name.toLowerCase().includes(topicSearchQuery.toLowerCase().trim());
                        })
                        .map(tp => {
                          const isSelected = assignTopics.includes(tp.name);
                          return (
                            <div
                              key={tp.id}
                              onClick={() => {
                                if (isSelected) {
                                  setAssignTopics(assignTopics.filter(t => t !== tp.name));
                                } else {
                                  setAssignTopics([...assignTopics, tp.name]);
                                }
                              }}
                              className={`flex items-center justify-between p-2 text-xs font-serif cursor-pointer transition-colors border ${
                                isSelected
                                  ? 'bg-[#BA8332]/15 text-[#5C130F] font-bold border-[#BA8332]/40'
                                  : 'bg-transparent text-[#3A1A14] hover:bg-[#5C130F]/5 border-transparent'
                              }`}
                            >
                              <span>{tp.name}</span>
                              {isSelected ? (
                                <span className="text-[10px] font-mono font-bold text-emerald-700 flex items-center gap-1">
                                  ✓ Selected
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-[#3A1A14]/50">
                                  + Add
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* ROW 3: Assignment Mode Toggle Buttons (Full Width) */}
                <div className="flex flex-col gap-1.5 p-4 bg-white/40 border border-[#5C130F]/18 rounded-none">
                  <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">
                    {lang === 'en' ? 'Assignment Mode' : 'نمط التخصيص'}
                  </label>
                  <div className="grid grid-cols-2 border border-[#5C130F]/25 rounded-none overflow-hidden bg-white/40 font-mono text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setAssignMode('individual')}
                      className={`py-2 px-2 text-center transition-all cursor-pointer ${
                        assignMode === 'individual'
                          ? 'bg-[#5C130F] !text-white'
                          : 'bg-transparent text-[#5C130F] hover:bg-[#5C130F]/10'
                      }`}
                    >
                      {lang === 'en' ? 'Assign Individually' : 'تخصيص فردي'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignMode('mohalla')}
                      className={`py-2 px-2 text-center transition-all cursor-pointer ${
                        assignMode === 'mohalla'
                          ? 'bg-[#5C130F] !text-white'
                          : 'bg-transparent text-[#5C130F] hover:bg-[#5C130F]/10'
                      }`}
                    >
                      {lang === 'en' ? 'Assign by Mohalla' : 'تخصيص حسب المحلة'}
                    </button>
                  </div>
                </div>

                {/* ROW 4: Assign Photographer/Videographer (Full Width) */}
                <div className="p-4 bg-white/40 border border-[#5C130F]/18 rounded-none">
                  {assignMode === 'individual' ? (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">{t.assignPv}</label>
                        {assignPVs.length > 0 && (
                          <span className="text-[10px] font-mono font-bold text-[#BA8332] bg-[#BA8332]/10 px-2 py-0.5 border border-[#BA8332]/30">
                            {assignPVs.length} {lang === 'en' ? 'Selected' : 'محدد'}
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-[#BA8332] absolute left-2.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-2.5" />
                        <input
                          type="text"
                          value={pvSearchQuery}
                          onChange={(e) => setPvSearchQuery(e.target.value)}
                          placeholder={t.searchPeoplePlaceholder}
                          className="w-full pl-8 pr-6 rtl:pl-6 rtl:pr-8 py-1.5 border border-[#5C130F]/35 bg-[#FDFAF3] text-xs font-serif text-[#3A1A14] focus:outline-none focus:border-[#5C130F]"
                        />
                        {pvSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setPvSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rtl:right-auto rtl:left-2 text-xs text-[#5C130F] font-bold"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-[#3A1A14]/70">
                          {filteredAssignPVs.length} {lang === 'en' ? 'match(es)' : 'مطابق'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const newSelected = Array.from(new Set([...assignPVs, ...filteredAssignPVs.map(p => p.itsNumber)]));
                              setAssignPVs(newSelected);
                            }}
                            className="text-[#5C130F] font-bold hover:underline"
                          >
                            {t.selectAllFiltered}
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => setAssignPVs([])}
                            className="text-[#3A1A14]/60 hover:underline"
                          >
                            {t.clearSelection}
                          </button>
                        </div>
                      </div>

                      <div className="border border-[#5C130F]/20 p-3 max-h-52 overflow-y-auto space-y-2 bg-white">
                        {filteredAssignPVs.length === 0 ? (
                          <p className="text-center py-4 text-xs font-serif italic text-[#3A1A14]/70">
                            {t.noMembersFound}
                          </p>
                        ) : (
                          filteredAssignPVs.map(pv => {
                            const isSelected = assignPVs.includes(pv.itsNumber);
                            return (
                              <label key={pv.itsNumber} className="flex items-center justify-between p-1.5 hover:bg-[#BA8332]/10 transition-colors cursor-pointer border border-transparent hover:border-[#5C130F]/15">
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      if (isSelected) {
                                        setAssignPVs(assignPVs.filter(id => id !== pv.itsNumber));
                                      } else {
                                        setAssignPVs([...assignPVs, pv.itsNumber]);
                                      }
                                    }}
                                    className="rounded-none text-[#BA8332] border-[#5C130F]/30 focus:ring-0"
                                  />
                                  <AvatarPlaceholder src={pv.avatarUrl} alt={pv.fullName} sizeClassName="w-6 h-6" iconSizeClassName="w-3 h-3" />
                                  <div>
                                    <span className="font-serif font-bold text-[#5C130F] text-xs block leading-tight">{pv.fullName}</span>
                                    <span className="text-[10px] text-[#3A1A14]/70 font-mono">ITS: {pv.itsNumber} ({pv.role})</span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <span className="text-[9px] font-mono font-bold bg-[#5C130F] !text-white px-1.5 py-0.5 uppercase">
                                    {lang === 'en' ? 'Selected' : 'محدد'}
                                  </span>
                                )}
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">
                        {lang === 'en' ? 'Select Target Mohalla:' : 'اختر المحلة المستهدفة:'}
                      </label>
                      <select
                        value={selectedMohalla}
                        onChange={(e) => setSelectedMohalla(e.target.value)}
                        className="w-full px-3 py-2 border border-[#5C130F]/35 bg-[#FDFAF3] font-serif text-xs text-[#3A1A14] focus:outline-none focus:border-[#5C130F]"
                      >
                        {MOHALLA_OPTIONS.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>

                      <div className="space-y-1.5 border border-[#5C130F]/20 p-3 bg-white">
                        <div className="flex items-center justify-between border-b border-[#5C130F]/15 pb-2 text-[11px] font-mono font-bold">
                          <span className="text-[#5C130F]">
                            {lang === 'en' ? `Members in ${selectedMohalla}:` : `الأعضاء في ${selectedMohalla}:`}
                          </span>
                          <span className="text-[#BA8332]">
                            {selectedMohallaPVs.length} / {mohallaPVs.length} {lang === 'en' ? 'Selected' : 'محدد'}
                          </span>
                        </div>

                        {mohallaPVs.length > 0 && (
                          <div className="flex items-center justify-end gap-2 text-[10px] font-mono pb-1">
                            <button
                              type="button"
                              onClick={() => setSelectedMohallaPVs(mohallaPVs.map(m => m.itsNumber))}
                              className="text-[#5C130F] font-bold hover:underline"
                            >
                              {t.selectAllFiltered}
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => setSelectedMohallaPVs([])}
                              className="text-[#3A1A14]/60 hover:underline"
                            >
                              {t.clearSelection}
                            </button>
                          </div>
                        )}

                        {mohallaPVs.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {mohallaPVs.map(pv => {
                              const isSelected = selectedMohallaPVs.includes(pv.itsNumber);
                              return (
                                <label
                                  key={pv.itsNumber}
                                  className="flex items-center gap-2.5 p-2 bg-[#FDFAF3] border border-[#5C130F]/15 cursor-pointer hover:bg-[#BA8332]/10 transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      if (isSelected) {
                                        setSelectedMohallaPVs(selectedMohallaPVs.filter(id => id !== pv.itsNumber));
                                      } else {
                                        setSelectedMohallaPVs([...selectedMohallaPVs, pv.itsNumber]);
                                      }
                                    }}
                                    className="rounded-none text-[#BA8332] border-[#5C130F]/30 focus:ring-0"
                                  />
                                  <AvatarPlaceholder sizeClassName="w-7 h-7" iconSizeClassName="w-3.5 h-3.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-serif font-bold text-[#5C130F] text-xs truncate leading-tight">{pv.fullName}</p>
                                    <p className="text-[9px] text-[#3A1A14]/70 font-mono truncate">ITS: {pv.itsNumber} • Role: {pv.role}</p>
                                  </div>
                                  {isSelected ? (
                                    <span className="text-[9px] font-mono font-bold bg-[#5C130F] !text-white px-1.5 py-0.5 rounded-none uppercase">
                                      {lang === 'en' ? 'Selected' : 'محدد'}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-mono text-[#3A1A14]/50 border border-[#5C130F]/20 px-1.5 py-0.5 rounded-none uppercase">
                                      {lang === 'en' ? 'Not Selected' : 'غير محدد'}
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#3A1A14]/70 italic font-serif py-3 text-center bg-[#FDFAF3] border border-[#5C130F]/10">
                            {lang === 'en' 
                              ? 'No active photographers/videographers registered under this mohalla.' 
                              : 'لا يوجد مصورون مسجلون في هذه المحلة حالياً.'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ROW 5: Operational Directives (Full Width Textarea) */}
                <div className="flex flex-col gap-1.5 p-4 bg-white/40 border border-[#5C130F]/18 rounded-none">
                  <label className="text-xs font-mono font-bold uppercase text-[#5C130F]">{t.notes}</label>
                  <textarea
                    rows={3}
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    placeholder="Focus directives..."
                    className="w-full px-3 py-2 border border-[#5C130F]/35 rounded-none bg-[#FDFAF3] font-serif text-[#3A1A14] focus:outline-none focus:border-[#5C130F]"
                  />
                </div>

                {/* Footer Action Buttons (Right-Aligned) */}
                <div className="flex justify-end gap-3 border-t border-[#5C130F]/20 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsNewAssignmentModalOpen(false)}
                    className="px-4 py-2 border border-[#5C130F]/30 text-[#5C130F] font-mono text-xs font-bold rounded-none uppercase cursor-pointer"
                  >
                    {lang === 'en' ? 'Cancel' : 'إلغاء'}
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#BA8332] hover:bg-[#a06e28] text-white font-mono font-bold rounded-none text-xs uppercase tracking-wider shadow-sm cursor-pointer"
                  >
                    {t.createAssignment}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* REUSABLE BULK ADD MODALS */}

        {/* 1. Bulk Add Coverage Zones Modal */}
        <BulkAddModal
          isOpen={isBulkAddZonesOpen}
          title={lang === 'en' ? 'Bulk Add Coverage Zones' : 'إضافة مناطق تغطية متعددة'}
          subtitle={lang === 'en' ? 'Type or paste multiple coverage zones, separated by commas. Existing zones will be automatically detected and skipped.' : 'اكتب أو ألصق مناطق تغطية متعددة تفصل بينها فاصلة.'}
          placeholder="e.g. Sahn-e-Masjid, Mawaid Entrance, VIP Gate, Balcony 1..."
          existingNames={zones.map(z => z.name)}
          onConfirm={(newNames) => {
            if (onBulkAddZones) onBulkAddZones(newNames);
            if (newNames.length > 0) setAssignZone(newNames[0]);
          }}
          onClose={() => setIsBulkAddZonesOpen(false)}
          lang={lang}
        />

        {/* 2. Bulk Add Touch Points Modal */}
        <BulkAddModal
          isOpen={isBulkAddTopicsOpen}
          title={lang === 'en' ? 'Bulk Add Touch Points' : 'إضافة نقاط تغطية متعددة'}
          subtitle={lang === 'en' ? 'Type or paste multiple touch points, separated by commas. Existing touch points will be automatically detected and skipped.' : 'اكتب أو ألصق نقاط تغطية متعددة تفصل بينها فاصلة.'}
          placeholder="e.g. Syedna Arrival, Waaz Shareef, Mumineen Devotion, Mawaid Catering..."
          existingNames={topics.map(t => t.name)}
          onConfirm={(newNames) => {
            if (onBulkAddTopics) onBulkAddTopics(newNames);
            setAssignTopics(prev => Array.from(new Set([...prev, ...newNames])));
          }}
          onClose={() => setIsBulkAddTopicsOpen(false)}
          lang={lang}
        />

        {/* 3. Star Rating Override Modal */}
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

        {/* 4. Ongoing Role & HR Permission Management Modal */}
        {editingPermissionsUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#FDFAF3] border-2 border-[#5C130F] rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-[#5C130F]/20 pb-4">
                <div className="flex items-center gap-3">
                  <AvatarPlaceholder src={editingPermissionsUser.avatarUrl} alt={editingPermissionsUser.fullName} sizeClassName="w-12 h-12" iconSizeClassName="w-6 h-6" />
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#5C130F] flex items-center gap-2">
                      <span>{editingPermissionsUser.fullName}</span>
                      <span className="text-[10px] font-mono font-bold bg-[#5C130F]/10 text-[#5C130F] px-2.5 py-0.5 rounded-md">
                        {formatRoleBadgeLabel(editingPermissionsUser)}
                      </span>
                    </h3>
                    <p className="text-xs font-mono text-[#3A1A14]/75">
                      ITS: {editingPermissionsUser.itsNumber} • Mobile: {editingPermissionsUser.mobile}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingPermissionsUser(null)}
                  className="p-1 text-[#5C130F]/60 hover:text-[#5C130F] hover:bg-[#5C130F]/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. Multi-Role Configuration */}
              <div className="space-y-3">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5C130F] block flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#BA8332]" />
                  <span>Assign User Tracks / Roles (Multi-Role Supported)</span>
                </label>
                <p className="text-xs text-[#3A1A14]/75 font-serif italic">
                  Users can hold multiple tracks simultaneously (e.g. Photographer + HR Coordinator). Existing equipment specs, assignment history, and star ratings remain intact.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Photographer Track */}
                  <label className={`p-3 border rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                    editingUserRoles.includes('photographer')
                      ? 'bg-[#BA8332]/15 border-[#BA8332] text-[#5C130F] font-bold'
                      : 'bg-white/60 border-[#5C130F]/20 text-[#3A1A14]'
                  }`}>
                    <input
                      type="checkbox"
                      checked={editingUserRoles.includes('photographer')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditingUserRoles(prev => [...prev, 'photographer']);
                        } else {
                          setEditingUserRoles(prev => prev.filter(r => r !== 'photographer'));
                        }
                      }}
                      className="accent-[#BA8332] w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-mono block">Photographer</span>
                      <span className="text-[9px] text-[#3A1A14]/70 block font-normal">Still photos capture track</span>
                    </div>
                  </label>

                  {/* Videographer Track */}
                  <label className={`p-3 border rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                    editingUserRoles.includes('videographer')
                      ? 'bg-[#BA8332]/15 border-[#BA8332] text-[#5C130F] font-bold'
                      : 'bg-white/60 border-[#5C130F]/20 text-[#3A1A14]'
                  }`}>
                    <input
                      type="checkbox"
                      checked={editingUserRoles.includes('videographer')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditingUserRoles(prev => [...prev, 'videographer']);
                        } else {
                          setEditingUserRoles(prev => prev.filter(r => r !== 'videographer'));
                        }
                      }}
                      className="accent-[#BA8332] w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-mono block">Videographer</span>
                      <span className="text-[9px] text-[#3A1A14]/70 block font-normal">Video & motion track</span>
                    </div>
                  </label>

                  {/* HR Coordinator Track */}
                  <label className={`p-3 border rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                    editingUserRoles.includes('coordinator')
                      ? 'bg-[#5C130F]/15 border-[#5C130F] text-[#5C130F] font-bold'
                      : 'bg-white/60 border-[#5C130F]/20 text-[#3A1A14]'
                  }`}>
                    <input
                      type="checkbox"
                      checked={editingUserRoles.includes('coordinator')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditingUserRoles(prev => [...prev, 'coordinator']);
                        } else {
                          setEditingUserRoles(prev => prev.filter(r => r !== 'coordinator'));
                        }
                      }}
                      className="accent-[#5C130F] w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-mono block">HR Coordinator</span>
                      <span className="text-[9px] text-[#3A1A14]/70 block font-normal">Logistics & HR track</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 2. Granular HR Permissions List (Visible when HR Coordinator role is active) */}
              {editingUserRoles.includes('coordinator') ? (
                <div className="p-4 bg-white/70 border border-[#5C130F]/20 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#5C130F]/15 pb-2">
                    <h4 className="font-serif font-bold text-sm text-[#5C130F] flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#BA8332]" />
                      <span>Toggle Specific HR Permissions (Extend or Revoke Anytime)</span>
                    </h4>
                    <span className="text-[9px] font-mono font-bold bg-[#5C130F]/10 text-[#5C130F] px-2 py-0.5 rounded">
                      HR Access Control
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* 1. Assign Coverage */}
                    <label className="flex items-start gap-2.5 p-2.5 bg-[#FDFAF3] border border-[#5C130F]/15 rounded-lg cursor-pointer hover:bg-white transition-colors">
                      <input
                        type="checkbox"
                        checked={editingHRPermissions.assignCoverage ?? true}
                        onChange={(e) => setEditingHRPermissions(prev => ({ ...prev, assignCoverage: e.target.checked }))}
                        className="mt-0.5 accent-[#BA8332] w-4 h-4"
                      />
                      <div>
                        <span className="text-xs font-mono font-bold text-[#5C130F] block">Coverage Assignments</span>
                        <span className="text-[10px] text-[#3A1A14]/70 block leading-tight">Assign team to schedules & zones</span>
                      </div>
                    </label>

                    {/* 2. View Assignments */}
                    <label className="flex items-start gap-2.5 p-2.5 bg-[#FDFAF3] border border-[#5C130F]/15 rounded-lg cursor-pointer hover:bg-white transition-colors">
                      <input
                        type="checkbox"
                        checked={editingHRPermissions.viewAssignments ?? true}
                        onChange={(e) => setEditingHRPermissions(prev => ({ ...prev, viewAssignments: e.target.checked }))}
                        className="mt-0.5 accent-[#BA8332] w-4 h-4"
                      />
                      <div>
                        <span className="text-xs font-mono font-bold text-[#5C130F] block">Assignment Status</span>
                        <span className="text-[10px] text-[#3A1A14]/70 block leading-tight">Follow up on active rosters</span>
                      </div>
                    </label>

                    {/* 3. Review Submissions */}
                    <label className="flex items-start gap-2.5 p-2.5 bg-[#FDFAF3] border border-[#5C130F]/15 rounded-lg cursor-pointer hover:bg-white transition-colors">
                      <input
                        type="checkbox"
                        checked={editingHRPermissions.reviewSubmissions ?? true}
                        onChange={(e) => setEditingHRPermissions(prev => ({ ...prev, reviewSubmissions: e.target.checked }))}
                        className="mt-0.5 accent-[#BA8332] w-4 h-4"
                      />
                      <div>
                        <span className="text-xs font-mono font-bold text-[#5C130F] block">Shot Report Auditing</span>
                        <span className="text-[10px] text-[#3A1A14]/70 block leading-tight">Review shot report submissions (View-only)</span>
                      </div>
                    </label>

                    {/* 4. Star Override */}
                    <label className="flex items-start gap-2.5 p-2.5 bg-[#FDFAF3] border border-[#5C130F]/15 rounded-lg cursor-pointer hover:bg-white transition-colors">
                      <input
                        type="checkbox"
                        checked={editingHRPermissions.starOverride ?? false}
                        onChange={(e) => setEditingHRPermissions(prev => ({ ...prev, starOverride: e.target.checked }))}
                        className="mt-0.5 accent-[#BA8332] w-4 h-4"
                      />
                      <div>
                        <span className="text-xs font-mono font-bold text-[#5C130F] block">Star Rating Override</span>
                        <span className="text-[10px] text-[#3A1A14]/70 block leading-tight">Override gold/red star ratings</span>
                      </div>
                    </label>

                    {/* 5. View Roster */}
                    <label className="flex items-start gap-2.5 p-2.5 bg-[#FDFAF3] border border-[#5C130F]/15 rounded-lg cursor-pointer hover:bg-white transition-colors">
                      <input
                        type="checkbox"
                        checked={editingHRPermissions.viewRoster ?? true}
                        onChange={(e) => setEditingHRPermissions(prev => ({ ...prev, viewRoster: e.target.checked }))}
                        className="mt-0.5 accent-[#BA8332] w-4 h-4"
                      />
                      <div>
                        <span className="text-xs font-mono font-bold text-[#5C130F] block">View Team Roster</span>
                        <span className="text-[10px] text-[#3A1A14]/70 block leading-tight">View Active Dispatched Lenses (Read-Only)</span>
                      </div>
                    </label>

                    {/* 6. Edit Roster */}
                    <label className="flex items-start gap-2.5 p-2.5 bg-[#FDFAF3] border border-[#5C130F]/15 rounded-lg cursor-pointer hover:bg-white transition-colors">
                      <input
                        type="checkbox"
                        checked={editingHRPermissions.editRoster ?? false}
                        onChange={(e) => setEditingHRPermissions(prev => ({ ...prev, editRoster: e.target.checked }))}
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
                        checked={editingHRPermissions.approveOnboarding ?? false}
                        onChange={(e) => setEditingHRPermissions(prev => ({ ...prev, approveOnboarding: e.target.checked }))}
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
                        checked={editingHRPermissions.manageSharaf ?? false}
                        onChange={(e) => setEditingHRPermissions(prev => ({ ...prev, manageSharaf: e.target.checked }))}
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
                        checked={editingHRPermissions.systemSettings ?? false}
                        onChange={(e) => setEditingHRPermissions(prev => ({ ...prev, systemSettings: e.target.checked }))}
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
                </div>
              ) : (
                <div className="p-4 bg-[#BA8332]/10 border border-[#BA8332]/30 rounded-xl text-xs font-serif text-[#3A1A14]/80 italic">
                  This user currently holds standard Photographer / Videographer track rights only. Check "HR Coordinator" above to grant HR permissions.
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#5C130F]/20">
                {editingUserRoles.includes('coordinator') ? (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = editingUserRoles.filter(r => r !== 'coordinator');
                      const finalRoles = updated.length > 0 ? updated : ['photographer' as UserRole];
                      if (onUpdateUserPermissions) {
                        onUpdateUserPermissions(editingPermissionsUser.itsNumber, finalRoles, undefined);
                      }
                      setEditingPermissionsUser(null);
                    }}
                    className="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-mono font-bold rounded-md transition-colors border border-red-300 flex items-center gap-1.5 cursor-pointer w-full sm:w-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove HR Role Entirely</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setEditingPermissionsUser(null)}
                    className="px-4 py-2 bg-white hover:bg-gray-100 text-[#5C130F] text-xs font-mono font-bold rounded-md transition-colors border border-[#5C130F]/20 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateUserPermissions && editingPermissionsUser) {
                        const finalRoles = editingUserRoles.length > 0 ? editingUserRoles : [editingPermissionsUser.role];
                        const isHR = finalRoles.includes('coordinator');
                        onUpdateUserPermissions(
                          editingPermissionsUser.itsNumber,
                          finalRoles,
                          isHR ? editingHRPermissions : undefined
                        );
                      }
                      setEditingPermissionsUser(null);
                    }}
                    className="px-5 py-2 bg-[#BA8332] hover:bg-[#a06e28] text-white text-xs font-mono font-bold rounded-md flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Roles & HR Permissions</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
