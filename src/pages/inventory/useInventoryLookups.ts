import { useCallback, useEffect, useState } from 'react'
import * as branchService from '../../services/branchService'
import * as inventoryService from '../../services/inventoryService'
import type { BranchResponse } from '../../types/branch'
import type { MaterialCategoryResponse, UomResponse } from '../../types/inventory'

export function useInventoryLookups(options?: {
  includeBranches?: boolean
  /** Use global categories (for ready-made catalog import filters). */
  forCatalog?: boolean
}) {
  const [categories, setCategories] = useState<MaterialCategoryResponse[]>([])
  const [uoms, setUoms] = useState<UomResponse[]>([])
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const loadCategories = options?.forCatalog
        ? inventoryService.getGlobalMaterialCategories({ active: true })
        : inventoryService.getMaterialCategories({ active: true })

      const [categoryData, uomData] = await Promise.all([
        loadCategories,
        inventoryService.getUoms(true),
      ])
      setCategories(categoryData)
      setUoms(uomData)

      if (options?.includeBranches) {
        const branchData = await branchService.getBranches()
        setBranches(branchData)
      }
    } catch {
      setCategories([])
      setUoms([])
      if (options?.includeBranches) setBranches([])
    } finally {
      setLoading(false)
    }
  }, [options?.forCatalog, options?.includeBranches])

  useEffect(() => {
    void reload()
  }, [reload])

  return { categories, uoms, branches, loading, reload }
}
