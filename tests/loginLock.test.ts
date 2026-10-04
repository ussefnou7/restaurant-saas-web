import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatCountdown,
  getStoredLockRemainingSeconds,
  storeLockEndTime,
  clearStoredLock,
  LOGIN_LOCK_UNTIL_KEY,
} from '../src/utils/loginLock.ts'
import { translateApiError, getApiErrorDetails } from '../src/utils/errors.ts'
import { getPasswordConstraint } from '../src/utils/passwordValidation.ts'
import { ar } from '../src/i18n/locales/ar/index.ts'
import { en } from '../src/i18n/locales/en/index.ts'

// Mock storage implementation for testing persistence
class MemoryStorage implements Storage {
  private data = new Map<string, string>()

  get length(): number {
    return this.data.size
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.data.set(key, String(value))
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  clear(): void {
    this.data.clear()
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null
  }
}

test('formatCountdown formats seconds into MM:SS format accurately', () => {
  assert.equal(formatCountdown(300), '05:00')
  assert.equal(formatCountdown(65), '01:05')
  assert.equal(formatCountdown(60), '01:00')
  assert.equal(formatCountdown(59), '00:59')
  assert.equal(formatCountdown(9), '00:09')
  assert.equal(formatCountdown(0), '00:00')
  assert.equal(formatCountdown(-5), '00:00')
})

test('storeLockEndTime stores end timestamp and getStoredLockRemainingSeconds retrieves remaining seconds', () => {
  const storage = new MemoryStorage()

  assert.equal(getStoredLockRemainingSeconds(storage), 0)

  const savedSeconds = storeLockEndTime(300, storage)
  assert.equal(savedSeconds, 300)

  const rawStored = storage.getItem(LOGIN_LOCK_UNTIL_KEY)
  assert.ok(rawStored, 'target end timestamp must be stored in localStorage')

  const remaining = getStoredLockRemainingSeconds(storage)
  assert.ok(remaining >= 299 && remaining <= 300, `remaining should be ~300, got ${remaining}`)
})

test('persistence: does not restart counter from beginning when re-queried after elapsed time', () => {
  const storage = new MemoryStorage()

  // Simulate storing a lock 60 seconds ago for 300 total seconds (240 left)
  const simulatedTargetTime = Date.now() + 240 * 1000
  storage.setItem(LOGIN_LOCK_UNTIL_KEY, String(simulatedTargetTime))

  const remaining = getStoredLockRemainingSeconds(storage)
  assert.ok(remaining >= 239 && remaining <= 240, `expected ~240 seconds, got ${remaining}`)
})

test('resynchronization: updates counter when new 429 response provides different retryAfterSeconds', () => {
  const storage = new MemoryStorage()

  storeLockEndTime(300, storage)
  assert.ok(getStoredLockRemainingSeconds(storage) >= 299)

  // A new 429 response arrives with 120 seconds
  storeLockEndTime(120, storage)
  const resynced = getStoredLockRemainingSeconds(storage)
  assert.ok(resynced >= 119 && resynced <= 120, `expected ~120 seconds, got ${resynced}`)
})

test('clearStoredLock removes lock and returns 0', () => {
  const storage = new MemoryStorage()
  storeLockEndTime(300, storage)
  assert.ok(storage.getItem(LOGIN_LOCK_UNTIL_KEY))

  clearStoredLock(storage)
  assert.equal(storage.getItem(LOGIN_LOCK_UNTIL_KEY), null)
  assert.equal(getStoredLockRemainingSeconds(storage), 0)
})

test('expired lock in storage is automatically cleaned up and returns 0', () => {
  const storage = new MemoryStorage()
  // Expired 5 seconds ago
  storage.setItem(LOGIN_LOCK_UNTIL_KEY, String(Date.now() - 5000))

  const remaining = getStoredLockRemainingSeconds(storage)
  assert.equal(remaining, 0)
  assert.equal(storage.getItem(LOGIN_LOCK_UNTIL_KEY), null, 'expired key must be cleaned up')
})

test('translateApiError translates LOGIN_TEMPORARILY_LOCKED without showing server debug message', () => {
  const tAr = (key: string) => ar[key] ?? key
  const tEn = (key: string) => en[key] ?? key

  const mockBackendError = {
    response: {
      status: 429,
      data: {
        errorCode: 'LOGIN_TEMPORARILY_LOCKED',
        message: 'Debug: Account locked by security policy for 300s',
        params: {
          retryAfterSeconds: 300,
          lockedUntil: '2026-10-03T13:00:00Z',
        },
      },
    },
  }

  const resultAr = translateApiError(mockBackendError, tAr)
  const resultEn = translateApiError(mockBackendError, tEn)

  // Verify server message is never returned
  assert.ok(!resultAr.message.includes('Debug: Account locked'))
  assert.ok(!resultEn.message.includes('Debug: Account locked'))

  // Verify Arabic and English translated messages explain the temporary 5-minute lock
  assert.equal(
    resultAr.message,
    'تم قفل الحساب مؤقتاً لمدة 5 دقائق بسبب تكرار محاولات الدخول.',
  )
  assert.equal(
    resultEn.message,
    'Your account is temporarily locked for 5 minutes due to repeated login attempts.',
  )

  // Verify getApiErrorDetails extracts parameters correctly
  const details = getApiErrorDetails(mockBackendError)
  assert.equal(details.errorCode, 'LOGIN_TEMPORARILY_LOCKED')
  assert.equal(details.params?.retryAfterSeconds, 300)
})

test('password rules verification (regression check)', () => {
  // Required in creation
  assert.equal(getPasswordConstraint('', true), 'PASSWORD_REQUIRED')
  assert.equal(getPasswordConstraint('   ', true), 'PASSWORD_REQUIRED')

  // Optional in edit
  assert.equal(getPasswordConstraint('', false), null)
  assert.equal(getPasswordConstraint(undefined, false), null)

  // Length 8..64
  assert.equal(getPasswordConstraint('abc1', true), 'PASSWORD_LENGTH')
  assert.equal(getPasswordConstraint('a'.repeat(65) + '1', true), 'PASSWORD_LENGTH')

  // Pattern: needs letter + number + no control characters
  assert.equal(getPasswordConstraint('12345678', true), 'PASSWORD_PATTERN') // no letter
  assert.equal(getPasswordConstraint('abcdefgh', true), 'PASSWORD_PATTERN') // no digit
  assert.equal(getPasswordConstraint('abcdef1\n', true), 'PASSWORD_PATTERN') // control char: newline
  assert.equal(getPasswordConstraint('abcdef1\t', true), 'PASSWORD_PATTERN') // control char: tab

  // Valid passwords (Latin and Arabic)
  assert.equal(getPasswordConstraint('Password123', true), null)
  assert.equal(getPasswordConstraint('كلمةسر123', true), null)
})
