import { createContext } from 'react'
import type { AuthUser } from '../types/auth'

export interface AuthSessionValue {
  /** The signed-in user, or null when signed out or still loading. */
  user: AuthUser | null
  /** True until the stored session has been verified against `/me` at least once. */
  loading: boolean
  /** Re-reads `/me`. Call after editing the current user's own permissions. */
  refresh: () => Promise<void>
}

export const AuthSessionContext = createContext<AuthSessionValue | null>(null)
