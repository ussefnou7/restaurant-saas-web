import { authService } from '../services/authService'

const TABLES_VIEW = 'TABLES_VIEW'
const TABLES_MANAGE = 'TABLES_MANAGE'

export function canViewTables(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (user.roleCode === 'OWNER' || user.roleCode === 'SYS_ADMIN') return true
  return user.permissions.includes(TABLES_VIEW)
}

export function canManageTables(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (user.roleCode === 'OWNER' || user.roleCode === 'SYS_ADMIN') return true
  return user.permissions.includes(TABLES_MANAGE)
}
