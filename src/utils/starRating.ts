import { ShotReport, Assignment, UserProfile, StarRating } from '../types';

export function parseDateTimeToMillis(dateStr?: string, timeStr?: string): number | null {
  if (!dateStr) return null;
  const cleanDate = dateStr.trim();
  
  if (timeStr && timeStr.trim()) {
    const cleanTime = timeStr.trim();
    const match12 = cleanTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    const match24 = cleanTime.match(/^(\d{1,2}):(\d{2})$/);
    
    let hours = 23;
    let minutes = 59;
    
    if (match12) {
      hours = parseInt(match12[1], 10);
      minutes = parseInt(match12[2], 10);
      const ampm = match12[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    } else if (match24) {
      hours = parseInt(match24[1], 10);
      minutes = parseInt(match24[2], 10);
    }
    
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), hours, minutes, 0);
      return d.getTime();
    }
  }

  // Fallback: End of that date
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 23, 59, 59);
    return d.getTime();
  }
  
  const parsed = new Date(cleanDate).getTime();
  return isNaN(parsed) ? null : parsed;
}

export function calculateStarRating(
  report: ShotReport,
  assignment?: Assignment,
  user?: UserProfile
): StarRating {
  // 1. Determine assigned touch points count & titles
  let totalTouchPoints = 1;
  let assignedTopicList: string[] = [];

  if (assignment?.topics && assignment.topics.length > 0) {
    assignedTopicList = assignment.topics;
    totalTouchPoints = assignment.topics.length;
  } else if (assignment?.topic) {
    if (Array.isArray(assignment.topic)) {
      assignedTopicList = assignment.topic;
      totalTouchPoints = assignment.topic.length;
    } else {
      assignedTopicList = [assignment.topic];
      totalTouchPoints = 1;
    }
  }

  // 2. Determine completed touch points count & detailed breakdown
  let completedCount = totalTouchPoints;
  let completionPercent = 100;

  if (report.touchPointCompletionMode === 'percentage' && report.completionPercentOverride !== undefined) {
    completionPercent = report.completionPercentOverride;
    completedCount = Math.round((completionPercent / 100) * totalTouchPoints);
  } else if (report.completedTouchPoints) {
    completedCount = report.completedTouchPoints.length;
    completionPercent = totalTouchPoints > 0 ? Math.min(100, Math.max(0, (completedCount / totalTouchPoints) * 100)) : 100;
  } else {
    completedCount = totalTouchPoints;
    completionPercent = 100;
  }

  const completedList = report.completedTouchPoints || [];
  const touchPointDetails = assignedTopicList.map(tp => ({
    name: tp,
    isCompleted: report.completedTouchPoints ? completedList.includes(tp) : true
  }));

  // 3. Touch-point Gold Star Tier calculation
  let touchPointGoldStars = 0;
  if (completionPercent >= 100) {
    touchPointGoldStars = 3.0;
  } else if (completionPercent >= 75) {
    touchPointGoldStars = 2.0;
  } else if (completionPercent >= 50) {
    touchPointGoldStars = 1.0;
  } else if (completionPercent >= 25) {
    touchPointGoldStars = 0.5;
  } else {
    touchPointGoldStars = 0.0;
  }

  // 4. On-Time Bonus calculation (+1 Gold Star if submitted before or on Data Copying Deadline)
  let isOnTime = true;
  const deadlineDate = assignment?.dataCopyingDeadlineDate || report.dueDate || assignment?.date;
  const deadlineTime = assignment?.dataCopyingDeadlineTime;

  if (deadlineDate && report.timestamp) {
    try {
      const subTime = new Date(report.timestamp).getTime();
      const dueTime = parseDateTimeToMillis(deadlineDate, deadlineTime);
      if (!isNaN(subTime) && dueTime !== null && subTime > dueTime) {
        isOnTime = false;
      }
    } catch {
      isOnTime = true;
    }
  }

  // Explicit red star flag override if marked late
  if (report.redStarFlags?.isLate !== undefined) {
    isOnTime = !report.redStarFlags.isLate;
  }

  const onTimeBonus = isOnTime ? 1.0 : 0.0;
  const computedGoldStars = touchPointGoldStars + onTimeBonus;

  // 5. Red Star Demerits calculation (+1 Red Star per flag)
  const isLate = !isOnTime;
  const sharafCancelledFault = Boolean(report.redStarFlags?.sharafCancelledFault || (user && (user as any).sharafCancelledFault));
  const assignmentCancelledFault = Boolean(report.redStarFlags?.assignmentCancelledFault || (user && (user as any).assignmentCancelledFault));
  const assignmentDeclineReason = assignment?.memberDeclineReasons?.[report.itsNumber];

  let computedRedStars = 0;
  if (isLate) computedRedStars += 1;
  if (sharafCancelledFault) computedRedStars += 1;
  if (assignmentCancelledFault) computedRedStars += 1;

  // 6. Return StarRating object, checking for admin override
  const override = report.adminOverride;
  if (override && override.isOverride) {
    return {
      goldStars: override.goldStars ?? computedGoldStars,
      redStars: override.redStars ?? computedRedStars,
      isOverride: true,
      overrideNote: override.note,
      completionPercent,
      completedTouchPointsCount: completedCount,
      totalTouchPointsCount: totalTouchPoints,
      touchPointDetails,
      isOnTime,
      redStarReasons: {
        isLate,
        sharafCancelledFault,
        assignmentCancelledFault,
        assignmentDeclineReason
      }
    };
  }

  return {
    goldStars: computedGoldStars,
    redStars: computedRedStars,
    isOverride: false,
    completionPercent,
    completedTouchPointsCount: completedCount,
    totalTouchPointsCount: totalTouchPoints,
    touchPointDetails,
    isOnTime,
    redStarReasons: {
      isLate,
      sharafCancelledFault,
      assignmentCancelledFault,
      assignmentDeclineReason
    }
  };
}

export function calculateUserAverageRating(
  reports: ShotReport[],
  assignments: Assignment[],
  user: UserProfile
): { averageGold: number; totalRedStars: number; reportsCount: number; redStarBreakdown: string[] } {
  const userReports = reports.filter(r => r.itsNumber === user.itsNumber);
  if (userReports.length === 0) {
    return { averageGold: 0, totalRedStars: 0, reportsCount: 0, redStarBreakdown: [] };
  }

  let sumGold = 0;
  let totalRed = 0;
  const breakdownSet = new Set<string>();

  userReports.forEach(report => {
    const assignment = assignments.find(a => a.id === report.assignmentId);
    const rating = calculateStarRating(report, assignment, user);
    sumGold += rating.goldStars;
    totalRed += rating.redStars;

    if (rating.redStarReasons.isLate) breakdownSet.add('Late Submission');
    if (rating.redStarReasons.sharafCancelledFault) breakdownSet.add('Sharaf Allocation Cancelled (Member Fault)');
    if (rating.redStarReasons.assignmentCancelledFault) breakdownSet.add('Assignment Cancelled (Member Fault)');
  });

  const averageGold = Math.round((sumGold / userReports.length) * 2) / 2; // round to nearest 0.5
  return {
    averageGold,
    totalRedStars: totalRed,
    reportsCount: userReports.length,
    redStarBreakdown: Array.from(breakdownSet)
  };
}
