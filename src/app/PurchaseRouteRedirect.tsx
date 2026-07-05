import { Navigate, useLocation } from 'react-router-dom'

type PurchaseRouteRedirectProps = {
  fromPrefix: string
  toPrefix: string
}

export function PurchaseRouteRedirect({ fromPrefix, toPrefix }: PurchaseRouteRedirectProps) {
  const { pathname, search, hash } = useLocation()
  const target = `${pathname.replace(fromPrefix, toPrefix)}${search}${hash}`
  return <Navigate to={target} replace />
}
