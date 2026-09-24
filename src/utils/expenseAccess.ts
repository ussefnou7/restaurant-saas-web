import { hasPermission } from '../access/can'
import { useAuthSession } from '../access/useAuthSession'

/** `OWNER` bypass removed: the backend bypasses `SYS_ADMIN` only. */

export function useCanViewExpenses(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'EXPENSES_VIEW')
}

export function useCanCreateExpense(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'EXPENSES_CREATE')
}

export function useCanVoidExpense(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'EXPENSES_VOID')
}

export function useCanManageExpenseCategories(): boolean {
  const { user } = useAuthSession()
  return hasPermission(user, 'EXPENSES_CATEGORY_MANAGE')
}
