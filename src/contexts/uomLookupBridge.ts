import type { UomLookupItemResponse } from '../types/inventory'

export interface UomLookupContextValue {
  uoms: UomLookupItemResponse[]
  activeUoms: UomLookupItemResponse[]
  version: string | null
  loading: boolean
  getUom: (id: number | string | null | undefined) => UomLookupItemResponse | undefined
  uomLabel: (id: number | string | null | undefined) => string
  uomSymbol: (id: number | string | null | undefined) => string
  resolveMiss: (id: number | string) => Promise<UomLookupItemResponse | null>
  revalidateOnOpen: () => Promise<void>
  invalidateAndRefetch: () => Promise<void>
}

type LookupVersionListener = (version: string) => void

let lookupVersionListener: LookupVersionListener | null = null

export function setLookupVersionListener(listener: LookupVersionListener | null): void {
  lookupVersionListener = listener
}

export function notifyLookupVersionHeader(rawHeader: string): void {
  if (!rawHeader) return
  const match = rawHeader.match(/uom=([^,;]+)/)
  const version = match ? match[1].trim() : rawHeader.trim()
  if (version && lookupVersionListener) {
    lookupVersionListener(version)
  }
}
