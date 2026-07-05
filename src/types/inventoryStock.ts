export type ManualTransactionType = 'OPENING_BALANCE' | 'MANUAL_IN' | 'MANUAL_OUT'

export type InventoryTransactionType =
  | ManualTransactionType
  | 'PURCHASE_IN'
  | 'WASTE'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ORDER_CONSUMPTION'
  | 'RETURN_TO_SUPPLIER'
  | 'STOCKTAKE_ADJUSTMENT'

export type InventoryTransactionDirection = 'IN' | 'OUT'

export type StockBalanceResponse = {
  id: number
  tenantId: number
  warehouseId: number
  warehouseCode: string
  warehouseName: string
  warehouseNameAr?: string | null
  materialId: number
  materialCode: string
  materialName: string
  materialNameAr?: string | null
  categoryId: number
  categoryCode?: string | null
  categoryName?: string | null
  categoryNameAr?: string | null
  /** Stock (calculation) UOM */
  uomId: number
  uomCode: string
  uomName: string
  uomNameAr?: string | null
  uomSymbol?: string | null
  quantity: number
  displayUomId?: number | null
  displayUomCode?: string | null
  displayUomName?: string | null
  displayUomSymbol?: string | null
  displayQuantity?: number | null
  averageCost: number
  stockValue: number
  minimumStockLevel?: number | null
  lowStock: boolean
  openingBalance?: number
  maximumQuantity?: number | null
  minimumQuantity?: number | null
  updatedAt?: string | null
}

export type StockBatchStatus = 'OPEN' | 'CLOSED'

export type StockBatchSourceType = 'PURCHASE' | 'OTHER'

export type StockBatchResponse = {
  id: number
  originalQuantity: number
  remainingQuantity: number
  unitCost: number
  movementDate: string
  status: StockBatchStatus
  uomSymbol: string | null
  sourceInvoiceId: number | null
  sourceType: StockBatchSourceType
}

export type StockBalanceListParams = {
  search?: string
  warehouseId?: number | string
  materialId?: number | string
  categoryId?: number | string
  lowStock?: boolean
}

export type WarehouseStockListParams = {
  search?: string
  categoryId?: number
  belowMinimum?: boolean
}

/** Stock row returned by GET /api/inventory/warehouses/{id}/stocks */
export type WarehouseStockResponse = {
  id: number
  materialId: number
  materialCode: string
  materialName: string
  materialNameAr?: string | null
  warehouseId: number
  uomName: string
  uomNameAr?: string | null
  uomSymbol?: string | null
  openingBalance?: number
  quantity: number
  averageCost?: number
  lastPurchasePrice?: number | null
  lastPurchaseDate?: string | null
  minimumQuantity?: number | null
  minimumStockLevel?: number | null
  maximumQuantity?: number | null
  belowMinimum?: boolean
  lowStock?: boolean
}

export type AddMaterialToWarehouseRequest = {
  materialId: number
  openingBalance?: number
  averageCost?: number
  minimumQuantity?: number
  maximumQuantity?: number | null
}

export type UpdateStockSettingsRequest = {
  minimumQuantity?: number
  maximumQuantity?: number | null
}

export type InventoryTransactionResponse = {
  id: number
  tenantId: number
  transactionType: InventoryTransactionType
  direction: InventoryTransactionDirection
  warehouseId: number
  warehouseCode: string
  warehouseName: string
  warehouseNameAr?: string | null
  materialId: number
  materialCode: string
  materialName: string
  materialNameAr?: string | null
  categoryId?: number | null
  categoryCode?: string | null
  categoryName?: string | null
  categoryNameAr?: string | null
  enteredQuantity: number
  enteredUomId: number
  enteredUomCode: string
  enteredUomName: string
  enteredUomNameAr?: string | null
  enteredUomSymbol?: string | null
  stockQuantity: number
  stockUomId: number
  stockUomCode: string
  stockUomName: string
  stockUomNameAr?: string | null
  stockUomSymbol?: string | null
  unitCost?: number | null
  totalCost?: number | null
  referenceType?: string | null
  referenceId?: number | null
  transactionDate: string
  notes?: string | null
  createdBy?: number | null
  createdAt?: string | null
}

export type InventoryTransactionListParams = {
  search?: string
  warehouseId?: number | string
  materialId?: number | string
  categoryId?: number | string
  transactionType?: string
  direction?: string
  dateFrom?: string
  dateTo?: string
}

export type CreateManualTransactionRequest = {
  warehouseId: number
  materialId: number
  transactionType: ManualTransactionType
  quantity: number
  uomId: number
  unitCost?: number | null
  transactionDate?: string | null
  notes?: string | null
}

export type ManualTransactionPrefill = {
  warehouseId?: number
  materialId?: number
  /** Display UOM for entry */
  uomId?: number
}
