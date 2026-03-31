/**
 * Normalize a phone number to +1XXXXXXXXXX format for US numbers.
 * Strips all non-digit characters, prepends +1 if needed.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')

  if (digits.length === 0) return ''

  // Already has country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }

  // Standard 10-digit US number
  if (digits.length === 10) {
    return `+1${digits}`
  }

  // Return as-is with + prefix if it doesn't match US patterns
  return `+${digits}`
}

/**
 * Normalize an email: lowercase and trim whitespace.
 */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

/**
 * Split a full name string into firstName and lastName.
 * Handles single names, multi-part names, and trims whitespace.
 */
export function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim()
  if (!trimmed) return { firstName: '', lastName: '' }

  const parts = trimmed.split(/\s+/)

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }

  const firstName = parts[0]
  const lastName = parts.slice(1).join(' ')

  return { firstName, lastName }
}
