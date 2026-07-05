import { authService } from '../services/authService'
import type { AuthUser, RoleCode } from '../types/auth'

const INVENTORY_SETUP_VIEW = 'INVENTORY_SETUP_VIEW'
const INVENTORY_SETUP_MANAGE = 'INVENTORY_SETUP_MANAGE'
const INVENTORY_STOCK_VIEW = 'INVENTORY_STOCK_VIEW'
const INVENTORY_STOCK_MANAGE = 'INVENTORY_STOCK_MANAGE'
const PHYSICAL_COUNT_REVERT_TO_DRAFT = 'PHYSICAL_COUNT_REVERT_TO_DRAFT'
const PHYSICAL_COUNT_DELETE = 'PHYSICAL_COUNT_DELETE'
const WASTE_UNCOMPLETE = 'WASTE_UNCOMPLETE'

const OWNER_ROLES: RoleCode[] = ['OWNER', 'SYS_ADMIN', 'INVENTORY_MANAGER']
const STOCK_VIEW_ROLES: RoleCode[] = ['OWNER', 'SYS_ADMIN', 'INVENTORY_MANAGER']

function hasPermission(user: AuthUser, code: string): boolean {
  return user.permissions.includes(code)
}

function hasRole(user: AuthUser, roles: RoleCode[]): boolean {
  return roles.includes(user.roleCode)
}

export function canViewInventorySetup(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, OWNER_ROLES)) return true
  return hasPermission(user, INVENTORY_SETUP_VIEW) || hasPermission(user, INVENTORY_SETUP_MANAGE)
}

export function canManageInventorySetup(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, ['OWNER', 'SYS_ADMIN'])) return true
  return hasPermission(user, INVENTORY_SETUP_MANAGE)
}

export function isSysAdmin(): boolean {
  const user = authService.getAuthUser()
  return user?.roleCode === 'SYS_ADMIN'
}

export function canViewInventoryStock(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, STOCK_VIEW_ROLES)) return true
  return hasPermission(user, INVENTORY_STOCK_VIEW) || hasPermission(user, INVENTORY_STOCK_MANAGE)
}

export function canManageInventoryStock(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, ['OWNER', 'SYS_ADMIN'])) return true
  return hasPermission(user, INVENTORY_STOCK_MANAGE)
}

export function canRevertPhysicalCountToDraft(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, ['OWNER', 'SYS_ADMIN'])) return true
  return hasPermission(user, PHYSICAL_COUNT_REVERT_TO_DRAFT)
}

export function canDeletePhysicalCount(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, ['OWNER', 'SYS_ADMIN'])) return true
  return hasPermission(user, PHYSICAL_COUNT_DELETE)
}

export function canUncompleteWasteDocuments(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, ['OWNER', 'SYS_ADMIN'])) return true
  return hasPermission(user, WASTE_UNCOMPLETE)
}
