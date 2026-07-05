import type {
  CreatePurchaseInvoiceHeaderRequest,
  PurchaseInvoiceLineRequest,
  PurchaseInvoiceListParams,
  PurchaseInvoiceResponse,
  PurchasePaymentStatus,
  UpdatePurchaseInvoiceHeaderRequest,
  UpdatePurchaseInvoiceLineRequest,
  UpdatePurchaseInvoiceRequest,
} from '../types/purchaseInvoice'
import { api } from './api'

function normalizePaymentStatus(status: string): PurchasePaymentStatus {
  if (status === 'PARTIALLY_PAID') return 'PARTIAL'
  return status as PurchasePaymentStatus
}

function normalizePurchaseInvoice(invoice: PurchaseInvoiceResponse): PurchaseInvoiceResponse {
  return {
    ...invoice,
    paymentStatus: normalizePaymentStatus(String(invoice.paymentStatus ?? 'UNPAID')),
  }
}

function toSearchParams(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function getPurchaseInvoices(
  params: PurchaseInvoiceListParams = {},
): Promise<PurchaseInvoiceResponse[]> {
  const response = await api.get<PurchaseInvoiceResponse[]>(
    `/api/inventory/purchase-invoices${toSearchParams({
      search: params.search,
      supplierId: params.supplierId,
      warehouseId: params.warehouseId,
      status: params.status,
      paymentStatus: params.paymentStatus,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    })}`,
  )
  return response.data.map(normalizePurchaseInvoice)
}

export async function getPurchaseInvoice(id: number | string): Promise<PurchaseInvoiceResponse> {
  const response = await api.get<PurchaseInvoiceResponse>(`/api/inventory/purchase-invoices/${id}`)
  return normalizePurchaseInvoice(response.data)
}

export async function createPurchaseInvoice(
  payload: CreatePurchaseInvoiceHeaderRequest,
): Promise<PurchaseInvoiceResponse> {
  const response = await api.post<PurchaseInvoiceResponse>(
    '/api/inventory/purchase-invoices',
    payload,
  )
  return normalizePurchaseInvoice(response.data)
}

export async function updatePurchaseInvoiceHeader(
  id: number | string,
  payload: UpdatePurchaseInvoiceHeaderRequest,
): Promise<PurchaseInvoiceResponse> {
  const response = await api.put<PurchaseInvoiceResponse>(
    `/api/inventory/purchase-invoices/${id}`,
    payload,
  )
  return normalizePurchaseInvoice(response.data)
}

export async function addPurchaseInvoiceLine(
  id: number | string,
  payload: PurchaseInvoiceLineRequest,
): Promise<PurchaseInvoiceResponse> {
  const response = await api.post<PurchaseInvoiceResponse>(
    `/api/inventory/purchase-invoices/${id}/lines`,
    payload,
  )
  return normalizePurchaseInvoice(response.data)
}

export async function updatePurchaseInvoiceLine(
  id: number | string,
  lineId: number | string,
  payload: UpdatePurchaseInvoiceLineRequest,
): Promise<PurchaseInvoiceResponse> {
  const response = await api.put<PurchaseInvoiceResponse>(
    `/api/inventory/purchase-invoices/${id}/lines/${lineId}`,
    payload,
  )
  return normalizePurchaseInvoice(response.data)
}

export async function deletePurchaseInvoiceLine(
  id: number | string,
  lineId: number | string,
): Promise<PurchaseInvoiceResponse> {
  const response = await api.delete<PurchaseInvoiceResponse>(
    `/api/inventory/purchase-invoices/${id}/lines/${lineId}`,
  )
  return normalizePurchaseInvoice(response.data)
}

export async function updatePurchaseInvoice(
  id: number | string,
  payload: UpdatePurchaseInvoiceRequest,
): Promise<PurchaseInvoiceResponse> {
  const response = await api.put<PurchaseInvoiceResponse>(
    `/api/inventory/purchase-invoices/${id}`,
    payload,
  )
  return normalizePurchaseInvoice(response.data)
}

export async function completePurchaseInvoice(id: number | string): Promise<PurchaseInvoiceResponse> {
  const response = await api.post<PurchaseInvoiceResponse>(
    `/api/inventory/purchase-invoices/${id}/complete`,
  )
  return normalizePurchaseInvoice(response.data)
}

export async function postPurchaseInvoice(id: number | string): Promise<PurchaseInvoiceResponse> {
  const response = await api.post<PurchaseInvoiceResponse>(
    `/api/inventory/purchase-invoices/${id}/post`,
  )
  return normalizePurchaseInvoice(response.data)
}

export async function cancelPurchaseInvoice(
  id: number | string,
  reason?: string,
): Promise<PurchaseInvoiceResponse> {
  const trimmed = reason?.trim()
  const response = await api.post<PurchaseInvoiceResponse>(
    `/api/inventory/purchase-invoices/${id}/cancel`,
    trimmed ? { reason: trimmed } : {},
  )
  return normalizePurchaseInvoice(response.data)
}

export async function unpostPurchaseInvoice(
  id: number | string,
  reason?: string,
): Promise<PurchaseInvoiceResponse> {
  const trimmed = reason?.trim()
  const response = await api.post<PurchaseInvoiceResponse>(
    `/api/inventory/purchase-invoices/${id}/unpost`,
    trimmed ? { reason: trimmed } : {},
  )
  return normalizePurchaseInvoice(response.data)
}

export async function uncompletePurchaseInvoice(
  id: number | string,
  reason?: string,
): Promise<PurchaseInvoiceResponse> {
  const trimmed = reason?.trim()
  const response = await api.post<PurchaseInvoiceResponse>(
    `/api/inventory/purchase-invoices/${id}/uncomplete`,
    trimmed ? { reason: trimmed } : {},
  )
  return normalizePurchaseInvoice(response.data)
}

export async function deletePurchaseInvoice(id: number | string): Promise<void> {
  await api.delete(`/api/inventory/purchase-invoices/${id}`)
}
