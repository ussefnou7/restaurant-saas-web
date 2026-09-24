import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { canOpenScreen } from '../access/screenAccess'
import type { ScreenId } from '../access/screen-map'
import { useAuthSession } from '../access/useAuthSession'
import { AccessDenied } from '../components/AccessDenied'

interface ScreenGuardProps {
  screen: ScreenId
  /** Omit for a layout route — the matched child renders through `Outlet` instead. */
  children?: ReactNode
}

/**
 * Route-level enforcement of `SCREEN_MAP`. Sits inside the authenticated layout, so it assumes a
 * session exists and only answers the permission question.
 *
 * <p>Hiding a sidebar link does not protect a route; this does. Both read the same map entry, so
 * they cannot disagree.
 */
export function ScreenGuard({ screen, children }: ScreenGuardProps) {
  const { user, loading } = useAuthSession()

  if (loading && !user) {
    return <AccessDenied variant="checking" />
  }

  if (!canOpenScreen(user, screen)) {
    return <AccessDenied variant="denied" />
  }

  return <>{children ?? <Outlet />}</>
}
