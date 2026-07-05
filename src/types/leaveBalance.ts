export type LeaveBalanceResponse = {
  id: number
  tenantId?: number
  employeeId: number
  branchId?: number
  leaveTypeId: number
  leaveTypeCode?: string | null
  leaveTypeNameEn?: string | null
  leaveTypeNameAr?: string | null
  /** Legacy alias some responses may still send */
  leaveTypeName?: string | null
  year: number
  openingBalance: number
  assignedDays: number
  usedDays: number
  remainingDays: number
  active: boolean
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export type UpdateLeaveBalanceRequest = {
  openingBalance: number
  assignedDays: number
  active: boolean
  notes?: string
}
