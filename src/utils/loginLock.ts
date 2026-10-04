export const LOGIN_LOCK_UNTIL_KEY = 'login_lock_until'

/**
 * Formats a duration in seconds into MM:SS format.
 * Examples:
 *   300 -> "05:00"
 *   65  -> "01:05"
 *   9   -> "00:09"
 *   0   -> "00:00"
 */
export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const minutes = Math.floor(clamped / 60)
  const seconds = clamped % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Calculates remaining seconds from the stored lock end timestamp in localStorage.
 * If expired or invalid, cleans up localStorage and returns 0.
 */
export function getStoredLockRemainingSeconds(storage: Storage = window.localStorage): number {
  try {
    const stored = storage.getItem(LOGIN_LOCK_UNTIL_KEY)
    if (!stored) return 0
    const endTime = Number(stored)
    if (!Number.isFinite(endTime)) {
      storage.removeItem(LOGIN_LOCK_UNTIL_KEY)
      return 0
    }
    const diff = Math.ceil((endTime - Date.now()) / 1000)
    if (diff <= 0) {
      storage.removeItem(LOGIN_LOCK_UNTIL_KEY)
      return 0
    }
    return diff
  } catch {
    return 0
  }
}

/**
 * Stores the target end time (Date.now() + seconds * 1000) in localStorage.
 * Returns the sanitized seconds.
 */
export function storeLockEndTime(
  retryAfterSeconds: number,
  storage: Storage = window.localStorage,
): number {
  const seconds = Math.max(0, Math.floor(Number(retryAfterSeconds) || 0))
  const targetEndTime = Date.now() + seconds * 1000
  try {
    storage.setItem(LOGIN_LOCK_UNTIL_KEY, String(targetEndTime))
  } catch {
    // Ignore storage quota or access errors
  }
  return seconds
}

/**
 * Removes the lock end time from localStorage.
 */
export function clearStoredLock(storage: Storage = window.localStorage): void {
  try {
    storage.removeItem(LOGIN_LOCK_UNTIL_KEY)
  } catch {
    // Ignore storage errors
  }
}
