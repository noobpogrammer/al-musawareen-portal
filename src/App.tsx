import React, { useState, useEffect } from 'react';
import { UserProfile, Assignment, ShotReport, SharafEventDef, SharafAllocation, MiqaatDef, Zone, Topic, AssignmentNotification, HRPermissions, UserRole, DataDumpRecord, getUserRoles, DEFAULT_HR_PERMISSIONS, MiqaatRequest } from './types';
import { 
  INITIAL_SUBMISSIONS, 
  INITIAL_ZONES, 
  INITIAL_TOPICS,
  DEFAULT_SHARAF_EVENTS,
  INITIAL_SHARAF_ALLOCATIONS,
  INITIAL_MIQAATS
} from './utils/mockData';
import { LanguageType } from './utils/translations';
import { 
  mapAssignmentFromDb, 
  mapAssignmentToDb, 
  mapNotificationFromDb, 
  mapMiqaatRequestFromDb, 
  mapMiqaatRequestToDb 
} from './utils/assignmentHelpers';

import { Clock, ShieldAlert } from 'lucide-react';
import Logo from './components/Logo';
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

// Helper to normalize Sharaf allocations from legacy or DB schema if needed
const normalizeSharafAllocation = (raw: any): SharafAllocation => ({
  id: raw.id || `alloc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  itsNumber: raw.itsNumber || raw.its_number,
  eventType: raw.eventType || raw.event_type,
  date: raw.date || undefined,
  location: raw.location || '',
  zone: raw.zone || raw.waazZone || undefined,
  fromTime: raw.fromTime || raw.from_time,
  toTime: raw.toTime || raw.to_time,
  dataCopyingDeadlineDate: raw.dataCopyingDeadlineDate || raw.data_copying_deadline_date || undefined,
  dataCopyingDeadlineTime: raw.dataCopyingDeadlineTime || raw.data_copying_deadline_time || undefined
});

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
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.map(sanitizeUserProfile) : [];
    } catch {
      return [];
    }
  });

  // Supabase-backed assignments (authoritative DB source)
  const [assignments, setAssignments] = useState<Assignment[]>([]);

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

  const [dataDumps, setDataDumps] = useState<DataDumpRecord[]>(() => {
    try {
      const saved = localStorage.getItem('al_musawareen_datadumps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Supabase-backed notifications (authoritative DB source)
  const [notifications, setNotifications] = useState<AssignmentNotification[]>([]);

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
      return Array.isArray(parsed) ? parsed.map(normalizeSharafAllocation) : INITIAL_SHARAF_ALLOCATIONS;
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

  // Supabase-backed Miqaat Requests (authoritative DB source)
  const [miqaatRequests, setMiqaatRequests] = useState<MiqaatRequest[]>([]);

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

  // 2. Persistence Hooks (Phase 1A: Only non-migrated entities in localStorage)
  useEffect(() => {
    localStorage.setItem('al_musawareen_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('al_musawareen_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('al_musawareen_datadumps', JSON.stringify(dataDumps));
  }, [dataDumps]);

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
        setActiveView(prev => (prev === 'pendingApproval' || prev === 'accountRejected' || prev === 'login') ? prev : 'public');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch all registered members and data dumps from Supabase database
  useEffect(() => {
    const fetchMembersAndDumps = async () => {
      try {
        const { data: dbMembers, error } = await supabase.from('members').select('*');
        if (!error && dbMembers && dbMembers.length > 0) {
          const mappedMembers: UserProfile[] = dbMembers.map(member => ({
            itsNumber: member.its_id,
            fullName: member.full_name,
            fullNameAr: member.full_name_ar,
            role: member.role as any,
            roles: member.roles || (member.role ? [member.role] : undefined),
            hrPermissions: member.hr_permissions || (member.role === 'coordinator' ? DEFAULT_HR_PERMISSIONS : undefined),
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
                  avatarUrl: dbm.avatarUrl || updated[index].avatarUrl,
                  hrPermissions: dbm.hrPermissions || updated[index].hrPermissions,
                  roles: dbm.roles || updated[index].roles
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
            if (dbMatch) {
              const updatedUser = { 
                ...prevUser, 
                avatarUrl: dbMatch.avatarUrl || prevUser.avatarUrl,
                hrPermissions: dbMatch.hrPermissions || prevUser.hrPermissions,
                roles: dbMatch.roles || prevUser.roles
              };
              localStorage.setItem('al_musawareen_session', JSON.stringify(updatedUser));
              return updatedUser;
            }
            return prevUser;
          });
        }

        // Fetch Assignments from Supabase
        const { data: dbAssignments, error: assignErr } = await supabase
          .from('assignments')
          .select('*')
          .order('date', { ascending: false });
        if (!assignErr && dbAssignments) {
          setAssignments(dbAssignments.map(mapAssignmentFromDb));
        } else if (assignErr) {
          console.warn('Failed to load assignments from Supabase:', assignErr);
        }

        // Fetch Assignment Notifications from Supabase
        const { data: dbNotifs, error: notifsErr } = await supabase
          .from('assignment_notifications')
          .select('*')
          .order('timestamp', { ascending: false });
        if (!notifsErr && dbNotifs) {
          setNotifications(dbNotifs.map(mapNotificationFromDb));
        } else if (notifsErr) {
          console.warn('Failed to load notifications from Supabase:', notifsErr);
        }

        // Fetch Data Dump records from Supabase
        const { data: dbDumps, error: dumpErr } = await supabase.from('data_dumps').select('*');
        if (!dumpErr && dbDumps && dbDumps.length > 0) {
          const mappedDumps: DataDumpRecord[] = dbDumps.map(d => ({
            id: d.id,
            assignmentId: d.assignment_id || undefined,
            sharafAllocationId: d.sharaf_allocation_id || undefined,
            itsNumber: d.its_number,
            eventName: d.event_name || undefined,
            date: d.date || undefined,
            zone: d.zone || undefined,
            cardReceived: Boolean(d.card_received),
            cardReceivedAt: d.card_received_at || undefined,
            cardReceivedBy: d.card_received_by || undefined,
            cardCopied: Boolean(d.card_copied),
            cardCopiedAt: d.card_copied_at || undefined,
            cardCopiedBy: d.card_copied_by || undefined,
            notes: d.notes || undefined,
            cardNotes: d.card_notes || undefined,
            touchPointCompletionMode: d.touch_point_completion_mode || undefined,
            completionPercentOverride: d.completion_percent_override || undefined,
            completedTouchPoints: d.completed_touch_points || undefined,
            createdAt: d.created_at,
            updatedAt: d.updated_at
          }));
          setDataDumps(mappedDumps);
        }

        // Fetch Shot Reports from Supabase
        const { data: dbReports, error: reportsErr } = await supabase.from('shot_reports').select('*');
        if (!reportsErr && dbReports && dbReports.length > 0) {
          const mappedReports: ShotReport[] = dbReports.map(sr => ({
            id: sr.id,
            itsNumber: sr.its_number,
            userName: sr.user_name,
            assignmentId: sr.assignment_id || undefined,
            assignmentTitle: sr.assignment_title,
            driveLink: sr.drive_link || undefined,
            submissionMethod: sr.submission_method || 'drive',
            touchPointCompletionMode: sr.touch_point_completion_mode || 'exact',
            completionPercentOverride: sr.completion_percent_override || undefined,
            completedTouchPoints: sr.completed_touch_points || [],
            adminOverride: sr.admin_override || undefined,
            redStarFlags: sr.red_star_flags || undefined,
            timestamp: sr.timestamp,
            notes: sr.notes || undefined,
            grade: sr.grade || 'Pending'
          }));
          setSubmissions(prev => {
            const combined = [...mappedReports];
            // Include local reports not yet in DB
            prev.forEach(p => {
              if (!combined.some(c => c.id === p.id || (p.assignmentId && c.assignmentId === p.assignmentId && c.itsNumber === p.itsNumber))) {
                combined.push(p);
              }
            });
            return combined;
          });
        }

        // Fetch Miqaat Requests from Supabase
        const { data: dbMiqaatReqs, error: miqaatReqsErr } = await supabase
          .from('miqaat_requests')
          .select('*')
          .order('created_at', { ascending: false });
        if (!miqaatReqsErr && dbMiqaatReqs) {
          setMiqaatRequests(dbMiqaatReqs.map(mapMiqaatRequestFromDb));
        } else if (miqaatReqsErr) {
          console.warn('Failed to load miqaat requests from Supabase:', miqaatReqsErr);
        }
      } catch (err) {
        console.warn('Could not fetch data from Supabase:', err);
      }
    };

    fetchMembersAndDumps();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: member, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (member) {
        // Enforce strict Admin Approval gate: non-admin users MUST have status === 'approved'
        if (member.role !== 'admin' && member.status !== 'approved') {
          console.warn(`[Access Guard] Unapproved user ${member.its_id} (status: ${member.status}) attempted session restore. Revoking auth session.`);
          const targetView = member.status === 'rejected' ? 'accountRejected' : 'pendingApproval';
          setActiveView(targetView);
          await supabase.auth.signOut();
          setCurrentUser(null);
          localStorage.removeItem('al_musawareen_session');
          return;
        }

        const profile: UserProfile = {
          itsNumber: member.its_id,
          fullName: member.full_name,
          fullNameAr: member.full_name_ar,
          role: member.role as any,
          roles: member.roles || (member.role ? [member.role] : undefined),
          hrPermissions: member.hr_permissions || (member.role === 'coordinator' ? DEFAULT_HR_PERMISSIONS : undefined),
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

  const handleUpdateAvatar = (its: string, avatarUrl: string) => {
    setUsers(prev => prev.map(u => u.itsNumber === its ? { ...u, avatarUrl } : u));
    setCurrentUser(prev => {
      if (prev && prev.itsNumber === its) {
        const updated = { ...prev, avatarUrl };
        localStorage.setItem('al_musawareen_session', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  };

  // 3. Operational State Mutation Functions (Callbacks)
  
  // A. Approve a pending user registration (with optional custom HR permissions)
  const handleApproveUser = async (its: string, permissions?: HRPermissions) => {
    const existing = users.find(u => u.itsNumber === its);
    const existingRoles = existing ? getUserRoles(existing) : ['photographer' as UserRole];
    const hrPermsToApply = permissions || existing?.hrPermissions || (existing?.role === 'coordinator' || existingRoles.includes('coordinator') ? DEFAULT_HR_PERMISSIONS : undefined);

    setUsers(prev => prev.map(u => {
      if (u.itsNumber === its) {
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
      await supabase.from('members').update({ 
        status: 'approved',
        roles: existingRoles,
        hr_permissions: hrPermsToApply
      }).eq('its_id', its);
    } catch (err) {
      console.warn('Failed to sync approval to Supabase database:', err);
    }
  };

  // Grant, extend, revoke HR permissions, or update user roles
  const handleUpdateUserPermissions = async (its: string, newRoles: UserRole[], permissions?: HRPermissions) => {
    const updatedRoles = Array.from(new Set(newRoles));
    // Primary role fallback: keep admin if admin, else first non-admin role or primary role
    const primaryRole = updatedRoles.includes('admin')
      ? 'admin'
      : updatedRoles[0] || 'photographer';

    setUsers(prev => prev.map(u => {
      if (u.itsNumber === its) {
        return {
          ...u,
          role: primaryRole,
          roles: updatedRoles,
          hrPermissions: permissions
        };
      }
      return u;
    }));

    // Update currentUser if modifying logged-in user
    setCurrentUser(prev => {
      if (prev && prev.itsNumber === its) {
        const updated = {
          ...prev,
          role: primaryRole,
          roles: updatedRoles,
          hrPermissions: permissions
        };
        localStorage.setItem('al_musawareen_session', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });

    try {
      await supabase.from('members').update({
        role: primaryRole,
        roles: updatedRoles,
        hr_permissions: permissions
      }).eq('its_id', its);
    } catch (err) {
      console.warn('Could not sync user permissions to Supabase:', err);
    }
  };

  // Data Dump update handler
  const handleUpdateDataDump = async (record: DataDumpRecord) => {
    setDataDumps(prev => {
      const idx = prev.findIndex(d => 
        d.id === record.id || 
        (record.assignmentId && d.assignmentId === record.assignmentId && d.itsNumber === record.itsNumber) ||
        (record.sharafAllocationId && d.sharafAllocationId === record.sharafAllocationId && d.itsNumber === record.itsNumber)
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = record;
        return next;
      }
      return [record, ...prev];
    });

    try {
      const { error } = await supabase.from('data_dumps').upsert({
        assignment_id: record.assignmentId || null,
        sharaf_allocation_id: record.sharafAllocationId && !record.sharafAllocationId.startsWith('alloc_') ? record.sharafAllocationId : null,
        its_number: record.itsNumber,
        event_name: record.eventName,
        date: record.date,
        zone: record.zone,
        card_received: record.cardReceived,
        card_received_at: record.cardReceivedAt,
        card_received_by: record.cardReceivedBy,
        card_copied: record.cardCopied,
        card_copied_at: record.cardCopiedAt,
        card_copied_by: record.cardCopiedBy,
        notes: record.notes,
        card_notes: record.cardNotes || record.notes,
        touch_point_completion_mode: record.touchPointCompletionMode || 'exact',
        completion_percent_override: record.completionPercentOverride ?? null,
        completed_touch_points: record.completedTouchPoints || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'assignment_id,its_number'
      });
      if (error) {
        console.warn('Supabase data_dumps upsert error:', error);
        throw error;
      }
    } catch (err) {
      console.warn('Could not sync data dump record to Supabase:', err);
      throw err;
    }
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

    setActiveView('pendingApproval');
  };

  // D. Create a new single assignment coverage record (Database-backed UUID generation)
  const handleAddAssignment = async (newAs: Omit<Assignment, 'id'>) => {
    const initialStatuses: Record<string, 'pending' | 'accepted' | 'declined'> = {};
    newAs.assignedUsers.forEach(its => {
      initialStatuses[its] = 'pending';
    });

    const dbPayload = mapAssignmentToDb({
      ...newAs,
      memberStatuses: initialStatuses,
      memberDeclineReasons: {}
    });

    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert(dbPayload)
        .select()
        .single();

      if (error) {
        console.error('Failed to create assignment in Supabase:', error);
        alert(lang === 'en' ? `Failed to create assignment: ${error.message}` : `فشل إنشاء التكليف: ${error.message}`);
        return;
      }

      const createdAssignment = mapAssignmentFromDb(data);
      setAssignments(prev => [createdAssignment, ...prev]);
    } catch (err) {
      console.error('Error in handleAddAssignment:', err);
    }
  };

  // Handle photographer/videographer accept or decline response via secure server RPC
  const handleRespondAssignment = async (
    assignmentId: string,
    itsNumber: string,
    action: 'accepted' | 'declined',
    reason?: string
  ) => {
    try {
      const { data, error } = await supabase.rpc('respond_to_assignment', {
        target_assignment_id: assignmentId,
        response_status: action,
        decline_reason: reason || null
      });

      if (error) {
        console.error('Supabase respond_to_assignment error:', error);
        alert(lang === 'en' ? `Failed to submit response: ${error.message}` : `فشل إرسال الرد: ${error.message}`);
        return;
      }

      if (data) {
        const saved = mapAssignmentFromDb(data);
        setAssignments(prev => prev.map(as => as.id === saved.id ? saved : as));
      }

      // Refetch notifications to sync newly created server notification
      const { data: dbNotifs } = await supabase
        .from('assignment_notifications')
        .select('*')
        .order('timestamp', { ascending: false });
      if (dbNotifs) {
        setNotifications(dbNotifs.map(mapNotificationFromDb));
      }
    } catch (err) {
      console.error('Error in handleRespondAssignment:', err);
    }
  };

  // Handle Admin slot reassignment when a member declines
  const handleReassignSlot = async (assignmentId: string, oldIts: string, newIts: string) => {
    const target = assignments.find(a => a.id === assignmentId);
    if (!target) return;

    const updatedUsers = target.assignedUsers.map(u => u === oldIts ? newIts : u);
    if (!updatedUsers.includes(newIts)) {
      updatedUsers.push(newIts);
    }
    const updatedStatuses = { ...(target.memberStatuses || {}) };
    delete updatedStatuses[oldIts];
    updatedStatuses[newIts] = 'pending';

    const updatedReasons = { ...(target.memberDeclineReasons || {}) };
    delete updatedReasons[oldIts];

    const updatedAssignment: Assignment = {
      ...target,
      assignedUsers: updatedUsers,
      memberStatuses: updatedStatuses,
      memberDeclineReasons: updatedReasons
    };

    try {
      const dbPayload = mapAssignmentToDb(updatedAssignment);
      const { data, error } = await supabase
        .from('assignments')
        .update(dbPayload)
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) {
        console.error('Failed to reassign slot in Supabase:', error);
        alert(lang === 'en' ? `Failed to reassign slot: ${error.message}` : `فشل إعادة التكليف: ${error.message}`);
        return;
      }

      const saved = mapAssignmentFromDb(data);
      setAssignments(prev => prev.map(as => as.id === saved.id ? saved : as));
    } catch (err) {
      console.error('Error in handleReassignSlot:', err);
    }
  };

  const handleUpdateAssignment = async (updatedAssignment: Assignment) => {
    try {
      const dbPayload = mapAssignmentToDb(updatedAssignment);
      const { data, error } = await supabase
        .from('assignments')
        .update(dbPayload)
        .eq('id', updatedAssignment.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update assignment in Supabase:', error);
        alert(lang === 'en' ? `Failed to update assignment: ${error.message}` : `فشل تحديث التكليف: ${error.message}`);
        return;
      }

      const saved = mapAssignmentFromDb(data);
      setAssignments(prev => prev.map(as => as.id === saved.id ? saved : as));
    } catch (err) {
      console.error('Error in handleUpdateAssignment:', err);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      const { error } = await supabase
        .from('assignment_notifications')
        .update({ read: true })
        .eq('id', id);
      if (error) {
        console.warn('Failed to mark notification read in Supabase:', error);
      }
    } catch (err) {
      console.warn('Error in handleMarkNotificationRead:', err);
    }
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
  const handleSubmitReport = async (newReport: Omit<ShotReport, 'id' | 'timestamp' | 'userName'>) => {
    const userName = users.find(u => u.itsNumber === newReport.itsNumber)?.fullName || 'Photographer';

    setSubmissions(prev => {
      const existingIndex = prev.findIndex(
        s => (newReport.assignmentId && s.assignmentId === newReport.assignmentId && s.itsNumber === newReport.itsNumber) ||
             (!newReport.assignmentId && s.assignmentTitle === newReport.assignmentTitle && s.itsNumber === newReport.itsNumber)
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          driveLink: newReport.driveLink !== undefined ? newReport.driveLink : updated[existingIndex].driveLink,
          submissionMethod: newReport.submissionMethod || updated[existingIndex].submissionMethod || 'drive',
          touchPointCompletionMode: newReport.touchPointCompletionMode || updated[existingIndex].touchPointCompletionMode,
          completionPercentOverride: newReport.completionPercentOverride !== undefined ? newReport.completionPercentOverride : updated[existingIndex].completionPercentOverride,
          completedTouchPoints: newReport.completedTouchPoints || updated[existingIndex].completedTouchPoints,
          notes: newReport.notes !== undefined ? newReport.notes : updated[existingIndex].notes,
          grade: updated[existingIndex].grade || 'Pending',
          timestamp: new Date().toISOString()
        };
        return updated;
      }

      const fullReport: ShotReport = {
        ...newReport,
        id: `sub_${Date.now()}`,
        submissionMethod: newReport.submissionMethod || 'drive',
        timestamp: new Date().toISOString(),
        userName
      };
      return [fullReport, ...prev];
    });

    try {
      const { data: dbReport, error } = await supabase.from('shot_reports').upsert({
        its_number: newReport.itsNumber,
        user_name: userName,
        assignment_id: newReport.assignmentId || null,
        assignment_title: newReport.assignmentTitle,
        drive_link: newReport.driveLink || null,
        submission_method: newReport.submissionMethod || 'drive',
        touch_point_completion_mode: newReport.touchPointCompletionMode || 'exact',
        completion_percent_override: newReport.completionPercentOverride ?? null,
        completed_touch_points: newReport.completedTouchPoints || null,
        notes: newReport.notes || null,
        grade: newReport.grade || 'Pending',
        timestamp: new Date().toISOString()
      }, {
        onConflict: 'assignment_id,its_number'
      }).select().single();

      if (error) {
        console.warn('Supabase shot_reports upsert error:', error);
      } else if (dbReport) {
        setSubmissions(prev => prev.map(s => 
          (newReport.assignmentId && s.assignmentId === newReport.assignmentId && s.itsNumber === newReport.itsNumber)
            ? { ...s, id: dbReport.id }
            : s
        ));
      }
    } catch (err) {
      console.warn('Could not sync shot report to Supabase:', err);
    }
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

  // Miqaat Request Handlers (Database-backed UUID generation)
  const handleAddMiqaatRequest = async (newRequest: Omit<MiqaatRequest, 'id' | 'createdAt'>) => {
    try {
      const dbPayload = mapMiqaatRequestToDb({
        ...newRequest,
        createdBy: currentUser?.itsNumber || newRequest.createdBy
      });

      const { data, error } = await supabase
        .from('miqaat_requests')
        .insert(dbPayload)
        .select()
        .single();

      if (error) {
        console.error('Failed to create miqaat request in Supabase:', error);
        alert(lang === 'en' ? `Failed to create Miqaat request: ${error.message}` : `فشل إنشاء طلب الميقات: ${error.message}`);
        return;
      }

      const saved = mapMiqaatRequestFromDb(data);
      setMiqaatRequests(prev => [saved, ...prev]);
    } catch (err) {
      console.error('Error in handleAddMiqaatRequest:', err);
    }
  };

  const handleRespondMiqaatRequest = async (
    requestId: string,
    itsNumber: string,
    status: 'accepted' | 'declined',
    declineReason?: string
  ) => {
    try {
      const { data, error } = await supabase.rpc('respond_to_miqaat_request', {
        target_request_id: requestId,
        response_status: status,
        decline_reason: declineReason || null
      });

      if (error) {
        console.error('Supabase respond_to_miqaat_request error:', error);
        alert(lang === 'en' ? `Failed to respond to Miqaat request: ${error.message}` : `فشل إرسال الرد على طلب الميقات: ${error.message}`);
        return;
      }

      if (data) {
        const saved = mapMiqaatRequestFromDb(data);
        setMiqaatRequests(prev => prev.map(r => r.id === saved.id ? saved : r));
      }
    } catch (err) {
      console.error('Error in handleRespondMiqaatRequest:', err);
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

        {activeView === 'pendingApproval' && (
          <div className="min-h-screen bg-editorial-bg py-16 px-4 flex items-center justify-center font-sans">
            <div className="w-full max-w-lg editorial-card p-8 sm:p-10 space-y-6 text-center animate-fadeIn">
              <div className="flex flex-col items-center">
                <Logo variant="primary" className="h-14 mb-4" />
                <div className="w-16 h-16 rounded-full bg-[#BA8332]/15 border-2 border-[#BA8332] flex items-center justify-center text-[#BA8332] my-2">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5C130F] mt-3">
                  Application Pending Official Approval
                </h2>
                <p className="font-mono text-xs text-[#BA8332] uppercase tracking-wider font-bold mt-1">
                  Al Musawareen Onboarding Status
                </p>
              </div>

              <div className="bg-[#FDFAF3] border border-[#5C130F]/20 p-5 rounded-none space-y-3 text-left rtl:text-right font-sans text-xs text-[#3A1A14]/85 leading-relaxed">
                <p className="font-serif italic text-sm text-[#5C130F] font-bold text-center">
                  "Your registration has been dispatched to Sheikh Ibrahim Bhai Lokhandwala for official onboarding."
                </p>
                <p className="text-center text-xs">
                  Once your ITS registration and credentials are verified by Administration, your account will be activated and you will be granted access to the Delegate Portal.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-[#5C130F]/15">
                <button
                  type="button"
                  onClick={() => setActiveView('login')}
                  className="w-full sm:w-auto px-6 py-3 bg-[#BA8332] hover:bg-[#a06e28] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Return to Login
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('public')}
                  className="w-full sm:w-auto px-6 py-3 bg-white/40 hover:bg-[#5C130F]/10 text-[#5C130F] font-mono text-xs font-bold uppercase tracking-wider transition-colors border border-[#5C130F]/30 cursor-pointer"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        )}

        {activeView === 'accountRejected' && (
          <div className="min-h-screen bg-editorial-bg py-16 px-4 flex items-center justify-center font-sans">
            <div className="w-full max-w-lg editorial-card p-8 sm:p-10 space-y-6 text-center animate-fadeIn">
              <div className="flex flex-col items-center">
                <Logo variant="primary" className="h-14 mb-4" />
                <div className="w-16 h-16 rounded-full bg-red-100 border-2 border-red-700 flex items-center justify-center text-red-700 my-2">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-red-900 mt-3">
                  Application Declined
                </h2>
                <p className="font-mono text-xs text-red-700 uppercase tracking-wider font-bold mt-1">
                  Registration Request Status
                </p>
              </div>

              <div className="bg-[#FDFAF3] border border-red-200 p-5 rounded-none space-y-3 text-center font-sans text-xs text-[#3A1A14]/85 leading-relaxed">
                <p className="font-serif italic text-sm text-red-900 font-bold">
                  "Your registration request was declined by Administration."
                </p>
                <p className="text-xs">
                  If you believe this is an error or require assistance regarding your ITS authorization, please contact Al Musawareen Administration.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-[#5C130F]/15">
                <button
                  type="button"
                  onClick={() => setActiveView('public')}
                  className="w-full sm:w-auto px-6 py-3 bg-[#5C130F] hover:bg-[#3A1A14] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
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
            dataDumps={dataDumps}
            miqaatRequests={miqaatRequests}
            onUpdateDataDump={handleUpdateDataDump}
            onSaveShotReport={handleSubmitReport}
            onApproveUser={handleApproveUser}
            onRejectUser={handleRejectUser}
            onUpdateUserPermissions={handleUpdateUserPermissions}
            onUpdateAvatar={handleUpdateAvatar}
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
            onAddMiqaatRequest={handleAddMiqaatRequest}
            onRespondMiqaatRequest={handleRespondMiqaatRequest}
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
            dataDumps={dataDumps}
            miqaatRequests={miqaatRequests}
            onUpdateDataDump={handleUpdateDataDump}
            onSubmitReport={handleSubmitReport}
            onRespondAssignment={handleRespondAssignment}
            onAddAssignment={handleAddAssignment}
            onUpdateAssignment={handleUpdateAssignment}
            onUpdateAvatar={handleUpdateAvatar}
            onAddMiqaat={handleAddMiqaat}
            onAddZone={handleAddZone}
            onBulkAddZones={handleBulkAddZones}
            onAddTopic={handleAddTopic}
            onBulkAddTopics={handleBulkAddTopics}
            onGradeSubmission={handleGradeSubmission}
            onAddMiqaatRequest={handleAddMiqaatRequest}
            onRespondMiqaatRequest={handleRespondMiqaatRequest}
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
