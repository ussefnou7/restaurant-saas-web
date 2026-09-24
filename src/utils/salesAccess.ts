import { hasPermission } from '../access/can'
import { useAuthSession } from '../access/useAuthSession'

/** `OWNER`/`BRANCH_MANAGER` bypasses removed: the backend bypasses `SYS_ADMIN` only. */
export function useCanViewSalesReports(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'REPORTS_VIEW_SALES')
}
