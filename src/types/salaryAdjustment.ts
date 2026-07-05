export type SalaryAdjustmentType = 'ADDITION' | 'DEDUCTION'

export type SalaryAdjustmentResponse = {
  id: number
  employeeId: number
  type: SalaryAdjustmentType | string
  amount: number
  adjustmentDate: string
  reason?: string | null
  notes?: string | null
  status: string
  active?: boolean
  createdAt: string
  updatedAt: string
}

export type CreateSalaryAdjustmentRequest = {
  type: SalaryAdjustmentType
  amount: number
  adjustmentDate: string
  reason?: string
  notes?: string
}
