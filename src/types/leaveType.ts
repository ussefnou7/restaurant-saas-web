export type LeaveTypeResponse = {
  id: number
  tenantId?: number
  code: string
  nameEn?: string | null
  nameAr?: string | null
  /** Legacy alias some responses may still send */
  name?: string | null
  descriptionEn?: string | null
  descriptionAr?: string | null
  defaultDays: number
  paid: boolean
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export type CreateLeaveTypeRequest = {
  code: string
  nameEn?: string
  nameAr?: string
  descriptionEn?: string
  descriptionAr?: string
  defaultDays: number
  paid: boolean
  active?: boolean
}

export type UpdateLeaveTypeRequest = CreateLeaveTypeRequest
