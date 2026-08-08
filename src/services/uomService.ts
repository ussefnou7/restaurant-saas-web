import type { CreateTenantUomRequest, UpdateTenantUomRequest, UomResponse } from '../types/inventory'
import { api } from './api'

export async function getTenantUoms(): Promise<UomResponse[]> {
  const response = await api.get<UomResponse[]>('/api/uom')
  return response.data
}

export async function createTenantUom(payload: CreateTenantUomRequest): Promise<UomResponse> {
  const response = await api.post<UomResponse>('/api/uom', payload)
  return response.data
}

export async function updateTenantUom(
  id: number | string,
  payload: UpdateTenantUomRequest,
): Promise<UomResponse> {
  const response = await api.put<UomResponse>(`/api/uom/${id}`, payload)
  return response.data
}

export async function deactivateTenantUom(id: number | string): Promise<UomResponse> {
  const response = await api.patch<UomResponse>(`/api/uom/${id}/deactivate`)
  return response.data
}

export async function deleteTenantUom(id: number | string): Promise<void> {
  // The UOM page shows a tailored "in use" hint on failure; skip the global toast.
  await api.delete(`/api/uom/${id}`, { notifyOnError: false })
}
