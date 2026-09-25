export const PHONE_LENGTH = 11
export const PHONE_PREFIX = '01'
export const EGYPT_PHONE_REGEX = /^01\d{9}$/

/**
 * Normalizes phone input by stripping non-digit characters, handling common
 * Egypt country codes (+20 / 0020), and limiting the value to 11 digits.
 */
export function normalizePhone(value: string): string {
  if (!value) return ''
  let cleaned = value.trim()

  if (cleaned.startsWith('+20')) {
    cleaned = cleaned.slice(3).trim()
    if (cleaned.startsWith('1')) {
      cleaned = '0' + cleaned
    }
  } else if (cleaned.startsWith('0020')) {
    cleaned = cleaned.slice(4).trim()
    if (cleaned.startsWith('1')) {
      cleaned = '0' + cleaned
    }
  }

  return cleaned.replace(/\D/g, '').slice(0, PHONE_LENGTH)
}

/**
 * Checks if a phone number is valid according to system rules:
 * - Optional if empty or whitespace
 * - If provided, must be exactly 11 digits and start with "01"
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone || !phone.trim()) {
    return true
  }
  return EGYPT_PHONE_REGEX.test(phone.trim())
}

/**
 * Validates a phone number field.
 * Returns an error string if invalid, or null if valid/empty.
 */
export function validatePhone(
  phone: string | null | undefined,
  t?: (key: string) => string,
): string | null {
  if (!phone || !phone.trim()) {
    return null
  }
  const trimmed = phone.trim()
  if (!EGYPT_PHONE_REGEX.test(trimmed)) {
    return t
      ? t('common.validation.phoneInvalid')
      : 'Phone number must be 11 digits and start with 01'
  }
  return null
}
