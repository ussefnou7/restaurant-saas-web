import { hasAnyPermission, hasPermission, isSysAdmin as isSysAdminUser } from '../access/can'
import { useAuthSession } from '../access/useAuthSession'

/**
 * Inventory gates, matching the inventory controllers.
 *
 * <p>The `OWNER` and `INVENTORY_MANAGER` bypasses are gone: the backend bypasses `SYS_ADMIN` only.
 * `INVENTORY_MANAGER` in particular was shown setup and stock actions it does not hold a grant for,
 * every one of which returned 403.
 */

export function useCanViewInventorySetup(): boolean {
  const { user } = useAuthSession()
  return hasAnyPermission(user, ['INVENTORY_SETUP_VIEW', 'INVENTORY_SETUP_MANAGE'])
}

export function useCanManageInventorySetup(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'INVENTORY_SETUP_MANAGE')
}

export function useIsSysAdmin(): boolean {
  const { user } = useAuthSession()
  return isSysAdminUser(user)
}

export function useCanViewInventoryStock(): boolean {
  const { user } = useAuthSession()
  return hasAnyPermission(user, ['INVENTORY_STOCK_VIEW', 'INVENTORY_STOCK_MANAGE'])
}

export function useCanManageInventoryStock(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'INVENTORY_STOCK_MANAGE')
}

export function useCanRevertPhysicalCountToDraft(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'PHYSICAL_COUNT_REVERT_TO_DRAFT')
}

export function useCanDeletePhysicalCount(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'PHYSICAL_COUNT_DELETE')
}

export function useCanUncompleteWasteDocuments(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'WASTE_UNCOMPLETE')
}
