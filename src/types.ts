export type UserRole = 'photographer' | 'videographer' | 'coordinator' | 'admin';

export interface SharafAllocation {
  id: string;
  itsNumber: string;
  eventType: string; // 'Waaz', 'Qadambosi', 'Nikah', 'Misaq', 'Ziyafat', or custom
  // Waaz specific fields:
  waazZone?: 'Masjid Sehan' | 'Bairoon Masjid' | 'Mawaid' | 'Relay Center' | string;
  mohalla?: string;
  isCustomZone?: boolean;
  // Non-Waaz fields:
  location?: string;
  fromTime?: string;
  toTime?: string;
}

export interface SharafEventDef {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface HRPermissions {
  assignCoverage?: boolean;      // Assign photographers/videographers to coverage schedules/zones
  viewAssignments?: boolean;     // Follow up on / view status of existing assignments
  reviewSubmissions?: boolean;   // Review and verify shot report submissions (view-only)
  starOverride?: boolean;        // Star-override rights on shot report submissions
  viewRoster?: boolean;          // View team roster (Active Dispatched Lenses table)
  editRoster?: boolean;          // Edit rights on team roster
  approveOnboarding?: boolean;   // Admin-only toggle: approving/rejecting onboarding applications
  manageSharaf?: boolean;        // Admin-only toggle: Sharaf allocation
  systemSettings?: boolean;      // Admin-only toggle: system settings (Zones, Topics, Miqaats, Safar Mode)
}

export const DEFAULT_HR_PERMISSIONS: HRPermissions = {
  assignCoverage: true,
  viewAssignments: true,
  reviewSubmissions: true,
  starOverride: false,
  viewRoster: true,
  editRoster: false,
  approveOnboarding: false,
  manageSharaf: false,
  systemSettings: false,
};

export interface UserProfile {
  itsNumber: string;
  fullName: string;
  fullNameAr?: string;
  role: UserRole;
  roles?: UserRole[];
  hrPermissions?: HRPermissions;
  mobile: string;
  email: string;
  password?: string;
  cityRaza: string;
  cityDomicile?: string;
  dateArrival?: string;
  mohalla?: string;
  avatarUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  sharafStatus: 'granted' | 'pending' | 'none';
  sharafZone?: string;
  sharafSeat?: string;
  sharafAllocations?: SharafAllocation[];
  createdAt: string;
  cameras?: string[];
  lenses?: string[];
  otherEquipment?: string;
}

export function getUserRoles(user?: UserProfile | null): UserRole[] {
  if (!user) return [];
  if (user.roles && user.roles.length > 0) {
    return Array.from(new Set(user.roles));
  }
  return [user.role];
}

export function hasRole(user: UserProfile | null | undefined, role: UserRole): boolean {
  if (!user) return false;
  return getUserRoles(user).includes(role);
}

export function formatRoleBadgeLabel(user?: UserProfile | null): string {
  if (!user) return '';
  const roles = getUserRoles(user);
  if (roles.includes('admin')) {
    return 'Admin';
  }
  const labels: string[] = [];
  if (roles.includes('photographer')) labels.push('Photographer');
  if (roles.includes('videographer')) labels.push('Videographer');
  if (roles.includes('coordinator')) labels.push('HR');

  if (labels.length === 0) {
    return user.role ? user.role.toUpperCase() : 'MEMBER';
  }
  return labels.join(' · ');
}


export interface MiqaatDef {
  id: string;
  name: string;
}

export interface Assignment {
  id: string;
  date: string;
  miqaatName?: string;
  zone: string;
  topic: string | string[]; // Single string or array of Touch Points
  topics?: string[]; // Array of selected Touch Points
  assignedUsers: string[]; // List of ITS numbers
  memberStatuses?: Record<string, 'pending' | 'accepted' | 'declined'>; // Member ITS -> status
  memberDeclineReasons?: Record<string, string>; // Member ITS -> decline reason
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface AssignmentNotification {
  id: string;
  assignmentId: string;
  itsNumber: string;
  memberName: string;
  assignmentTitle: string;
  action: 'accepted' | 'declined';
  declineReason?: string;
  timestamp: string;
  read: boolean;
}

export interface RedStarReasons {
  isLate: boolean;
  sharafCancelledFault: boolean;
  assignmentCancelledFault: boolean;
  assignmentDeclineReason?: string;
}

export interface TouchPointDetail {
  name: string;
  isCompleted: boolean;
}

export interface StarRating {
  goldStars: number;
  redStars: number;
  isOverride: boolean;
  overrideNote?: string;
  completionPercent: number;
  completedTouchPointsCount: number;
  totalTouchPointsCount: number;
  touchPointDetails: TouchPointDetail[];
  isOnTime: boolean;
  redStarReasons: RedStarReasons;
}

export interface ShotReport {
  id: string;
  itsNumber: string;
  userName: string;
  assignmentId: string;
  assignmentTitle: string;
  driveLink: string;
  timestamp: string;
  notes?: string;
  grade: 'Pending' | 'A-Excellent' | 'B-Good' | 'C-Late-Incomplete';
  // Automated Star Rating & Touch Point Granularity
  completedTouchPoints?: string[];
  dueDate?: string;
  redStarFlags?: {
    isLate?: boolean;
    sharafCancelledFault?: boolean;
    assignmentCancelledFault?: boolean;
  };
  adminOverride?: {
    goldStars?: number;
    redStars?: number;
    isOverride: boolean;
    note?: string;
  };
}

export interface Zone {
  id: string;
  name: string;
  description: string;
}

export interface Topic {
  id: string;
  name: string;
  category: string;
}
