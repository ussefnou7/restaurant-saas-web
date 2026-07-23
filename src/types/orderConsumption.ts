export type OrderConsumptionStatus = 'PENDING' | 'IN_PROGRESS' | 'POSTED' | 'CONFLICT'

export interface OrderConsumptionDocListResponse {
  id: number
  warehouseId: number
  warehouseName: string
  status: OrderConsumptionStatus
  createdAt: string
  processedAt: string | null
  lineCount: number
}

export interface OrderConsumptionErrorDetail {
  materialId: number
  materialName: string
  exceptionClass: string
  message: string
}

export interface OrderConsumptionDocLineResponse {
  id: number
  orderId: number
  createdBy: number
  consumed: boolean
}

export interface OrderConsumptionDocDetailResponse {
  id: number
  warehouseId: number
  warehouseName: string
  status: OrderConsumptionStatus
  createdAt: string
  processedAt: string | null
  errorDetails: OrderConsumptionErrorDetail[] | null
  lines: OrderConsumptionDocLineResponse[]
}

export interface OrderConsumptionMaterialsSummaryResponse {
  docId: number
  materials: OrderConsumptionMaterialSummaryResponse[]
}

export interface OrderConsumptionMaterialSummaryResponse {
  materialId: number
  materialName: string
  uom: string
  totalQtyConsumed: string
  orderCount: number
}

export interface OrderConsumptionListParams {
  warehouseId?: number | string
  status?: OrderConsumptionStatus
  dateFrom?: string
  dateTo?: string
  page?: number
  size?: number
}
