export type ReportColumnType = 'text' | 'number' | 'currency' | 'date'

export type ColumnMeta = {
  key: string
  label: string
  type: ReportColumnType
}

export type ReportFilterId = 'branch' | 'warehouse' | 'category' | 'dateRange'

export type FilterConfig = {
  id: ReportFilterId
  required?: boolean
}

export type ReportConfig = {
  id: string
  titleKey: string
  endpoint: string
  permission: string
  filters: FilterConfig[]
  columns: ColumnMeta[]
  paginated: boolean
}

export type ReportFilters = {
  branchId: string
  warehouseId: string
  categoryId: string
  dateFrom: string
  dateTo: string
}

export type ReportRow = Record<string, string | number | null | undefined>

export type StockValuationRow = {
  warehouseId: number
  warehouseName: string
  warehouseNameAr: string | null
  materialId: number
  materialName: string
  materialNameAr: string | null
  categoryId: number
  categoryName: string
  categoryNameAr: string | null
  quantity: string
  averageCost: string
  totalValue: string
}
