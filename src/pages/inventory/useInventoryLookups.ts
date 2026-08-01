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

  // Capture the primitives, not the options object: callers pass inline
  // literals whose identity changes every render, and closing over the object
  // would defeat the memoization below.
  const { forCatalog, includeBranches } = options ?? {}

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const loadCategories = forCatalog
        ? inventoryService.getGlobalMaterialCategories({ active: true })
        : inventoryService.getMaterialCategories({ active: true })

      const [categoryData, uomData] = await Promise.all([
        loadCategories,
        inventoryService.getUoms(true),
      ])
      setCategories(categoryData)
      setUoms(uomData)

      if (includeBranches) {
        const branchData = await branchService.getBranches()
        setBranches(branchData)
      }
    } catch {
      setCategories([])
      setUoms([])
      if (includeBranches) setBranches([])
    } finally {
      setLoading(false)
    }
  }, [forCatalog, includeBranches])

  useEffect(() => {
    void reload()
  }, [reload])

  return { categories, uoms, branches, loading, reload }
}
