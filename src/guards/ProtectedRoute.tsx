import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { canOpenScreen } from '../access/screenAccess'
import type { ScreenId } from '../access/screen-map'
import { useAuthSession } from '../access/useAuthSession'
import { AccessDenied } from '../components/AccessDenied'
import { authService } from '../services/authService'

interface ProtectedRouteProps {
  children: ReactNode
  /**
   * The screen being entered. Omit only for routes with no permission gate.
   *
   * A hidden nav link is not a guard — the URL is still typeable — so a denied screen renders an
   * explicit access-denied page rather than silently redirecting somewhere that looks like it
   * worked.
   */
  requires?: ScreenId
}

export function ProtectedRoute({ children, requires }: ProtectedRouteProps) {
  const { user, loading } = useAuthSession()

  if (!authService.getAccessToken()) {
    return <Navigate to="/login" replace />
  }

  // Never render actions from an unverified stored session.
  if (loading && !user) {
    return <AccessDenied variant="checking" />
  }

  if (requires && !canOpenScreen(user, requires)) {
    return <AccessDenied variant="denied" />
  }

  return <>{children}</>
}
