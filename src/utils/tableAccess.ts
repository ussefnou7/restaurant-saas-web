import { hasPermission } from '../access/can'
import { useAuthSession } from '../access/useAuthSession'

/** `OWNER` bypass removed: the backend bypasses `SYS_ADMIN` only. */

export function useCanViewTables(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'TABLES_VIEW')
}

export function useCanManageTables(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'TABLES_MANAGE')
}
