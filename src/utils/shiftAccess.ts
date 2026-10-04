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
 * Variance visibility is enforced by the backend in `ShiftQueryService.java` (both list and detail
 * queries). When a user lacks `SHIFTS_VIEW_VARIANCE`, the server strips variance figures, cash
 * totals, expenses, and explained variance from the response.
 *
 * Hiding variance columns in the UI aligns the presentation with the server's data filtering.
 * Checked through the type-safe `hasPermission` path.
 */
export function useCanViewShiftVariance(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'SHIFTS_VIEW_VARIANCE')
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
