/**
 * Lightweight bilingual label system for CRM.
 *
 * Provides English and Spanish labels for statuses, task types,
 * and common CRM terms. Not a full i18n framework - just a simple
 * lookup function for CRM-specific strings.
 *
 * To add Spanish follow-up templates, add entries to the TEMPLATES map.
 */

type Lang = 'en' | 'es'

const LABELS: Record<string, Record<Lang, string>> = {
  // Lead statuses
  'status.new': { en: 'New', es: 'Nuevo' },
  'status.attempted_contact': { en: 'Attempted Contact', es: 'Contacto Intentado' },
  'status.engaged': { en: 'Engaged', es: 'En Conversación' },
  'status.tour_scheduled': { en: 'Tour Scheduled', es: 'Tour Programado' },
  'status.toured': { en: 'Toured', es: 'Tour Completado' },
  'status.applied': { en: 'Applied', es: 'Aplicación Enviada' },
  'status.approved': { en: 'Approved', es: 'Aprobado' },
  'status.leased': { en: 'Leased', es: 'Arrendado' },
  'status.lost': { en: 'Lost', es: 'Perdido' },
  'status.archived': { en: 'Archived', es: 'Archivado' },

  // Lead sources
  'source.zillow': { en: 'Zillow', es: 'Zillow' },
  'source.apartments_com': { en: 'Apartments.com', es: 'Apartments.com' },
  'source.website': { en: 'Website', es: 'Sitio Web' },
  'source.facebook': { en: 'Facebook', es: 'Facebook' },
  'source.instagram': { en: 'Instagram', es: 'Instagram' },
  'source.phone': { en: 'Phone', es: 'Teléfono' },
  'source.walk_in': { en: 'Walk-In', es: 'Visita en Persona' },
  'source.referral': { en: 'Referral', es: 'Referencia' },
  'source.other': { en: 'Other', es: 'Otro' },

  // Lead types
  'leadType.tenant': { en: 'Tenant', es: 'Inquilino' },
  'leadType.owner': { en: 'Owner', es: 'Propietario' },
  'leadType.vendor': { en: 'Vendor', es: 'Proveedor' },
  'leadType.other': { en: 'Other', es: 'Otro' },

  // Task types
  'taskType.follow_up_call': { en: 'Follow-up Call', es: 'Llamada de Seguimiento' },
  'taskType.follow_up_sms': { en: 'Follow-up SMS', es: 'SMS de Seguimiento' },
  'taskType.follow_up_email': { en: 'Follow-up Email', es: 'Email de Seguimiento' },
  'taskType.manual_review': { en: 'Manual Review', es: 'Revisión Manual' },
  'taskType.spanish_follow_up': { en: 'Spanish Follow-up', es: 'Seguimiento en Español' },
  'taskType.appfolio_push': { en: 'Push to AppFolio', es: 'Enviar a AppFolio' },
  'taskType.other': { en: 'Other', es: 'Otro' },

  // Task statuses
  'taskStatus.open': { en: 'Open', es: 'Abierto' },
  'taskStatus.in_progress': { en: 'In Progress', es: 'En Progreso' },
  'taskStatus.complete': { en: 'Complete', es: 'Completado' },
  'taskStatus.canceled': { en: 'Canceled', es: 'Cancelado' },
  'taskStatus.overdue': { en: 'Overdue', es: 'Vencido' },

  // Priorities
  'priority.low': { en: 'Low', es: 'Baja' },
  'priority.medium': { en: 'Medium', es: 'Media' },
  'priority.high': { en: 'High', es: 'Alta' },
  'priority.urgent': { en: 'Urgent', es: 'Urgente' },

  // Activity types
  'activity.note': { en: 'Note', es: 'Nota' },
  'activity.email_sent': { en: 'Email Sent', es: 'Email Enviado' },
  'activity.email_received': { en: 'Email Received', es: 'Email Recibido' },
  'activity.sms_sent': { en: 'SMS Sent', es: 'SMS Enviado' },
  'activity.sms_received': { en: 'SMS Received', es: 'SMS Recibido' },
  'activity.call_logged': { en: 'Call Logged', es: 'Llamada Registrada' },
  'activity.voicemail': { en: 'Voicemail', es: 'Buzón de Voz' },
  'activity.status_changed': { en: 'Status Changed', es: 'Estado Cambiado' },
  'activity.task_created': { en: 'Task Created', es: 'Tarea Creada' },
  'activity.task_completed': { en: 'Task Completed', es: 'Tarea Completada' },
  'activity.guest_card_created': { en: 'Guest Card Created', es: 'Tarjeta de Invitado Creada' },

  // Conversation channels
  'channel.email': { en: 'Email', es: 'Email' },
  'channel.sms': { en: 'SMS', es: 'SMS' },
  'channel.phone': { en: 'Phone', es: 'Teléfono' },
  'channel.web': { en: 'Web', es: 'Web' },
  'channel.social': { en: 'Social', es: 'Redes Sociales' },
  'channel.internal': { en: 'Internal Note', es: 'Nota Interna' },

  // Common UI labels
  'ui.leads': { en: 'Leads', es: 'Prospectos' },
  'ui.tasks': { en: 'Tasks', es: 'Tareas' },
  'ui.activities': { en: 'Activities', es: 'Actividades' },
  'ui.conversations': { en: 'Conversations', es: 'Conversaciones' },
  'ui.pipeline': { en: 'Pipeline', es: 'Flujo de Ventas' },
  'ui.inbox': { en: 'Inbox', es: 'Bandeja de Entrada' },
  'ui.reporting': { en: 'Reporting', es: 'Reportes' },
  'ui.assign': { en: 'Assign', es: 'Asignar' },
  'ui.follow_up': { en: 'Follow Up', es: 'Seguimiento' },
  'ui.overdue': { en: 'Overdue', es: 'Vencido' },
  'ui.due_today': { en: 'Due Today', es: 'Vence Hoy' },
}

/**
 * Message templates for lead follow-up.
 * These are starting points - customize in the AutomationRules collection.
 */
export const TEMPLATES: Record<string, Record<Lang, string>> = {
  'initial_contact': {
    en: 'Hi {firstName}, thank you for your interest in renting with High Desert Property Management! We received your inquiry and a member of our team will be in touch shortly. In the meantime, you can browse our available listings at highdesertpm.com/listings.',
    es: 'Hola {firstName}, ¡gracias por su interés en alquilar con High Desert Property Management! Recibimos su consulta y un miembro de nuestro equipo se comunicará con usted pronto. Mientras tanto, puede ver nuestras propiedades disponibles en highdesertpm.com/listings.',
  },
  'follow_up_no_response': {
    en: 'Hi {firstName}, this is {agentName} from High Desert Property Management. I wanted to follow up on your recent inquiry. Are you still looking for a rental in Central Oregon? I\'d love to help you find the right place. Feel free to call or text me back.',
    es: 'Hola {firstName}, soy {agentName} de High Desert Property Management. Quería dar seguimiento a su consulta reciente. ¿Todavía está buscando un alquiler en Central Oregon? Me encantaría ayudarle a encontrar el lugar adecuado. No dude en llamar o enviar un mensaje de texto.',
  },
  'tour_confirmation': {
    en: 'Hi {firstName}, your tour of {propertyAddress} is confirmed for {tourDate}. Please arrive a few minutes early. If you need to reschedule, just let us know. See you there!',
    es: 'Hola {firstName}, su tour de {propertyAddress} está confirmado para {tourDate}. Por favor llegue unos minutos antes. Si necesita reprogramar, solo avísenos. ¡Nos vemos allí!',
  },
  'post_tour_follow_up': {
    en: 'Hi {firstName}, thanks for touring {propertyAddress} with us! What did you think? If you\'re ready to move forward, you can submit an application at the link below. Let me know if you have any questions.',
    es: 'Hola {firstName}, ¡gracias por visitar {propertyAddress} con nosotros! ¿Qué le pareció? Si desea continuar, puede enviar una solicitud en el enlace a continuación. Avíseme si tiene alguna pregunta.',
  },
  'application_received': {
    en: 'Hi {firstName}, we\'ve received your application for {propertyAddress}. Our team is reviewing it now and we\'ll get back to you within 1-2 business days. Thank you for your patience!',
    es: 'Hola {firstName}, hemos recibido su solicitud para {propertyAddress}. Nuestro equipo la está revisando y le responderemos dentro de 1-2 días hábiles. ¡Gracias por su paciencia!',
  },
}

/**
 * Get a translated label for a CRM key.
 */
export function t(key: string, lang: Lang = 'en'): string {
  return LABELS[key]?.[lang] ?? key
}

/**
 * Get a message template with variable substitution.
 */
export function template(
  templateKey: string,
  lang: Lang,
  vars: Record<string, string> = {},
): string | null {
  const tpl = TEMPLATES[templateKey]?.[lang]
  if (!tpl) return null

  return tpl.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
}

/**
 * Get all status options with translated labels.
 */
export function getStatusOptions(lang: Lang = 'en') {
  return [
    'new', 'attempted_contact', 'engaged', 'tour_scheduled',
    'toured', 'applied', 'approved', 'leased', 'lost', 'archived',
  ].map((status) => ({
    value: status,
    label: t(`status.${status}`, lang),
  }))
}
