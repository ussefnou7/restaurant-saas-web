import type { AuthUser, RoleCode } from '../types/auth'
import type { PermissionCode, RoleRule } from './permissions.generated'

/**
 * Mirrors the backend's authorization rules so the UI can avoid rendering a control whose endpoint
 * would reject it. Advisory only — the backend gate is the binding one, and these answers may be
 * stale until the next `/me`.
 *
 * Every function here takes the user explicitly. Reading the session inside an access helper is
 * what made the old `utils/*Access.ts` unable to re-render when permissions changed.
 */

/**
 * The one role that bypasses permission checks, matching `SecurityService.hasPermission`.
 * `OWNER` is deliberately absent: the role grants nothing on its own (D36). Owners are seeded with
 * every enforced permission, so they lose no access from being checked normally.
 */
const PERMISSION_BYPASS_ROLE: RoleCode = 'SYS_ADMIN'

export function hasPermission(user: AuthUser | null, code: PermissionCode): boolean {
  if (!user) return false
  if (user.roleCode === PERMISSION_BYPASS_ROLE) return true
  return Array.isArray(user.permissions) && user.permissions.includes(code)
}

/** True when the user holds at least one of the codes — the `a or b` shape used by some gates. */
export function hasAnyPermission(user: AuthUser | null, codes: readonly PermissionCode[]): boolean {
  return codes.some((code) => hasPermission(user, code))
}

/**
 * Roles each backend role rule accepts. Generated `RoleRule` is the source of truth for which
 * rules exist, so removing one from the backend turns this into a type error rather than dead code
 * — which is how `isOwner` and `isOwnerOrBranchManager` left when HR became `HR_MANAGE`.
 */
const ROLE_RULE_MEMBERS: Record<RoleRule, readonly RoleCode[]> = {
  isSysAdmin: ['SYS_ADMIN'],
}

/**
 * For endpoints gated on the role itself rather than a permission. A user cannot be granted these,
 * so never substitute a permission code that merely sounds related — that is how the HR module
 * ended up showing payroll actions to `HR_MANAGER`, which the old backend rule excluded.
 */
export function satisfiesRoleRule(user: AuthUser | null, rule: RoleRule): boolean {
  if (!user) return false
  return ROLE_RULE_MEMBERS[rule].includes(user.roleCode)
}

export function isSysAdmin(user: AuthUser | null): boolean {
  return user?.roleCode === 'SYS_ADMIN'
}
