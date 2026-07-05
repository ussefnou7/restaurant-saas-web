export const USER_ROLE_OPTIONS = [
  { code: 'OWNER', label: 'Owner' },
  { code: 'BRANCH_MANAGER', label: 'Branch Manager' },
  { code: 'CASHIER', label: 'Cashier' },
  { code: 'ACCOUNTANT', label: 'Accountant' },
  { code: 'HR_MANAGER', label: 'HR Manager' },
  { code: 'INVENTORY_MANAGER', label: 'Inventory Manager' },
] as const

export type UserRoleCode = (typeof USER_ROLE_OPTIONS)[number]['code']
