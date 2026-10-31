import { LeadStatus, nextStatuses } from './types'

/**
 * Check if a status transition is allowed.
 */
export function isValidTransition(
  from: LeadStatus,
  to: LeadStatus,
  leadType?: string | null,
): boolean {
  if (from === to) return true // no-op is always valid
  return nextStatuses(from, leadType).includes(to)
}

const STATUS_LABELS_EN: Record<LeadStatus, string> = {
  [LeadStatus.New]: 'New',
  [LeadStatus.AttemptedContact]: 'Attempted Contact',
  [LeadStatus.Engaged]: 'Engaged',
  [LeadStatus.TourScheduled]: 'Tour Scheduled',
  [LeadStatus.Toured]: 'Toured',
  [LeadStatus.Applied]: 'Applied',
  [LeadStatus.Approved]: 'Approved',
  [LeadStatus.Leased]: 'Leased',
  [LeadStatus.ConsultBooked]: 'Consult Booked',
  [LeadStatus.ProposalSent]: 'Proposal Sent',
  [LeadStatus.Signed]: 'Signed',
  [LeadStatus.Lost]: 'Lost',
  [LeadStatus.Archived]: 'Archived',
}

const STATUS_LABELS_ES: Record<LeadStatus, string> = {
  [LeadStatus.New]: 'Nuevo',
  [LeadStatus.AttemptedContact]: 'Contacto Intentado',
  [LeadStatus.Engaged]: 'En Contacto',
  [LeadStatus.TourScheduled]: 'Tour Programado',
  [LeadStatus.Toured]: 'Tour Realizado',
  [LeadStatus.Applied]: 'Aplicado',
  [LeadStatus.Approved]: 'Aprobado',
  [LeadStatus.Leased]: 'Arrendado',
  [LeadStatus.ConsultBooked]: 'Consulta Programada',
  [LeadStatus.ProposalSent]: 'Propuesta Enviada',
  [LeadStatus.Signed]: 'Firmado',
  [LeadStatus.Lost]: 'Perdido',
  [LeadStatus.Archived]: 'Archivado',
}

/**
 * Get a human-readable label for a lead status.
 */
export function getStatusLabel(status: LeadStatus, lang: 'en' | 'es' = 'en'): string {
  const labels = lang === 'es' ? STATUS_LABELS_ES : STATUS_LABELS_EN
  return labels[status] || status
}
