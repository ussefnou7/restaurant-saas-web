export type ReportColumnType = 'text' | 'number' | 'currency'

export type ColumnMeta<T> = {
  key: keyof T
  labelKey: string
  type: ReportColumnType
}

export type ReportFilterId = 'branch' | 'warehouse' | 'category'

export type FilterConfig = ReportFilterId

export type ReportConfig<T> = {
  id: string
  titleKey: string
  endpoint: string
  filters: FilterConfig[]
  columns: ColumnMeta<T>[]
}

export type ReportFilters = {
  branchId: string
  warehouseId: string
  categoryId: string
}

export type ReportCellValue = string | number | null | undefined

export type ReportRow = object

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

export type LowStockRow = {
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
  minQuantity: string
  shortfall: string
}
