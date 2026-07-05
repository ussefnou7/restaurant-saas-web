import type {
  PurchaseReturnLineRequest,
  PurchaseReturnListParams,
  PurchaseReturnRequest,
  PurchaseReturnResponse,
  PurchaseReturnUpdateLineRequest,
  ReturnableLineResponse,
} from '../types/purchaseReturn'
import { api } from './api'

function toSearchParams(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function getPurchaseReturns(
  params: PurchaseReturnListParams = {},
): Promise<PurchaseReturnResponse[]> {
  const response = await api.get<PurchaseReturnResponse[]>(
    `/api/inventory/purchase-returns${toSearchParams({
      search: params.search,
      supplierId: params.supplierId,
      status: params.status,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    })}`,
  )
  return response.data
}

export async function getPurchaseReturn(id: number | string): Promise<PurchaseReturnResponse> {
  const response = await api.get<PurchaseReturnResponse>(`/api/inventory/purchase-returns/${id}`)
  return response.data
}

export async function createPurchaseReturn(
  payload: PurchaseReturnRequest,
): Promise<PurchaseReturnResponse> {
  const response = await api.post<PurchaseReturnResponse>(
    '/api/inventory/purchase-returns',
    payload,
  )
  return response.data
}

export async function updatePurchaseReturnHeader(
  id: number | string,
  payload: PurchaseReturnRequest,
): Promise<PurchaseReturnResponse> {
  const response = await api.put<PurchaseReturnResponse>(
    `/api/inventory/purchase-returns/${id}`,
    payload,
  )
  return response.data
}

export async function getReturnableLines(id: number | string): Promise<ReturnableLineResponse[]> {
  const response = await api.get<ReturnableLineResponse[]>(
    `/api/inventory/purchase-returns/${id}/returnable-lines`,
  )
  return response.data
}

export async function addPurchaseReturnLine(
  id: number | string,
  payload: PurchaseReturnLineRequest,
): Promise<PurchaseReturnResponse> {
  const response = await api.post<PurchaseReturnResponse>(
    `/api/inventory/purchase-returns/${id}/lines`,
    payload,
  )
  return response.data
}

export async function updatePurchaseReturnLine(
  id: number | string,
  lineId: number | string,
  payload: PurchaseReturnUpdateLineRequest,
): Promise<PurchaseReturnResponse> {
  const response = await api.put<PurchaseReturnResponse>(
    `/api/inventory/purchase-returns/${id}/lines/${lineId}`,
    payload,
  )
  return response.data
}

export async function deletePurchaseReturnLine(
  id: number | string,
  lineId: number | string,
): Promise<PurchaseReturnResponse> {
  const response = await api.delete<PurchaseReturnResponse>(
    `/api/inventory/purchase-returns/${id}/lines/${lineId}`,
  )
  return response.data
}

export async function completePurchaseReturn(id: number | string): Promise<PurchaseReturnResponse> {
  const response = await api.post<PurchaseReturnResponse>(
    `/api/inventory/purchase-returns/${id}/complete`,
  )
  return response.data
}

export async function postPurchaseReturn(id: number | string): Promise<PurchaseReturnResponse> {
  const response = await api.post<PurchaseReturnResponse>(
    `/api/inventory/purchase-returns/${id}/post`,
  )
  return response.data
}

export async function cancelPurchaseReturn(
  id: number | string,
  reason: string,
): Promise<PurchaseReturnResponse> {
  const response = await api.post<PurchaseReturnResponse>(
    `/api/inventory/purchase-returns/${id}/cancel`,
    { reason },
  )
  return response.data
}

export async function unpostPurchaseReturn(
  id: number | string,
  reason?: string,
): Promise<PurchaseReturnResponse> {
  const trimmed = reason?.trim()
  const response = await api.post<PurchaseReturnResponse>(
    `/api/inventory/purchase-returns/${id}/unpost`,
    trimmed ? { reason: trimmed } : {},
  )
  return response.data
}

export async function uncompletePurchaseReturn(
  id: number | string,
  reason?: string,
): Promise<PurchaseReturnResponse> {
  const trimmed = reason?.trim()
  const response = await api.post<PurchaseReturnResponse>(
    `/api/inventory/purchase-returns/${id}/uncomplete`,
    trimmed ? { reason: trimmed } : {},
  )
  return response.data
}
