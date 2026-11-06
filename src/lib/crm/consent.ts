import { CONSENT_WORDING_VERSION } from './consent-wording'

/**
 * SMS and email consent are explicit opt-in. A lead is opted in only when the
 * person ticked a consent box: a checked HTML checkbox posts "on", and a JSON
 * intake sends true. Anything else (missing, false, "yes", 1) counts as no consent.
 */
export function explicitConsent(value: unknown): boolean {
  return value === true || value === 'on'
}

/**
 * The opt-in flags for a new lead plus the evidence for each box that was
 * ticked: when, on which form, and which wording version the person saw.
 * Unticked boxes leave their evidence empty. Leads opted in without evidence
 * were saved before the consent boxes existed.
 */
export function consentFields(
  sms: unknown,
  email: unknown,
  form: string,
  options: { now?: Date; wordingVersion?: string } = {},
) {
  const smsOptIn = explicitConsent(sms)
  const emailOptIn = explicitConsent(email)
  const at = (options.now ?? new Date()).toISOString()
  const any = smsOptIn || emailOptIn
  return {
    smsOptIn,
    emailOptIn,
    smsConsentAt: smsOptIn ? at : null,
    emailConsentAt: emailOptIn ? at : null,
    consentForm: any ? form : null,
    consentWordingVersion: any ? (options.wordingVersion ?? CONSENT_WORDING_VERSION) : null,
  }
}

/**
 * Consent ticked on a submission that matched an existing lead. An email or
 * phone match is not proof of identity, so the existing lead's opt-ins, its
 * doNotContact and its earlier evidence are left alone. Instead the evidence
 * goes on the reviewable activity, with a line telling staff to verify before
 * opting the lead in. Returns null when no box was ticked.
 */
export function submittedConsent(
  sms: unknown,
  email: unknown,
  form: string,
  options: { now?: Date; wordingVersion?: string } = {},
) {
  const fields = consentFields(sms, email, form, options)
  if (!fields.smsOptIn && !fields.emailOptIn) return null
  const channels = [fields.smsOptIn && 'SMS', fields.emailOptIn && 'email'].filter(Boolean).join(' and ')
  return {
    metadata: {
      sms: fields.smsOptIn,
      email: fields.emailOptIn,
      smsConsentAt: fields.smsConsentAt,
      emailConsentAt: fields.emailConsentAt,
      consentForm: fields.consentForm,
      consentWordingVersion: fields.consentWordingVersion,
      appliedToLead: false,
    },
    note: `Consent ticked on this submission: ${channels}. Not applied to the lead: verify this is the same person before opting them in.`,
  }
}
