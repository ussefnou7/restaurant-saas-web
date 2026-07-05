export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export type LeaveRequestResponse = {
  id: number
  branchId: number
  employeeId: number
  employeeCode?: string | null
  employeeName?: string | null
  leaveTypeId: number
  leaveTypeCode?: string | null
  leaveTypeName?: string | null
  fromDate: string
  toDate: string
  daysCount: number
  reason?: string | null
  status: LeaveRequestStatus
  statusNote?: string | null
  statusChangedBy?: number | null
  statusChangedAt?: string | null
  createdAt: string
  updatedAt: string
}

export type CreateLeaveRequestRequest = {
  employeeId: number
  leaveTypeId: number
  fromDate: string
  toDate: string
  daysCount: number
  reason?: string
}

export type UpdateLeaveRequestStatusRequest = {
  status: Exclude<LeaveRequestStatus, 'PENDING'>
  statusNote?: string
}
