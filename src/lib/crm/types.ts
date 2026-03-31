export enum LeadStatus {
  New = 'new',
  AttemptedContact = 'attempted_contact',
  Engaged = 'engaged',
  TourScheduled = 'tour_scheduled',
  Toured = 'toured',
  Applied = 'applied',
  Approved = 'approved',
  Leased = 'leased',
  Lost = 'lost',
  Archived = 'archived',
}

export enum LeadSource {
  Zillow = 'zillow',
  ApartmentsCom = 'apartments_com',
  Website = 'website',
  Facebook = 'facebook',
  Instagram = 'instagram',
  Phone = 'phone',
  WalkIn = 'walk_in',
  Referral = 'referral',
  Other = 'other',
}

export enum LeadType {
  Tenant = 'tenant',
  Owner = 'owner',
  Vendor = 'vendor',
  Other = 'other',
}

export enum TaskType {
  FollowUp = 'follow_up',
  Tour = 'tour',
  ApplicationReview = 'application_review',
  LeasePrep = 'lease_prep',
  PhoneCall = 'phone_call',
  Email = 'email',
  Sms = 'sms',
  Other = 'other',
}

export enum TaskStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum TaskPriority {
  Low = 'low',
  Normal = 'normal',
  High = 'high',
  Urgent = 'urgent',
}

export enum ActivityType {
  StatusChange = 'status_change',
  NoteAdded = 'note_added',
  EmailSent = 'email_sent',
  EmailReceived = 'email_received',
  SmsSent = 'sms_sent',
  SmsReceived = 'sms_received',
  PhoneCall = 'phone_call',
  TourScheduled = 'tour_scheduled',
  TourCompleted = 'tour_completed',
  ApplicationSubmitted = 'application_submitted',
  LeaseCreated = 'lease_created',
  Assigned = 'assigned',
  Merged = 'merged',
  Other = 'other',
}

export enum ConversationChannel {
  Email = 'email',
  Sms = 'sms',
  Phone = 'phone',
  WebChat = 'web_chat',
  Facebook = 'facebook',
  Instagram = 'instagram',
  Other = 'other',
}

export const CLOSED_STATUSES: LeadStatus[] = [
  LeadStatus.Leased,
  LeadStatus.Lost,
  LeadStatus.Archived,
]

export const ValidStatusTransitions: Record<LeadStatus, LeadStatus[]> = {
  [LeadStatus.New]: [
    LeadStatus.AttemptedContact,
    LeadStatus.Engaged,
    LeadStatus.Lost,
    LeadStatus.Archived,
  ],
  [LeadStatus.AttemptedContact]: [
    LeadStatus.Engaged,
    LeadStatus.Lost,
    LeadStatus.Archived,
  ],
  [LeadStatus.Engaged]: [
    LeadStatus.TourScheduled,
    LeadStatus.Applied,
    LeadStatus.Lost,
    LeadStatus.Archived,
  ],
  [LeadStatus.TourScheduled]: [
    LeadStatus.Toured,
    LeadStatus.Engaged,
    LeadStatus.Lost,
    LeadStatus.Archived,
  ],
  [LeadStatus.Toured]: [
    LeadStatus.Applied,
    LeadStatus.Engaged,
    LeadStatus.Lost,
    LeadStatus.Archived,
  ],
  [LeadStatus.Applied]: [
    LeadStatus.Approved,
    LeadStatus.Engaged,
    LeadStatus.Lost,
    LeadStatus.Archived,
  ],
  [LeadStatus.Approved]: [
    LeadStatus.Leased,
    LeadStatus.Lost,
    LeadStatus.Archived,
  ],
  [LeadStatus.Leased]: [LeadStatus.Archived],
  [LeadStatus.Lost]: [LeadStatus.New, LeadStatus.Archived],
  [LeadStatus.Archived]: [LeadStatus.New],
}
