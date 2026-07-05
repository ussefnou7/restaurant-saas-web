export type EmployeeResponse = {
  id: number
  branchId: number
  branchName: string
  branchNameEn?: string | null
  branchNameAr?: string | null
  branchCode: string
  jobId: number
  jobName: string
  jobNameEn?: string | null
  jobNameAr?: string | null
  jobCode: string
  appUserId?: number | null
  employeeCode: string
  fullName: string
  fullNameEn?: string | null
  fullNameAr?: string | null
  phone?: string | null
  email?: string | null
  nationalId?: string | null
  address?: string | null
  hireDate: string
  salary: number
  active: boolean
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export type CreateEmployeeRequest = {
  branchId: number
  jobId: number
  appUserId?: number | null
  employeeCode: string
  fullName: string
  fullNameAr?: string | null
  phone?: string
  email?: string
  nationalId?: string
  address?: string
  hireDate: string
  salary: number
  active: boolean
  notes?: string
}

export type UpdateEmployeeRequest = {
  branchId: number
  jobId: number
  appUserId?: number | null
  employeeCode: string
  fullName: string
  fullNameAr?: string | null
  phone?: string
  email?: string
  nationalId?: string
  address?: string
  hireDate: string
  salary: number
  active: boolean
  notes?: string
}

export type UpdateActiveStatusRequest = {
  active: boolean
}
