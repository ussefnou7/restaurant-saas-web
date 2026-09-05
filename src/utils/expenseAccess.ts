import { authService } from '../services/authService'
import type { AuthUser, RoleCode } from '../types/auth'

const EXPENSES_VIEW = 'EXPENSES_VIEW'
const EXPENSES_CREATE = 'EXPENSES_CREATE'
const EXPENSES_VOID = 'EXPENSES_VOID'
const EXPENSES_CATEGORY_MANAGE = 'EXPENSES_CATEGORY_MANAGE'

const BYPASS_ROLES: RoleCode[] = ['OWNER', 'SYS_ADMIN']

function hasPermission(user: AuthUser, code: string): boolean {
  return Array.isArray(user.permissions) && user.permissions.includes(code)
}

function hasRole(user: AuthUser, roles: RoleCode[]): boolean {
  return roles.includes(user.roleCode)
}

export function canViewExpenses(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, BYPASS_ROLES)) return true
  return hasPermission(user, EXPENSES_VIEW)
}

export function canCreateExpense(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, BYPASS_ROLES)) return true
  return hasPermission(user, EXPENSES_CREATE)
}

export function canVoidExpense(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, BYPASS_ROLES)) return true
  return hasPermission(user, EXPENSES_VOID)
}

export function canManageExpenseCategories(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, BYPASS_ROLES)) return true
  return hasPermission(user, EXPENSES_CATEGORY_MANAGE)
}
