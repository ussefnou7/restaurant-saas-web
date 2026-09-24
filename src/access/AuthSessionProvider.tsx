import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { authService } from '../services/authService'
import { AUTH_SESSION_CHANGED_EVENT } from '../services/authEvents'
import type { AuthUser } from '../types/auth'
import { AuthSessionContext, type AuthSessionValue } from './AuthSessionContext'

const AUTH_USER_KEY = 'authUser'

interface AuthSessionProviderProps {
  children: ReactNode
}

/**
 * Holds the signed-in user as reactive state so a permission change re-renders the UI. The old
 * `utils/*Access.ts` helpers read `localStorage` during render instead, which React cannot observe
 * — permissions edited mid-session kept their stale buttons until a manual reload.
 *
 * Storage stays the source of truth across reloads; this provider is a subscription to it.
 */
export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getAuthUser())
  const [loading, setLoading] = useState(() => authService.getAccessToken() !== null)

  // Discards a `/me` response that resolved after the session it belonged to was replaced.
  const requestId = useRef(0)

  const refresh = useCallback(async () => {
    if (!authService.getAccessToken()) {
      setUser(null)
      setLoading(false)
      return
    }

    const id = ++requestId.current
    setLoading(true)
    try {
      const fresh = await authService.getCurrentUser()
      if (id !== requestId.current) return
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(fresh))
      setUser(fresh)
    } catch {
      if (id !== requestId.current) return
      // A 401 is already handled by the api interceptor: it clears storage and redirects. Anything
      // else is a network or server failure, where signing the user out would be wrong — keep the
      // stored user and let the backend reject whatever they try.
      setUser(authService.getAuthUser())
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  // Verify the restored session once on mount.
  useEffect(() => {
    void refresh()
  }, [refresh])

  // Login, logout and the 401 interceptor all dispatch this.
  useEffect(() => {
    const onSessionChanged = () => {
      requestId.current++
      setUser(authService.getAuthUser())
      setLoading(false)
    }
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionChanged)
    return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionChanged)
  }, [])

  // Another tab signing in or out.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== AUTH_USER_KEY && event.key !== 'accessToken') return
      requestId.current++
      setUser(authService.getAuthUser())
      setLoading(false)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Returning to the tab is the cheapest moment to notice a permission change made elsewhere.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && authService.getAccessToken()) {
        void refresh()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  const value = useMemo<AuthSessionValue>(() => ({ user, loading, refresh }), [user, loading, refresh])

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
}
