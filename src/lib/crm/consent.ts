/**
 * SMS and email consent are explicit opt-in. A lead is opted in only when the
 * person ticked a consent box: a checked HTML checkbox posts "on", and a JSON
 * intake sends true. Anything else (missing, false, "yes", 1) counts as no consent.
 */
export function explicitConsent(value: unknown): boolean {
  return value === true || value === 'on'
}
