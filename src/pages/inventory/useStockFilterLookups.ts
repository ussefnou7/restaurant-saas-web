import { useCallback, useEffect, useState } from 'react'
import * as inventoryService from '../../services/inventoryService'
import type { MaterialCategoryResponse, MaterialResponse, WarehouseResponse } from '../../types/inventory'

export function useStockFilterLookups() {
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const [categories, setCategories] = useState<MaterialCategoryResponse[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [warehouseData, materialData, categoryData] = await Promise.all([
        inventoryService.getWarehouses({ active: true }),
        inventoryService.getMaterials({ active: true }),
        inventoryService.getMaterialCategories({ active: true }),
      ])
      setWarehouses(warehouseData)
      setMaterials(materialData)
      setCategories(categoryData)
    } catch {
      setWarehouses([])
      setMaterials([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { warehouses, materials, categories, loading, reload }
}
