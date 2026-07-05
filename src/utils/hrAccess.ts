import { authService } from '../services/authService'
import type { AuthUser, RoleCode } from '../types/auth'

const PAYROLL_ROLES: RoleCode[] = ['OWNER', 'BRANCH_MANAGER', 'HR_MANAGER', 'SYS_ADMIN']
const LEAVE_MANAGE_ROLES: RoleCode[] = ['OWNER', 'BRANCH_MANAGER', 'HR_MANAGER', 'SYS_ADMIN']

function hasPermission(user: AuthUser, code: string): boolean {
  return user.permissions.includes(code)
}

function hasRole(user: AuthUser, roles: RoleCode[]): boolean {
  return roles.includes(user.roleCode)
}

export function canManageHrPayroll(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, PAYROLL_ROLES)) return true
  return (
    hasPermission(user, 'HR_SALARY_ADDITIONS_CREATE') ||
    hasPermission(user, 'HR_SALARY_ADDITIONS_UPDATE') ||
    hasPermission(user, 'HR_EMPLOYEES_UPDATE')
  )
}

export function canManageLeaveRequests(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, LEAVE_MANAGE_ROLES)) return true
  return (
    hasPermission(user, 'HR_LEAVES_CREATE') || hasPermission(user, 'HR_LEAVES_UPDATE_STATUS')
  )
}

export function canViewLeaveTypes(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  return hasRole(user, LEAVE_MANAGE_ROLES) || hasPermission(user, 'HR_LEAVES_VIEW')
}

export function canManageLeaveTypes(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, ['OWNER', 'SYS_ADMIN'])) return true
  return (
    hasPermission(user, 'HR_LEAVE_TYPES_CREATE') ||
    hasPermission(user, 'HR_LEAVE_TYPES_UPDATE')
  )
}
