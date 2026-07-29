import { GenericReportPage } from '../../components/reports/GenericReportPage'
import { REPORT_ENDPOINTS } from '../../api/reports'
import type { ReportConfig } from '../../types/reports'

const stockValuationReportConfig: ReportConfig = {
  id: 'stock_valuation',
  titleKey: 'reports.stockValuation.title',
  endpoint: REPORT_ENDPOINTS.stockValuation,
  permission: 'INVENTORY_REPORTS_VIEW',
  filters: [
    { id: 'branch' },
    { id: 'warehouse' },
    { id: 'category' },
  ],
  columns: [
    { key: 'warehouseId', label: 'reports.columns.warehouseId', type: 'number' },
    { key: 'warehouseName', label: 'reports.columns.warehouseName', type: 'text' },
    { key: 'warehouseNameAr', label: 'reports.columns.warehouseNameAr', type: 'text' },
    { key: 'materialId', label: 'reports.columns.materialId', type: 'number' },
    { key: 'materialName', label: 'reports.columns.materialName', type: 'text' },
    { key: 'materialNameAr', label: 'reports.columns.materialNameAr', type: 'text' },
    { key: 'categoryId', label: 'reports.columns.categoryId', type: 'number' },
    { key: 'categoryName', label: 'reports.columns.categoryName', type: 'text' },
    { key: 'categoryNameAr', label: 'reports.columns.categoryNameAr', type: 'text' },
    { key: 'quantity', label: 'reports.columns.quantity', type: 'number' },
    { key: 'averageCost', label: 'reports.columns.averageCost', type: 'currency' },
    { key: 'totalValue', label: 'reports.columns.totalValue', type: 'currency' },
  ],
  paginated: false,
}

export function StockValuationReport() {
  return <GenericReportPage config={stockValuationReportConfig} />
}
