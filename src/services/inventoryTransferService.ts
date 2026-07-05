import type {
  CreateInventoryTransferRequest,
  InventoryTransferResponse,
  TransferListParams,
  UpdateInventoryTransferRequest,
} from '../types/inventoryOperations'
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

export async function getTransfers(
  params: TransferListParams = {},
): Promise<InventoryTransferResponse[]> {
  const response = await api.get<InventoryTransferResponse[]>(
    `/api/inventory/transfers${toSearchParams({
      search: params.search,
      sourceWarehouseId: params.sourceWarehouseId,
      destinationWarehouseId: params.destinationWarehouseId,
      status: params.status,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    })}`,
  )
  return response.data
}

export async function getTransfer(id: number | string): Promise<InventoryTransferResponse> {
  const response = await api.get<InventoryTransferResponse>(`/api/inventory/transfers/${id}`)
  return response.data
}

export async function createTransfer(
  payload: CreateInventoryTransferRequest,
): Promise<InventoryTransferResponse> {
  const response = await api.post<InventoryTransferResponse>('/api/inventory/transfers', payload)
  return response.data
}

export async function updateTransfer(
  id: number | string,
  payload: UpdateInventoryTransferRequest,
): Promise<InventoryTransferResponse> {
  const response = await api.put<InventoryTransferResponse>(
    `/api/inventory/transfers/${id}`,
    payload,
  )
  return response.data
}

export async function dispatchTransfer(id: number | string): Promise<InventoryTransferResponse> {
  const response = await api.post<InventoryTransferResponse>(
    `/api/inventory/transfers/${id}/dispatch`,
  )
  return response.data
}

export async function receiveTransfer(id: number | string): Promise<InventoryTransferResponse> {
  const response = await api.post<InventoryTransferResponse>(
    `/api/inventory/transfers/${id}/receive`,
  )
  return response.data
}

export async function cancelTransfer(id: number | string): Promise<InventoryTransferResponse> {
  const response = await api.post<InventoryTransferResponse>(
    `/api/inventory/transfers/${id}/cancel`,
  )
  return response.data
}
