export type RoleResponse = {
  id?: number
  code: string
  name: string
  nameEn?: string | null
  nameAr?: string | null
  description?: string
  active?: boolean
}

export type UserResponse = {
  id: number
  username: string
  fullName: string
  phone?: string | null
  role: RoleResponse
  branchId?: number | null
  branchName?: string | null
  branchNameEn?: string | null
  branchNameAr?: string | null
  branchCode?: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export type CreateUserRequest = {
  username: string
  fullName: string
  phone?: string
  password: string
  roleCode: string
  branchId?: number | null
  active: boolean
}

export type UpdateUserRequest = {
  fullName: string
  phone?: string
  roleCode: string
  branchId?: number | null
  active: boolean
}

export type UpdateUserStatusRequest = {
  active: boolean
}
