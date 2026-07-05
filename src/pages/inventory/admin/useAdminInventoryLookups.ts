import { useCallback, useEffect, useState } from 'react'
import * as adminInventoryService from '../../../services/adminInventoryService'
import type { AdminMaterialCategoryResponse, UomResponse } from '../../../types/inventory'

export function useAdminInventoryLookups() {
  const [categories, setCategories] = useState<AdminMaterialCategoryResponse[]>([])
  const [uoms, setUoms] = useState<UomResponse[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [categoryData, uomData] = await Promise.all([
        adminInventoryService.getAdminMaterialCategories(),
        adminInventoryService.getAdminUoms(),
      ])
      setCategories(categoryData)
      setUoms(uomData)
    } catch {
      setCategories([])
      setUoms([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { categories, uoms, loading, reload }
}
