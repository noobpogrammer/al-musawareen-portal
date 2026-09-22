import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, Assignment, SharafAllocation, ShotReport, DataDumpRecord } from '../types';
import { LanguageType } from '../utils/translations';
import { 
  HardDrive, CheckCircle2, Clock, 
  UserCheck, AlertCircle, RefreshCw, FileText, Check,
  Camera, Video, Calendar, MapPin, ExternalLink, Link as LinkIcon,
  ChevronDown, Layers, Sparkles, Star, Award, CheckSquare, Square, Percent
} from 'lucide-react';
import AvatarPlaceholder from './AvatarPlaceholder';
import { calculateStarRating, parseDateTimeToMillis } from '../utils/starRating';

interface DataDumpViewProps {
  lang: LanguageType;
  currentUser: UserProfile;
  users: UserProfile[];
  assignments: Assignment[];
  sharafAllocations?: SharafAllocation[];
  submissions: ShotReport[];
  dataDumps: DataDumpRecord[];
  onUpdateDataDump: (record: DataDumpRecord) => Promise<boolean | void> | void;
  onSaveShotReport?: (report: ShotReport) => Promise<boolean | void> | void;
}

// Format YYYY-MM-DD into readable "21 Jul 2026"
function formatReadableDate(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);
    if (!isNaN(dateObj.getTime())) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${monthNames[month]} ${year}`;
    }
  }
  return dateStr;
}

// Check if an event has concluded based strictly on Event Date + Event To Time (NOT Data Copying Deadline)
function isEventConcluded(dateStr?: string, toTimeStr?: string, isCompletedStatus?: boolean): boolean {
  if (isCompletedStatus) return true;
  if (!dateStr) return false;

  const now = new Date();
  const timeMillis = parseDateTimeToMillis(dateStr, toTimeStr);
  if (timeMillis !== null) {
    return now.getTime() >= timeMillis;
  }
  return false;
}

// Unified Work Item definition for Data Dump selector
interface WorkItem {
  id: string; // assignment id OR `sharaf_${sharaf.id}`
  type: 'assignment' | 'sharaf';
  date: string;
  fromTime?: string;
  toTime?: string;
  dataCopyingDeadlineDate?: string;
  dataCopyingDeadlineTime?: string;
  title: string;
  touchPoints: string[];
  location: string;
  zone: string;
  assignedUsers: string[];
  rawAssignment?: Assignment;
  rawSharaf?: SharafAllocation;
}

export default function DataDumpView({
  lang,
  currentUser,
  users,
  assignments,
  sharafAllocations = [],
  submissions,
  dataDumps,
  onUpdateDataDump,
  onSaveShotReport
}: DataDumpViewProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'received_awaiting_copy' | 'completed'>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justCompletedNotice, setJustCompletedNotice] = useState<string | null>(null);

  // Local state for interactive touch point completion and mode overrides before save
  const [memberTouchPointsState, setMemberTouchPointsState] = useState<Record<string, {
    mode: 'exact' | 'percentage';
    completedTouchPoints: string[];
    percentOverride: 25 | 50 | 75 | 100;
  }>>({});

  // 1. Build unified work items list across Normal Assignments and Sharaf Allocations
  const allWorkItems = useMemo<WorkItem[]>(() => {
    const list: WorkItem[] = [];

    // Normal Coverage Assignments
    assignments.forEach(as => {
      const tpList: string[] = Array.isArray(as.topics) && as.topics.length > 0
        ? as.topics
        : (typeof as.topic === 'string' ? [as.topic] : (Array.isArray(as.topic) ? as.topic : ['General Coverage']));
      
      const eventTitle = as.miqaatName ? `${as.miqaatName}` : (tpList[0] || 'Coverage Assignment');

      list.push({
        id: as.id,
        type: 'assignment',
        date: as.date,
        fromTime: as.fromTime,
        toTime: as.toTime || as.endTime,
        dataCopyingDeadlineDate: as.dataCopyingDeadlineDate || as.date,
        dataCopyingDeadlineTime: as.dataCopyingDeadlineTime,
        title: eventTitle,
        touchPoints: tpList,
        location: as.zone,
        zone: as.zone,
        assignedUsers: Array.from(new Set(as.assignedUsers || [])),
        rawAssignment: as
      });
    });

    // Sharaf Allocations
    sharafAllocations.forEach(sh => {
      list.push({
        id: `sharaf_${sh.id}`,
        type: 'sharaf',
        date: sh.date || '2026-07-22',
        fromTime: sh.fromTime,
        toTime: sh.toTime,
        dataCopyingDeadlineDate: sh.dataCopyingDeadlineDate || sh.date || '2026-07-22',
        dataCopyingDeadlineTime: sh.dataCopyingDeadlineTime || '10:00 PM',
        title: `Sharaf — ${sh.eventType}`,
        touchPoints: [sh.eventType, sh.location, sh.zone].filter(Boolean) as string[],
        location: sh.location,
        zone: sh.zone || 'General Zone',
        assignedUsers: [sh.itsNumber],
        rawSharaf: sh
      });
    });

    return list;
  }, [assignments, sharafAllocations]);

  // Helper to check member completion
  const isMemberCompleteCheck = (itemId: string, its: string) => {
    // 1. Check if valid Drive Link exists in shot_reports
    const hasDrive = submissions.some(
      sub => sub.assignmentId === itemId && sub.itsNumber === its && sub.driveLink && sub.driveLink.trim().length > 0
    );
    if (hasDrive) return true;

    // 2. Check if physical card marked as copied in dataDumps
    const recordKey = `${itemId}_${its}`;
    const dRecord = dataDumps.find(d => 
      ((d.assignmentId === itemId || d.sharafAllocationId === itemId.replace('sharaf_', '')) && d.itsNumber === its) || 
      d.id === recordKey
    );
    return Boolean(dRecord?.cardCopied);
  };

  // Helper to check work item completion: every assigned member is complete
  const isWorkItemCompleteCheck = (item: WorkItem) => {
    if (item.assignedUsers.length === 0) return false;
    return item.assignedUsers.every(its => isMemberCompleteCheck(item.id, its));
  };

  // Eligible work items for the Data Dump dropdown:
  // 1. Event end time has passed (Event Date + Event To Time)
  // 2. Data Dump is not complete (at least one assigned member is still pending)
  // 3. Has at least 1 assigned member
  // 4. Sorted by most recent date / end time first
  const eligibleWorkItems = useMemo(() => {
    return allWorkItems
      .filter(item => {
        if (item.assignedUsers.length === 0) return false;
        const eventConcluded = isEventConcluded(item.date, item.toTime, item.rawAssignment?.status === 'completed');
        const isComplete = isWorkItemCompleteCheck(item);
        return eventConcluded && !isComplete;
      })
      .sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return (b.toTime || '').localeCompare(a.toTime || '');
      });
  }, [allWorkItems, submissions, dataDumps]);

  // Auto-clear selection and notify if the selected work item becomes 100% complete
  useEffect(() => {
    if (!selectedItemId) return;
    const currentItem = allWorkItems.find(i => i.id === selectedItemId);
    if (!currentItem || isWorkItemCompleteCheck(currentItem)) {
      setSelectedItemId('');
      setJustCompletedNotice(
        lang === 'en'
          ? 'Data dump complete for this coverage.'
          : 'اكتمل تفريغ الذاكرة لهذه التغطية بنجاح.'
      );
    }
  }, [allWorkItems, submissions, dataDumps, selectedItemId, lang]);

  // Selected work item
  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return allWorkItems.find(i => i.id === selectedItemId) || null;
  }, [allWorkItems, selectedItemId]);

  // Build the list of assigned members for the selected work item
  const selectedItemMembers = useMemo(() => {
    if (!selectedItem) return [];

    const item = selectedItem;
    return item.assignedUsers.map(its => {
      const u = users.find(user => user.itsNumber === its) || {
        itsNumber: its,
        fullName: `Member (${its})`,
        role: 'photographer' as const,
        status: 'approved' as const,
        email: '',
        mobile: '—'
      };

      // Check Drive Link
      const matchingSubmission = submissions.find(
        sub => sub.assignmentId === item.id && sub.itsNumber === its && sub.driveLink && sub.driveLink.trim().length > 0
      );
      const hasDriveLink = Boolean(matchingSubmission && matchingSubmission.driveLink && matchingSubmission.driveLink.trim().length > 0);
      const driveLinkUrl = matchingSubmission ? matchingSubmission.driveLink.trim() : undefined;

      // Check Data Dump status record
      const recordKey = `${item.id}_${its}`;
      const existingRecord: DataDumpRecord = dataDumps.find(
        d => ((d.assignmentId === item.id || d.sharafAllocationId === item.id.replace('sharaf_', '')) && d.itsNumber === its) || d.id === recordKey
      ) || {
        id: recordKey,
        assignmentId: item.type === 'assignment' ? item.id : undefined,
        sharafAllocationId: item.type === 'sharaf' ? item.id.replace('sharaf_', '') : undefined,
        itsNumber: its,
        memberName: u.fullName,
        eventName: item.title,
        date: item.date,
        zone: item.zone,
        cardReceived: false,
        cardReceivedAt: undefined,
        cardReceivedBy: undefined,
        cardCopied: false,
        cardCopiedAt: undefined,
        cardCopiedBy: undefined,
        notes: '',
        cardNotes: '',
        touchPointCompletionMode: item.touchPoints.length <= 5 ? 'exact' : 'percentage',
        completionPercentOverride: 100,
        completedTouchPoints: item.touchPoints
      };

      const deliveryType: 'card' | 'drive_link' = hasDriveLink ? 'drive_link' : 'card';
      const cardReceived = Boolean(existingRecord.cardReceived);
      const cardCopied = Boolean(existingRecord.cardCopied);
      const isMemberComplete = hasDriveLink || cardCopied;

      // Interactive state sync
      const localState = memberTouchPointsState[recordKey] || {
        mode: existingRecord.touchPointCompletionMode || (item.touchPoints.length <= 5 ? 'exact' : 'percentage'),
        completedTouchPoints: existingRecord.completedTouchPoints || item.touchPoints,
        percentOverride: existingRecord.completionPercentOverride || 100
      };

      return {
        id: recordKey,
        itemId: item.id,
        user: u,
        deliveryType,
        driveLinkUrl,
        cardReceived,
        cardReceivedAt: existingRecord.cardReceivedAt,
        cardReceivedBy: existingRecord.cardReceivedBy,
        cardCopied,
        cardCopiedAt: existingRecord.cardCopiedAt,
        cardCopiedBy: existingRecord.cardCopiedBy,
        cardNotes: existingRecord.cardNotes || existingRecord.notes || '',
        isMemberComplete,
        rawRecord: existingRecord,
        localState,
        matchingSubmission
      };
    });
  }, [selectedItem, users, submissions, dataDumps, memberTouchPointsState]);

  // Filtered members inside selected work item
  const filteredMembers = useMemo(() => {
    return selectedItemMembers.filter(item => {
      if (filterStatus === 'pending') {
        return item.deliveryType === 'card' && !item.cardReceived;
      } else if (filterStatus === 'received_awaiting_copy') {
        return item.deliveryType === 'card' && item.cardReceived && !item.cardCopied;
      } else if (filterStatus === 'completed') {
        return item.isMemberComplete;
      }
      return true;
    });
  }, [selectedItemMembers, filterStatus]);

  // Metrics for selected work item
  const totalInSelected = selectedItemMembers.length;
  const completedInSelected = selectedItemMembers.filter(m => m.isMemberComplete).length;
  const driveLinksInSelected = selectedItemMembers.filter(m => m.deliveryType === 'drive_link').length;
  const cardsReceivedInSelected = selectedItemMembers.filter(m => m.deliveryType === 'card' && m.cardReceived).length;
  const cardsCopiedInSelected = selectedItemMembers.filter(m => m.deliveryType === 'card' && m.cardCopied).length;

  // Toggle Card Received
  const handleToggleCardReceived = async (item: typeof selectedItemMembers[0]) => {
    setErrorMessage(null);
    setJustCompletedNotice(null);
    const newReceived = !item.cardReceived;

    if (!newReceived && item.cardCopied) {
      const updatedRecord: DataDumpRecord = {
        ...item.rawRecord,
        cardReceived: false,
        cardReceivedAt: undefined,
        cardReceivedBy: undefined,
        cardCopied: false,
        cardCopiedAt: undefined,
        cardCopiedBy: undefined,
        updatedAt: new Date().toISOString()
      };
      try {
        await onUpdateDataDump(updatedRecord);
      } catch (err) {
        setErrorMessage(lang === 'en' ? 'Failed to update database status. Reverting change.' : 'فشل تحديث الحالة في قاعدة البيانات.');
      }
      return;
    }

    const updatedRecord: DataDumpRecord = {
      ...item.rawRecord,
      cardReceived: newReceived,
      cardReceivedAt: newReceived ? new Date().toISOString() : undefined,
      cardReceivedBy: newReceived ? (currentUser.fullName || currentUser.itsNumber) : undefined,
      cardCopied: newReceived ? item.cardCopied : false,
      cardCopiedAt: newReceived ? item.cardCopiedAt : undefined,
      cardCopiedBy: newReceived ? item.cardCopiedBy : undefined,
      updatedAt: new Date().toISOString()
    };

    try {
      await onUpdateDataDump(updatedRecord);
    } catch (err) {
      setErrorMessage(lang === 'en' ? 'Failed to update database status. Reverting change.' : 'فشل تحديث الحالة في قاعدة البيانات.');
    }
  };

  // Toggle Card Copied -> Automatically creates/updates ShotReport with submissionMethod: 'physical_card'
  const handleToggleCardCopied = async (item: typeof selectedItemMembers[0]) => {
    setErrorMessage(null);
    setJustCompletedNotice(null);

    if (!item.cardReceived && !item.cardCopied) {
      setErrorMessage(
        lang === 'en'
          ? 'Card must be marked as Received before it can be marked as Copied.'
          : 'يجب استلام الكارت أولاً قبل تحديد حالة نسخ البيانات.'
      );
      return;
    }

    const newCopied = !item.cardCopied;
    const nowIso = new Date().toISOString();

    const updatedRecord: DataDumpRecord = {
      ...item.rawRecord,
      cardCopied: newCopied,
      cardCopiedAt: newCopied ? nowIso : undefined,
      cardCopiedBy: newCopied ? (currentUser.fullName || currentUser.itsNumber) : undefined,
      touchPointCompletionMode: item.localState.mode,
      completionPercentOverride: item.localState.percentOverride,
      completedTouchPoints: item.localState.completedTouchPoints,
      updatedAt: nowIso
    };

    try {
      await onUpdateDataDump(updatedRecord);

      // If marking as copied, create or update a ShotReport for this member & assignment
      if (newCopied && onSaveShotReport && selectedItem) {
        const physicalReport: ShotReport = {
          id: item.matchingSubmission?.id || `sub_phys_${selectedItem.id}_${item.user.itsNumber}`,
          itsNumber: item.user.itsNumber,
          userName: item.user.fullName,
          assignmentId: selectedItem.id,
          assignmentTitle: `${selectedItem.date} — ${selectedItem.title} — ${selectedItem.zone}`,
          driveLink: '',
          submissionMethod: 'physical_card',
          touchPointCompletionMode: item.localState.mode,
          completionPercentOverride: item.localState.percentOverride,
          completedTouchPoints: item.localState.completedTouchPoints,
          timestamp: nowIso,
          notes: item.cardNotes || 'Physical SD Card ingested by HR.',
          grade: 'Pending',
          dueDate: selectedItem.dataCopyingDeadlineDate || selectedItem.date
        };
        await onSaveShotReport(physicalReport);
      }
    } catch (err) {
      setErrorMessage(lang === 'en' ? 'Failed to save submission status. Reverting change.' : 'فشل حفظ حالة التسليم.');
    }
  };

  // Touch Point Mode Switcher
  const handleSetTouchPointMode = (recordKey: string, mode: 'exact' | 'percentage') => {
    setMemberTouchPointsState(prev => {
      const current = prev[recordKey] || {
        mode,
        completedTouchPoints: selectedItem?.touchPoints || [],
        percentOverride: 100
      };
      return {
        ...prev,
        [recordKey]: { ...current, mode }
      };
    });
  };

  // Toggle single touch point in Exact mode
  const handleToggleTouchPoint = (recordKey: string, tp: string) => {
    setMemberTouchPointsState(prev => {
      const current = prev[recordKey] || {
        mode: 'exact',
        completedTouchPoints: selectedItem?.touchPoints || [],
        percentOverride: 100
      };
      const exists = current.completedTouchPoints.includes(tp);
      const updated = exists 
        ? current.completedTouchPoints.filter(t => t !== tp)
        : [...current.completedTouchPoints, tp];
      return {
        ...prev,
        [recordKey]: { ...current, completedTouchPoints: updated }
      };
    });
  };

  // Set Quick % Override
  const handleSetPercentOverride = (recordKey: string, pct: 25 | 50 | 75 | 100) => {
    setMemberTouchPointsState(prev => {
      const current = prev[recordKey] || {
        mode: 'percentage',
        completedTouchPoints: selectedItem?.touchPoints || [],
        percentOverride: pct
      };
      return {
        ...prev,
        [recordKey]: { ...current, percentOverride: pct }
      };
    });
  };

  // Update card notes
  const handleUpdateCardNotes = async (item: typeof selectedItemMembers[0], notesVal: string) => {
    const updatedRecord: DataDumpRecord = {
      ...item.rawRecord,
      notes: notesVal,
      cardNotes: notesVal,
      updatedAt: new Date().toISOString()
    };
    try {
      await onUpdateDataDump(updatedRecord);
    } catch (err) {
      console.warn('Failed to save card notes:', err);
    }
  };

  return (
    <div className="editorial-card-dense p-6 sm:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#5C130F]/20 pb-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#5C130F] flex items-center gap-2.5">
            <HardDrive className="w-7 h-7 text-[#BA8332]" />
            <span>{lang === 'en' ? 'Data Dump Operations' : 'عمليات تفريغ الذاكرة (Data Dump)'}</span>
          </h2>
          <p className="font-sans text-xs text-[#5C130F]/80 italic mt-1">
            {lang === 'en'
              ? 'Post-event media delivery tracking, physical card copying, and touch-point grading.'
              : 'متابعة تسليم المواد الإعلامية بعد الفعاليات، نسخ كروت الذاكرة، وتقييم نقاط التغطية.'}
          </p>
        </div>

        {/* Global Active Count Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-sans font-semibold px-3 py-1.5 bg-[#5C130F] text-white !text-white rounded-md uppercase tracking-wider shadow-xs">
            <span className="font-mono">{eligibleWorkItems.length}</span> {lang === 'en' ? 'Active Coverage Pending' : 'تغطيات قيد الانتظار'}
          </span>
        </div>
      </div>

      {/* Completion Alert Banner */}
      {justCompletedNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-sans font-semibold rounded-lg flex items-center justify-between gap-2 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span className="text-sm font-sans">{justCompletedNotice}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setJustCompletedNotice(null)} 
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer font-semibold px-2 py-0.5 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-800 text-xs font-sans font-semibold rounded-lg flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setErrorMessage(null)} 
            className="text-red-700 hover:text-red-900 cursor-pointer font-semibold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Selector: Single Assignment / Sharaf Dropdown */}
      <div className="p-5 bg-white/80 border border-[#5C130F]/20 rounded-xl space-y-2 shadow-xs">
        <label className="block text-xs font-sans font-semibold uppercase tracking-wider text-[#5C130F] flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#BA8332]" />
          <span>{lang === 'en' ? 'Select Event / Coverage' : 'اختر الفعالية / التكليف'}</span>
        </label>

        {eligibleWorkItems.length === 0 ? (
          <div className="p-4 bg-[#FDFAF3] border border-emerald-300/80 rounded-lg flex items-center gap-3 text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-serif font-semibold text-sm">
                {lang === 'en' ? 'All data dumps are complete.' : 'جميع تفريغات الذاكرة مكتملة.'}
              </p>
              <p className="font-sans text-xs text-emerald-800/80 italic mt-0.5">
                {lang === 'en'
                  ? 'No concluded coverage assignments currently require media ingestion.'
                  : 'لا توجد تكليفات منتهية بانتظار استلام أو نسخ المواد حالياً.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <select
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                setJustCompletedNotice(null);
                setFilterStatus('all');
              }}
              className="w-full px-4 py-3 bg-[#FDFAF3] border border-[#5C130F]/30 text-xs sm:text-sm font-sans font-semibold text-[#5C130F] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BA8332] shadow-2xs appearance-none cursor-pointer pr-10"
            >
              <option value="">
                {lang === 'en' ? '[ Select an event or coverage assignment ▼ ]' : '[ اختر الفعالية أو التكليف ▼ ]'}
              </option>
              {eligibleWorkItems.map(item => {
                const dateLabel = formatReadableDate(item.date);
                const fullLabel = `${dateLabel} — ${item.title} — ${item.touchPoints.slice(0, 2).join(', ')} — ${item.zone}`;
                return (
                  <option key={item.id} value={item.id}>
                    {fullLabel}
                  </option>
                );
              })}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C130F]">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>

      {/* Unselected Initial Prompt */}
      {!selectedItem && eligibleWorkItems.length > 0 && (
        <div className="p-12 text-center bg-white/60 border border-[#5C130F]/15 rounded-xl space-y-3">
          <HardDrive className="w-12 h-12 text-[#BA8332]/60 mx-auto" />
          <h3 className="font-serif font-semibold text-lg text-[#5C130F]">
            {lang === 'en' ? 'Select an event or coverage assignment to begin.' : 'اختر فعالية أو تكليفاً للبدء.'}
          </h3>
          <p className="font-sans text-xs text-[#3A1A14]/70 max-w-md mx-auto italic">
            {lang === 'en'
              ? 'Choose a concluded coverage from the dropdown above to view assigned members, log physical cards, record touch points, and copy media.'
              : 'اختر تكليفاً من القائمة أعلاه لعرض أعضاء الفريق ومتابعة تسليم كروت الذاكرة أو روابط السحابة.'}
          </p>
        </div>
      )}

      {/* Selected Item Dashboard & Member Table */}
      {selectedItem && (
        <div className="space-y-6 animate-fadeIn">
          {/* Selected Assignment Summary Card */}
          <div className="p-5 bg-white/90 border border-[#5C130F]/20 rounded-xl space-y-4 shadow-xs">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#5C130F]/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-[#5C130F] text-white !text-white text-[11px] font-mono font-bold rounded uppercase tracking-wider">
                    {formatReadableDate(selectedItem.date)}
                  </span>
                  {(selectedItem.fromTime || selectedItem.toTime) && (
                    <span className="px-2 py-0.5 bg-[#5C130F]/10 text-[#5C130F] text-[11px] font-mono font-bold rounded">
                      Event Time: {selectedItem.fromTime || '—'} – {selectedItem.toTime || '—'}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-[#BA8332]/15 text-[#5C130F] text-[11px] font-sans font-semibold rounded border border-[#BA8332]/30 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#BA8332]" />
                    {selectedItem.zone}
                  </span>
                  {(selectedItem.dataCopyingDeadlineDate || selectedItem.dataCopyingDeadlineTime) && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-mono font-bold rounded flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-700" />
                      <span>Deadline: {formatReadableDate(selectedItem.dataCopyingDeadlineDate)} {selectedItem.dataCopyingDeadlineTime || ''}</span>
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-xl font-semibold text-[#5C130F] mt-1">
                  {selectedItem.title}
                </h3>
                <p className="font-sans text-xs text-[#3A1A14]/80 font-medium">
                  {selectedItem.touchPoints.join(' • ')}
                </p>
              </div>

              {/* Progress Box */}
              <div className="w-full lg:w-64 p-3 bg-[#FDFAF3] border border-[#5C130F]/15 rounded-lg space-y-1.5 shrink-0">
                <div className="flex justify-between items-center text-xs font-sans font-semibold">
                  <span className="text-[#5C130F] uppercase">{lang === 'en' ? 'Ingestion Status' : 'حالة التسليم'}</span>
                  <span className="text-emerald-800 font-mono">{completedInSelected} / {totalInSelected} ({totalInSelected > 0 ? Math.round((completedInSelected / totalInSelected) * 100) : 0}%)</span>
                </div>
                <div className="h-2 w-full bg-[#5C130F]/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${totalInSelected > 0 ? (completedInSelected / totalInSelected) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 bg-[#FDFAF3] border border-[#5C130F]/10 rounded-lg">
                <p className="text-[10px] text-[#5C130F] font-sans font-semibold uppercase">{lang === 'en' ? 'Assigned Team' : 'فريق التغطية'}</p>
                <p className="text-lg font-mono font-bold text-[#5C130F]">{totalInSelected}</p>
              </div>
              <div className="p-3 bg-[#FDFAF3] border border-[#5C130F]/10 rounded-lg">
                <p className="text-[10px] text-emerald-800 font-sans font-semibold uppercase">{lang === 'en' ? 'Completed' : 'المكتمل'}</p>
                <p className="text-lg font-mono font-bold text-emerald-800">{completedInSelected}</p>
              </div>
              <div className="p-3 bg-[#FDFAF3] border border-[#5C130F]/10 rounded-lg">
                <p className="text-[10px] text-[#BA8332] font-sans font-semibold uppercase">{lang === 'en' ? 'Cards In Hand' : 'الكروت المستلمة'}</p>
                <p className="text-lg font-mono font-bold text-[#BA8332]">{cardsCopiedInSelected} <span className="text-xs text-[#3A1A14]/60 font-normal">/ {cardsReceivedInSelected}</span></p>
              </div>
              <div className="p-3 bg-[#FDFAF3] border border-[#5C130F]/10 rounded-lg">
                <p className="text-[10px] text-indigo-900 font-sans font-semibold uppercase">{lang === 'en' ? 'Drive Links' : 'روابط السحابة'}</p>
                <p className="text-lg font-mono font-bold text-indigo-900">{driveLinksInSelected}</p>
              </div>
            </div>
          </div>

          {/* Status Filter Chips */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-sans font-semibold text-[#5C130F] uppercase mr-1">
              {lang === 'en' ? 'Filter Team:' : 'تصفية الفريق:'}
            </span>
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 text-xs font-sans font-semibold rounded-md transition-colors cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-[#5C130F] text-white !text-white'
                  : 'bg-white/70 text-[#5C130F] border border-[#5C130F]/20 hover:bg-[#5C130F]/10'
              }`}
            >
              {lang === 'en' ? 'All Records' : 'الكل'} (<span className="font-mono">{selectedItemMembers.length}</span>)
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1 text-xs font-sans font-semibold rounded-md transition-colors cursor-pointer ${
                filterStatus === 'pending'
                  ? 'bg-red-700 text-white !text-white'
                  : 'bg-white/70 text-red-800 border border-red-300/60 hover:bg-red-50'
              }`}
            >
              {lang === 'en' ? 'Pending Delivery' : 'في انتظار التسليم'} (<span className="font-mono">{selectedItemMembers.filter(i => i.deliveryType === 'card' && !i.cardReceived).length}</span>)
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('received_awaiting_copy')}
              className={`px-3 py-1 text-xs font-sans font-semibold rounded-md transition-colors cursor-pointer ${
                filterStatus === 'received_awaiting_copy'
                  ? 'bg-[#BA8332] text-white !text-white'
                  : 'bg-white/70 text-[#BA8332] border border-[#BA8332]/30 hover:bg-[#BA8332]/10'
              }`}
            >
              {lang === 'en' ? 'Card Received (Awaiting Copy)' : 'مستلم (بانتظار النسخ)'} (<span className="font-mono">{selectedItemMembers.filter(i => i.deliveryType === 'card' && i.cardReceived && !i.cardCopied).length}</span>)
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1 text-xs font-sans font-semibold rounded-md transition-colors cursor-pointer ${
                filterStatus === 'completed'
                  ? 'bg-emerald-700 text-white !text-white'
                  : 'bg-white/70 text-emerald-800 border border-emerald-300/60 hover:bg-emerald-50'
              }`}
            >
              {lang === 'en' ? 'Completed' : 'مكتمل'} (<span className="font-mono">{completedInSelected}</span>)
            </button>
          </div>

          {/* Focused Team Members Table */}
          <div className="bg-white/90 border border-[#5C130F]/20 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#5C130F] text-[#F3E6D0] font-sans text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">{lang === 'en' ? 'Photographer' : 'المصور'}</th>
                    <th className="py-3.5 px-3 font-semibold">{lang === 'en' ? 'ITS' : 'رقم ITS'}</th>
                    <th className="py-3.5 px-3 font-semibold">{lang === 'en' ? 'Delivery' : 'طريقة التسليم'}</th>
                    <th className="py-3.5 px-3 font-semibold text-center">{lang === 'en' ? 'Status / Receipt' : 'الحالة / الاستلام'}</th>
                    <th className="py-3.5 px-3 font-semibold">{lang === 'en' ? 'Touch Point Coverage' : 'تغطية النقاط'}</th>
                    <th className="py-3.5 px-3 font-semibold text-center">{lang === 'en' ? 'Copy Media' : 'نسخ البيانات'}</th>
                    <th className="py-3.5 px-4 font-semibold">{lang === 'en' ? 'Notes / Slot' : 'الملاحظات'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#5C130F]/10 font-sans">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-[#3A1A14]/60 font-sans italic">
                        {lang === 'en' ? 'No photographers matched the selected status filter.' : 'لا يوجد مصورون مطابقون لحالة التصفية المحددة.'}
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map(item => {
                      const { user, deliveryType, isMemberComplete, localState } = item;

                      // Compute projected star rating for card mode
                      const projectedReport: ShotReport = {
                        id: `preview_${item.id}`,
                        itsNumber: user.itsNumber,
                        userName: user.fullName,
                        assignmentId: selectedItem.id,
                        assignmentTitle: selectedItem.title,
                        driveLink: item.driveLinkUrl || '',
                        submissionMethod: deliveryType,
                        touchPointCompletionMode: localState.mode,
                        completionPercentOverride: localState.percentOverride,
                        completedTouchPoints: localState.completedTouchPoints,
                        timestamp: item.cardCopiedAt || new Date().toISOString(),
                        grade: 'Pending'
                      };

                      const projectedRating = calculateStarRating(
                        projectedReport,
                        selectedItem.rawAssignment || {
                          id: selectedItem.id,
                          date: selectedItem.date,
                          zone: selectedItem.zone,
                          topic: selectedItem.touchPoints,
                          topics: selectedItem.touchPoints,
                          assignedUsers: selectedItem.assignedUsers,
                          status: 'active',
                          dataCopyingDeadlineDate: selectedItem.dataCopyingDeadlineDate,
                          dataCopyingDeadlineTime: selectedItem.dataCopyingDeadlineTime
                        },
                        user
                      );

                      return (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-[#5C130F]/5 transition-colors ${
                            isMemberComplete ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          {/* Photographer Profile */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <AvatarPlaceholder
                                src={user.avatarUrl}
                                alt={user.fullName}
                                sizeClassName="w-9 h-9"
                                iconSizeClassName="w-4 h-4"
                                className="border border-[#BA8332]/40 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-serif font-bold text-sm text-[#5C130F] truncate">
                                  {user.fullName}
                                </p>
                                <p className="text-[10px] text-[#3A1A14]/70 font-mono">
                                  {user.mobile}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* ITS Number */}
                          <td className="py-3.5 px-3 font-mono font-bold text-xs text-[#BA8332]">
                            {user.itsNumber}
                          </td>

                          {/* Delivery Mode Badge */}
                          <td className="py-3.5 px-3">
                            {deliveryType === 'drive_link' ? (
                              <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-900 text-[10px] font-mono font-bold px-2.5 py-1 rounded uppercase tracking-wider border border-indigo-200 shadow-2xs">
                                <LinkIcon className="w-3 h-3 text-indigo-700" />
                                <span>Drive Link</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-[#BA8332]/15 text-[#5C130F] text-[10px] font-mono font-bold px-2.5 py-1 rounded uppercase tracking-wider border border-[#BA8332]/30 shadow-2xs">
                                <HardDrive className="w-3 h-3 text-[#BA8332]" />
                                <span>Physical Card</span>
                              </span>
                            )}
                          </td>

                          {/* Status / Receipt */}
                          <td className="py-3.5 px-3 text-center">
                            {deliveryType === 'drive_link' ? (
                              <div className="flex flex-col items-center justify-center gap-1.5">
                                <span className="bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold px-2.5 py-1 rounded inline-flex items-center gap-1 border border-emerald-300">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Drive Link Received</span>
                                </span>
                                {item.driveLinkUrl && (
                                  <a
                                    href={item.driveLinkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Open Link</span>
                                  </a>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1">
                                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.cardReceived}
                                    onChange={() => handleToggleCardReceived(item)}
                                    className="w-5 h-5 accent-[#BA8332] cursor-pointer rounded border-[#5C130F]/30"
                                  />
                                </label>
                                {item.cardReceived && item.cardReceivedAt && (
                                  <span 
                                    className="text-[9px] font-mono text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded"
                                    title={`Marked by: ${item.cardReceivedBy || 'Admin'}`}
                                  >
                                    {new Date(item.cardReceivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Touch Point Coverage Entry Modes */}
                          <td className="py-3.5 px-3 min-w-[240px]">
                            {deliveryType === 'drive_link' ? (
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono text-indigo-900 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                  Cloud Shot Report Mode
                                </span>
                                <p className="text-[10px] text-[#3A1A14]/70 font-serif italic">
                                  Coverage parsed from submitted shot report
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {/* Mode Switcher Header */}
                                <div className="flex items-center justify-between gap-1 pb-1 border-b border-[#5C130F]/10">
                                  <span className="text-[10px] font-mono font-bold text-[#5C130F] uppercase">
                                    Mode:
                                  </span>
                                  <div className="flex items-center gap-1 bg-[#5C130F]/10 p-0.5 rounded">
                                    <button
                                      type="button"
                                      onClick={() => handleSetTouchPointMode(item.id, 'exact')}
                                      className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded cursor-pointer transition-colors ${
                                        localState.mode === 'exact' ? 'bg-[#5C130F] text-white !text-white' : 'text-[#5C130F] hover:bg-white/60'
                                      }`}
                                    >
                                      Exact Touch Points
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSetTouchPointMode(item.id, 'percentage')}
                                      className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded cursor-pointer transition-colors ${
                                        localState.mode === 'percentage' ? 'bg-[#5C130F] text-white !text-white' : 'text-[#5C130F] hover:bg-white/60'
                                      }`}
                                    >
                                      Quick %
                                    </button>
                                  </div>
                                </div>

                                {/* Mode A: Exact Touch Points List */}
                                {localState.mode === 'exact' ? (
                                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                                    {selectedItem.touchPoints.map((tp, idx) => {
                                      const isChecked = localState.completedTouchPoints.includes(tp);
                                      return (
                                        <label 
                                          key={idx} 
                                          className="flex items-center gap-1.5 text-[11px] font-serif text-[#3A1A14] cursor-pointer hover:text-[#5C130F]"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleToggleTouchPoint(item.id, tp)}
                                            className="w-3.5 h-3.5 accent-[#BA8332] rounded"
                                          />
                                          <span className={isChecked ? 'font-bold text-[#5C130F]' : 'opacity-70'}>
                                            {tp}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  /* Mode B: Quick % Buttons */
                                  <div className="grid grid-cols-4 gap-1">
                                    {([25, 50, 75, 100] as const).map(pct => (
                                      <button
                                        key={pct}
                                        type="button"
                                        onClick={() => handleSetPercentOverride(item.id, pct)}
                                        className={`py-1 text-[10px] font-mono font-bold rounded cursor-pointer transition-colors border ${
                                          localState.percentOverride === pct
                                            ? 'bg-[#BA8332] text-white !text-white border-[#BA8332]'
                                            : 'bg-white/80 text-[#5C130F] border-[#5C130F]/20 hover:bg-[#BA8332]/10'
                                        }`}
                                      >
                                        {pct}%
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {/* Projected Star Rating Preview */}
                                <div className="pt-1 flex items-center justify-between text-[10px] font-mono bg-white/70 p-1.5 rounded border border-[#5C130F]/15">
                                  <span className="font-bold text-[#5C130F] flex items-center gap-1">
                                    <Star className="w-3 h-3 text-[#BA8332] fill-[#BA8332]" />
                                    <span>Projected: {projectedRating.goldStars} Gold</span>
                                  </span>
                                  <span className={projectedRating.isOnTime ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                                    {projectedRating.isOnTime ? '✓ On-Time' : '⚠ Late (+1 Red)'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Card Copied Action */}
                          <td className="py-3.5 px-3 text-center">
                            {deliveryType === 'drive_link' ? (
                              <span className="text-gray-400 font-mono text-sm">—</span>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1">
                                <label className={`inline-flex items-center gap-1.5 ${item.cardReceived ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}>
                                  <input
                                    type="checkbox"
                                    checked={item.cardCopied}
                                    disabled={!item.cardReceived}
                                    onChange={() => handleToggleCardCopied(item)}
                                    className="w-5 h-5 accent-emerald-600 cursor-pointer rounded border-[#5C130F]/30 disabled:cursor-not-allowed"
                                  />
                                </label>
                                {item.cardCopied && item.cardCopiedAt && (
                                  <span 
                                    className="text-[9px] font-mono text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded"
                                    title={`Copied by: ${item.cardCopiedBy || 'Admin'}`}
                                  >
                                    {new Date(item.cardCopiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Card Notes / Slot Input */}
                          <td className="py-3.5 px-4">
                            {deliveryType === 'drive_link' ? (
                              <span className="text-[10px] font-serif text-[#3A1A14]/60 italic">
                                Cloud link verified
                              </span>
                            ) : (
                              <input
                                type="text"
                                defaultValue={item.cardNotes || ''}
                                onBlur={(e) => handleUpdateCardNotes(item, e.target.value)}
                                placeholder={lang === 'en' ? 'e.g. Slot #4 / 128GB SD' : 'رقم الكارت / القرص...'}
                                className="w-full px-2.5 py-1.5 bg-[#FDFAF3] border border-[#5C130F]/20 rounded text-xs font-sans text-[#3A1A14] focus:outline-none focus:ring-1 focus:ring-[#BA8332]"
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
