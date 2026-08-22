import { useContext } from 'react'
import { UomLookupContext } from '../contexts/UomLookupContext'
import type { UomLookupContextValue } from '../contexts/uomLookupBridge'

export function useUomLookup(): UomLookupContextValue {
  const context = useContext(UomLookupContext)
  if (!context) {
    throw new Error('useUomLookup must be used within a UomLookupProvider')
  }
  return context
}
