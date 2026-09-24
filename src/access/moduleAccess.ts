import type { AuthUser } from '../types/auth'

/**
 * A module's coarse "can they even see this exists" gate, separate from `screen-map.ts`'s
 * backend-verified screen/action codes. Deliberately not a `PermissionCode`: it never stands in
 * for a real data guarantee, because every read inside a module still goes through its own
 * enforced permission (see `hr.actions` in `screen-map.ts`), so an unenforced code here cannot
 * expose anything it does not already expose. It decides only whether the module's nav link shows
 * and whether navigating to its route lands on the module shell instead of an access-denied page.
 */
export function hasModuleAccess(user: AuthUser | null, code: string): boolean {
  if (!user) return false
  if (user.roleCode === 'SYS_ADMIN') return true
  return Array.isArray(user.permissions) && user.permissions.includes(code)
}
