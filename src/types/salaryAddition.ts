export type SalaryAdditionResponse = {
  id: number
  branchId: number
  employeeId: number
  employeeCode?: string | null
  employeeName?: string | null
  employeeNameEn?: string | null
  employeeNameAr?: string | null
  title: string
  amount: number
  salaryMonth: string
  notes?: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export type CreateSalaryAdditionRequest = {
  employeeId: number
  title: string
  amount: number
  salaryMonth: string
  notes?: string
  active?: boolean
}

export type UpdateSalaryAdditionRequest = {
  title: string
  amount: number
  salaryMonth: string
  notes?: string
  active: boolean
}
