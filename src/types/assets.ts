export type AssetCategory = 'FURNITURE' | 'KITCHEN_EQUIPMENT' | 'FINISHING' | 'ELECTRONICS' | 'OTHER'
export type AssetStatus = 'ACTIVE' | 'PARTIALLY_DISPOSED' | 'FULLY_DISPOSED'
export type AssetDisposalReason = 'DAMAGED' | 'LOST' | 'OBSOLETE' | 'SOLD'

export interface AssetResponse {
  id: number
  branchId: number
  name: string
  nameAr?: string
  category: AssetCategory
  status: AssetStatus
  lineCount: number
  totalCurrentValue: string | number
}

export interface AssetLineResponse {
  id: number
  assetId: number
  label?: string
  quantity: string
  remainingQuantity: string
  unitCost: string
  totalCost: string
  purchaseDate: string
  status: AssetStatus
}

export interface AssetDisposalResponse {
  id: number
  assetId: number
  assetLineId: number
  quantityDisposed: string
  reason: AssetDisposalReason
  disposalDate: string
  notes?: string
  createdBy?: number
  createdAt: string
}

export interface AssetMaintenanceResponse {
  id: number
  assetId: number
  assetLineId: number
  cost: string
  maintenanceDate: string
  description?: string
  vendor?: string
  createdBy?: number
  createdAt: string
}

export interface CreateAssetRequest {
  branchId: number
  name: string
  nameAr?: string
  category: AssetCategory
}

export interface UpdateAssetRequest {
  name: string
  nameAr?: string
  category: AssetCategory
}

export interface CreateAssetLineRequest {
  label?: string
  quantity: string
  unitCost: string
  purchaseDate: string
}

export interface CreateAssetDisposalRequest {
  assetId: number
  assetLineId: number
  quantityDisposed: string
  reason: AssetDisposalReason
  disposalDate: string
  notes?: string
}

export interface CreateAssetMaintenanceRequest {
  assetId: number
  assetLineId: number
  cost: string
  maintenanceDate: string
  description?: string
  vendor?: string
}

export interface AssetSummaryReportResponse {
  totalOriginalInvestment: string | number
  totalCurrentValue: string | number
}

export interface AssetDisposalReportRow {
  assetName: string
  assetLineLabel?: string
  quantityDisposed: string
  reason: AssetDisposalReason
  disposalDate: string
  value: string
}
