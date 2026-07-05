export type PurchaseInvoiceStatus = 'DRAFT' | 'COMPLETE' | 'POSTED' | 'CANCELLED'

export type PurchasePaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID'

export type PurchaseInvoiceLineResponse = {
  id: number
  materialId: number
  materialCode?: string | null
  materialName?: string | null
  materialNameAr?: string | null
  categoryId?: number | null
  categoryCode?: string | null
  categoryName?: string | null
  categoryNameAr?: string | null
  quantity: number
  returnedQuantity?: number | null
  uomId: number
  uomCode?: string | null
  uomName?: string | null
  uomNameAr?: string | null
  uomSymbol?: string | null
  unitCost: number
  lineTotal: number
  notes?: string | null
}

export type PurchaseInvoiceResponse = {
  id: number
  tenantId?: number
  supplierId?: number | null
  supplierCode?: string | null
  supplierName?: string | null
  supplierNameAr?: string | null
  warehouseId: number
  warehouseCode?: string | null
  warehouseName?: string | null
  warehouseNameAr?: string | null
  invoiceNumber?: string | null
  invoiceDate: string
  receiptDate?: string | null
  status: PurchaseInvoiceStatus
  subtotal: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  paidAmount: number
  paymentStatus: PurchasePaymentStatus
  notes?: string | null
  createdBy?: number | null
  createdAt?: string | null
  updatedAt?: string | null
  completedAt?: string | null
  completedBy?: number | null
  postedAt?: string | null
  postedBy?: number | null
  lines: PurchaseInvoiceLineResponse[]
}

export type PurchaseInvoiceLineRequest = {
  materialId: number
  quantity: number
  uomId: number
  unitCost: number
  notes?: string | null
}

export type CreatePurchaseInvoiceHeaderRequest = {
  supplierId?: number | null
  warehouseId: number
  invoiceDate: string
  receiptDate?: string | null
  discountAmount?: number
  taxAmount?: number
  notes?: string | null
}

export type UpdatePurchaseInvoiceHeaderRequest = CreatePurchaseInvoiceHeaderRequest

export type UpdatePurchaseInvoiceLineRequest = {
  quantity: number
  uomId: number
  unitCost: number
  notes?: string | null
}

export type CreatePurchaseInvoiceRequest = CreatePurchaseInvoiceHeaderRequest & {
  invoiceNumber?: string | null
  lines: PurchaseInvoiceLineRequest[]
}

export type UpdatePurchaseInvoiceRequest = CreatePurchaseInvoiceRequest

export type PurchaseInvoiceListParams = {
  search?: string
  supplierId?: number | string
  warehouseId?: number | string
  status?: PurchaseInvoiceStatus | ''
  paymentStatus?: PurchasePaymentStatus | ''
  dateFrom?: string
  dateTo?: string
}
