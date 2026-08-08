import type {
  SalesByHourRow,
  SalesByPaymentMethodRow,
  SalesByProductRow,
  SalesFilterParams,
  SalesOverTimeRow,
} from '../types/reports'
import { api } from './api'

function toSalesParams(filters: SalesFilterParams): Record<string, string | undefined> {
  return {
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    branchId: filters.branchId || undefined,
    cashierUserId: filters.cashierUserId || undefined,
    orderType: filters.orderType || undefined,
  }
}

export async function getSalesOverTime(filters: SalesFilterParams): Promise<SalesOverTimeRow[]> {
  const response = await api.get<SalesOverTimeRow[]>('/api/orders/reports/sales-over-time', {
    params: toSalesParams(filters),
  })
  return response.data
}

export async function getSalesByHour(filters: SalesFilterParams): Promise<SalesByHourRow[]> {
  const response = await api.get<SalesByHourRow[]>('/api/orders/reports/sales-by-hour', {
    params: toSalesParams(filters),
  })
  return response.data
}

export async function getSalesByProduct(filters: SalesFilterParams): Promise<SalesByProductRow[]> {
  const response = await api.get<SalesByProductRow[]>('/api/orders/reports/sales-by-product', {
    params: toSalesParams(filters),
  })
  return response.data
}

export async function getSalesByPaymentMethod(
  filters: SalesFilterParams,
): Promise<SalesByPaymentMethodRow[]> {
  const response = await api.get<SalesByPaymentMethodRow[]>('/api/orders/reports/sales-by-payment-method', {
    params: toSalesParams(filters),
  })
  return response.data
}
