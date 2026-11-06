/**
 * The consent wording shown beside the SMS and email boxes on every website
 * form. A lead's consent record stores CONSENT_WORDING_VERSION, so change the
 * version whenever either text changes; the old text stays in git history.
 *
 * DRAFT pending Craig's approval. The SMS text needs a legal check before release.
 */
export const CONSENT_WORDING_VERSION = '2026-11-06-v1'

export const SMS_CONSENT_TEXT =
  'Text me. I agree that High Desert Property Management may send text messages about my inquiry and its property management services to the phone number I entered. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out or HELP for help. Consent is not a condition of service.'

export const EMAIL_CONSENT_TEXT =
  'Email me. I agree that High Desert Property Management may email me about my inquiry, rental market updates and its property management services. Every email has an unsubscribe link. Consent is not a condition of service.'
