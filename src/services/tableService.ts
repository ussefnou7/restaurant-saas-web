import { TABLE_ENDPOINTS } from '../api/tables'
import type { RestaurantTable, TableLayoutRequest, TableRequest } from '../types/table'
import { api } from './api'

export async function getTables(params?: {
  branchId?: number | string
  sectionId?: number | string
}): Promise<RestaurantTable[]> {
  const response = await api.get<RestaurantTable[]>(TABLE_ENDPOINTS.base, { params })
  return response.data
}

export async function getTable(id: number | string): Promise<RestaurantTable> {
  const response = await api.get<RestaurantTable>(TABLE_ENDPOINTS.byId(id))
  return response.data
}

export async function createTable(payload: TableRequest): Promise<RestaurantTable> {
  const response = await api.post<RestaurantTable>(TABLE_ENDPOINTS.base, payload)
  return response.data
}

export async function updateTable(
  id: number | string,
  payload: TableRequest,
): Promise<RestaurantTable> {
  const response = await api.put<RestaurantTable>(TABLE_ENDPOINTS.byId(id), payload)
  return response.data
}

export async function activateTable(id: number | string): Promise<RestaurantTable> {
  const response = await api.patch<RestaurantTable>(TABLE_ENDPOINTS.activate(id))
  return response.data
}

export async function deactivateTable(id: number | string): Promise<RestaurantTable> {
  const response = await api.patch<RestaurantTable>(TABLE_ENDPOINTS.deactivate(id))
  return response.data
}

export async function updateTableLayout(
  id: number | string,
  payload: TableLayoutRequest,
): Promise<RestaurantTable> {
  const response = await api.patch<RestaurantTable>(TABLE_ENDPOINTS.layout(id), payload)
  return response.data
}
