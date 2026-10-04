import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { PERMISSION_CODES, type PermissionCode } from '../src/access/permissions.generated.ts'
import { hasPermission } from '../src/access/can.ts'
import type { AuthUser } from '../src/types/auth.ts'

test('SHIFTS_VIEW_VARIANCE is included in PERMISSION_CODES and PermissionCode type (L046)', () => {
  assert.ok(
    (PERMISSION_CODES as readonly string[]).includes('SHIFTS_VIEW_VARIANCE'),
    'PERMISSION_CODES must include SHIFTS_VIEW_VARIANCE'
  )

  // Type check assignment
  const testCode: PermissionCode = 'SHIFTS_VIEW_VARIANCE'
  assert.equal(testCode, 'SHIFTS_VIEW_VARIANCE')
})

test('hasPermission correctly authorizes SHIFTS_VIEW_VARIANCE (L046)', () => {
  // 1. null user
  assert.equal(hasPermission(null, 'SHIFTS_VIEW_VARIANCE'), false)

  // 2. SYS_ADMIN bypass
  const sysAdminUser: AuthUser = {
    id: 1,
    roleCode: 'SYS_ADMIN',
    permissions: [],
    fullName: 'System Administrator',
    email: 'admin@example.com',
    branchId: null,
  }
  assert.equal(hasPermission(sysAdminUser, 'SHIFTS_VIEW_VARIANCE'), true)

  // 3. User with SHIFTS_VIEW_VARIANCE
  const permittedUser: AuthUser = {
    id: 2,
    roleCode: 'CASHIER',
    permissions: ['SHIFTS_VIEW' as PermissionCode, 'SHIFTS_VIEW_VARIANCE'],
    fullName: 'Permitted Cashier',
    email: 'cashier@example.com',
    branchId: 1,
  }
  assert.equal(hasPermission(permittedUser, 'SHIFTS_VIEW_VARIANCE'), true)

  // 4. User without SHIFTS_VIEW_VARIANCE
  const unpermittedUser: AuthUser = {
    id: 3,
    roleCode: 'CASHIER',
    permissions: ['SHIFTS_VIEW' as PermissionCode],
    fullName: 'Blind Cashier',
    email: 'blind@example.com',
    branchId: 1,
  }
  assert.equal(hasPermission(unpermittedUser, 'SHIFTS_VIEW_VARIANCE'), false)
})

test('src/utils/shiftAccess.ts routes SHIFTS_VIEW_VARIANCE through hasPermission and does not bypass (L046)', () => {
  const filePath = path.resolve('src/utils/shiftAccess.ts')
  const content = fs.readFileSync(filePath, 'utf8')

  // Must call hasPermission(user, 'SHIFTS_VIEW_VARIANCE')
  assert.match(
    content,
    /hasPermission\(user,\s*['"]SHIFTS_VIEW_VARIANCE['"]\)/,
    'useCanViewShiftVariance must call hasPermission(user, "SHIFTS_VIEW_VARIANCE")'
  )

  // Must NOT directly bypass via user.permissions.includes
  assert.doesNotMatch(
    content,
    /user\.permissions\.includes\(['"]SHIFTS_VIEW_VARIANCE['"]\)/,
    'shiftAccess.ts must not bypass hasPermission using user.permissions.includes'
  )

  // Must NOT claim that no endpoint enforces it or that it is display-only
  assert.doesNotMatch(
    content,
    /no endpoint enforces/i,
    'shiftAccess.ts must not claim no endpoint enforces SHIFTS_VIEW_VARIANCE'
  )
  assert.doesNotMatch(
    content,
    /display-only/i,
    'shiftAccess.ts must not claim SHIFTS_VIEW_VARIANCE is a display-only grant'
  )
  assert.doesNotMatch(
    content,
    /courtesy,?\s*not a control/i,
    'shiftAccess.ts must not claim hiding variance is a courtesy rather than a control'
  )
  assert.doesNotMatch(
    content,
    /server sends the (figures|value) regardless/i,
    'shiftAccess.ts must not claim the server sends figures regardless'
  )
})

test('src/access/screen-map.ts does not claim SHIFTS_VIEW_VARIANCE is unenforced (L046)', () => {
  const filePath = path.resolve('src/access/screen-map.ts')
  const content = fs.readFileSync(filePath, 'utf8')

  assert.doesNotMatch(
    content,
    /gate no endpoint/i,
    'screen-map.ts must not claim SHIFTS_VIEW_VARIANCE gates no endpoint'
  )
  assert.doesNotMatch(
    content,
    /server sends the (value|figures) regardless/i,
    'screen-map.ts must not claim the server sends the value regardless'
  )
})

test('no source file in src/ claims SHIFTS_VIEW_VARIANCE is unenforced (L046)', () => {
  const srcDir = path.resolve('src')

  function scanDir(dir: string): string[] {
    const results: string[] = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...scanDir(fullPath))
      } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        results.push(fullPath)
      }
    }
    return results
  }

  const files = scanDir(srcDir)
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    assert.doesNotMatch(
      content,
      /no endpoint enforces.*SHIFTS_VIEW_VARIANCE/i,
      `Unenforced claim found in ${file}`
    )
    assert.doesNotMatch(
      content,
      /SHIFTS_VIEW_VARIANCE.*display-only/i,
      `Display-only claim found in ${file}`
    )
  }
})
