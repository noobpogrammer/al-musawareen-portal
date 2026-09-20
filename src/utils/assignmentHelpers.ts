import { Assignment, AssignmentNotification, MiqaatRequest } from '../types';

export function mapAssignmentFromDb(raw: any): Assignment {
  const topicsArray = Array.isArray(raw.topics)
    ? raw.topics
    : typeof raw.topics === 'string' && raw.topics.trim()
      ? [raw.topics.trim()]
      : [];

  const primaryTopic = topicsArray.length > 0 ? topicsArray[0] : (typeof raw.topic === 'string' ? raw.topic : 'General Coverage');

  return {
    id: raw.id,
    date: raw.date,
    fromTime: raw.from_time || undefined,
    toTime: raw.to_time || undefined,
    dataCopyingDeadlineDate: raw.data_copying_deadline_date || raw.date || undefined,
    dataCopyingDeadlineTime: raw.data_copying_deadline_time || undefined,
    miqaatName: raw.miqaat_name || undefined,
    zone: raw.zone || '',
    topic: primaryTopic,
    topics: topicsArray,
    assignedUsers: Array.isArray(raw.assigned_users) ? raw.assigned_users : [],
    memberStatuses: raw.member_statuses && typeof raw.member_statuses === 'object' ? raw.member_statuses : {},
    memberDeclineReasons: raw.member_decline_reasons && typeof raw.member_decline_reasons === 'object' ? raw.member_decline_reasons : {},
    notes: raw.notes || undefined,
    status: raw.status || 'active'
  };
}

export function mapAssignmentToDb(as: Omit<Assignment, 'id'> | Assignment): Record<string, any> {
  const topicsList = Array.isArray(as.topics) && as.topics.length > 0
    ? as.topics
    : (typeof as.topic === 'string' && as.topic.trim() ? [as.topic.trim()] : []);

  return {
    date: as.date,
    from_time: as.fromTime?.trim() || null,
    to_time: as.toTime?.trim() || null,
    data_copying_deadline_date: as.dataCopyingDeadlineDate?.trim() || as.date || null,
    data_copying_deadline_time: as.dataCopyingDeadlineTime?.trim() || null,
    miqaat_name: as.miqaatName?.trim() || null,
    zone: as.zone?.trim() || '',
    topics: topicsList,
    assigned_users: as.assignedUsers || [],
    member_statuses: as.memberStatuses || {},
    member_decline_reasons: as.memberDeclineReasons || {},
    notes: as.notes?.trim() || null,
    status: as.status || 'active'
  };
}

export function mapNotificationFromDb(raw: any): AssignmentNotification {
  return {
    id: raw.id,
    assignmentId: raw.assignment_id,
    itsNumber: raw.its_number,
    memberName: raw.member_name,
    assignmentTitle: raw.assignment_title,
    action: raw.action,
    declineReason: raw.decline_reason || undefined,
    timestamp: raw.timestamp,
    read: Boolean(raw.read)
  };
}

export function mapMiqaatRequestFromDb(raw: any): MiqaatRequest {
  return {
    id: raw.id,
    miqaatName: raw.miqaat_name,
    fromDate: raw.from_date,
    toDate: raw.to_date,
    notes: raw.notes || undefined,
    createdBy: raw.created_by || undefined,
    memberResponses: raw.member_responses && typeof raw.member_responses === 'object' ? raw.member_responses : {},
    createdAt: raw.created_at,
    updatedAt: raw.updated_at || undefined
  };
}

export function mapMiqaatRequestToDb(req: Omit<MiqaatRequest, 'id' | 'createdAt'> | MiqaatRequest): Record<string, any> {
  return {
    miqaat_name: req.miqaatName?.trim() || '',
    from_date: req.fromDate,
    to_date: req.toDate,
    notes: req.notes?.trim() || null,
    created_by: req.createdBy?.trim() || null,
    member_responses: req.memberResponses || {}
  };
}
