import { canManageInventorySetup } from '../../utils/inventoryAccess'

export type InventoryHubUserPermissions = {
  materials: { canView: boolean; canAdd: boolean }
  warehouses: { canAdd: boolean }
  categories: { canEdit: boolean }
  uom: { canEdit: boolean }
}

export function buildInventoryHubUserPermissions(): InventoryHubUserPermissions {
  const canManage = canManageInventorySetup()

  return {
    materials: { canView: true, canAdd: canManage },
    warehouses: { canAdd: canManage },
    categories: { canEdit: canManage },
    uom: { canEdit: canManage },
  }
}
