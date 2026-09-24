import { hasPermission } from '../access/can'
import { useAuthSession } from '../access/useAuthSession'

/** `OWNER` bypass removed: the backend gates on `DEVICES_MANAGE` with a `SYS_ADMIN`-only bypass. */
export function useCanManageDevices(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'DEVICES_MANAGE')
}
