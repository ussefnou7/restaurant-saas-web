export type DocumentStatus = 'DRAFT' | 'COMPLETE' | 'POSTED' | 'CANCELLED'

export type WasteReasonCode =
  | 'SPOILED'
  | 'EXPIRED'
  | 'DAMAGED'
  | 'PREPARATION_LOSS'
  | 'OTHER'

export interface WasteDocumentRequest {
  warehouseId: number
  wasteDate: string
  reasonCode: WasteReasonCode
  notes?: string
}

export interface WasteLineRequest {
  materialId: number
  quantity: number
  uomId?: number
  notes?: string
}

export interface WasteUpdateLineRequest {
  quantity: number
  uomId?: number
  notes?: string
}

export interface WasteLineResponse {
  id: number
  materialId: number
  materialCode: string
  materialName: string
  materialNameAr: string
  uomId: number
  uomSymbol: string
  quantity: number
  notes: string | null
}

export interface MaterialShortfallResponse {
  materialId: number
  materialName: string
  requiredQty: number
  availableQty: number
  shortfallQty: number
  uomSymbol: string
  notStockedInWarehouse: boolean
}

export interface WasteDocumentResponse {
  id: number
  warehouseId: number
  warehouseName: string
  code: string
  wasteDate: string
  reasonCode: WasteReasonCode
  status: DocumentStatus
  notes: string | null
  completedAt: string | null
  postedAt: string | null
  cancelledAt: string | null
  lines: WasteLineResponse[]
  /** Populated after COMPLETE; empty array in DRAFT */
  stockWarnings?: MaterialShortfallResponse[]
  createdAt: string
  updatedAt: string
}

export interface WasteDocumentListParams {
  warehouseId?: number | string
}

export interface WasteDocumentCancelRequest {
  reason?: string
}

export const WASTE_REASON_CODES: WasteReasonCode[] = [
  'SPOILED',
  'EXPIRED',
  'DAMAGED',
  'PREPARATION_LOSS',
  'OTHER',
]
