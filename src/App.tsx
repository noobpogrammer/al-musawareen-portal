import React, { useState, useEffect } from 'react';
import { UserProfile, Assignment, ShotReport, SharafEventDef, SharafAllocation, MiqaatDef, Zone, Topic, AssignmentNotification, HRPermissions, UserRole, getUserRoles, DEFAULT_HR_PERMISSIONS } from './types';
import { 
  INITIAL_USERS, 
  INITIAL_ASSIGNMENTS, 
  INITIAL_SUBMISSIONS, 
  INITIAL_ZONES, 
  INITIAL_TOPICS,
  DEFAULT_SHARAF_EVENTS,
  INITIAL_SHARAF_ALLOCATIONS,
  INITIAL_MIQAATS
} from './utils/mockData';
import { LanguageType } from './utils/translations';

// Import Modular Portal components
import Navbar from './components/Navbar';
import PublicPortal from './components/PublicPortal';
import LoginPortal from './components/LoginPortal';
import RegistrationPortal from './components/RegistrationPortal';
import AdminDashboard from './components/AdminDashboard';
import SubmissionPortal from './components/SubmissionPortal';
import SharafPortal from './components/SharafPortal';
import { supabase } from './utils/supabaseClient';

// Helper to ensure admin profile attributes match current mock data even if restored from stale localStorage
const sanitizeUserProfile = (u: UserProfile): UserProfile => {
  if (u.itsNumber === '40486680' || (u.fullName && (u.fullName.includes('Ramzan') || u.fullName.includes('Bailokhandwala'))) || (u.email && (u.email.includes('ramzan') || u.email.includes('bailokhandwala')))) {
    return {
      ...u,
      fullName: 'Sheikh Ibrahim Bhai Lokhandwala',
      fullNameAr: 'الشيخ إبراهيم بهائي لوكهند والا',
      email: 'ibrahim.lokhandwala@almusawareen.org',
      avatarUrl: u.avatarUrl || (u as any).dp_url || (u as any).avatar_url
    };
  }
  return u;
};

export default function App() {
  // 1. Core State Hooks
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('al_musawareen_session');
    if (!saved) return null;
    try {
      return sanitizeUserProfile(JSON.parse(saved));
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('al_musawareen_users');
      if (!saved) return INITIAL_USERS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.map(sanitizeUserProfile) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    try {
      const saved = localStorage.getItem('al_musawareen_assignments');
      if (!saved) return INITIAL_ASSIGNMENTS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_ASSIGNMENTS;
    } catch {
      return INITIAL_ASSIGNMENTS;
    }
  });

  const [submissions, setSubmissions] = useState<ShotReport[]>(() => {
    try {
      const saved = localStorage.getItem('al_musawareen_submissions');
      if (!saved) return INITIAL_SUBMISSIONS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_SUBMISSIONS;
    } catch {
      return INITIAL_SUBMISSIONS;
    }
  });

  const [notifications, setNotifications] = useState<AssignmentNotification[]>(() => {
    try {
      const saved = localStorage.getItem('al_musawareen_notifications');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [lang, setLang] = useState<LanguageType>(() => {
    const saved = localStorage.getItem('al_musawareen_lang');
    return (saved as LanguageType) || 'en';
  });

  // Moula's Tus Safar Mode Global State (defaults to true)
  const [isSafarModeEnabled, setIsSafarModeEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('al_musawareen_safar_mode');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Sharaf Event Types List
  const [sharafEvents, setSharafEvents] = useState<SharafEventDef[]>(() => {
    try {
      const saved = localStorage.getItem('al_musawareen_sharaf_events');
      if (!saved) return DEFAULT_SHARAF_EVENTS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : DEFAULT_SHARAF_EVENTS;
    } catch {
      return DEFAULT_SHARAF_EVENTS;
    }
  });

  // Sharaf Allocations List
  const [sharafAllocations, setSharafAllocations] = useState<SharafAllocation[]>(() => {
    try {
      const saved = localStorage.getItem('al_musawareen_sharaf_allocations');
      if (!saved) return INITIAL_SHARAF_ALLOCATIONS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_SHARAF_ALLOCATIONS;
    } catch {
      return INITIAL_SHARAF_ALLOCATIONS;
    }
  });

  // Predefined Miqaats List
  const [miqaats, setMiqaats] = useState<MiqaatDef[]>(() => {
    try {
      const saved = localStorage.getItem('al_musawareen_miqaats');
      if (!saved) return INITIAL_MIQAATS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_MIQAATS;
    } catch {
      return INITIAL_MIQAATS;
    }
  });

  // Coverage Zones List
  const [zones, setZones] = useState<Zone[]>(() => {
    try {
      const saved = localStorage.getItem('al_musawareen_zones');
      if (!saved) return INITIAL_ZONES;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_ZONES;
    } catch {
      return INITIAL_ZONES;
    }
  });

  // Touch Points (Topics) List
  const [topics, setTopics] = useState<Topic[]>(() => {
    try {
      const saved = localStorage.getItem('al_musawareen_topics');
      if (!saved) return INITIAL_TOPICS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_TOPICS;
    } catch {
      return INITIAL_TOPICS;
    }
  });

  const [activeView, setActiveView] = useState<string>(() => {
    const savedUser = localStorage.getItem('al_musawareen_session');
    if (savedUser) {
      try {
        const parsed = sanitizeUserProfile(JSON.parse(savedUser));
        return parsed.role === 'admin' ? 'admin' : 'submit';
      } catch {
        return 'public';
      }
    }
    return 'public';
  });

  // 2. Persistence Hooks
  useEffect(() => {
    localStorage.setItem('al_musawareen_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('al_musawareen_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('al_musawareen_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('al_musawareen_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('al_musawareen_safar_mode', JSON.stringify(isSafarModeEnabled));
  }, [isSafarModeEnabled]);

  useEffect(() => {
    localStorage.setItem('al_musawareen_sharaf_events', JSON.stringify(sharafEvents));
  }, [sharafEvents]);

  useEffect(() => {
    localStorage.setItem('al_musawareen_sharaf_allocations', JSON.stringify(sharafAllocations));
  }, [sharafAllocations]);

  useEffect(() => {
    localStorage.setItem('al_musawareen_miqaats', JSON.stringify(miqaats));
  }, [miqaats]);

  useEffect(() => {
    localStorage.setItem('al_musawareen_zones', JSON.stringify(zones));
  }, [zones]);

  useEffect(() => {
    localStorage.setItem('al_musawareen_topics', JSON.stringify(topics));
  }, [topics]);

  useEffect(() => {
    localStorage.setItem('al_musawareen_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Load and listen to Supabase Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem('al_musawareen_session');
        setActiveView('public');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch all registered members from Supabase database to populate Admin approval queue and user DPs
  useEffect(() => {
    const fetchMembersFromSupabase = async () => {
      try {
        const { data: dbMembers, error } = await supabase.from('members').select('*');
        if (error || !dbMembers || dbMembers.length === 0) return;

        const mappedMembers: UserProfile[] = dbMembers.map(member => ({
          itsNumber: member.its_id,
          fullName: member.full_name,
          fullNameAr: member.full_name_ar,
          role: member.role as any,
          mobile: member.mobile,
          email: member.email,
          avatarUrl: member.dp_url || member.avatar_url || member.avatarUrl,
          cityRaza: member.city_raza,
          mohalla: member.mohalla,
          status: member.status as any,
          sharafStatus: member.sharaf_status as any,
          sharafZone: member.sharaf_zone,
          sharafSeat: member.sharaf_seat,
          createdAt: member.created_at,
          cameras: member.cameras,
          lenses: member.lenses,
          otherEquipment: member.other_equipment
        }));

        setUsers(prev => {
          const updated = [...prev];
          mappedMembers.forEach(dbm => {
            const index = updated.findIndex(u => u.itsNumber === dbm.itsNumber);
            if (index >= 0) {
              updated[index] = {
                ...updated[index],
                ...dbm,
                avatarUrl: dbm.avatarUrl || updated[index].avatarUrl
              };
            } else {
              updated.push(dbm);
            }
          });
          return updated;
        });

        // Immediately sync Supabase dp_url into active logged-in user profile
        setCurrentUser(prevUser => {
          if (!prevUser) return null;
          const dbMatch = mappedMembers.find(m => m.itsNumber === prevUser.itsNumber);
          if (dbMatch && dbMatch.avatarUrl) {
            const updatedUser = { ...prevUser, avatarUrl: dbMatch.avatarUrl };
            localStorage.setItem('al_musawareen_session', JSON.stringify(updatedUser));
            return updatedUser;
          }
          return prevUser;
        });
      } catch (err) {
        console.warn('Could not fetch members from Supabase:', err);
      }
    };

    fetchMembersFromSupabase();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: member, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (member) {
        const profile: UserProfile = {
          itsNumber: member.its_id,
          fullName: member.full_name,
          fullNameAr: member.full_name_ar,
          role: member.role as any,
          mobile: member.mobile,
          email: member.email,
          avatarUrl: member.dp_url,
          cityRaza: member.city_raza,
          mohalla: member.mohalla,
          status: member.status as any,
          sharafStatus: member.sharaf_status as any,
          sharafZone: member.sharaf_zone,
          sharafSeat: member.sharaf_seat,
          createdAt: member.created_at,
          cameras: member.cameras,
          lenses: member.lenses,
          otherEquipment: member.other_equipment
        };
        setCurrentUser(profile);
        localStorage.setItem('al_musawareen_session', JSON.stringify(profile));
        setActiveView(prev => {
          if (prev === 'public' || prev === 'login' || prev === 'register') {
            return profile.role === 'admin' ? 'admin' : 'submit';
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  };

  // Handle current user session update
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('al_musawareen_session', JSON.stringify(user));
    if (user.role === 'admin') {
      setActiveView('admin');
    } else {
      setActiveView('submit');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('al_musawareen_session');
    setActiveView('public');
  };

  // 3. Operational State Mutation Functions (Callbacks)
  
  // A. Approve a pending user registration (with optional custom HR permissions)
  const handleApproveUser = async (its: string, permissions?: HRPermissions) => {
    setUsers(prev => prev.map(u => {
      if (u.itsNumber === its) {
        const existingRoles = getUserRoles(u);
        const hrPermsToApply = permissions || u.hrPermissions || (u.role === 'coordinator' || existingRoles.includes('coordinator') ? DEFAULT_HR_PERMISSIONS : undefined);
        return {
          ...u,
          status: 'approved',
          roles: existingRoles,
          hrPermissions: hrPermsToApply
        };
      }
      return u;
    }));

    try {
      await supabase.from('members').update({ status: 'approved' }).eq('its_id', its);
    } catch (err) {
      console.warn('Failed to sync approval to Supabase database:', err);
    }
  };

  // Grant, extend, revoke HR permissions, or update user roles
  const handleUpdateUserPermissions = (its: string, newRoles: UserRole[], permissions?: HRPermissions) => {
    setUsers(prev => prev.map(u => {
      if (u.itsNumber === its) {
        const updatedRoles = Array.from(new Set(newRoles));
        // Primary role fallback: keep admin if admin, else first non-admin role or primary role
        const primaryRole = updatedRoles.includes('admin')
          ? 'admin'
          : updatedRoles[0] || u.role;
        return {
          ...u,
          role: primaryRole,
          roles: updatedRoles,
          hrPermissions: permissions
        };
      }
      return u;
    }));
  };

  // B. Reject a pending user registration
  const handleRejectUser = async (its: string) => {
    setUsers(prev => prev.map(u => {
      if (u.itsNumber === its) {
        return { ...u, status: 'rejected' };
      }
      return u;
    }));

    try {
      await supabase.from('members').update({ status: 'rejected' }).eq('its_id', its);
    } catch (err) {
      console.warn('Failed to sync rejection to Supabase database:', err);
    }
  };

  // C. Add a new registration from portal onboarding (remains strictly PENDING until Admin approval)
  const handleRegisterOnboard = (newUser: UserProfile) => {
    const pendingUser: UserProfile = {
      ...newUser,
      status: 'pending'
    };

    setUsers(prev => {
      const exists = prev.some(u => u.itsNumber === pendingUser.itsNumber);
      if (exists) {
        return prev.map(u => u.itsNumber === pendingUser.itsNumber ? pendingUser : u);
      }
      return [...prev, pendingUser];
    });

    setActiveView('login');
  };

  // D. Create a new single assignment coverage record
  const handleAddAssignment = (newAs: Omit<Assignment, 'id'>) => {
    const initialStatuses: Record<string, 'pending' | 'accepted' | 'declined'> = {};
    newAs.assignedUsers.forEach(its => {
      initialStatuses[its] = 'pending';
    });

    const freshAssignment: Assignment = {
      ...newAs,
      id: `as_gen_${Date.now()}`,
      memberStatuses: initialStatuses
    };
    setAssignments(prev => [freshAssignment, ...prev]);
  };

  // Handle photographer/videographer accept or decline response
  const handleRespondAssignment = (assignmentId: string, itsNumber: string, action: 'accepted' | 'declined', reason?: string) => {
    const targetAssignment = assignments.find(a => a.id === assignmentId);
    const member = users.find(u => u.itsNumber === itsNumber);

    if (!targetAssignment || !member) return;

    // Update assignment memberStatuses and memberDeclineReasons
    setAssignments(prev => prev.map(as => {
      if (as.id === assignmentId) {
        const updatedStatuses = { ...(as.memberStatuses || {}) };
        updatedStatuses[itsNumber] = action;
        const updatedReasons = { ...(as.memberDeclineReasons || {}) };
        if (reason) {
          updatedReasons[itsNumber] = reason;
        }
        return { 
          ...as, 
          memberStatuses: updatedStatuses,
          memberDeclineReasons: updatedReasons 
        };
      }
      return as;
    }));

    // Create notification alert for Admin
    const title = typeof targetAssignment.topic === 'string'
      ? targetAssignment.topic
      : Array.isArray(targetAssignment.topics) ? targetAssignment.topics.join(', ') : 'Coverage Task';

    const notificationMsg = action === 'accepted'
      ? `${member.fullName} confirmed ${title} coverage.`
      : `${member.fullName} declined ${title} coverage${reason ? ` (${reason})` : ''} — 1 slot needs reassignment.`;

    const newNotification: AssignmentNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      assignmentId,
      itsNumber,
      memberName: member.fullName,
      assignmentTitle: notificationMsg,
      action,
      declineReason: reason,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  // Handle Admin slot reassignment when a member declines
  const handleReassignSlot = (assignmentId: string, oldIts: string, newIts: string) => {
    setAssignments(prev => prev.map(as => {
      if (as.id === assignmentId) {
        const updatedUsers = as.assignedUsers.map(u => u === oldIts ? newIts : u);
        if (!updatedUsers.includes(newIts)) {
          updatedUsers.push(newIts);
        }
        const updatedStatuses = { ...(as.memberStatuses || {}) };
        delete updatedStatuses[oldIts];
        updatedStatuses[newIts] = 'pending';
        return {
          ...as,
          assignedUsers: updatedUsers,
          memberStatuses: updatedStatuses
        };
      }
      return as;
    }));
  };

  const handleUpdateAssignment = (updatedAssignment: Assignment) => {
    setAssignments(prev => prev.map(as => as.id === updatedAssignment.id ? updatedAssignment : as));
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Add Miqaat Handler
  const handleAddMiqaat = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (miqaats.some(m => m.name.toLowerCase() === trimmed.toLowerCase())) return;
    const newMiqaat: MiqaatDef = {
      id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: trimmed
    };
    setMiqaats(prev => [...prev, newMiqaat]);
  };

  // Add Zone Handlers
  const handleAddZone = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (zones.some(z => z.name.toLowerCase() === trimmed.toLowerCase())) return;
    const newZone: Zone = {
      id: `z_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: trimmed,
      description: 'Custom added coverage zone'
    };
    setZones(prev => [...prev, newZone]);
  };

  const handleBulkAddZones = (newNames: string[]) => {
    const formatted: Zone[] = newNames.map((n, i) => ({
      id: `z_bulk_${Date.now()}_${i}`,
      name: n.trim(),
      description: 'Bulk added coverage zone'
    }));
    setZones(prev => [...prev, ...formatted]);
  };

  // Add Touch Point (Topic) Handlers
  const handleAddTopic = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (topics.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) return;
    const newTopic: Topic = {
      id: `t_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: trimmed,
      category: 'Touch Point'
    };
    setTopics(prev => [...prev, newTopic]);
  };

  const handleBulkAddTopics = (newNames: string[]) => {
    const formatted: Topic[] = newNames.map((n, i) => ({
      id: `t_bulk_${Date.now()}_${i}`,
      name: n.trim(),
      category: 'Touch Point'
    }));
    setTopics(prev => [...prev, ...formatted]);
  };

  // E. Audits and grades a shot report
  const handleGradeSubmission = (subId: string, grade: ShotReport['grade']) => {
    setSubmissions(prev => prev.map(sub => {
      if (sub.id === subId) {
        return { ...sub, grade };
      }
      return sub;
    }));
  };

  // F. Submit or update a shot report
  const handleSubmitReport = (newReport: Omit<ShotReport, 'id' | 'timestamp' | 'userName'>) => {
    const userName = users.find(u => u.itsNumber === newReport.itsNumber)?.fullName || 'Photographer';

    setSubmissions(prev => {
      const existingIndex = prev.findIndex(
        s => s.assignmentId === newReport.assignmentId && s.itsNumber === newReport.itsNumber
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          driveLink: newReport.driveLink,
          notes: newReport.notes,
          completedTouchPoints: newReport.completedTouchPoints,
          grade: 'Pending',
          timestamp: new Date().toISOString()
        };
        return updated;
      }

      const fullReport: ShotReport = {
        ...newReport,
        id: `sub_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userName
      };
      return [fullReport, ...prev];
    });
  };

  // G. Legacy allocate Sharaf seating
  const handleAllocateSharaf = (its: string, zone: string, seat: string) => {
    setUsers(prev => prev.map(u => {
      if (u.itsNumber === its) {
        return {
          ...u,
          sharafStatus: 'granted',
          sharafZone: zone,
          sharafSeat: seat
        };
      }
      return u;
    }));
  };

  // Sharaf Event Allocation Handlers
  const handleToggleSafarMode = (enabled: boolean) => {
    setIsSafarModeEnabled(enabled);
    if (!enabled && activeView === 'sharaf') {
      setActiveView(currentUser?.role === 'admin' ? 'admin' : 'submit');
    }
  };

  const handleAddSharafAllocation = (newAlloc: Omit<SharafAllocation, 'id'>) => {
    const freshAlloc: SharafAllocation = {
      ...newAlloc,
      id: `alloc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };
    setSharafAllocations(prev => [freshAlloc, ...prev]);
  };

  const handleRemoveSharafAllocation = (allocId: string) => {
    setSharafAllocations(prev => prev.filter(a => a.id !== allocId));
  };

  const handleBulkAssignSharaf = (newAllocations: Omit<SharafAllocation, 'id'>[]) => {
    const formatted = newAllocations.map((a, index) => ({
      ...a,
      id: `alloc_bulk_${Date.now()}_${index}`
    }));
    setSharafAllocations(prev => [...formatted, ...prev]);
  };

  const handleCreateCustomEvent = (name: string) => {
    const newId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (sharafEvents.some(e => e.id === newId || e.name.toLowerCase() === name.toLowerCase())) {
      alert(lang === 'en' ? 'An event with this name already exists.' : 'توجد مناسبة بهذا الاسم بالفعل.');
      return;
    }
    const newEvent: SharafEventDef = {
      id: newId,
      name,
      isDefault: false
    };
    setSharafEvents(prev => [...prev, newEvent]);
  };

  const handleDeleteCustomEvent = (eventId: string) => {
    const eventToDelete = sharafEvents.find(e => e.id === eventId);
    if (eventToDelete?.isDefault) {
      alert(lang === 'en' ? 'Default event types cannot be deleted.' : 'لا يمكن حذف المناسبات الافتراضية.');
      return;
    }

    const countAllocated = sharafAllocations.filter(a => a.eventType.toLowerCase() === eventToDelete?.name.toLowerCase()).length;
    if (countAllocated > 0) {
      const confirmDelete = window.confirm(
        lang === 'en'
          ? `${countAllocated} member(s) are allocated to this event. Deleting will remove their Sharaf allocation for it. Continue?`
          : `يوجد ${countAllocated} من الأعضاء المخصصين لهذه المناسبة. سيؤدي الحذف إلى إزالة تخصيصهم. هل تريد المتابعة؟`
      );
      if (!confirmDelete) return;
    }

    setSharafEvents(prev => prev.filter(e => e.id !== eventId));
    if (eventToDelete) {
      setSharafAllocations(prev => prev.filter(a => a.eventType.toLowerCase() !== eventToDelete.name.toLowerCase()));
    }
  };

  // Keep currentUser state in sync with the master users list (important for real-time Sharaf updates!)
  useEffect(() => {
    if (currentUser) {
      const matchInMaster = users.find(u => u.itsNumber === currentUser.itsNumber);
      if (matchInMaster && JSON.stringify(matchInMaster) !== JSON.stringify(currentUser)) {
        setCurrentUser(matchInMaster);
        localStorage.setItem('al_musawareen_session', JSON.stringify(matchInMaster));
      }
    }
  }, [users, currentUser]);

  return (
    <div className="min-h-screen bg-editorial-bg text-editorial-ink flex flex-col font-sans transition-all duration-300 ltr" dir="ltr">
      
      {/* Universal Navigation bar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        lang={lang}
        setLang={setLang}
        activeView={activeView}
        setActiveView={setActiveView}
        isSafarModeEnabled={isSafarModeEnabled}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
      />

      {/* Primary content area rendering views dynamically */}
      <main className="flex-grow">
        {activeView === 'public' && (
          <PublicPortal
            lang={lang}
            onJoinClick={() => setActiveView('register')}
            onLoginClick={() => setActiveView('login')}
          />
        )}

        {activeView === 'login' && (
          <LoginPortal
            lang={lang}
            onLoginSuccess={handleLoginSuccess}
            onNavigateRegister={() => setActiveView('register')}
          />
        )}

        {activeView === 'register' && (
          <RegistrationPortal
            lang={lang}
            onRegisterSuccess={handleRegisterOnboard}
            onNavigateLogin={() => setActiveView('login')}
          />
        )}

        {activeView === 'admin' && currentUser?.role === 'admin' && (
          <AdminDashboard
            lang={lang}
            currentUser={currentUser}
            users={users}
            assignments={assignments}
            submissions={submissions}
            miqaats={miqaats}
            zones={zones}
            topics={topics}
            onApproveUser={handleApproveUser}
            onRejectUser={handleRejectUser}
            onUpdateUserPermissions={handleUpdateUserPermissions}
            onAddAssignment={handleAddAssignment}
            onUpdateAssignment={handleUpdateAssignment}
            onReassignSlot={handleReassignSlot}
            onGradeSubmission={handleGradeSubmission}
            onAllocateSharaf={handleAllocateSharaf}
            isSafarModeEnabled={isSafarModeEnabled}
            onToggleSafarMode={handleToggleSafarMode}
            sharafEvents={sharafEvents}
            sharafAllocations={sharafAllocations}
            onAddSharafAllocation={handleAddSharafAllocation}
            onRemoveSharafAllocation={handleRemoveSharafAllocation}
            onBulkAssignSharaf={handleBulkAssignSharaf}
            onCreateCustomEvent={handleCreateCustomEvent}
            onDeleteCustomEvent={handleDeleteCustomEvent}
            onAddMiqaat={handleAddMiqaat}
            onAddZone={handleAddZone}
            onBulkAddZones={handleBulkAddZones}
            onAddTopic={handleAddTopic}
            onBulkAddTopics={handleBulkAddTopics}
            onSaveRatingOverride={(reportId, goldStars, redStars, note, isOverride) => {
              setSubmissions(prev =>
                prev.map(sub => {
                  if (sub.id === reportId) {
                    return {
                      ...sub,
                      adminOverride: {
                        goldStars,
                        redStars,
                        isOverride,
                        note
                      }
                    };
                  }
                  return sub;
                })
              );
            }}
          />
        )}

        {(activeView === 'submit' || activeView === 'sharaf') && currentUser && currentUser.role !== 'admin' && (
          <SubmissionPortal
            lang={lang}
            currentUser={currentUser}
            users={users}
            assignments={assignments}
            submissions={submissions}
            zones={zones}
            topics={topics}
            miqaats={miqaats}
            onSubmitReport={handleSubmitReport}
            onRespondAssignment={handleRespondAssignment}
            onAddAssignment={handleAddAssignment}
            onUpdateAssignment={handleUpdateAssignment}
            onAddMiqaat={handleAddMiqaat}
            onAddZone={handleAddZone}
            onBulkAddZones={handleBulkAddZones}
            onAddTopic={handleAddTopic}
            onBulkAddTopics={handleBulkAddTopics}
            onGradeSubmission={handleGradeSubmission}
            onSaveRatingOverride={(reportId, goldStars, redStars, note, isOverride) => {
              setSubmissions(prev =>
                prev.map(sub => {
                  if (sub.id === reportId) {
                    return {
                      ...sub,
                      adminOverride: {
                        goldStars,
                        redStars,
                        isOverride,
                        note
                      }
                    };
                  }
                  return sub;
                })
              );
            }}
            isSafarModeEnabled={isSafarModeEnabled}
            sharafAllocations={sharafAllocations}
            initialTab={activeView === 'sharaf' ? 'sharaf' : 'assigned'}
          />
        )}
      </main>

    </div>
  );
}
