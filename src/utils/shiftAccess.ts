import { hasPermission } from '../access/can'
import { useAuthSession } from '../access/useAuthSession'

/**
 * Shift gates, matching ShiftController.
 *
 * <p>Three defects removed here: an `OWNER` bypass the backend does not have (owners are seeded
 * with every enforced permission, so they lose nothing by being checked normally); a `SHIFTS_MANAGE`
 * code that was never seeded nor gated; and a `canCloseShift` that admitted anyone holding
 * `SHIFTS_VIEW`, so permission to *see* a shift granted the close button.
 */

export function useCanViewShifts(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'SHIFTS_VIEW')
}

/**
 * Variance is a display-only grant: no endpoint enforces `SHIFTS_VIEW_VARIANCE`, the server sends
 * the figures regardless. Hiding the columns is a courtesy, not a control — which is also why the
 * code is checked directly rather than through `hasPermission`, whose `PermissionCode` type only
 * admits codes some endpoint enforces.
 */
export function useCanViewShiftVariance(): boolean {
  const { user } = useAuthSession()
  if (!user) return false
  if (user.roleCode === 'SYS_ADMIN') return true
  return Array.isArray(user.permissions) && user.permissions.includes('SHIFTS_VIEW_VARIANCE')
}

export function useCanCloseShift(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'SHIFTS_CLOSE')
}

/** Closing a shift opened by another cashier is a separate grant (D122/D123). */
export function useCanForceCloseShift(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'SHIFTS_FORCE_CLOSE')
}

export function useCanOpenShift(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'SHIFTS_OPEN')
}
