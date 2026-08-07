import type { ReportFilters, ReportRow } from '../types/reports'
import { api } from './api'

function toReportParams(filters: ReportFilters): Record<string, string | boolean | undefined> {
  return {
    branchId: filters.branchId || undefined,
    warehouseId: filters.warehouseId || undefined,
    categoryId: filters.categoryId || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    negativesOnly: filters.negativesOnly ? true : undefined,
    reasonCode: filters.reasonCode || undefined,
  }
}

export async function getReportRows<T extends ReportRow>(
  endpoint: string,
  filters: ReportFilters,
): Promise<T[]> {
  const response = await api.get<T[]>(endpoint, { params: toReportParams(filters) })
  return response.data
}
