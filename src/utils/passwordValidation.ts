export type PasswordConstraint = 'PASSWORD_REQUIRED' | 'PASSWORD_LENGTH' | 'PASSWORD_PATTERN'

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 64

function containsControlChar(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    if ((code >= 0 && code <= 31) || (code >= 127 && code <= 159)) {
      return true
    }
  }
  return /\p{Cc}/u.test(str)
}

/**
 * Validates a password according to the system rules:
 * - 8 to 64 characters
 * - At least one letter in any language
 * - At least one number
 * - No control characters such as newline or tab
 *
 * In creation: password is required.
 * In edit: password is optional; if left empty or null, returns null.
 *
 * Returns a constraint code if invalid, or null if valid.
 */
export function getPasswordConstraint(
  password: string | null | undefined,
  isRequired: boolean,
): PasswordConstraint | null {
  if (!password || !password.trim()) {
    return isRequired ? 'PASSWORD_REQUIRED' : null
  }

  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return 'PASSWORD_LENGTH'
  }

  const hasLetter = /\p{L}/u.test(password)
  const hasNumber = /\d/.test(password) || /\p{N}/u.test(password)
  const hasControlChars = containsControlChar(password)

  if (!hasLetter || !hasNumber || hasControlChars) {
    return 'PASSWORD_PATTERN'
  }

  return null
}

/**
 * Validates a password and returns the localized error message, or null if valid.
 */
export function validatePassword(
  password: string | null | undefined,
  isRequired: boolean,
  t: (key: string) => string,
): string | null {
  const constraint = getPasswordConstraint(password, isRequired)
  if (!constraint) return null

  return t(`errors.${constraint}`)
}
