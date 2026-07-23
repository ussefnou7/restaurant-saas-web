import { authService } from '../services/authService'

const DEVICES_MANAGE = 'DEVICES_MANAGE'

export function canManageDevices(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (user.roleCode === 'OWNER' || user.roleCode === 'SYS_ADMIN') return true
  return user.permissions.includes(DEVICES_MANAGE)
}
