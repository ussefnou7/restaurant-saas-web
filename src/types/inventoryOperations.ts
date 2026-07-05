// ─── Transfer Types ─────────────────────────────────────────────────────────

export type TransferStatus = 'DRAFT' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'

export type InventoryTransferLineResponse = {
  id: number
  materialId: number
  materialCode: string
  materialName: string
  materialNameAr?: string | null
  requestedQuantity: number
  dispatchedQuantity?: number | null
  receivedQuantity?: number | null
  uomId: number
  uomCode: string
  uomName: string
  uomNameAr?: string | null
  uomSymbol?: string | null
  unitCostSnapshot: number
  dispatchTransactionId?: number | null
  receiveTransactionId?: number | null
  notes?: string | null
}

export type InventoryTransferResponse = {
  id: number
  tenantId: number
  code: string
  status: TransferStatus
  sourceWarehouseId: number
  sourceWarehouseCode: string
  sourceWarehouseName: string
  sourceWarehouseNameAr?: string | null
  destinationWarehouseId: number
  destinationWarehouseCode: string
  destinationWarehouseName: string
  destinationWarehouseNameAr?: string | null
  requestedDate: string
  dispatchedAt?: string | null
  receivedAt?: string | null
  cancelledAt?: string | null
  dispatchedBy?: number | null
  receivedBy?: number | null
  notes?: string | null
  lines?: InventoryTransferLineResponse[]
  createdAt?: string | null
  updatedAt?: string | null
}

export type CreateTransferLineRequest = {
  materialId: number
  requestedQuantity: number
  uomId: number
  notes?: string | null
}

export type CreateInventoryTransferRequest = {
  sourceWarehouseId: number
  destinationWarehouseId: number
  requestedDate: string
  notes?: string | null
  lines: CreateTransferLineRequest[]
}

export type UpdateInventoryTransferRequest = CreateInventoryTransferRequest

export type TransferListParams = {
  search?: string
  sourceWarehouseId?: number | string
  destinationWarehouseId?: number | string
  status?: TransferStatus | ''
  dateFrom?: string
  dateTo?: string
}

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
  countedQuantity: number | null
  variance: number | null
  varianceValue: number | null
  unitCostAtFreeze: number
  actionTaken: string
  adjustmentTransactionId: number | null
  wasteTransactionId: number | null
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

export type ReconcileLineAction = 'ADJUSTMENT' | 'WASTE'

export type ReconcileCountRequest = {
  lines: Array<{
    lineId: number
    action: ReconcileLineAction
  }>
}
