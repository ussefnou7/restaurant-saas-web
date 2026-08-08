import { authService } from '../services/authService'
import type { AuthUser, RoleCode } from '../types/auth'

const REPORTS_VIEW_SALES = 'REPORTS_VIEW_SALES'
const VIEW_ROLES: RoleCode[] = ['OWNER', 'SYS_ADMIN', 'BRANCH_MANAGER']

function hasPermission(user: AuthUser, code: string): boolean {
  return user.permissions.includes(code)
}

function hasRole(user: AuthUser, roles: RoleCode[]): boolean {
  return roles.includes(user.roleCode)
}

export function canViewSalesReports(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, VIEW_ROLES)) return true
  return hasPermission(user, REPORTS_VIEW_SALES)
}
