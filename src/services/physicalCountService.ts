import type {
  PhysicalCountCancelRequest,
  PhysicalCountListParams,
  PhysicalCountMaterialsRequest,
  PhysicalCountRequest,
  PhysicalCountResponse,
  PhysicalCountSummaryResponse,
  ReconcileCountRequest,
  UpdateCountedQuantitiesRequest,
} from '../types/inventoryOperations'
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

export async function getPhysicalCounts(
  params: PhysicalCountListParams = {},
): Promise<PhysicalCountSummaryResponse[]> {
  const response = await api.get<PhysicalCountSummaryResponse[]>(
    `/api/inventory/physical-counts${toSearchParams({
      warehouseId: params.warehouseId,
    })}`,
  )
  return response.data
}

export async function getPhysicalCount(id: number | string): Promise<PhysicalCountResponse> {
  const response = await api.get<PhysicalCountResponse>(`/api/inventory/physical-counts/${id}`)
  return response.data
}

export async function createPhysicalCount(
  payload: PhysicalCountRequest,
): Promise<PhysicalCountResponse> {
  const response = await api.post<PhysicalCountResponse>(
    '/api/inventory/physical-counts',
    payload,
    { headers: getMutationHeaders() },
  )
  return response.data
}

export async function addPhysicalCountMaterials(
  id: number | string,
  payload: PhysicalCountMaterialsRequest,
): Promise<PhysicalCountResponse> {
  const response = await api.post<PhysicalCountResponse>(
    `/api/inventory/physical-counts/${id}/add-materials`,
    payload,
    { headers: getMutationHeaders() },
  )
  return response.data
}

export async function removePhysicalCountMaterials(
  id: number | string,
  payload: PhysicalCountMaterialsRequest,
): Promise<PhysicalCountResponse> {
  const response = await api.post<PhysicalCountResponse>(
    `/api/inventory/physical-counts/${id}/remove-materials`,
    payload,
    { headers: getMutationHeaders() },
  )
  return response.data
}

export async function startPhysicalCount(id: number | string): Promise<PhysicalCountResponse> {
  const response = await api.post<PhysicalCountResponse>(
    `/api/inventory/physical-counts/${id}/start`,
    undefined,
    { headers: getMutationHeaders() },
  )
  return response.data
}

export async function cancelPhysicalCount(
  id: number | string,
  payload: PhysicalCountCancelRequest = {},
): Promise<PhysicalCountResponse> {
  const response = await api.post<PhysicalCountResponse>(
    `/api/inventory/physical-counts/${id}/cancel`,
    payload,
    { headers: getMutationHeaders() },
  )
  return response.data
}

export async function updateCountedQuantities(
  id: number | string,
  payload: UpdateCountedQuantitiesRequest,
): Promise<PhysicalCountResponse> {
  const response = await api.put<PhysicalCountResponse>(
    `/api/inventory/physical-counts/${id}/counted-quantities`,
    payload,
    { headers: getMutationHeaders() },
  )
  return response.data
}

export async function reconcilePhysicalCount(
  id: number | string,
  payload: ReconcileCountRequest,
): Promise<PhysicalCountResponse> {
  const response = await api.post<PhysicalCountResponse>(
    `/api/inventory/physical-counts/${id}/reconcile`,
    payload,
    { headers: getMutationHeaders() },
  )
  return response.data
}

export async function revertPhysicalCountToDraft(
  id: number | string,
): Promise<PhysicalCountResponse> {
  const response = await api.post<PhysicalCountResponse>(
    `/api/inventory/physical-counts/${id}/revert-to-draft`,
    undefined,
    { headers: getMutationHeaders() },
  )
  return response.data
}

export async function deletePhysicalCount(id: number | string): Promise<void> {
  await api.delete(`/api/inventory/physical-counts/${id}`, {
    headers: getMutationHeaders(),
  })
}
