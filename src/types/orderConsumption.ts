export type OrderConsumptionStatus = 'PENDING' | 'IN_PROGRESS' | 'PARTIAL' | 'POSTED' | 'CONFLICT'

export interface OrderConsumptionDocListResponse {
  id: number
  warehouseId: number
  warehouseName: string
  status: OrderConsumptionStatus
  createdAt: string
  processedAt: string | null
  lineCount: number
}

export type OrderConsumptionFailureReason = 'INSUFFICIENT_STOCK' | 'TECHNICAL_FAILURE'

/**
 * One (doc, material) outcome row. requiredQuantity and availableQuantity are both in
 * uomId/uomSymbol — the material's display unit.
 */
export interface OrderConsumptionDocMaterialResponse {
  materialId: number
  materialName: string
  requiredQuantity: string
  uomId: number
  uomSymbol: string
  consumed: boolean
  availableQuantity: string | null
  failureReason: OrderConsumptionFailureReason | null
  exceptionClass: string | null
  exceptionMessage: string | null
}

/** No consumed flag: consumption is per material, and one line needs several materials. */
export interface OrderConsumptionDocLineResponse {
  id: number
  orderId: number
  createdBy: number
}

export interface OrderConsumptionDocDetailResponse {
  id: number
  warehouseId: number
  warehouseName: string
  status: OrderConsumptionStatus
  createdAt: string
  processedAt: string | null
  materials: OrderConsumptionDocMaterialResponse[]
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
