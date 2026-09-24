export type ExpensePaymentSource = 'CASH_DRAWER' | 'CASH_ON_HAND' | 'BANK'

export type ExpenseSourceType = 'MANUAL'

export type ExpenseStatus = 'ACTIVE' | 'VOIDED'

export interface CreateExpenseRequest {
  branchId?: number | null
  categoryId: number
  amount: number
  expenseDate: string
  description?: string | null
  payeeName?: string | null
  paymentSource: ExpensePaymentSource
  paidFromShiftId?: number | null
}

export interface SelectableExpenseShift {
  id: number
  businessDate: string
  deviceId: number
  deviceName: string
  branchDeviceCount: number
  cashierUserId: number
  cashierName: string | null
  openedAt: string
  closedAt: string | null
  status: 'OPEN' | 'CLOSED'
  closed: boolean
}

export interface VoidExpenseRequest {
  reason: string
}

export interface ExpenseCategoryRequest {
  name: string
  nameAr?: string | null
}

export interface ExpenseResponse {
  id: number
  branchId: number | null
  branchName: string | null
  categoryId: number
  categoryName: string
  categoryNameAr: string | null
  amount: number
  expenseDate: string
  description: string | null
  payeeName: string | null
  paymentSource: ExpensePaymentSource
  sourceType: ExpenseSourceType
  sourceId: number | null
  status: ExpenseStatus
  voidedAt: string | null
  voidedBy: number | null
  voidReason: string | null
  createdBy: number | null
  createdAt: string
  paidFromShiftId: number | null
  recordedAfterShiftClose: boolean | null
}

export interface ExpenseCategoryResponse {
  id: number
  tenantId: number | null
  name: string
  nameAr: string | null
  active: boolean
  global: boolean
  createdBy: number | null
  createdAt: string
}

export interface ExpenseListParams {
  branchId?: number
  unbranchedOnly?: boolean
  categoryId?: number
  dateFrom?: string
  dateTo?: string
  paymentSource?: ExpensePaymentSource
  status?: ExpenseStatus
  search?: string
  page?: number
  size?: number
  sort?: string | string[]
}

export interface ExpensePageResponse {
  content: ExpenseResponse[]
  empty: boolean
  first: boolean
  last: boolean
  number: number
  numberOfElements: number
  pageable: {
    offset: number
    pageNumber: number
    pageSize: number
    paged: boolean
    sort: {
      empty: boolean
      sorted: boolean
      unsorted: boolean
    }
    unpaged: boolean
  }
  size: number
  sort: {
    empty: boolean
    sorted: boolean
    unsorted: boolean
  }
  totalElements: number
  totalPages: number
}
