export type ShiftStatus = 'OPEN' | 'CLOSED'
export type ShiftOrderStatus = 'COMPLETE' | 'CANCELLED'
export type ShiftExpenseStatus = 'ACTIVE' | 'VOIDED'
export type ShiftPaymentMethod = 'CASH' | 'CARD' | 'WALLET'

export interface ShiftListItemResponse {
  id: number
  businessDate: string
  deviceId: number
  deviceName: string
  branchId: number
  branchName: string
  cashierUserId: number
  cashierName: string | null
  closedByUserId?: number | null
  closedByUserName?: string | null
  openedAt: string
  closedAt?: string | null
  durationMinutes?: number | null
  status: ShiftStatus
  forcedClose: boolean
  variance?: number | null
  handoverVariance?: number | null
}

export interface ShiftOrderLine {
  id: number
  orderNo: string | null
  orderDate: string
  status: ShiftOrderStatus
  paymentMethod: ShiftPaymentMethod
  totalAmount: number
  createdByUserId: number | null
  createdByName: string | null
}

export interface ShiftExpenseLine {
  id: number
  amount: number
  expenseDate: string
  description: string | null
  payeeName: string | null
  categoryId: number | null
  categoryName: string | null
  status: ShiftExpenseStatus
  recordedByUserId: number | null
  recordedByName: string | null
  createdAt: string
  recordedAfterClose: boolean
}

export interface ShiftDetailResponse {
  shift: ShiftListItemResponse
  salesByPaymentMethod: Partial<Record<ShiftPaymentMethod, number>>
  cashSales: number | null
  expensesAtClose: number | null
  lateExpenses: number | null
  explainedVariance: number | null
  orders: ShiftOrderLine[]
  expenses: ShiftExpenseLine[]
}

export interface ShiftListParams {
  branchId?: number
  deviceId?: number
  cashierUserId?: number
  dateFrom?: string
  dateTo?: string
  status?: ShiftStatus
  forcedClose?: boolean
  page?: number
  size?: number
}

export interface ShiftPageResponse {
  content: ShiftListItemResponse[]
  empty: boolean
  first: boolean
  last: boolean
  number: number
  numberOfElements: number
  size: number
  totalElements: number
  totalPages: number
}

export interface CloseShiftRequest {
  closingCount: number
}
