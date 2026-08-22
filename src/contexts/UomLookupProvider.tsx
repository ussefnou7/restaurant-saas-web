import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from '../i18n/useTranslation'
import { AUTH_SESSION_CHANGED_EVENT } from '../services/authService'
import * as uomService from '../services/uomService'
import type { UomLookupItemResponse } from '../types/inventory'
import { getInventoryLocalizedName } from '../utils/inventoryDisplay'
import { getLocalizedUomSymbol } from '../utils/inventoryUom'
import { UomLookupContext } from './UomLookupContext'
import {
  setLookupVersionListener,
  type UomLookupContextValue,
} from './uomLookupBridge'

const AUTH_USER_KEY = 'authUser'
const ACCESS_TOKEN_KEY = 'accessToken'

type TenantCacheEntry = {
  itemsMap: Map<number, UomLookupItemResponse>
  version: string | null
}

const lookupCacheByTenant = new Map<string, TenantCacheEntry>()
const inFlightLookupByTenant = new Map<string, Promise<TenantCacheEntry>>()

function readTenantKey(): string | null {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (!token) return null

  const raw = localStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null

  try {
    const user = JSON.parse(raw) as { tenantId?: number | null }
    return user.tenantId == null ? null : String(user.tenantId)
  } catch {
    return null
  }
}

function emptyEntry(): TenantCacheEntry {
  return {
    itemsMap: new Map(),
    version: null,
  }
}

async function fetchLookupForTenant(
  tenantKey: string,
  ifNoneMatch?: string | null,
): Promise<TenantCacheEntry> {
  const inFlight = inFlightLookupByTenant.get(tenantKey)
  if (inFlight) return inFlight

  const request = (async () => {
    try {
      const previous = lookupCacheByTenant.get(tenantKey)
      const result = await uomService.getUomLookup(ifNoneMatch ?? previous?.version ?? undefined)
      if (result.notModified && previous) return previous

      const itemsMap = new Map<number, UomLookupItemResponse>()
      for (const item of result.items) {
        itemsMap.set(item.id, item)
      }

      const entry = {
        itemsMap,
        version: result.version,
      }
      lookupCacheByTenant.set(tenantKey, entry)
      return entry
    } finally {
      inFlightLookupByTenant.delete(tenantKey)
    }
  })()

  inFlightLookupByTenant.set(tenantKey, request)
  return request
}

export function UomLookupProvider({ children }: { children: ReactNode }) {
  const { locale } = useTranslation()
  const [tenantKey, setTenantKey] = useState<string | null>(() => readTenantKey())
  const [itemsMap, setItemsMap] = useState<Map<number, UomLookupItemResponse>>(() => new Map())
  const [version, setVersion] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const itemsMapRef = useRef(itemsMap)
  const versionRef = useRef(version)
  const tenantKeyRef = useRef(tenantKey)

  useEffect(() => {
    itemsMapRef.current = itemsMap
  }, [itemsMap])

  useEffect(() => {
    versionRef.current = version
  }, [version])

  useEffect(() => {
    tenantKeyRef.current = tenantKey
  }, [tenantKey])

  const inFlightById = useRef<Map<number, Promise<UomLookupItemResponse | null>>>(new Map())

  const uoms = useMemo(() => Array.from(itemsMap.values()), [itemsMap])
  const activeUoms = useMemo(() => uoms.filter((u) => u.active), [uoms])

  useEffect(() => {
    function syncTenantKey() {
      setTenantKey(readTenantKey())
    }

    window.addEventListener('storage', syncTenantKey)
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncTenantKey)
    return () => {
      window.removeEventListener('storage', syncTenantKey)
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncTenantKey)
    }
  }, [])

  const resolveMiss = useCallback(async (id: number | string): Promise<UomLookupItemResponse | null> => {
    const currentTenantKey = tenantKeyRef.current
    if (!currentTenantKey) return null

    const numId = Number(id)
    if (!numId || Number.isNaN(numId)) return null

    const existing = itemsMapRef.current.get(numId)
    if (existing) return existing

    const inFlight = inFlightById.current.get(numId)
    if (inFlight) return inFlight

    const request = (async () => {
      try {
        const item = await uomService.getUomById(numId)
        if (item && item.id) {
          setItemsMap((prev) => {
            const next = new Map(prev)
            next.set(item.id, item)
            return next
          })
          return item
        }
        return null
      } catch {
        return null
      } finally {
        inFlightById.current.delete(numId)
      }
    })()

    inFlightById.current.set(numId, request)
    return request
  }, [])

  const revalidateOnOpen = useCallback(async (): Promise<void> => {
    const currentTenantKey = tenantKeyRef.current
    if (!currentTenantKey) return

    try {
      const entry = await fetchLookupForTenant(currentTenantKey, versionRef.current)
      if (tenantKeyRef.current !== currentTenantKey) return
      setItemsMap(new Map(entry.itemsMap))
      setVersion(entry.version)
    } catch {
      // Silently preserve existing cache on revalidate failure.
    }
  }, [])

  const invalidateAndRefetch = useCallback(async (): Promise<void> => {
    const currentTenantKey = tenantKeyRef.current
    if (!currentTenantKey) return

    try {
      lookupCacheByTenant.delete(currentTenantKey)
      const entry = await fetchLookupForTenant(currentTenantKey)
      if (tenantKeyRef.current !== currentTenantKey) return
      setItemsMap(new Map(entry.itemsMap))
      setVersion(entry.version)
    } catch {
      // Invalidation error logged silently
    }
  }, [])

  useEffect(() => {
    inFlightById.current.clear()

    if (!tenantKey) {
      lookupCacheByTenant.clear()
      inFlightLookupByTenant.clear()
      const entry = emptyEntry()
      setItemsMap(entry.itemsMap)
      setVersion(entry.version)
      setLoading(false)
      return undefined
    }

    const cached = lookupCacheByTenant.get(tenantKey)
    if (cached) {
      setItemsMap(new Map(cached.itemsMap))
      setVersion(cached.version)
      setLoading(false)
      return undefined
    }

    let mounted = true
    setLoading(true)

    fetchLookupForTenant(tenantKey)
      .then((entry) => {
        if (!mounted) return
        setItemsMap(new Map(entry.itemsMap))
        setVersion(entry.version)
      })
      .catch(() => {
        if (!mounted) return
        const entry = emptyEntry()
        setItemsMap(entry.itemsMap)
        setVersion(entry.version)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [tenantKey])

  // Listen to response header version differences from axios
  useEffect(() => {
    const handleVersion = (newVersion: string) => {
      if (newVersion && newVersion !== versionRef.current) {
        void revalidateOnOpen()
      }
    }

    setLookupVersionListener(handleVersion)
    return () => {
      setLookupVersionListener(null)
    }
  }, [revalidateOnOpen])

  const getUom = useCallback((id: number | string | null | undefined): UomLookupItemResponse | undefined => {
    if (id == null || id === '') return undefined
    const numId = Number(id)
    if (!numId || Number.isNaN(numId)) return undefined
    return itemsMap.get(numId)
  }, [itemsMap])

  const uomLabel = useCallback((id: number | string | null | undefined): string => {
    if (id == null || id === '') return '—'
    const numId = Number(id)
    if (!numId || Number.isNaN(numId)) return '—'

    const item = itemsMap.get(numId)
    if (item) {
      return getInventoryLocalizedName(
        {
          name: item.name,
          nameAr: item.nameAr ?? undefined,
          code: item.code ?? undefined,
        },
        locale,
      )
    }

    // Trigger resolve-on-miss in background
    void resolveMiss(numId)
    return '—'
  }, [itemsMap, locale, resolveMiss])

  const uomSymbol = useCallback((id: number | string | null | undefined): string => {
    if (id == null || id === '') return '—'
    const numId = Number(id)
    if (!numId || Number.isNaN(numId)) return '—'

    const item = itemsMap.get(numId)
    if (item) {
      return (
        getLocalizedUomSymbol(item, locale) ||
        getInventoryLocalizedName(
          {
            name: item.name,
            nameAr: item.nameAr ?? undefined,
            code: item.code ?? undefined,
          },
          locale,
        )
      )
    }

    // Trigger resolve-on-miss in background
    void resolveMiss(numId)
    return '—'
  }, [itemsMap, locale, resolveMiss])

  const value = useMemo<UomLookupContextValue>(
    () => ({
      uoms,
      activeUoms,
      version,
      loading,
      getUom,
      uomLabel,
      uomSymbol,
      resolveMiss,
      revalidateOnOpen,
      invalidateAndRefetch,
    }),
    [
      uoms,
      activeUoms,
      version,
      loading,
      getUom,
      uomLabel,
      uomSymbol,
      resolveMiss,
      revalidateOnOpen,
      invalidateAndRefetch,
    ],
  )

  return <UomLookupContext.Provider value={value}>{children}</UomLookupContext.Provider>
}
