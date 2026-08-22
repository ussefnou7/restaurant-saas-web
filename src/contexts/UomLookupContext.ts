import { createContext } from 'react'
import type { UomLookupContextValue } from './uomLookupBridge'

export const UomLookupContext = createContext<UomLookupContextValue | null>(null)
export type { UomLookupContextValue } from './uomLookupBridge'
export { setLookupVersionListener, notifyLookupVersionHeader } from './uomLookupBridge'
