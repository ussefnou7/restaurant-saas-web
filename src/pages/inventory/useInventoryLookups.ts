import { useCallback, useEffect, useState } from 'react'
import { AUTH_SESSION_CHANGED_EVENT } from '../../services/authEvents'
import * as branchService from '../../services/branchService'
import * as inventoryService from '../../services/inventoryService'
import type { BranchResponse } from '../../types/branch'
import type { MaterialCategoryResponse } from '../../types/inventory'

type CacheEntry<T> = {
  data: T
  timestamp: number
}

const CACHE_TTL_MS = 60_000 // 1 minute

const categoryCache = new Map<string, CacheEntry<MaterialCategoryResponse[]>>()
const branchCache = new Map<string, CacheEntry<BranchResponse[]>>()

const inFlightCategories = new Map<string, Promise<MaterialCategoryResponse[]>>()
const inFlightBranches = new Map<string, Promise<BranchResponse[]>>()

export function invalidateInventoryLookupsCache() {
  categoryCache.clear()
  branchCache.clear()
  inFlightCategories.clear()
  inFlightBranches.clear()
}

if (typeof window !== 'undefined') {
  window.addEventListener(AUTH_SESSION_CHANGED_EVENT, invalidateInventoryLookupsCache)
  window.addEventListener('storage', invalidateInventoryLookupsCache)
}

async function fetchCategoriesCached(
  forCatalog: boolean,
  force = false,
): Promise<MaterialCategoryResponse[]> {
  const key = forCatalog ? 'global' : 'tenant'
  const now = Date.now()

  if (!force) {
    const cached = categoryCache.get(key)
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data
    }
  }

  const existingInFlight = inFlightCategories.get(key)
  if (existingInFlight) {
    return existingInFlight
  }

  const promise = (async () => {
    try {
      const data = forCatalog
        ? await inventoryService.getGlobalMaterialCategories({ active: true })
        : await inventoryService.getMaterialCategories({ active: true })
      categoryCache.set(key, { data, timestamp: Date.now() })
      return data
    } finally {
      inFlightCategories.delete(key)
    }
  })()

  inFlightCategories.set(key, promise)
  return promise
}

async function fetchBranchesCached(force = false): Promise<BranchResponse[]> {
  const key = 'all'
  const now = Date.now()

  if (!force) {
    const cached = branchCache.get(key)
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data
    }
  }

  const existingInFlight = inFlightBranches.get(key)
  if (existingInFlight) {
    return existingInFlight
  }

  const promise = (async () => {
    try {
      const data = await branchService.getBranches()
      branchCache.set(key, { data, timestamp: Date.now() })
      return data
    } finally {
      inFlightBranches.delete(key)
    }
  })()

  inFlightBranches.set(key, promise)
  return promise
}

export function useInventoryLookups(options?: {
  includeBranches?: boolean
  /** Use global categories (for ready-made catalog import filters). */
  forCatalog?: boolean
  /** Whether lookup fetching is enabled. Defaults to true. */
  enabled?: boolean
}) {
  const { forCatalog = false, includeBranches = false, enabled = true } = options ?? {}

  const [categories, setCategories] = useState<MaterialCategoryResponse[]>(() => {
    if (!enabled) return []
    const key = forCatalog ? 'global' : 'tenant'
    const cached = categoryCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data
    }
    return []
  })

  const [branches, setBranches] = useState<BranchResponse[]>(() => {
    if (!enabled || !includeBranches) return []
    const cached = branchCache.get('all')
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data
    }
    return []
  })

  const [loading, setLoading] = useState(() => {
    if (!enabled) return false
    const key = forCatalog ? 'global' : 'tenant'
    const cached = categoryCache.get(key)
    const hasCachedCategories = Boolean(cached && Date.now() - cached.timestamp < CACHE_TTL_MS)
    if (includeBranches) {
      const branchCached = branchCache.get('all')
      const hasCachedBranches = Boolean(
        branchCached && Date.now() - branchCached.timestamp < CACHE_TTL_MS,
      )
      return !hasCachedCategories || !hasCachedBranches
    }
    return !hasCachedCategories
  })

  const reload = useCallback(
    async (force = true) => {
      if (!enabled) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const categoryPromise = fetchCategoriesCached(forCatalog, force)
        const branchPromise = includeBranches ? fetchBranchesCached(force) : Promise.resolve([])

        const [categoryData, branchData] = await Promise.all([categoryPromise, branchPromise])
        setCategories(categoryData)
        if (includeBranches) {
          setBranches(branchData)
        }
      } catch {
        setCategories([])
        if (includeBranches) setBranches([])
      } finally {
        setLoading(false)
      }
    },
    [enabled, forCatalog, includeBranches],
  )

  useEffect(() => {
    if (!enabled) return
    void reload(false)
  }, [enabled, reload])

  return {
    categories,
    branches,
    loading,
    reload,
  }
}

