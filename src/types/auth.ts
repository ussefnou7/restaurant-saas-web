export type RoleCode =
  | 'SYS_ADMIN'
  | 'OWNER'
  | 'BRANCH_MANAGER'
  | 'CASHIER'
  | 'ACCOUNTANT'
  | 'HR_MANAGER'
  | 'INVENTORY_MANAGER'

export interface AuthUser {
  id: number
  tenantId?: number | null
  fullName: string
  username: string
  email: string
  phone: string
  roleCode: RoleCode
  permissions: string[]
}

export interface LoginRequest {
  tenantCode: string
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}
