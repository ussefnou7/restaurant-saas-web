import type { PermissionCode } from './permissions.generated'

/**
 * Every gated screen and control in one place, so changing how a denial behaves is a one-line edit
 * here rather than a hunt through components. See docs/RBAC_UI_CONTRACT_PLAN.md in the backend repo.
 *
 * <p><strong>`requires` is typed as `PermissionCode`, which is generated from the backend's
 * @PreAuthorize gates.</strong> That makes the compiler the drift test: a code the backend does not
 * enforce will not typecheck, and a code the backend stops enforcing breaks the build on the next
 * `npm run sync:permissions`. Do not widen this to `string`.
 *
 * <p>Codes that are seeded but gate no endpoint — `SHIFTS_VIEW_VARIANCE` is the only one today —
 * are deliberately absent. They hide a column rather than a screen, the server sends the value
 * regardless, and treating them as access control here would imply a guarantee that does not exist.
 * They belong in `utils/shiftAccess.ts`, not in this map.
 */

/**
 * What a denied surface does.
 *
 * - `hide` — not rendered. For nav links and screens where a missing entry reads as "not my job".
 * - `disable` — rendered inert, so the user can see the action exists and ask for the grant.
 * - `deny-screen` — an explicit access-denied page. Only meaningful on a route.
 */
export type DeniedBehaviour = 'hide' | 'disable' | 'deny-screen'

interface ActionEntry {
  /** Holding any one of these is enough, matching the backend's `a or b` gates. */
  requires: PermissionCode | readonly PermissionCode[]
  onDenied: DeniedBehaviour
}

export interface ScreenEntry extends ActionEntry {
  route: string
  /**
   * What a denied *direct navigation* does. `onDenied` styles the nav link; a URL is always
   * typeable, so the route itself always needs a real answer — never a blank page.
   */
  onDeniedRoute: 'deny-screen'
  actions?: Readonly<Record<string, ActionEntry>>
  /**
   * A coarse "can they see this module exists" gate that, when set, decides `canOpenScreen` by
   * itself instead of `requires`. See `moduleAccess.ts` for why this is a plain string rather
   * than a `PermissionCode`: it never protects data, only whether the shell renders, because every
   * screen and action inside still goes through its own entry in `requires`/`actions`.
   */
  moduleAccess?: string
}

export const SCREEN_MAP = {
  sales: {
    route: '/sales',
    requires: 'REPORTS_VIEW_SALES',
    onDenied: 'hide',
    onDeniedRoute: 'deny-screen',
  },

  inventory: {
    route: '/inventory',
    requires: ['INVENTORY_SETUP_VIEW', 'INVENTORY_SETUP_MANAGE', 'INVENTORY_STOCK_VIEW', 'INVENTORY_STOCK_MANAGE'],
    onDenied: 'hide',
    onDeniedRoute: 'deny-screen',
    actions: {
      manageSetup: { requires: 'INVENTORY_SETUP_MANAGE', onDenied: 'disable' },
      manageStock: { requires: 'INVENTORY_STOCK_MANAGE', onDenied: 'disable' },
      deletePhysicalCount: { requires: 'PHYSICAL_COUNT_DELETE', onDenied: 'disable' },
      revertPhysicalCount: { requires: 'PHYSICAL_COUNT_REVERT_TO_DRAFT', onDenied: 'disable' },
      uncompleteWaste: { requires: 'WASTE_UNCOMPLETE', onDenied: 'disable' },
    },
  },

  assets: {
    route: '/assets',
    requires: 'ASSETS_VIEW',
    onDenied: 'hide',
    onDeniedRoute: 'deny-screen',
    actions: {
      manage: { requires: 'ASSETS_MANAGE', onDenied: 'disable' },
    },
  },

  purchase: {
    route: '/purchase',
    requires: ['INVENTORY_PURCHASE_VIEW', 'INVENTORY_PURCHASE_MANAGE'],
    onDenied: 'hide',
    onDeniedRoute: 'deny-screen',
    actions: {
      manage: { requires: 'INVENTORY_PURCHASE_MANAGE', onDenied: 'disable' },
      unpostInvoice: { requires: 'PURCHASE_INVOICE_UNPOST', onDenied: 'disable' },
      unpostReturn: { requires: 'PURCHASE_RETURN_UNPOST', onDenied: 'disable' },
      uncompleteInvoice: { requires: 'PURCHASE_INVOICE_UNCOMPLETE', onDenied: 'disable' },
      uncompleteReturn: { requires: 'PURCHASE_RETURN_UNCOMPLETE', onDenied: 'disable' },
      deleteInvoice: { requires: 'PURCHASE_INVOICE_DELETE', onDenied: 'disable' },
      deleteReturn: { requires: 'PURCHASE_RETURN_DELETE', onDenied: 'disable' },
    },
  },

  expenses: {
    route: '/expenses',
    requires: 'EXPENSES_VIEW',
    onDenied: 'hide',
    onDeniedRoute: 'deny-screen',
    actions: {
      create: { requires: 'EXPENSES_CREATE', onDenied: 'disable' },
      void: { requires: 'EXPENSES_VOID', onDenied: 'disable' },
      manageCategories: { requires: 'EXPENSES_CATEGORY_MANAGE', onDenied: 'disable' },
    },
  },

  hr: {
    route: '/hr',
    moduleAccess: 'HR_ACCESS',
    requires: [
      'HR_EMPLOYEES_VIEW',
      'HR_LEAVE_REQUESTS_VIEW',
      'HR_LEAVE_BALANCES_VIEW',
      'HR_LEAVES_VIEW',
      'HR_SALARIES_VIEW',
      'HR_SALARY_ADJUSTMENTS_VIEW',
    ],
    onDenied: 'hide',
    onDeniedRoute: 'deny-screen',
    actions: {
      createEmployee: { requires: 'HR_EMPLOYEES_CREATE', onDenied: 'disable' },
      updateEmployee: { requires: 'HR_EMPLOYEES_UPDATE', onDenied: 'disable' },
      viewLeaveRequests: { requires: 'HR_LEAVE_REQUESTS_VIEW', onDenied: 'hide' },
      manageLeaveRequests: { requires: 'HR_LEAVE_REQUESTS_MANAGE', onDenied: 'disable' },
      viewLeaveBalances: { requires: 'HR_LEAVE_BALANCES_VIEW', onDenied: 'hide' },
      manageLeaveBalances: { requires: 'HR_LEAVE_BALANCES_MANAGE', onDenied: 'disable' },
      viewLeaveTypes: { requires: 'HR_LEAVES_VIEW', onDenied: 'hide' },
      manageLeaveTypes: { requires: 'HR_LEAVE_TYPES_MANAGE', onDenied: 'disable' },
      viewSalaries: { requires: 'HR_SALARIES_VIEW', onDenied: 'hide' },
      manageSalaries: { requires: 'HR_SALARIES_MANAGE', onDenied: 'disable' },
      viewSalaryAdjustments: { requires: 'HR_SALARY_ADJUSTMENTS_VIEW', onDenied: 'hide' },
      manageSalaryAdjustments: { requires: 'HR_SALARY_ADJUSTMENTS_MANAGE', onDenied: 'disable' },
    },
  },

  shifts: {
    route: '/shifts',
    requires: 'SHIFTS_VIEW',
    onDenied: 'hide',
    onDeniedRoute: 'deny-screen',
    actions: {
      open: { requires: 'SHIFTS_OPEN', onDenied: 'disable' },
      close: { requires: 'SHIFTS_CLOSE', onDenied: 'disable' },
      forceClose: { requires: 'SHIFTS_FORCE_CLOSE', onDenied: 'hide' },
    },
  },

  devices: {
    route: '/devices',
    requires: 'DEVICES_MANAGE',
    onDenied: 'hide',
    onDeniedRoute: 'deny-screen',
  },

  tables: {
    route: '/tables',
    requires: 'TABLES_VIEW',
    onDenied: 'hide',
    onDeniedRoute: 'deny-screen',
    actions: {
      manage: { requires: 'TABLES_MANAGE', onDenied: 'disable' },
    },
  },

  branches: {
    route: '/branches',
    requires: 'BRANCHES_VIEW',
    onDenied: 'hide',
    onDeniedRoute: 'deny-screen',
    actions: {
      create: { requires: 'BRANCHES_CREATE', onDenied: 'disable' },
      update: { requires: 'BRANCHES_UPDATE', onDenied: 'disable' },
    },
  },

  users: {
    route: '/users',
    requires: 'USERS_VIEW',
    onDenied: 'hide',
    onDeniedRoute: 'deny-screen',
    actions: {
      create: { requires: 'USERS_CREATE', onDenied: 'disable' },
      update: { requires: 'USERS_UPDATE', onDenied: 'disable' },
      delete: { requires: 'USERS_DELETE', onDenied: 'disable' },
      changeStatus: { requires: 'USERS_CHANGE_STATUS', onDenied: 'disable' },
      editPermissions: { requires: 'USER_PERMISSIONS_UPDATE', onDenied: 'disable' },
    },
  },

  menu: {
    route: '/menu',
    requires: 'PRODUCTS_VIEW',
    onDenied: 'hide',
    onDeniedRoute: 'deny-screen',
    actions: {
      create: { requires: 'PRODUCTS_CREATE', onDenied: 'disable' },
      update: { requires: 'PRODUCTS_UPDATE', onDenied: 'disable' },
      delete: { requires: 'PRODUCTS_DELETE', onDenied: 'disable' },
      changeStatus: { requires: 'PRODUCTS_CHANGE_STATUS', onDenied: 'disable' },
    },
  },

  orders: {
    route: '/orders',
    requires: 'ORDERS_VIEW',
    onDenied: 'hide',
    onDeniedRoute: 'deny-screen',
    actions: {
      create: { requires: 'ORDERS_CREATE', onDenied: 'disable' },
    },
  },
} as const satisfies Readonly<Record<string, ScreenEntry>>

export type ScreenId = keyof typeof SCREEN_MAP
