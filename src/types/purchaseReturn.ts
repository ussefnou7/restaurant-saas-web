import type { PurchaseInvoiceStatus } from './purchaseInvoice'

export type PurchaseReturnReason =
  | 'DAMAGED'
  | 'WRONG_QUANTITY'
  | 'WRONG_SPEC'
  | 'EXPIRED'
  | 'OTHER'

export type PurchaseReturnStatus = PurchaseInvoiceStatus

export type PurchaseReturnLineResponse = {
  id: number
  originalLineId: number
  materialId: number
  materialCode?: string | null
  materialName?: string | null
  materialNameAr?: string | null
  quantity: number
  uomId: number
  uomCode?: string | null
  uomSymbol?: string | null
  unitCost: number
  lineTotal: number
  notes?: string | null
}

export type PurchaseReturnResponse = {
  id: number
  returnNumber?: string | null
  originalInvoiceId: number
  originalInvoiceNumber?: string | null
  supplierId?: number | null
  supplierCode?: string | null
  supplierName?: string | null
  supplierNameAr?: string | null
  warehouseId?: number | null
  warehouseName?: string | null
  returnDate: string
  reason: PurchaseReturnReason
  status: PurchaseReturnStatus
  subtotal?: number
  totalAmount: number
  postedToInventory?: boolean | null
  notes?: string | null
  postedAt?: string | null
  lines: PurchaseReturnLineResponse[]
}

export type ReturnableLineResponse = {
  originalLineId: number
  materialId: number
  materialCode?: string | null
  materialName?: string | null
  uomId: number
  uomSymbol?: string | null
  unitCost: number
  originalQuantity: number
  returnedQuantity: number
  returnableQuantity: number
}

/** Header-only create/update payload. Lines are managed via /{id}/lines. */
export type PurchaseReturnRequest = {
  originalInvoiceId: number
  returnDate: string
  reason: PurchaseReturnReason
  notes?: string | null
}

export type PurchaseReturnLineRequest = {
  originalLineId: number
  quantity: number
  uomId: number
  notes?: string | null
}

export type PurchaseReturnUpdateLineRequest = {
  quantity: number
  uomId: number
  notes?: string | null
}

export type PurchaseReturnListParams = {
  search?: string
  supplierId?: number | string
  status?: PurchaseReturnStatus | ''
  dateFrom?: string
  dateTo?: string
}
