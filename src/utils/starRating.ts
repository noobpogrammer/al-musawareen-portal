import { ShotReport, Assignment, UserProfile, StarRating } from '../types';

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
  if (report.completedTouchPoints) {
    completedCount = report.completedTouchPoints.length;
  }

  const completionPercent = totalTouchPoints > 0 ? Math.min(100, Math.max(0, (completedCount / totalTouchPoints) * 100)) : 100;

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

  // 4. On-Time Bonus calculation (+1 Gold Star if submitted before or on due date)
  let isOnTime = true;
  const dueDateStr = report.dueDate || assignment?.date;

  if (dueDateStr && report.timestamp) {
    try {
      const subTime = new Date(report.timestamp).getTime();
      // If dueDate is a date string like '2026-07-21', consider end of that day or exact ISO string
      const dueTime = new Date(dueDateStr.includes('T') ? dueDateStr : `${dueDateStr}T23:59:59Z`).getTime();
      if (!isNaN(subTime) && !isNaN(dueTime) && subTime > dueTime) {
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
