import type {
  WasteDocumentCancelRequest,
  WasteDocumentListParams,
  WasteDocumentRequest,
  WasteDocumentResponse,
  WasteLineRequest,
  WasteUpdateLineRequest,
} from '../types/wasteDocument'
import { authService } from './authService'
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

function getMutationHeaders(): Record<string, string> {
  const authUser = authService.getAuthUser()
  if (authUser?.id == null) return {}
  return { 'X-User-Id': String(authUser.id) }
}

export async function getWasteDocuments(
  params: WasteDocumentListParams = {},
): Promise<WasteDocumentResponse[]> {
  const response = await api.get<WasteDocumentResponse[]>(
    `/api/inventory/waste-documents${toSearchParams({
      warehouseId: params.warehouseId,
    })}`,
  )
  return response.data
}

export async function getWasteDocument(id: number | string): Promise<WasteDocumentResponse> {
  const response = await api.get<WasteDocumentResponse>(`/api/inventory/waste-documents/${id}`)
  return response.data
}

export async function createWasteDocument(
  payload: WasteDocumentRequest,
): Promise<WasteDocumentResponse> {
  const response = await api.post<WasteDocumentResponse>(
    '/api/inventory/waste-documents',
    payload,
    { headers: getMutationHeaders() },
  )
  return response.data
}

export async function updateWasteDocument(
  id: number | string,
  payload: WasteDocumentRequest,
): Promise<WasteDocumentResponse> {
  const response = await api.put<WasteDocumentResponse>(
    `/api/inventory/waste-documents/${id}`,
    payload,
    { headers: getMutationHeaders() },
  )
  return response.data
}

export async function addWasteLine(
  id: number | string,
  payload: WasteLineRequest,
): Promise<WasteDocumentResponse> {
  const response = await api.post<WasteDocumentResponse>(
    `/api/inventory/waste-documents/${id}/lines`,
    payload,
    { headers: getMutationHeaders() },
  )
  return response.data
}

export async function updateWasteLine(
  id: number | string,
  lineId: number | string,
  payload: WasteUpdateLineRequest,
): Promise<WasteDocumentResponse> {
  const response = await api.put<WasteDocumentResponse>(
    `/api/inventory/waste-documents/${id}/lines/${lineId}`,
    payload,
    { headers: getMutationHeaders() },
  )
  return response.data
}

export async function deleteWasteLine(
  id: number | string,
  lineId: number | string,
): Promise<WasteDocumentResponse> {
  const response = await api.delete<WasteDocumentResponse>(
    `/api/inventory/waste-documents/${id}/lines/${lineId}`,
    { headers: getMutationHeaders() },
  )
  return response.data
}

export async function completeWasteDocument(
  id: number | string,
  payload: WasteDocumentCancelRequest = {},
): Promise<WasteDocumentResponse> {
  const response = await api.post<WasteDocumentResponse>(
    `/api/inventory/waste-documents/${id}/complete`,
    payload,
    { headers: getMutationHeaders() },
  )
  return response.data
}

export async function postWasteDocument(
  id: number | string,
  payload: WasteDocumentCancelRequest = {},
): Promise<WasteDocumentResponse> {
  const response = await api.post<WasteDocumentResponse>(
    `/api/inventory/waste-documents/${id}/post`,
    payload,
    { headers: getMutationHeaders() },
  )
  return response.data
}

export async function cancelWasteDocument(
  id: number | string,
  payload: WasteDocumentCancelRequest = {},
): Promise<WasteDocumentResponse> {
  const response = await api.post<WasteDocumentResponse>(
    `/api/inventory/waste-documents/${id}/cancel`,
    payload,
    { headers: getMutationHeaders() },
  )
  return response.data
}

export async function uncompleteWasteDocument(
  id: number | string,
  reason?: string,
): Promise<WasteDocumentResponse> {
  const trimmed = reason?.trim()
  const response = await api.post<WasteDocumentResponse>(
    `/api/inventory/waste-documents/${id}/uncomplete`,
    trimmed ? { reason: trimmed } : {},
    { headers: getMutationHeaders() },
  )
  return response.data
}
