import React, { useState } from 'react';
import { UserProfile, Assignment, Zone, Topic, MiqaatDef, MiqaatRequest, getUserRoles, hasRole, formatRoleBadgeLabel } from '../types';
import { translations, LanguageType } from '../utils/translations';
import { 
  Calendar, MapPin, Plus, Search, Check, AlertCircle, RefreshCw, X, Edit3, 
  Shield, UserCheck, CheckCircle2, Layers, Users, Clock, Send, CheckSquare, 
  Square, CalendarDays, HelpCircle, ChevronDown, ChevronUp, UserX
} from 'lucide-react';
import AvatarPlaceholder from './AvatarPlaceholder';
import BulkAddModal from './BulkAddModal';

interface CoverageAssignmentsViewProps {
  assignments: Assignment[];
  users: UserProfile[];
  zones: Zone[];
  topics: Topic[];
  miqaats?: MiqaatDef[];
  miqaatRequests?: MiqaatRequest[];
  lang: LanguageType;
  canAssignCoverage?: boolean;
  onAddAssignment?: (assignment: Omit<Assignment, 'id'>) => void;
  onUpdateAssignment?: (assignment: Assignment) => void;
  onReassignSlot?: (assignmentId: string, oldIts: string, newIts: string) => void;
  onAddMiqaat?: (name: string) => void;
  onAddZone?: (name: string) => void;
  onBulkAddZones?: (names: string[]) => void;
  onAddTopic?: (name: string) => void;
  onBulkAddTopics?: (names: string[]) => void;
  onAddMiqaatRequest?: (request: Omit<MiqaatRequest, 'id' | 'createdAt'>) => void;
  onRespondMiqaatRequest?: (requestId: string, itsNumber: string, status: 'accepted' | 'declined', declineReason?: string) => void;
}

export default function CoverageAssignmentsView({
  assignments,
  users,
  zones,
  topics,
  miqaats = [],
  miqaatRequests = [],
  lang,
  canAssignCoverage = true,
  onAddAssignment,
  onUpdateAssignment,
  onReassignSlot,
  onAddMiqaat,
  onAddZone,
  onBulkAddZones,
  onAddTopic,
  onBulkAddTopics,
  onAddMiqaatRequest,
  onRespondMiqaatRequest
}: CoverageAssignmentsViewProps) {
  const t = translations[lang];
  const approvedPVs = users.filter(u => u.status === 'approved' && !hasRole(u, 'admin'));

  // Modals state
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [isBulkAddZonesOpen, setIsBulkAddZonesOpen] = useState(false);
  const [isBulkAddTopicsOpen, setIsBulkAddTopicsOpen] = useState(false);
  const [expandedCardTopics, setExpandedCardTopics] = useState<Record<string, boolean>>({});

  // Searchable Roster Picker Modal State for Slot Reassignment
  const [reassignModalTarget, setReassignModalTarget] = useState<{ assignment: Assignment; oldIts: string } | null>(null);
  const [selectedReplacementIts, setSelectedReplacementIts] = useState('');
  const [reassignSearchQuery, setReassignSearchQuery] = useState('');

  // Form State for Dispatching / Editing Coverage
  const [assignDate, setAssignDate] = useState('2026-07-21');
  const [assignFromTime, setAssignFromTime] = useState('02:00 PM');
  const [assignToTime, setAssignToTime] = useState('05:00 PM');
  const [assignDeadlineDate, setAssignDeadlineDate] = useState('2026-07-21');
  const [assignDeadlineTime, setAssignDeadlineTime] = useState('08:00 PM');
  const [assignMiqaat, setAssignMiqaat] = useState(miqaats[0]?.name || 'Ashara Mubarakah 1448H');
  const [assignZone, setAssignZone] = useState(zones[0]?.name || '');
  const [assignTopics, setAssignTopics] = useState<string[]>(topics[0]?.name ? [topics[0].name] : []);
  const [assignUsers, setAssignUsers] = useState<string[]>([]);
  const [assignNotes, setAssignNotes] = useState('');

  // Assignment Mode Toggle: 'individual' vs 'mohalla'
  const [assignmentMode, setAssignmentMode] = useState<'individual' | 'mohalla'>('individual');
  const [selectedMohalla, setSelectedMohalla] = useState('');

  // Search & Inline Add States
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [topicSearchQuery, setTopicSearchQuery] = useState('');

  // Inline Add Input States
  const [isAddingInlineMiqaat, setIsAddingInlineMiqaat] = useState(false);
  const [newInlineMiqaat, setNewInlineMiqaat] = useState('');
  const [isAddingInlineZone, setIsAddingInlineZone] = useState(false);
  const [newInlineZone, setNewInlineZone] = useState('');
  const [isAddingInlineTopic, setIsAddingInlineTopic] = useState(false);
  const [newInlineTopic, setNewInlineTopic] = useState('');

  // Section toggle: 'active_coverage' vs 'miqaat_requests'
  const [activeSection, setActiveSection] = useState<'active_coverage' | 'miqaat_requests'>('active_coverage');

  // Miqaat Request creation & response view state
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [isNewMiqaatRequestModalOpen, setIsNewMiqaatRequestModalOpen] = useState(false);
  const [reqMiqaat, setReqMiqaat] = useState(miqaats[0]?.name || 'Ashara Mubarakah 1448H');
  const [reqFromDate, setReqFromDate] = useState('2026-07-01');
  const [reqToDate, setReqToDate] = useState('2026-07-05');
  const [reqNotes, setReqNotes] = useState('');
  const [reqSelectedIts, setReqSelectedIts] = useState<string[]>([]);
  const [reqMemberSearch, setReqMemberSearch] = useState('');
  const [isAddingReqInlineMiqaat, setIsAddingReqInlineMiqaat] = useState(false);
  const [newReqInlineMiqaat, setNewReqInlineMiqaat] = useState('');

  // Context for prefilled assignment from accepted member
  const [miqaatRequestContext, setMiqaatRequestContext] = useState<{
    fromDate: string;
    toDate: string;
    miqaatName: string;
    memberName: string;
    itsNumber: string;
  } | null>(null);

  // Extract unique Mohallas from approved team
  const availableMohallas = Array.from(new Set(approvedPVs.map(u => u.mohalla || u.cityDomicile).filter(Boolean))) as string[];

  // Helper for Touch points
  const getAssignmentTouchPoints = (as: Assignment): string[] => {
    if (Array.isArray(as.topics) && as.topics.length > 0) return as.topics;
    if (typeof as.topic === 'string') return [as.topic];
    if (Array.isArray(as.topic)) return as.topic;
    return [];
  };

  const handleOpenCreateModal = () => {
    setEditingAssignmentId(null);
    setMiqaatRequestContext(null);
    setAssignDate('2026-07-21');
    setAssignFromTime('02:00 PM');
    setAssignToTime('05:00 PM');
    setAssignDeadlineDate('2026-07-21');
    setAssignDeadlineTime('08:00 PM');
    setAssignMiqaat(miqaats[0]?.name || 'Ashara Mubarakah 1448H');
    setAssignZone(zones[0]?.name || '');
    setAssignTopics(topics[0]?.name ? [topics[0].name] : []);
    setAssignUsers([]);
    setAssignNotes('');
    setAssignmentMode('individual');
    setSelectedMohalla('');
    setMemberSearchQuery('');
    setTopicSearchQuery('');
    setIsAddingInlineMiqaat(false);
    setIsAddingInlineZone(false);
    setIsAddingInlineTopic(false);
    setIsAssignmentModalOpen(true);
  };

  const handleOpenEditModal = (as: Assignment) => {
    setEditingAssignmentId(as.id);
    setMiqaatRequestContext(null);
    setAssignDate(as.date || '2026-07-21');
    setAssignFromTime(as.fromTime || '02:00 PM');
    setAssignToTime(as.toTime || '05:00 PM');
    setAssignDeadlineDate(as.dataCopyingDeadlineDate || as.date || '2026-07-21');
    setAssignDeadlineTime(as.dataCopyingDeadlineTime || '08:00 PM');
    setAssignMiqaat(as.miqaatName || miqaats[0]?.name || 'Ashara Mubarakah 1448H');
    setAssignZone(as.zone || zones[0]?.name || '');
    setAssignTopics(getAssignmentTouchPoints(as));
    setAssignUsers([...as.assignedUsers]);
    setAssignNotes(as.notes || '');
    setAssignmentMode('individual');
    setSelectedMohalla('');
    setMemberSearchQuery('');
    setTopicSearchQuery('');
    setIsAddingInlineMiqaat(false);
    setIsAddingInlineZone(false);
    setIsAddingInlineTopic(false);
    setIsAssignmentModalOpen(true);
  };

  const handleAssignCoverageFromAcceptedMember = (request: MiqaatRequest, memberIts: string) => {
    const member = users.find(u => u.itsNumber === memberIts);
    const memberName = member?.fullName || memberIts;

    setEditingAssignmentId(null);
    setAssignDate(request.fromDate);
    setAssignFromTime('02:00 PM');
    setAssignToTime('05:00 PM');
    setAssignDeadlineDate(request.fromDate);
    setAssignDeadlineTime('08:00 PM');
    setAssignMiqaat(request.miqaatName);
    setAssignZone(zones[0]?.name || '');
    setAssignTopics(topics[0]?.name ? [topics[0].name] : []);
    setAssignUsers([memberIts]);
    setAssignNotes('');
    setAssignmentMode('individual');
    setSelectedMohalla('');
    setMemberSearchQuery('');
    setTopicSearchQuery('');
    setIsAddingInlineMiqaat(false);
    setIsAddingInlineZone(false);
    setIsAddingInlineTopic(false);

    setMiqaatRequestContext({
      fromDate: request.fromDate,
      toDate: request.toDate,
      miqaatName: request.miqaatName,
      memberName,
      itsNumber: memberIts
    });

    setIsAssignmentModalOpen(true);
  };

  const handleOpenNewMiqaatRequestModal = () => {
    setReqMiqaat(miqaats[0]?.name || 'Ashara Mubarakah 1448H');
    setReqFromDate('2026-07-01');
    setReqToDate('2026-07-05');
    setReqNotes('');
    setReqSelectedIts([]);
    setReqMemberSearch('');
    setIsAddingReqInlineMiqaat(false);
    setIsNewMiqaatRequestModalOpen(true);
  };

  const handleSelectAllPhotographers = () => {
    const pIts = approvedPVs.filter(u => hasRole(u, 'photographer')).map(u => u.itsNumber);
    setReqSelectedIts(prev => Array.from(new Set([...prev, ...pIts])));
  };

  const handleSelectAllVideographers = () => {
    const vIts = approvedPVs.filter(u => hasRole(u, 'videographer')).map(u => u.itsNumber);
    setReqSelectedIts(prev => Array.from(new Set([...prev, ...vIts])));
  };

  const handleSelectAllMembers = () => {
    setReqSelectedIts(approvedPVs.map(u => u.itsNumber));
  };

  const handleClearAllSelected = () => {
    setReqSelectedIts([]);
  };

  const handleToggleReqMember = (its: string) => {
    setReqSelectedIts(prev => 
      prev.includes(its) ? prev.filter(i => i !== its) : [...prev, its]
    );
  };

  const handleCreateReqInlineMiqaat = () => {
    const trimmed = newReqInlineMiqaat.trim();
    if (!trimmed) return;
    if (onAddMiqaat) {
      onAddMiqaat(trimmed);
    }
    setReqMiqaat(trimmed);
    setNewReqInlineMiqaat('');
    setIsAddingReqInlineMiqaat(false);
  };

  const handleCreateMiqaatRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqMiqaat.trim()) {
      alert(lang === 'en' ? 'Please select or enter a Miqaat name.' : 'يرجى اختيار أو إدخال اسم الميقات.');
      return;
    }
    if (!reqFromDate || !reqToDate) {
      alert(lang === 'en' ? 'Please select both From and To dates.' : 'يرجى اختيار تاريخ البداية والنهاية.');
      return;
    }
    if (reqFromDate > reqToDate) {
      alert(lang === 'en' ? 'From Date cannot be later than To Date.' : 'تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية.');
      return;
    }
    if (reqSelectedIts.length === 0) {
      alert(lang === 'en' ? 'Please select at least one member to request availability from.' : 'يرجى اختيار عضو واحد على الأقل لإرسال طلب التفرغ.');
      return;
    }

    const memberResponses: Record<string, any> = {};
    reqSelectedIts.forEach(its => {
      memberResponses[its] = {
        itsNumber: its,
        status: 'pending'
      };
    });

    if (onAddMiqaatRequest) {
      onAddMiqaatRequest({
        miqaatName: reqMiqaat.trim(),
        fromDate: reqFromDate,
        toDate: reqToDate,
        notes: reqNotes.trim() || undefined,
        memberResponses
      });
    }

    setIsNewMiqaatRequestModalOpen(false);
    alert(lang === 'en' ? `Miqaat Request sent to ${reqSelectedIts.length} member(s)!` : `تم إرسال طلب الميقات إلى ${reqSelectedIts.length} من الأعضاء!`);
  };

  const handleSaveAssignment = () => {
    if (!assignZone) {
      alert(lang === 'en' ? 'Please select a coverage zone.' : 'يرجى اختيار منطقة التغطية.');
      return;
    }
    if (assignTopics.length === 0) {
      alert(lang === 'en' ? 'Please select at least one touch point.' : 'يرجى اختيار نقطة تغطية واحدة على الأقل.');
      return;
    }
    if (assignUsers.length === 0) {
      alert(lang === 'en' ? 'Please select at least one team member.' : 'يرجى اختيار عضو فريق واحد على الأقل.');
      return;
    }

    if (editingAssignmentId) {
      // Edit existing assignment
      if (onUpdateAssignment) {
        const existing = assignments.find(a => a.id === editingAssignmentId);
        if (existing) {
          onUpdateAssignment({
            ...existing,
            date: assignDate,
            fromTime: assignFromTime.trim() || undefined,
            toTime: assignToTime.trim() || undefined,
            dataCopyingDeadlineDate: assignDeadlineDate.trim() || assignDate,
            dataCopyingDeadlineTime: assignDeadlineTime.trim() || undefined,
            miqaatName: assignMiqaat,
            zone: assignZone,
            topic: assignTopics[0] || 'General Coverage',
            topics: assignTopics,
            assignedUsers: assignUsers,
            notes: assignNotes
          });
        }
      }
    } else {
      // Create new assignment
      if (onAddAssignment) {
        onAddAssignment({
          date: assignDate,
          fromTime: assignFromTime.trim() || undefined,
          toTime: assignToTime.trim() || undefined,
          dataCopyingDeadlineDate: assignDeadlineDate.trim() || assignDate,
          dataCopyingDeadlineTime: assignDeadlineTime.trim() || undefined,
          miqaatName: assignMiqaat,
          zone: assignZone,
          topic: assignTopics[0] || 'General Coverage',
          topics: assignTopics,
          assignedUsers: assignUsers,
          notes: assignNotes,
          status: 'active'
        });
      }
    }

    setIsAssignmentModalOpen(false);
    setEditingAssignmentId(null);
    setAssignUsers([]);
    setAssignNotes('');
  };

  const handleCreateInlineMiqaat = () => {
    const trimmed = newInlineMiqaat.trim();
    if (!trimmed) return;
    if (onAddMiqaat) {
      onAddMiqaat(trimmed);
    }
    setAssignMiqaat(trimmed);
    setNewInlineMiqaat('');
    setIsAddingInlineMiqaat(false);
  };

  const handleCreateInlineZone = () => {
    const trimmed = newInlineZone.trim();
    if (!trimmed) return;
    if (onAddZone) {
      onAddZone(trimmed);
    }
    setAssignZone(trimmed);
    setNewInlineZone('');
    setIsAddingInlineZone(false);
  };

  const handleCreateInlineTopic = () => {
    const trimmed = newInlineTopic.trim();
    if (!trimmed) return;
    if (onAddTopic) {
      onAddTopic(trimmed);
    }
    if (!assignTopics.includes(trimmed)) {
      setAssignTopics(prev => [...prev, trimmed]);
    }
    setNewInlineTopic('');
    setIsAddingInlineTopic(false);
  };

  return (
    <div className="editorial-card-dense p-6 sm:p-8 space-y-6">
      
      {/* Top Segment Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#5C130F]/20 pb-4">
        <div className="flex items-center gap-1.5 p-1 bg-[#5C130F]/10 rounded-lg w-fit border border-[#5C130F]/20">
          <button
            type="button"
            onClick={() => setActiveSection('active_coverage')}
            className={`px-4 py-2 font-sans text-xs font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer flex items-center gap-2 ${
              activeSection === 'active_coverage'
                ? 'bg-[#5C130F] !text-white shadow-xs'
                : 'text-[#5C130F] hover:bg-[#5C130F]/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Active Coverage' : 'التغطية الحالية'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeSection === 'active_coverage' ? 'bg-white/20 text-white' : 'bg-[#5C130F]/15 text-[#5C130F]'
            }`}>
              {assignments.length}
            </span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveSection('miqaat_requests')}
            className={`px-4 py-2 font-sans text-xs font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer flex items-center gap-2 ${
              activeSection === 'miqaat_requests'
                ? 'bg-[#5C130F] !text-white shadow-xs'
                : 'text-[#5C130F] hover:bg-[#5C130F]/10'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Miqaat Requests' : 'طلبات الميقات'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeSection === 'miqaat_requests' ? 'bg-white/20 text-white' : 'bg-[#5C130F]/15 text-[#5C130F]'
            }`}>
              {miqaatRequests.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeSection === 'active_coverage' && canAssignCoverage && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-[#BA8332] hover:bg-[#a06e28] text-white !text-white font-sans text-xs font-semibold rounded-none flex items-center gap-1.5 transition-all shadow-sm cursor-pointer uppercase tracking-wider"
            >
              <Plus className="w-4 h-4 text-[#5C130F] shrink-0" />
              <span className="text-white !text-white">{lang === 'en' ? 'New Coverage' : 'تغطية جديدة'}</span>
            </button>
          )}

          {activeSection === 'miqaat_requests' && canAssignCoverage && (
            <button
              type="button"
              onClick={handleOpenNewMiqaatRequestModal}
              className="px-4 py-2 bg-[#BA8332] hover:bg-[#a06e28] text-white !text-white font-sans text-xs font-semibold rounded-none flex items-center gap-1.5 transition-all shadow-sm cursor-pointer uppercase tracking-wider"
            >
              <Plus className="w-4 h-4 text-[#5C130F] shrink-0" />
              <span className="text-white !text-white">{lang === 'en' ? 'New Miqaat Request' : 'طلب ميقات جديد'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: ACTIVE COVERAGE ROSTERS */}
      {activeSection === 'active_coverage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#5C130F]">
                {lang === 'en' ? 'Active Coverage Rosters' : 'قوائم التغطية الحيوية الجارية'}
              </h3>
              <p className="text-xs text-[#3A1A14]/80 font-sans mt-0.5">
                {lang === 'en' ? 'Manage and monitor coverage across all active Miqaat zones.' : 'إدارة ومراقبة التغطية الميدانية عبر جميع مناطق الميقات الحيوية.'}
              </p>
            </div>
            <span className="bg-editorial-ink text-white text-xs font-sans px-3 py-1.5 rounded-none font-semibold">
              <span className="font-mono">{assignments.length}</span> Total
            </span>
          </div>

          <div className="space-y-4 max-h-[calc(100vh-320px)] min-h-[400px] overflow-y-auto pr-2">
            {assignments.length === 0 ? (
              <div className="py-16 text-center text-[#3A1A14]/60 bg-white/30 border border-[#5C130F]/15 p-8">
                <Calendar className="w-12 h-12 text-[#BA8332] mx-auto mb-3" />
                <p className="text-base font-serif font-semibold text-[#5C130F]">
                  {lang === 'en' ? 'No active coverage assignments scheduled.' : 'لا توجد تكليفات تغطية مجدولة حالياً.'}
                </p>
                {canAssignCoverage && (
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="mt-4 px-4 py-2 bg-[#BA8332] hover:bg-[#a06e28] text-white !text-white font-sans text-xs font-semibold uppercase rounded-none cursor-pointer flex items-center gap-1.5 mx-auto shadow-xs"
                  >
                    <Plus className="w-4 h-4 text-[#5C130F] shrink-0" />
                    <span className="text-white !text-white">{lang === 'en' ? 'Schedule First Coverage' : 'جدولة التغطية الأولى'}</span>
                  </button>
                )}
              </div>
            ) : (
              assignments.map((as) => (
                <div key={as.id} className="p-5 border border-[#5C130F]/20 rounded-xl flex flex-col gap-3.5 hover:bg-[#BA8332]/10 transition-colors bg-white/40 shadow-xs">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-[#5C130F] !text-white text-[10px] font-mono px-2.5 py-0.5 rounded-md font-bold">
                          {as.date}
                        </span>
                        {as.miqaatName && (
                          <span className="bg-[#BA8332] !text-white text-[10px] font-mono px-2.5 py-0.5 rounded-md font-bold">
                            {as.miqaatName}
                          </span>
                        )}
                        {(as.fromTime || as.toTime) && (
                          <span className="bg-[#5C130F]/10 text-[#5C130F] text-[10px] font-mono px-2 py-0.5 rounded-md font-bold">
                            {as.fromTime || '—'} – {as.toTime || '—'}
                          </span>
                        )}
                        {(as.dataCopyingDeadlineDate || as.dataCopyingDeadlineTime) && (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-md font-bold" title="Data Copying Deadline">
                            Deadline: {as.dataCopyingDeadlineDate || as.date} {as.dataCopyingDeadlineTime || ''}
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif text-lg font-semibold text-[#5C130F] mt-1.5">
                        {Array.isArray(as.topic) ? as.topic.join(', ') : as.topic}
                      </h4>
                      <p className="text-xs text-[#3A1A14]/80 flex items-center gap-1 mt-1 font-sans">
                        <MapPin className="w-3.5 h-3.5 text-[#BA8332] shrink-0" />
                        <span>{as.zone}</span>
                      </p>

                      {/* Multi-Touch Point Tag Chips */}
                      {(() => {
                        const rawTouchPoints = getAssignmentTouchPoints(as);
                        if (rawTouchPoints.length === 0) return null;
                        const isExpanded = !!expandedCardTopics[as.id];
                        const visibleTouchPoints = isExpanded ? rawTouchPoints : rawTouchPoints.slice(0, 3);
                        const hiddenCount = rawTouchPoints.length - 3;

                        return (
                          <div className="mt-2.5 space-y-1">
                            <span className="text-[10px] font-sans font-semibold text-[#5C130F] uppercase tracking-wider block">
                              {lang === 'en' ? 'Touch Points:' : 'نقاط التغطية:'}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {visibleTouchPoints.map((tp, idx) => (
                                <span
                                  key={idx}
                                  className="bg-[#BA8332]/15 text-[#5C130F] border border-[#BA8332]/35 text-[11px] font-sans font-medium px-2 py-0.5 rounded-md"
                                >
                                  {tp}
                                </span>
                              ))}

                              {rawTouchPoints.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedCardTopics(prev => ({ ...prev, [as.id]: !prev[as.id] }))}
                                  className="bg-[#5C130F] !text-white text-[10px] font-sans font-semibold px-2 py-0.5 rounded-md hover:bg-[#3A1A14] transition-all cursor-pointer"
                                >
                                  {isExpanded
                                    ? (lang === 'en' ? 'Show less' : 'عرض أقل')
                                    : `+${hiddenCount} ${lang === 'en' ? 'more' : 'المزيد'}`}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-2">
                      {canAssignCoverage && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(as)}
                          className="px-3 py-1 bg-[#5C130F]/10 hover:bg-[#5C130F] active:bg-[#5C130F] rounded-md transition-colors border border-[#5C130F]/20 flex items-center gap-1 cursor-pointer group"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#5C130F] group-hover:!text-[#F3E6D0] group-active:!text-[#F3E6D0] transition-colors" />
                          <span className="text-[#5C130F] group-hover:!text-[#F3E6D0] group-active:!text-[#F3E6D0] text-[11px] font-sans font-semibold transition-colors">
                            {lang === 'en' ? 'Edit Assignment' : 'تعديل التكليف'}
                          </span>
                        </button>
                      )}

                      <span className={`text-[10px] font-semibold font-sans uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        as.status === 'completed' ? 'bg-[#5C130F] !text-white border border-[#5C130F]' : 'bg-[#BA8332]/15 text-[#5C130F] border border-[#BA8332]/30 animate-pulse'
                      }`}>
                        {as.status}
                      </span>
                    </div>
                  </div>

                  {as.notes && (
                    <p className="text-xs text-[#3A1A14]/85 bg-white/60 p-3 rounded-md border border-[#5C130F]/20 font-sans">
                      {as.notes}
                    </p>
                  )}

                  {/* Assigned PV list with Individual Status Tags & Slot Reassignment */}
                  <div className="space-y-2 border-t border-[#5C130F]/15 pt-3">
                    <span className="text-[10px] text-[#5C130F] font-sans font-semibold uppercase tracking-wider block">
                      {lang === 'en' ? 'ASSIGNED TEAM STATUS:' : 'حالة أعضاء الفريق المكلف:'}
                    </span>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      {as.assignedUsers.map(its => {
                        const matchedUser = users.find(u => u.itsNumber === its);
                        const memberStatus = (as.memberStatuses && as.memberStatuses[its]) || 'pending';

                        return (
                          <div key={its} className="flex flex-col gap-1.5 bg-white border border-[#5C130F]/20 p-2.5 rounded-lg shadow-2xs min-w-[210px]">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <AvatarPlaceholder src={matchedUser?.avatarUrl} alt={matchedUser?.fullName} sizeClassName="w-6 h-6 shrink-0" iconSizeClassName="w-3.5 h-3.5" />
                                <div className="min-w-0">
                                  <span className="font-serif font-semibold text-[#5C130F] text-xs truncate block">
                                    {matchedUser ? matchedUser.fullName : its}
                                  </span>
                                  <span className="text-[9px] font-mono text-[#3A1A14]/70 block">ITS: {its}</span>
                                </div>
                              </div>

                              {/* Member Status Tag */}
                              <span className={`text-[9px] font-sans font-semibold uppercase px-1.5 py-0.5 shrink-0 rounded ${
                                memberStatus === 'accepted'
                                  ? 'bg-[#4F6B57] text-[#F3E6D0]'
                                  : memberStatus === 'declined'
                                  ? 'bg-[#8C3B32] text-[#F3E6D0]'
                                  : 'bg-[#B8893B] text-[#F3E6D0]'
                              }`}>
                                {memberStatus === 'accepted' ? 'Confirmed' : memberStatus === 'declined' ? 'Declined' : 'Pending'}
                              </span>
                            </div>

                            {/* Reassign Slot Action Button (When Member Declined) */}
                            {memberStatus === 'declined' && onReassignSlot && canAssignCoverage && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReassignModalTarget({ assignment: as, oldIts: its });
                                  setSelectedReplacementIts('');
                                  setReassignSearchQuery('');
                                }}
                                className="mt-1 w-full py-1 bg-[#8C3B32] hover:bg-[#6E2824] text-[#F3E6D0] font-sans text-[9px] font-semibold uppercase cursor-pointer text-center rounded flex items-center justify-center gap-1 shadow-xs"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>{lang === 'en' ? 'Reassign Slot' : 'إعادة تكليف'}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: MIQAAT REQUESTS (AVAILABILITY WORKFLOW) */}
      {activeSection === 'miqaat_requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#5C130F]">
                {lang === 'en' ? 'Miqaat Requests' : 'طلبات التفرغ للميقات'}
              </h3>
              <p className="text-xs text-[#3A1A14]/80 font-sans mt-0.5">
                {lang === 'en' 
                  ? 'Request, track, and review member availability across upcoming Miqaats.' 
                  : 'إرسال ومتابعة واستعراض تفرغ الأعضاء للمناسبات والميقات القادم.'}
              </p>
            </div>
            <span className="bg-editorial-ink text-white text-xs font-sans px-3 py-1.5 rounded-none font-semibold">
              <span className="font-mono">{miqaatRequests.length}</span> Total
            </span>
          </div>

          <div className="space-y-4 max-h-[calc(100vh-320px)] min-h-[400px] overflow-y-auto pr-2">
            {miqaatRequests.length === 0 ? (
              <div className="py-16 text-center text-[#3A1A14]/60 bg-white/30 border border-[#5C130F]/15 p-8">
                <CalendarDays className="w-12 h-12 text-[#BA8332] mx-auto mb-3" />
                <p className="text-base font-serif font-semibold text-[#5C130F]">
                  {lang === 'en' ? 'No Miqaat Requests created yet.' : 'لا توجد طلبات ميقات مسجلة حالياً.'}
                </p>
                <p className="text-xs text-[#3A1A14]/70 font-sans mt-1 max-w-md mx-auto">
                  {lang === 'en'
                    ? 'Create a Miqaat Request to ask photographers and videographers for their availability over a specific date range.'
                    : 'أنشئ طلب ميقات لطلب التفرغ الميداني من المصورين عبر فترة زمنية محددة.'}
                </p>
                {canAssignCoverage && (
                  <button
                    type="button"
                    onClick={handleOpenNewMiqaatRequestModal}
                    className="mt-4 px-4 py-2 bg-[#BA8332] hover:bg-[#a06e28] text-white !text-white font-sans text-xs font-semibold uppercase rounded-none cursor-pointer flex items-center gap-1.5 mx-auto shadow-xs"
                  >
                    <Plus className="w-4 h-4 text-[#5C130F] shrink-0" />
                    <span className="text-white !text-white">{lang === 'en' ? 'Create First Miqaat Request' : 'إنشاء أول طلب ميقات'}</span>
                  </button>
                )}
              </div>
            ) : (
              miqaatRequests.map((req) => {
                const totalRequested = Object.keys(req.memberResponses || {}).length;
                const acceptedCount = Object.values(req.memberResponses || {}).filter((r: any) => r.status === 'accepted').length;
                const declinedCount = Object.values(req.memberResponses || {}).filter((r: any) => r.status === 'declined').length;
                const pendingCount = Object.values(req.memberResponses || {}).filter((r: any) => !r.status || r.status === 'pending').length;
                const isExpanded = expandedRequestId === req.id;

                return (
                  <div key={req.id} className="p-5 border border-[#5C130F]/20 rounded-xl flex flex-col gap-4 bg-white/50 hover:bg-[#BA8332]/5 transition-all shadow-xs">
                    
                    {/* Request Top Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-[#5C130F] text-white text-[11px] font-sans px-2.5 py-0.5 rounded-md font-semibold uppercase tracking-wider">
                            {req.miqaatName}
                          </span>
                          <span className="bg-[#BA8332]/15 text-[#5C130F] border border-[#BA8332]/35 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#BA8332]" />
                            <span>{req.fromDate} — {req.toDate}</span>
                          </span>
                        </div>

                        {req.notes && (
                          <p className="text-xs text-[#3A1A14]/80 font-sans italic mt-1">
                            "{req.notes}"
                          </p>
                        )}
                      </div>

                      {/* Summary Metrics Pills */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-[#5C130F]/10 text-[#5C130F] border border-[#5C130F]/20 text-[10px] font-sans px-2.5 py-1 rounded-md font-semibold">
                          Requested: <span className="font-mono">{totalRequested}</span>
                        </span>
                        <span className="bg-[#4F6B57]/12 text-[#3A5341] border border-[#4F6B57]/30 text-[10px] font-sans px-2.5 py-1 rounded-md font-semibold">
                          Accepted: <span className="font-mono">{acceptedCount}</span>
                        </span>
                        <span className="bg-[#8C3B32]/12 text-[#7A302C] border border-[#8C3B32]/30 text-[10px] font-sans px-2.5 py-1 rounded-md font-semibold">
                          Declined: <span className="font-mono">{declinedCount}</span>
                        </span>
                        <span className="bg-[#B8893B]/12 text-[#8F6423] border border-[#B8893B]/30 text-[10px] font-sans px-2.5 py-1 rounded-md font-semibold">
                          Pending: <span className="font-mono">{pendingCount}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}
                          className="px-3 py-1.5 bg-[#5C130F] text-[#F3E6D0] hover:bg-[#3A1A14] text-xs font-sans font-semibold uppercase rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <span>{isExpanded ? (lang === 'en' ? 'Hide Responses' : 'إخفاء الردود') : (lang === 'en' ? 'View Responses' : 'عرض الردود')}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#F3E6D0]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#F3E6D0]" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Member Responses Panel */}
                    {isExpanded && (
                      <div className="mt-2 pt-4 border-t border-[#5C130F]/15 space-y-3 animate-fadeIn">
                        <div className="flex items-center justify-between gap-3">
                          <h5 className="font-sans text-xs font-semibold text-[#5C130F] uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#BA8332]" />
                            <span>{lang === 'en' ? 'Member Availability Status' : 'حالة تفرغ الأعضاء'}</span>
                          </h5>
                          <span className="text-[10px] font-sans text-[#3A1A14]/70">
                            <span className="font-mono">{acceptedCount}</span> of <span className="font-mono">{totalRequested}</span> Available
                          </span>
                        </div>

                        <div className="divide-y divide-[#5C130F]/10 border border-[#5C130F]/20 rounded-lg bg-white overflow-hidden shadow-2xs">
                          {Object.entries(req.memberResponses || {}).map(([its, resp]: [string, any]) => {
                            const matchedUser = users.find(u => u.itsNumber === its);
                            const status = resp.status || 'pending';

                            return (
                              <div key={its} className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FDFAF3] transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                  <AvatarPlaceholder src={matchedUser?.avatarUrl} alt={matchedUser?.fullName} sizeClassName="w-8 h-8 shrink-0" iconSizeClassName="w-4 h-4" />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-serif font-bold text-xs text-[#5C130F] truncate">
                                        {matchedUser ? matchedUser.fullName : its}
                                      </span>
                                      {matchedUser && (
                                        <span className="text-[9px] font-mono bg-[#5C130F]/10 text-[#5C130F] px-1.5 py-0.2 rounded font-bold">
                                          {formatRoleBadgeLabel(matchedUser)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#3A1A14]/70">
                                      <span>ITS: {its}</span>
                                      {matchedUser?.mohalla && <span>• {matchedUser.mohalla}</span>}
                                      {resp.respondedAt && (
                                        <span>• Responded: {new Date(resp.respondedAt).toLocaleDateString()}</span>
                                      )}
                                    </div>
                                    {status === 'declined' && resp.declineReason && (
                                      <p className="text-[11px] font-serif text-[#8C3B32] italic mt-0.5">
                                        Reason: {resp.declineReason}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                                  {/* Status Pill */}
                                  <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-md flex items-center gap-1 ${
                                    status === 'accepted'
                                      ? 'bg-[#3E7458] text-white !text-white'
                                      : status === 'declined'
                                      ? 'bg-[#A13F36] text-white !text-white'
                                      : 'bg-[#BA8332] text-white !text-white'
                                  }`}>
                                    {status === 'accepted' ? (
                                      <>
                                        <Check className="w-3 h-3 text-white" />
                                        <span className="text-white !text-white">Available</span>
                                      </>
                                    ) : status === 'declined' ? (
                                      <>
                                        <UserX className="w-3 h-3 text-white" />
                                        <span className="text-white !text-white">Declined</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-3 h-3 text-white" />
                                        <span className="text-white !text-white">Pending</span>
                                      </>
                                    )}
                                  </span>

                                  {/* Assign Coverage Button (for Accepted Members) */}
                                  {status === 'accepted' && canAssignCoverage && (
                                    <button
                                      type="button"
                                      onClick={() => handleAssignCoverageFromAcceptedMember(req, its)}
                                      className="px-3 py-1 bg-[#BA8332] hover:bg-[#a06e28] text-white !text-white text-[11px] font-mono font-bold rounded-md flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                      title="Open Coverage Assignment form with pre-filled member and Miqaat context"
                                    >
                                      <Plus className="w-3.5 h-3.5 text-[#5C130F] shrink-0" />
                                      <span className="text-white !text-white">{lang === 'en' ? 'Assign Coverage' : 'تكليف تغطية'}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* UNIFIED CREATE / EDIT COVERAGE ASSIGNMENT MODAL (SINGLE SOURCE OF TRUTH FOR ADMIN & HR) */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FDFAF3] border-2 border-[#5C130F] rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#5C130F]/20 pb-4">
              <div>
                <h3 className="font-serif font-bold text-xl text-[#5C130F] flex items-center gap-2">
                  {editingAssignmentId ? <Edit3 className="w-5 h-5 text-[#BA8332]" /> : <Plus className="w-5 h-5 text-[#BA8332]" />}
                  <span>
                    {editingAssignmentId 
                      ? (lang === 'en' ? 'Edit Coverage Assignment' : 'تعديل تكليف التغطية')
                      : (lang === 'en' ? 'Schedule New Zone Coverage' : 'إرسال تكليف تغطية جديد')}
                  </span>
                </h3>
                <p className="text-xs text-[#3A1A14]/75 font-serif mt-0.5">
                  Assign photographers/videographers to coverage zones and touch points.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAssignmentModalOpen(false);
                  setEditingAssignmentId(null);
                }}
                className="p-1 text-[#5C130F]/60 hover:text-[#5C130F] hover:bg-[#5C130F]/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-5 text-xs font-serif">
              
              {/* Miqaat Request Context Banner (if pre-filled from an accepted Miqaat Request) */}
              {miqaatRequestContext && (
                <div className="p-3 bg-[#BA8332]/10 border border-[#BA8332]/35 rounded-lg flex items-center justify-between text-[#5C130F]">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#BA8332] shrink-0" />
                    <span className="font-serif text-xs">
                      Assigning coverage for <strong>{miqaatRequestContext.memberName}</strong> (ITS: {miqaatRequestContext.itsNumber}) based on confirmed availability for <strong>{miqaatRequestContext.miqaatName}</strong> ({miqaatRequestContext.fromDate} to {miqaatRequestContext.toDate}).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMiqaatRequestContext(null)}
                    className="text-[10px] font-mono text-[#5C130F]/70 hover:text-[#5C130F] underline shrink-0 cursor-pointer"
                  >
                    Clear Context
                  </button>
                </div>
              )}

              {/* Date Range Validation Warning */}
              {miqaatRequestContext && (assignDate < miqaatRequestContext.fromDate || assignDate > miqaatRequestContext.toDate) && (
                <div className="p-3.5 bg-amber-500/15 border-2 border-amber-500/50 rounded-lg flex items-start gap-2.5 text-amber-900 shadow-2xs">
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-mono text-xs font-bold uppercase tracking-wider text-amber-900">
                      {lang === 'en' ? 'Date Outside Accepted Miqaat Availability' : 'التاريخ خارج فترة التفرغ المقبولة للميقات'}
                    </p>
                    <p className="text-xs font-serif mt-0.5 text-amber-950/90 leading-relaxed">
                      {lang === 'en'
                        ? `This assignment date (${assignDate}) is outside the member's accepted Miqaat availability period (${miqaatRequestContext.fromDate} to ${miqaatRequestContext.toDate}).`
                        : `تاريخ التكليف هذا (${assignDate}) يقع خارج فترة التفرغ المقبولة للعضو (${miqaatRequestContext.fromDate} إلى ${miqaatRequestContext.toDate}).`}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono font-bold text-[#5C130F] block mb-1">Event Date:</label>
                  <input
                    type="date"
                    value={assignDate}
                    onChange={(e) => {
                      setAssignDate(e.target.value);
                      if (!assignDeadlineDate || assignDeadlineDate === assignDate) {
                        setAssignDeadlineDate(e.target.value);
                      }
                    }}
                    className="w-full p-2 border border-[#5C130F]/30 bg-white rounded-md font-mono text-xs"
                  />
                </div>

                {/* 1. Miqaat Event field with "+ Add new" inline option */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-mono font-bold text-[#5C130F]">Miqaat Event / Name:</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingInlineMiqaat(!isAddingInlineMiqaat)}
                      className="text-[10px] font-mono text-[#BA8332] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAddingInlineMiqaat ? 'Cancel' : 'Add new'}</span>
                    </button>
                  </div>

                  {!isAddingInlineMiqaat ? (
                    <select
                      value={assignMiqaat}
                      onChange={(e) => setAssignMiqaat(e.target.value)}
                      className="w-full p-2 border border-[#5C130F]/30 bg-white rounded-md font-serif text-xs"
                    >
                      {(miqaats.length > 0 ? miqaats : [{ id: 'm1', name: 'Ashara Mubarakah 1448H' }]).map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5 animate-fadeIn">
                      <input
                        type="text"
                        value={newInlineMiqaat}
                        onChange={(e) => setNewInlineMiqaat(e.target.value)}
                        placeholder="Enter new Miqaat name..."
                        className="flex-1 p-2 border border-[#BA8332] bg-white rounded-md font-serif text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleCreateInlineMiqaat}
                        className="px-3 py-2 bg-[#BA8332] hover:bg-[#a06e28] text-white font-sans text-xs font-semibold rounded-md cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Timing & Data Copying Deadline Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-[#FDFAF3] border border-[#5C130F]/15 rounded-lg shadow-2xs">
                {/* Event Time */}
                <div className="space-y-1.5">
                  <label className="font-sans font-semibold text-[#5C130F] text-[11px] uppercase tracking-wider block">
                    Event Time (Start & End):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-sans font-medium text-[#5C130F]/70 block">From Time</span>
                      <input
                        type="text"
                        value={assignFromTime}
                        onChange={(e) => setAssignFromTime(e.target.value)}
                        placeholder="02:00 PM"
                        className="w-full p-2 border border-[#5C130F]/30 bg-white rounded-md font-mono text-xs text-[#3A1A14]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-sans font-medium text-[#5C130F]/70 block">To Time</span>
                      <input
                        type="text"
                        value={assignToTime}
                        onChange={(e) => setAssignToTime(e.target.value)}
                        placeholder="05:00 PM"
                        className="w-full p-2 border border-[#5C130F]/30 bg-white rounded-md font-mono text-xs text-[#3A1A14]"
                      />
                    </div>
                  </div>
                </div>

                {/* Data Copying Deadline */}
                <div className="space-y-1.5">
                  <label className="font-sans font-semibold text-[#BA8332] text-[11px] uppercase tracking-wider block">
                    Data Copying Deadline:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-sans font-medium text-[#5C130F]/70 block">Deadline Date</span>
                      <input
                        type="date"
                        value={assignDeadlineDate}
                        onChange={(e) => setAssignDeadlineDate(e.target.value)}
                        className="w-full p-2 border border-[#5C130F]/30 bg-white rounded-md font-mono text-xs text-[#3A1A14]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-sans font-medium text-[#5C130F]/70 block">Deadline Time</span>
                      <input
                        type="text"
                        value={assignDeadlineTime}
                        onChange={(e) => setAssignDeadlineTime(e.target.value)}
                        placeholder="08:00 PM"
                        className="w-full p-2 border border-[#5C130F]/30 bg-white rounded-md font-mono text-xs text-[#3A1A14]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Coverage Zone field with both "Inline Add" and "Bulk Add" */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-mono font-bold text-[#5C130F]">Coverage Zone:</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddingInlineZone(!isAddingInlineZone)}
                      className="text-[10px] font-mono text-[#BA8332] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAddingInlineZone ? 'Cancel' : 'Inline Add'}</span>
                    </button>
                    {onBulkAddZones && (
                      <button
                        type="button"
                        onClick={() => setIsBulkAddZonesOpen(true)}
                        className="text-[10px] font-mono text-[#BA8332] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Bulk Add</span>
                      </button>
                    )}
                  </div>
                </div>

                {!isAddingInlineZone ? (
                  <select
                    value={assignZone}
                    onChange={(e) => setAssignZone(e.target.value)}
                    className="w-full p-2 border border-[#5C130F]/30 bg-white rounded-md font-serif text-xs"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.name}>{z.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <input
                      type="text"
                      value={newInlineZone}
                      onChange={(e) => setNewInlineZone(e.target.value)}
                      placeholder="Enter new zone name..."
                      className="flex-1 p-2 border border-[#BA8332] bg-white rounded-md font-serif text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleCreateInlineZone}
                      className="px-3 py-2 bg-[#BA8332] hover:bg-[#a06e28] text-white font-mono text-xs font-bold rounded-md cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Touch Points field with both "Inline Add" and "Bulk Add" */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-mono font-bold text-[#5C130F]">Select Touch Points:</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddingInlineTopic(!isAddingInlineTopic)}
                      className="text-[10px] font-mono text-[#BA8332] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAddingInlineTopic ? 'Cancel' : 'Inline Add'}</span>
                    </button>
                    {onBulkAddTopics && (
                      <button
                        type="button"
                        onClick={() => setIsBulkAddTopicsOpen(true)}
                        className="text-[10px] font-mono text-[#BA8332] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Bulk Add</span>
                      </button>
                    )}
                  </div>
                </div>

                {isAddingInlineTopic && (
                  <div className="flex items-center gap-1.5 mb-2 animate-fadeIn">
                    <input
                      type="text"
                      value={newInlineTopic}
                      onChange={(e) => setNewInlineTopic(e.target.value)}
                      placeholder="Enter new touch point name..."
                      className="flex-1 p-2 border border-[#BA8332] bg-white rounded-md font-serif text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleCreateInlineTopic}
                      className="px-3 py-2 bg-[#BA8332] hover:bg-[#a06e28] text-white font-mono text-xs font-bold rounded-md"
                    >
                      Save
                    </button>
                  </div>
                )}

                <div className="p-3 bg-white/80 border border-[#5C130F]/20 rounded-md space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#BA8332] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={topicSearchQuery}
                      onChange={(e) => setTopicSearchQuery(e.target.value)}
                      placeholder="Filter touch points..."
                      className="w-full pl-8 pr-3 py-1 border border-[#5C130F]/20 text-xs font-serif rounded"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                    {topics
                      .filter(t => !topicSearchQuery || t.name.toLowerCase().includes(topicSearchQuery.toLowerCase()))
                      .map(t => (
                        <label key={t.id} className="flex items-center gap-2 p-1 hover:bg-[#BA8332]/10 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={assignTopics.includes(t.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAssignTopics(prev => [...prev, t.name]);
                              } else {
                                setAssignTopics(prev => prev.filter(name => name !== t.name));
                              }
                            }}
                            className="accent-[#BA8332]"
                          />
                          <span className="text-xs text-[#3A1A14]">{t.name}</span>
                        </label>
                      ))}
                  </div>
                </div>
              </div>

              {/* 4. Assignment Mode Toggle */}
              <div>
                <label className="font-mono font-bold text-[#5C130F] block mb-1">Assignment Mode:</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="assignMode"
                      checked={assignmentMode === 'individual'}
                      onChange={() => setAssignmentMode('individual')}
                      className="accent-[#5C130F]"
                    />
                    <span>Individual Members</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="assignMode"
                      checked={assignmentMode === 'mohalla'}
                      onChange={() => setAssignmentMode('mohalla')}
                      className="accent-[#5C130F]"
                    />
                    <span>Mohalla Batch Selection</span>
                  </label>
                </div>
              </div>

              {/* 3. Team Member Selection: Vertical list/table with search bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono font-bold text-[#5C130F]">
                    Select Photographers / Videographers:
                  </label>
                  <span className="text-[10px] font-mono text-[#5C130F] font-bold">
                    {assignUsers.length} Selected
                  </span>
                </div>

                {assignmentMode === 'mohalla' && (
                  <div className="mb-2">
                    <select
                      value={selectedMohalla}
                      onChange={(e) => {
                        const m = e.target.value;
                        setSelectedMohalla(m);
                        if (m) {
                          const mohallaIts = approvedPVs
                            .filter(u => u.mohalla === m || u.cityDomicile === m)
                            .map(u => u.itsNumber);
                          setAssignUsers(mohallaIts);
                        }
                      }}
                      className="w-full p-2 border border-[#5C130F]/30 bg-white rounded-md font-serif text-xs mb-2"
                    >
                      <option value="">-- Select Mohalla --</option>
                      {availableMohallas.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Vertical Member List with Search Bar */}
                <div className="p-3 bg-white/90 border border-[#5C130F]/20 rounded-xl space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#BA8332] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="Search team by name, ITS number, or mohalla..."
                      className="w-full pl-8 pr-3 py-1.5 border border-[#5C130F]/25 text-xs font-serif rounded-lg text-[#3A1A14]"
                    />
                    {memberSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setMemberSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5C130F]"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto divide-y divide-[#5C130F]/10 pr-1">
                    {approvedPVs
                      .filter(u => {
                        if (!memberSearchQuery.trim()) return true;
                        const q = memberSearchQuery.toLowerCase().trim();
                        return (
                          u.fullName.toLowerCase().includes(q) ||
                          u.itsNumber.includes(q) ||
                          (u.mohalla && u.mohalla.toLowerCase().includes(q))
                        );
                      })
                      .map(u => {
                        const isChecked = assignUsers.includes(u.itsNumber);
                        return (
                          <label
                            key={u.itsNumber}
                            className={`flex items-center justify-between gap-3 p-2 hover:bg-[#BA8332]/10 cursor-pointer transition-colors rounded-md ${
                              isChecked ? 'bg-[#BA8332]/15 font-bold' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAssignUsers(prev => [...prev, u.itsNumber]);
                                  } else {
                                    setAssignUsers(prev => prev.filter(id => id !== u.itsNumber));
                                  }
                                }}
                                className="accent-[#BA8332] w-4 h-4 shrink-0"
                              />
                              <AvatarPlaceholder src={u.avatarUrl} alt={u.fullName} sizeClassName="w-7 h-7 shrink-0" iconSizeClassName="w-3.5 h-3.5" />
                              <div className="min-w-0">
                                <span className="text-xs font-serif font-bold text-[#3A1A14] truncate block">
                                  {u.fullName}
                                </span>
                                <span className="text-[10px] font-mono text-[#3A1A14]/70 block">
                                  ITS: {u.itsNumber} • {u.mohalla || u.cityDomicile || 'No Mohalla'}
                                </span>
                              </div>
                            </div>

                            <span className="text-[9px] font-mono font-bold bg-[#5C130F]/10 text-[#5C130F] px-2 py-0.5 rounded shrink-0">
                              {formatRoleBadgeLabel(u)}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* 4. Coverage Notes field */}
              <div>
                <label className="font-mono font-bold text-[#5C130F] block mb-1">Coverage Notes:</label>
                <textarea
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Additional instructions or guidelines..."
                  rows={2}
                  className="w-full p-2 border border-[#5C130F]/30 bg-white rounded-md font-serif text-xs"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-[#5C130F]/20 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsAssignmentModalOpen(false);
                  setEditingAssignmentId(null);
                }}
                className="px-4 py-2 border border-[#5C130F]/30 text-[#5C130F] font-mono text-xs font-bold rounded-md hover:bg-[#5C130F]/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssignment}
                className="px-5 py-2 bg-[#BA8332] hover:bg-[#a06e28] text-white font-mono text-xs font-bold rounded-md flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                {editingAssignmentId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>
                  {editingAssignmentId
                    ? (lang === 'en' ? 'Save Changes' : 'حفظ التعديلات')
                    : (lang === 'en' ? 'Create Assignment' : 'إرسال التكليف')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEARCHABLE ROSTER PICKER MODAL FOR SLOT REASSIGNMENT */}
      {reassignModalTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FDFAF3] border-2 border-[#5C130F] rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-6 my-8 max-h-[85vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#5C130F]/20 pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#5C130F] flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-[#BA8332]" />
                  <span>Reassign Slot — {reassignModalTarget.assignment.zone}</span>
                </h3>
                <p className="text-xs text-[#3A1A14]/80 font-serif mt-0.5">
                  Select a replacement team member for declining ITS:{' '}
                  <strong className="text-red-700">{reassignModalTarget.oldIts}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReassignModalTarget(null)}
                className="p-1 text-[#5C130F]/60 hover:text-[#5C130F] hover:bg-[#5C130F]/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#BA8332] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={reassignSearchQuery}
                onChange={(e) => setReassignSearchQuery(e.target.value)}
                placeholder="Search team by name, ITS, or mohalla..."
                className="w-full pl-9 pr-8 py-2 border border-[#5C130F]/30 bg-white rounded-lg text-xs font-serif text-[#3A1A14] focus:outline-none focus:border-[#5C130F]"
              />
              {reassignSearchQuery && (
                <button
                  type="button"
                  onClick={() => setReassignSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5C130F] font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Eligible Member List Cards */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {approvedPVs
                .filter(p => !reassignModalTarget.assignment.assignedUsers.includes(p.itsNumber))
                .filter(p => {
                  if (!reassignSearchQuery.trim()) return true;
                  const q = reassignSearchQuery.toLowerCase().trim();
                  return (
                    p.fullName.toLowerCase().includes(q) ||
                    p.itsNumber.includes(q) ||
                    (p.mohalla && p.mohalla.toLowerCase().includes(q))
                  );
                })
                .map(pv => {
                  const isSelected = selectedReplacementIts === pv.itsNumber;
                  return (
                    <div
                      key={pv.itsNumber}
                      onClick={() => setSelectedReplacementIts(pv.itsNumber)}
                      className={`p-3 border rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#BA8332]/20 border-[#BA8332] shadow-sm'
                          : 'bg-white/80 border-[#5C130F]/15 hover:bg-[#5C130F]/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <AvatarPlaceholder src={pv.avatarUrl} alt={pv.fullName} sizeClassName="w-9 h-9" iconSizeClassName="w-4 h-4" />
                        <div>
                          <p className="font-serif font-bold text-xs text-[#3A1A14] flex items-center gap-2">
                            <span>{pv.fullName}</span>
                            <span className="text-[9px] font-mono bg-[#5C130F]/10 text-[#5C130F] px-1.5 py-0.5 rounded">
                              {formatRoleBadgeLabel(pv)}
                            </span>
                          </p>
                          <p className="text-[10px] font-mono text-[#3A1A14]/75">
                            ITS: {pv.itsNumber} • {pv.mohalla || pv.cityDomicile || 'No Mohalla'}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <span className="px-3 py-1 bg-[#BA8332] text-white text-[10px] font-mono font-bold rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Selected</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-white border border-[#5C130F]/20 text-[#5C130F] text-[10px] font-mono font-bold rounded-md hover:bg-[#5C130F]/10">
                            Select Replacement
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-[#5C130F]/20 pt-4">
              <button
                type="button"
                onClick={() => setReassignModalTarget(null)}
                className="px-4 py-2 border border-[#5C130F]/30 text-[#5C130F] font-mono text-xs font-bold rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedReplacementIts}
                onClick={() => {
                  if (selectedReplacementIts && onReassignSlot) {
                    onReassignSlot(reassignModalTarget.assignment.id, reassignModalTarget.oldIts, selectedReplacementIts);
                    setReassignModalTarget(null);
                    setSelectedReplacementIts('');
                  }
                }}
                className="px-5 py-2 bg-[#BA8332] hover:bg-[#a06e28] disabled:opacity-50 text-white font-mono text-xs font-bold rounded-md flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Reassignment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Modals */}
      <BulkAddModal
        isOpen={isBulkAddZonesOpen}
        title={lang === 'en' ? 'Bulk Add Zones' : 'إضافة مناطق متعددة'}
        subtitle={lang === 'en' ? 'Type or paste multiple zone names, separated by commas.' : 'اكتب أو ألصق أسماء مناطق متعددة.'}
        placeholder="e.g. Zone A - Main Hall, Zone B - Courtyard..."
        existingNames={zones.map(z => z.name)}
        onConfirm={(newNames) => {
          if (onBulkAddZones) onBulkAddZones(newNames);
          if (newNames.length > 0) setAssignZone(newNames[0]);
        }}
        onClose={() => setIsBulkAddZonesOpen(false)}
        lang={lang}
      />

      <BulkAddModal
        isOpen={isBulkAddTopicsOpen}
        title={lang === 'en' ? 'Bulk Add Touch Points' : 'إضافة نقاط تغطية متعددة'}
        subtitle={lang === 'en' ? 'Type or paste multiple touch points, separated by commas.' : 'اكتب أو ألصق نقاط تغطية متعددة.'}
        placeholder="e.g. Syedna Arrival, Waaz Shareef, Mumineen Devotion..."
        existingNames={topics.map(t => t.name)}
        onConfirm={(newNames) => {
          if (onBulkAddTopics) onBulkAddTopics(newNames);
          setAssignTopics(prev => Array.from(new Set([...prev, ...newNames])));
        }}
        onClose={() => setIsBulkAddTopicsOpen(false)}
        lang={lang}
      />

      {/* MODAL: CREATE NEW MIQAAT REQUEST */}
      {isNewMiqaatRequestModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FDFAF3] border-2 border-[#5C130F] rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#5C130F]/20 pb-4">
              <div>
                <h3 className="font-serif font-bold text-xl text-[#5C130F] flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-[#BA8332]" />
                  <span>{lang === 'en' ? 'Create New Miqaat Request' : 'إنشاء طلب ميقات جديد'}</span>
                </h3>
                <p className="text-xs text-[#3A1A14]/75 font-serif mt-0.5">
                  {lang === 'en' 
                    ? 'Request availability from eligible photographers and videographers.' 
                    : 'طلب التفرغ الميداني من المصورين المعتمدين لمناسبة أو ميقات محدد.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewMiqaatRequestModalOpen(false)}
                className="p-1 text-[#5C130F]/60 hover:text-[#5C130F] hover:bg-[#5C130F]/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMiqaatRequestSubmit} className="space-y-5 text-xs font-serif">
              {/* 1. Miqaat Event Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-mono font-bold text-[#5C130F]">Miqaat Event / Name:</label>
                  <button
                    type="button"
                    onClick={() => setIsAddingReqInlineMiqaat(!isAddingReqInlineMiqaat)}
                    className="text-[10px] font-mono text-[#BA8332] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isAddingReqInlineMiqaat ? 'Cancel' : 'Add new'}</span>
                  </button>
                </div>

                {!isAddingReqInlineMiqaat ? (
                  <select
                    value={reqMiqaat}
                    onChange={(e) => setReqMiqaat(e.target.value)}
                    className="w-full p-2.5 border border-[#5C130F]/30 bg-white rounded-md font-serif text-xs text-[#3A1A14]"
                  >
                    {(miqaats.length > 0 ? miqaats : [{ id: 'm1', name: 'Ashara Mubarakah 1448H' }]).map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <input
                      type="text"
                      value={newReqInlineMiqaat}
                      onChange={(e) => setNewReqInlineMiqaat(e.target.value)}
                      placeholder="Enter new Miqaat name..."
                      className="flex-1 p-2 border border-[#BA8332] bg-white rounded-md font-serif text-xs text-[#3A1A14]"
                    />
                    <button
                      type="button"
                      onClick={handleCreateReqInlineMiqaat}
                      className="px-3 py-2 bg-[#BA8332] hover:bg-[#a06e28] text-white font-mono text-xs font-bold rounded-md cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Requested Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-[#FDFAF3] border border-[#5C130F]/15 rounded-lg">
                <div>
                  <label className="font-mono font-bold text-[#5C130F] block mb-1">From Date (Start):</label>
                  <input
                    type="date"
                    required
                    value={reqFromDate}
                    onChange={(e) => setReqFromDate(e.target.value)}
                    className="w-full p-2 border border-[#5C130F]/30 bg-white rounded-md font-mono text-xs text-[#3A1A14]"
                  />
                </div>
                <div>
                  <label className="font-mono font-bold text-[#5C130F] block mb-1">To Date (End):</label>
                  <input
                    type="date"
                    required
                    value={reqToDate}
                    onChange={(e) => setReqToDate(e.target.value)}
                    className="w-full p-2 border border-[#5C130F]/30 bg-white rounded-md font-mono text-xs text-[#3A1A14]"
                  />
                </div>
              </div>

              {/* 3. Optional Instructions / Notes */}
              <div>
                <label className="font-sans font-semibold text-[#5C130F] block mb-1">Notes & Context (Optional):</label>
                <textarea
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="e.g. Morning & evening Waaz coverage in Karachi. Please confirm all days if possible."
                  rows={2}
                  className="w-full p-2.5 border border-[#5C130F]/30 bg-white rounded-md font-sans text-xs text-[#3A1A14]"
                />
              </div>

              {/* 4. Target Member Selection with Quick Actions */}
              <div className="space-y-2.5 border-t border-[#5C130F]/15 pt-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-sans font-semibold text-[#5C130F] uppercase tracking-wider block">
                    Select Eligible Team Members (<span className="font-mono">{reqSelectedIts.length}</span> selected):
                  </label>
                </div>

                {/* Quick Selection Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSelectAllMembers}
                    className="px-2.5 py-1 bg-[#5C130F] text-white text-[10px] font-sans font-semibold uppercase rounded hover:bg-[#3A1A14] transition-colors cursor-pointer"
                  >
                    [ Select All (<span className="font-mono">{approvedPVs.length}</span>) ]
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAllPhotographers}
                    className="px-2.5 py-1 bg-[#BA8332] text-white text-[10px] font-sans font-semibold uppercase rounded hover:bg-[#a06e28] transition-colors cursor-pointer"
                  >
                    [ Select Photographers ]
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAllVideographers}
                    className="px-2.5 py-1 bg-[#BA8332] text-white text-[10px] font-sans font-semibold uppercase rounded hover:bg-[#a06e28] transition-colors cursor-pointer"
                  >
                    [ Select Videographers ]
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllSelected}
                    className="px-2.5 py-1 bg-white border border-[#5C130F]/30 text-[#5C130F] text-[10px] font-sans font-semibold uppercase rounded hover:bg-[#5C130F]/10 transition-colors cursor-pointer"
                  >
                    [ Clear All ]
                  </button>
                </div>

                {/* Member Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#5C130F]/50 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={reqMemberSearch}
                    onChange={(e) => setReqMemberSearch(e.target.value)}
                    placeholder="Search member by name or ITS..."
                    className="w-full pl-8 pr-3 py-1.5 border border-[#5C130F]/30 bg-white rounded-md font-sans text-xs"
                  />
                </div>

                {/* Member Checkbox List */}
                <div className="max-h-56 overflow-y-auto divide-y divide-[#5C130F]/10 border border-[#5C130F]/20 rounded-lg bg-white">
                  {approvedPVs
                    .filter(pv => {
                      if (!reqMemberSearch) return true;
                      const q = reqMemberSearch.toLowerCase();
                      return pv.fullName.toLowerCase().includes(q) || pv.itsNumber.includes(q);
                    })
                    .map(pv => {
                      const isChecked = reqSelectedIts.includes(pv.itsNumber);
                      return (
                        <div
                          key={pv.itsNumber}
                          onClick={() => handleToggleReqMember(pv.itsNumber)}
                          className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#BA8332]/10 transition-colors ${
                            isChecked ? 'bg-[#BA8332]/15' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="text-[#5C130F]">
                              {isChecked ? <CheckSquare className="w-4 h-4 text-[#BA8332]" /> : <Square className="w-4 h-4 text-[#5C130F]/40" />}
                            </div>
                            <AvatarPlaceholder src={pv.avatarUrl} alt={pv.fullName} sizeClassName="w-7 h-7" iconSizeClassName="w-3.5 h-3.5" />
                            <div className="min-w-0">
                              <span className="font-serif font-semibold text-xs text-[#5C130F] truncate block">
                                {pv.fullName}
                              </span>
                              <span className="text-[10px] font-sans text-[#3A1A14]/70">
                                ITS: <span className="font-mono">{pv.itsNumber}</span> • {formatRoleBadgeLabel(pv)}
                              </span>
                            </div>
                          </div>

                          <span className={`text-[9px] font-sans font-semibold uppercase px-1.5 py-0.5 rounded ${
                            isChecked ? 'bg-[#BA8332] text-white' : 'bg-[#5C130F]/10 text-[#5C130F]'
                          }`}>
                            {isChecked ? 'Selected' : 'Click to select'}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-[#5C130F]/20 pt-4">
                <button
                  type="button"
                  onClick={() => setIsNewMiqaatRequestModalOpen(false)}
                  className="px-4 py-2 border border-[#5C130F]/30 text-[#5C130F] font-sans text-xs font-semibold rounded-md hover:bg-[#5C130F]/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reqSelectedIts.length === 0}
                  className="px-5 py-2 bg-[#5C130F] hover:bg-[#3A1A14] disabled:opacity-50 text-white font-sans text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-md cursor-pointer uppercase tracking-wider"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Miqaat Request (<span className="font-mono">{reqSelectedIts.length}</span>)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
