import { useContext } from 'react'
import { AuthSessionContext, type AuthSessionValue } from './AuthSessionContext'
import { hasAnyPermission, hasPermission, satisfiesRoleRule } from './can'
import type { PermissionCode, RoleRule } from './permissions.generated'

export function useAuthSession(): AuthSessionValue {
  const context = useContext(AuthSessionContext)
  if (!context) {
    throw new Error('useAuthSession must be used within an AuthSessionProvider')
  }
  return context
}

export interface AccessChecks {
  can: (code: PermissionCode) => boolean
  canAny: (codes: readonly PermissionCode[]) => boolean
  hasRoleRule: (rule: RoleRule) => boolean
}

/**
 * Access checks bound to the live session, so a permission change re-renders the components that
 * asked. Prefer this over importing `can.ts` directly in a component.
 */
export function useAccess(): AccessChecks {
  const { user } = useAuthSession()
  return {
    can: (code) => hasPermission(user, code),
    canAny: (codes) => hasAnyPermission(user, codes),
    hasRoleRule: (rule) => satisfiesRoleRule(user, rule),
  }
}
