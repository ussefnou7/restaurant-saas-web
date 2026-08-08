import type { WasteReasonCode } from './wasteDocument'

export type ReportColumnType = 'text' | 'number' | 'currency'

export type ColumnMeta<T> = {
  key: keyof T
  labelKey: string
  type: ReportColumnType
}

export type ReportFilterId = 'branch' | 'warehouse' | 'category'

export type FilterConfig = ReportFilterId

export type ReportConfig<T> = {
  id: string
  titleKey: string
  endpoint: string
  type: 'flat'
  filters: FilterConfig[]
  columns: ColumnMeta<T>[]
}

export type ReportFilters = {
  branchId?: string
  warehouseId?: string
  categoryId?: string
  supplierId?: string
  dateFrom?: string
  dateTo?: string
  negativesOnly?: boolean
  reasonCode?: string
}

export type ReportCellValue = string | number | null | undefined

export type ReportRow = object

export type StockValuationRow = {
  warehouseId: number
  warehouseName: string
  warehouseNameAr: string | null
  materialId: number
  materialName: string
  materialNameAr: string | null
  categoryId: number
  categoryName: string
  categoryNameAr: string | null
  quantity: string
  averageCost: string
  totalValue: string
}

export type LowStockRow = {
  warehouseId: number
  warehouseName: string
  warehouseNameAr: string | null
  materialId: number
  materialName: string
  materialNameAr: string | null
  categoryId: number
  categoryName: string
  categoryNameAr: string | null
  quantity: string
  minQuantity: string
  shortfall: string
}

export type ShrinkageRow = {
  materialId: number
  materialCode: string
  materialName: string
  materialNameAr?: string | null
  netQuantity?: string
  uomId?: number
  uomSymbol?: string
  netValue: string
  movementCount: number
  materialActive?: boolean
}

export type WasteAnalysisRow = ShrinkageRow & {
  reasonCode: WasteReasonCode | 'UNSPECIFIED'
}

export type LossComparisonRow = {
  materialId: number
  materialCode: string
  materialName: string
  materialNameAr?: string | null
  wasteQuantity?: string | null
  wasteValue: string
  shrinkageQuantity?: string | null
  shrinkageValue: string
  totalValue: string
  uomId?: number | null
  uomSymbol?: string | null
  materialActive?: boolean
}

export type PurchasePriceDriftRow = {
  materialId: number
  materialCode: string
  materialName: string
  materialNameAr?: string | null
  firstPrice: string
  firstPurchaseDate: string
  lastPrice: string
  lastPurchaseDate: string
  priceChange: string
  changePercent?: string | null
  purchaseCount: number
  uomId: number
  uomSymbol: string
  materialActive?: boolean
}

export type OrderTypeFilter = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'

export type SalesFilterParams = {
  dateFrom: string
  dateTo: string
  branchId?: string
  cashierUserId?: string
  orderType?: OrderTypeFilter
}

export type SalesOverTimeRow = {
  salesDate: string
  orderCount: number
  subtotal: string
  taxAmount: string
  totalAmount: string
  averageOrderValue: string
}

export type SalesByHourRow = SalesOverTimeRow & {
  hourOfDay: number
}

export type SalesByProductRow = {
  productId: number
  productName: string
  quantitySold: string
  revenue: string
  revenueSharePercent: string
}

export type PaymentMethodCode = 'CASH' | 'CARD' | 'WALLET' | 'AGGREGATOR'

export type SalesByPaymentMethodRow = {
  paymentMethod: PaymentMethodCode
  orderCount: number
  subtotal: string
  taxAmount: string
  totalAmount: string
  totalSharePercent: string
}



