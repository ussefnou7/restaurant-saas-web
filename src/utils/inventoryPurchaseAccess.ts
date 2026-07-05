import { authService } from '../services/authService'
import type { AuthUser, RoleCode } from '../types/auth'

const INVENTORY_PURCHASE_VIEW = 'INVENTORY_PURCHASE_VIEW'
const INVENTORY_PURCHASE_MANAGE = 'INVENTORY_PURCHASE_MANAGE'
const PURCHASE_INVOICE_UNPOST = 'PURCHASE_INVOICE_UNPOST'
const PURCHASE_RETURN_UNPOST = 'PURCHASE_RETURN_UNPOST'
const PURCHASE_INVOICE_UNCOMPLETE = 'PURCHASE_INVOICE_UNCOMPLETE'
const PURCHASE_RETURN_UNCOMPLETE = 'PURCHASE_RETURN_UNCOMPLETE'

const VIEW_ROLES: RoleCode[] = ['OWNER', 'SYS_ADMIN', 'INVENTORY_MANAGER']

function hasPermission(user: AuthUser, code: string): boolean {
  return user.permissions.includes(code)
}

function hasRole(user: AuthUser, roles: RoleCode[]): boolean {
  return roles.includes(user.roleCode)
}

export function canViewPurchaseInvoices(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, VIEW_ROLES)) return true
  return (
    hasPermission(user, INVENTORY_PURCHASE_VIEW) || hasPermission(user, INVENTORY_PURCHASE_MANAGE)
  )
}

export function canManagePurchaseInvoices(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, ['OWNER', 'SYS_ADMIN'])) return true
  return hasPermission(user, INVENTORY_PURCHASE_MANAGE)
}

export function canUnpostPurchaseInvoices(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, ['OWNER', 'SYS_ADMIN'])) return true
  return hasPermission(user, PURCHASE_INVOICE_UNPOST)
}

export function canUnpostPurchaseReturns(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, ['OWNER', 'SYS_ADMIN'])) return true
  return hasPermission(user, PURCHASE_RETURN_UNPOST)
}

export function canUncompletePurchaseInvoices(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, ['OWNER', 'SYS_ADMIN'])) return true
  return hasPermission(user, PURCHASE_INVOICE_UNCOMPLETE)
}

export function canUncompletePurchaseReturns(): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (hasRole(user, ['OWNER', 'SYS_ADMIN'])) return true
  return hasPermission(user, PURCHASE_RETURN_UNCOMPLETE)
}
