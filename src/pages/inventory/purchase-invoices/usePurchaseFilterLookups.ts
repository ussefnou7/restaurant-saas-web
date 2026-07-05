import { useCallback, useEffect, useState } from 'react'
import * as inventoryService from '../../../services/inventoryService'
import type { SupplierResponse, WarehouseResponse } from '../../../types/inventory'

export function usePurchaseFilterLookups() {
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [warehouseData, supplierData] = await Promise.all([
        inventoryService.getWarehouses({ active: true }),
        inventoryService.getSuppliers({ active: true }),
      ])
      setWarehouses(warehouseData)
      setSuppliers(supplierData)
    } catch {
      setWarehouses([])
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { warehouses, suppliers, loading, reload }
}
