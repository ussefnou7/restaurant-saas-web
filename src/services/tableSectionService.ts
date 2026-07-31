import { TABLE_SECTION_ENDPOINTS } from '../api/tableSections'
import type { TableSection, TableSectionRequest } from '../types/tableSection'
import { api } from './api'

export async function getTableSections(
  branchId: number | string,
  options?: { includeInactive?: boolean },
): Promise<TableSection[]> {
  const response = await api.get<TableSection[]>(TABLE_SECTION_ENDPOINTS.base, {
    params: {
      branchId,
      includeInactive: options?.includeInactive || undefined,
    },
  })
  return response.data
}

export async function createTableSection(payload: TableSectionRequest): Promise<TableSection> {
  const response = await api.post<TableSection>(TABLE_SECTION_ENDPOINTS.base, payload)
  return response.data
}

export async function updateTableSection(
  id: number | string,
  payload: TableSectionRequest,
): Promise<TableSection> {
  const response = await api.put<TableSection>(TABLE_SECTION_ENDPOINTS.byId(id), payload)
  return response.data
}

export async function activateTableSection(id: number | string): Promise<TableSection> {
  const response = await api.patch<TableSection>(TABLE_SECTION_ENDPOINTS.activate(id))
  return response.data
}

export async function deactivateTableSection(id: number | string): Promise<TableSection> {
  const response = await api.patch<TableSection>(TABLE_SECTION_ENDPOINTS.deactivate(id))
  return response.data
}

export async function deleteTableSection(id: number | string): Promise<void> {
  await api.delete(TABLE_SECTION_ENDPOINTS.byId(id))
}
