import type {
  CreateManualTransactionRequest,
  InventoryTransactionListParams,
  InventoryTransactionResponse,
  StockBalanceListParams,
  StockBalanceResponse,
  StockBatchResponse,
} from '../types/inventoryStock'
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

export async function getStockBalances(
  params: StockBalanceListParams = {},
): Promise<StockBalanceResponse[]> {
  const response = await api.get<StockBalanceResponse[]>(
    `/api/inventory/stock-balances${toSearchParams({
      search: params.search,
      warehouseId: params.warehouseId,
      materialId: params.materialId,
      categoryId: params.categoryId,
      lowStock: params.lowStock,
    })}`,
  )
  return response.data
}

export async function getStockBalanceBatches(balanceId: number | string): Promise<StockBatchResponse[]> {
  const response = await api.get<StockBatchResponse[]>(
    `/api/inventory/stock-balances/${balanceId}/batches`,
  )
  return response.data
}

export async function getInventoryTransactions(
  params: InventoryTransactionListParams = {},
): Promise<InventoryTransactionResponse[]> {
  const response = await api.get<InventoryTransactionResponse[]>(
    `/api/inventory/transactions${toSearchParams({
      search: params.search,
      warehouseId: params.warehouseId,
      materialId: params.materialId,
      categoryId: params.categoryId,
      transactionType: params.transactionType,
      direction: params.direction,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    })}`,
  )
  return response.data
}

export async function createManualTransaction(
  payload: CreateManualTransactionRequest,
): Promise<InventoryTransactionResponse> {
  const response = await api.post<InventoryTransactionResponse>(
    '/api/inventory/transactions/manual',
    payload,
  )
  return response.data
}
