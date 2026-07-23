export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'
export type OrderSource = 'POS' | 'ONLINE' | 'AGGREGATOR'
export type OrderStatus = 'COMPLETE' | 'CANCELLED'
export type CancellationStage =
  | 'BEFORE_KITCHEN'
  | 'IN_KITCHEN_COOKED'
  | 'IN_KITCHEN_NOT_COOKED'
  | 'AFTER_DONE'
export type PaymentMethod = 'CASH' | 'CARD' | 'WALLET' | 'AGGREGATOR'

export interface OrderLineView {
  id: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface OrderView {
  id: number
  orderType: OrderType
  orderSource: OrderSource
  aggregatorName?: string
  status: OrderStatus
  cancellationStage?: CancellationStage
  paymentMethod: PaymentMethod
  tableNo?: string
  branchId: number
  branchName?: string
  warehouseId: number
  warehouseName?: string
  totalAmount: number
  orderDate: string
  externalOrderReference?: string
  createdAt?: string
  updatedAt?: string
  lines: OrderLineView[]
}

export interface OrderListParams {
  orderType?: OrderType
  orderSource?: OrderSource
  status?: OrderStatus
  branchId?: number | string
  dateFrom?: string
  dateTo?: string
  page?: number
  size?: number
}
