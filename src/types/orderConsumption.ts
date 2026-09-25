export type OrderConsumptionStatus = 'PENDING' | 'IN_PROGRESS' | 'PARTIAL' | 'POSTED' | 'CONFLICT'

/** What the doc's lines consumed stock for (D20). Both run the same lifecycle. */
export type OrderConsumptionType = 'ORDINARY' | 'WASTE'

export interface OrderConsumptionDocListResponse {
  id: number
  warehouseId: number
  warehouseName: string
  type: OrderConsumptionType
  status: OrderConsumptionStatus
  createdAt: string
  processedAt: string | null
  lineCount: number
}

export type OrderConsumptionFailureReason = 'INSUFFICIENT_STOCK' | 'TECHNICAL_FAILURE'

/**
 * One (doc, material) outcome row. requiredQuantity and availableQuantity are both in
 * uomId — the material's display unit. uomSymbol is a temporary backend
 * compatibility fallback while the frontend resolves display labels from
 * the app-level UOM cache.
 */
export interface OrderConsumptionDocMaterialResponse {
  materialId: number
  materialName: string
  materialNameAr?: string | null
  requiredQuantity: string
  uomId: number
  uomSymbol?: string | null
  consumed: boolean
  availableQuantity: string | null
  failureReason: OrderConsumptionFailureReason | null
  exceptionClass: string | null
  exceptionMessage: string | null
}

/** SALE, or WASTE for a dish cooked and then taken off the order (D20). */
export type OrderLineType = 'SALE' | 'WASTE'

/** The cooked stage a waste line was binned at — the only two D20 treats as waste. */
export type OrderLineWasteStage = 'IN_KITCHEN_COOKED' | 'AFTER_DONE'

/** No consumed flag: consumption is per material, and one line needs several materials. */
export interface OrderConsumptionDocLineResponse {
  id: number
  orderId: number
  createdBy: number
  lineType: OrderLineType
  wasteStage: OrderLineWasteStage | null
}

export interface OrderConsumptionDocDetailResponse {
  id: number
  warehouseId: number
  warehouseName: string
  type: OrderConsumptionType
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
  materialNameAr?: string | null
  uomId?: number | null
  uom: string
  totalQtyConsumed: string
  orderCount: number
}

export interface OrderConsumptionListParams {
  warehouseId?: number | string
  type?: OrderConsumptionType
  status?: OrderConsumptionStatus
  dateFrom?: string
  dateTo?: string
  page?: number
  size?: number
}
