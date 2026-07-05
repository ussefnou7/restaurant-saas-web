export type EmployeeCurrentSalaryResponse = {
  amount: number
  effectiveFrom?: string | null
  employeeId?: number
}

export type EmployeeSalaryRecord = {
  id: number
  employeeId: number
  amount: number
  effectiveFrom: string
  notes?: string | null
  createdAt: string
  updatedAt?: string
}

export type CreateEmployeeSalaryRequest = {
  amount: number
  effectiveFrom?: string
  notes?: string
}
