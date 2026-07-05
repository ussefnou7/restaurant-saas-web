import { Navigate } from 'react-router-dom'

/** @deprecated Use /inventory hub — kept for legacy links */
export function InventorySetupPage() {
  return <Navigate to="/inventory" replace />
}
