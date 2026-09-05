// ─── Physical Count Types ─────────────────────────────────────────────────────

export type PhysicalCountStatus = 'DRAFT' | 'IN_PROGRESS' | 'RECONCILED' | 'CANCELLED'

export type PhysicalCountSummaryResponse = {
  id: number
  warehouseId: number
  warehouseName: string
  code: string
  scheduledDate: string
  status: PhysicalCountStatus
  hasLargeVariance: boolean
  largeVarianceValue: number | null
  lineCount: number
  varianceCount: number
  createdAt: string
}

export type PhysicalCountLineResponse = {
  id: number
  materialId: number
  materialCode: string
  materialName: string
  materialNameAr: string
  uomId: number
  uomSymbol: string
  expectedQuantity: number
  adjustedExpectedQuantity: number | null
  adjustedExpectedQuantityProvisional: boolean
  countedQuantity: number | null
  variance: number | null
  varianceValue: number | null
  varianceValueIsEstimate: boolean
  unitCostAtFreeze: number
  actionTaken: string
  adjustmentTransactionId: number | null
  countedAt: string | null
  notes: string | null
}

export type PhysicalCountResponse = {
  id: number
  warehouseId: number
  warehouseName: string
  code: string
  scheduledDate: string
  status: PhysicalCountStatus
  notes: string | null
  hasLargeVariance: boolean
  largeVarianceValue: number | null
  frozenAt: string | null
  reconciledAt: string | null
  lines: PhysicalCountLineResponse[]
  createdAt: string
  updatedAt: string
}

export type PhysicalCountRequest = {
  warehouseId: number
  scheduledDate: string
  notes?: string
  materialIds: number[]
}

/** @deprecated Use PhysicalCountRequest */
export type CreatePhysicalCountRequest = PhysicalCountRequest

export type PhysicalCountListParams = {
  warehouseId?: number | string
}

export type PhysicalCountCancelRequest = {
  reason?: string
}

export type PhysicalCountMaterialsRequest = {
  materialIds: number[]
}

export type UpdateCountedQuantitiesRequest = {
  lines: Array<{
    lineId: number
    countedQuantity: number
    notes?: string
  }>
}

export type PostFreezeMaterialMovementResponse = {
  materialId: number
  materialCode: string
  materialName: string
  materialNameAr?: string | null
  uomId: number
  uomSymbol: string
  movementCount: number
  quantityIn: string
  quantityOut: string
  netQuantity: string
}

export type PostFreezeMovementDirection = 'IN' | 'OUT'

export type PostFreezeMovementRowResponse = {
  materialId: number
  materialName: string
  materialNameAr?: string | null
  quantity: number
  uomId: number
  uomSymbol: string
  direction: PostFreezeMovementDirection
  movementDate: string
  createdAt: string
  referenceType: string | null
  referenceId: number | null
  referenceCode: string | null
}

export type PostFreezeMovementsResponse = {
  countId: number
  warehouseId: number
  frozenAt: string
  totalMovementCount: number
  affectedMaterialCount: number
  materials: PostFreezeMaterialMovementResponse[]
  included: PostFreezeMovementRowResponse[]
  afterCount: PostFreezeMovementRowResponse[]
}
