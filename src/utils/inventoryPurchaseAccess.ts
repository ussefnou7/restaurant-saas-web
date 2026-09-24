import { hasAnyPermission, hasPermission } from '../access/can'
import { useAuthSession } from '../access/useAuthSession'

/**
 * Purchase gates, matching the purchase invoice and return controllers.
 *
 * <p>The `OWNER` and `INVENTORY_MANAGER` bypasses are gone: the backend bypasses `SYS_ADMIN` only.
 * Note that unpost and uncomplete are four separate grants, not one — a user may be trusted to
 * reverse a return but not an invoice.
 */

export function useCanViewPurchaseInvoices(): boolean {
  const { user } = useAuthSession()
  return hasAnyPermission(user, ['INVENTORY_PURCHASE_VIEW', 'INVENTORY_PURCHASE_MANAGE'])
}

export function useCanManagePurchaseInvoices(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'INVENTORY_PURCHASE_MANAGE')
}

export function useCanUnpostPurchaseInvoices(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'PURCHASE_INVOICE_UNPOST')
}

export function useCanUnpostPurchaseReturns(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'PURCHASE_RETURN_UNPOST')
}

export function useCanUncompletePurchaseInvoices(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'PURCHASE_INVOICE_UNCOMPLETE')
}

export function useCanUncompletePurchaseReturns(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'PURCHASE_RETURN_UNCOMPLETE')
}
