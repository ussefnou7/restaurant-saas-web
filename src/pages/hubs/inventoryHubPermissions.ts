import { useMemo } from 'react'
import { useCanManageInventorySetup } from '../../utils/inventoryAccess'

export type InventoryHubUserPermissions = {
  materials: { canView: boolean; canAdd: boolean }
  warehouses: { canAdd: boolean }
  categories: { canEdit: boolean }
  uom: { canEdit: boolean }
}

export function useInventoryHubUserPermissions(): InventoryHubUserPermissions {
  const canManage = useCanManageInventorySetup()

  return useMemo(() => ({
    materials: { canView: true, canAdd: canManage },
    warehouses: { canAdd: canManage },
    categories: { canEdit: canManage },
    uom: { canEdit: canManage },
  }), [canManage])
}
