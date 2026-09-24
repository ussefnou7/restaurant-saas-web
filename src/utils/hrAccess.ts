import { hasPermission } from '../access/can'
import { useAuthSession } from '../access/useAuthSession'

/**
 * HR used to be one grantable permission (`HR_MANAGE`) covering leave requests, leave balances,
 * leave types, salaries and salary adjustments, so a tenant could not grant an accountant payroll
 * without also handing them leave approval. It is now a VIEW/MANAGE pair per feature, mirroring
 * `INVENTORY_SETUP_VIEW`/`MANAGE` and `INVENTORY_STOCK_VIEW`/`MANAGE`. See
 * V66__hr_granular_permissions.sql in the backend repo, which deactivates `HR_MANAGE` and the
 * unenforced `HR_ACCESS` module gate.
 */

export function useCanViewLeaveRequests(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'HR_LEAVE_REQUESTS_VIEW')
}

export function useCanManageLeaveRequests(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'HR_LEAVE_REQUESTS_MANAGE')
}

export function useCanViewLeaveBalances(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'HR_LEAVE_BALANCES_VIEW')
}

export function useCanManageLeaveBalances(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'HR_LEAVE_BALANCES_MANAGE')
}

/** Reading leave types is its own grant -- `GET /api/hr/leave-types` gates on `HR_LEAVES_VIEW`. */
export function useCanViewLeaveTypes(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'HR_LEAVES_VIEW')
}

export function useCanManageLeaveTypes(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'HR_LEAVE_TYPES_MANAGE')
}

export function useCanViewSalaries(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'HR_SALARIES_VIEW')
}

export function useCanManageSalaries(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'HR_SALARIES_MANAGE')
}

export function useCanViewSalaryAdjustments(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'HR_SALARY_ADJUSTMENTS_VIEW')
}

export function useCanManageSalaryAdjustments(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'HR_SALARY_ADJUSTMENTS_MANAGE')
}
