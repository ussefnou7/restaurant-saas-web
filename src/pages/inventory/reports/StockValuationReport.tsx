import { GenericReportPage } from '../../../components/reports/GenericReportPage'
import { REPORT_ENDPOINTS } from '../../../api/reports'
import type { ReportConfig, StockValuationRow } from '../../../types/reports'

const stockValuationReportConfig: ReportConfig<StockValuationRow> = {
  id: 'stock_valuation',
  titleKey: 'reports.stockValuation',
  endpoint: REPORT_ENDPOINTS.stockValuation,
  filters: ['branch', 'warehouse', 'category'],
  columns: [
    { key: 'warehouseId', labelKey: 'reports.columns.warehouseId', type: 'number' },
    { key: 'warehouseName', labelKey: 'reports.columns.warehouseName', type: 'text' },
    { key: 'warehouseNameAr', labelKey: 'reports.columns.warehouseNameAr', type: 'text' },
    { key: 'materialId', labelKey: 'reports.columns.materialId', type: 'number' },
    { key: 'materialName', labelKey: 'reports.columns.materialName', type: 'text' },
    { key: 'materialNameAr', labelKey: 'reports.columns.materialNameAr', type: 'text' },
    { key: 'categoryId', labelKey: 'reports.columns.categoryId', type: 'number' },
    { key: 'categoryName', labelKey: 'reports.columns.categoryName', type: 'text' },
    { key: 'categoryNameAr', labelKey: 'reports.columns.categoryNameAr', type: 'text' },
    { key: 'quantity', labelKey: 'reports.columns.quantity', type: 'number' },
    { key: 'averageCost', labelKey: 'reports.columns.averageCost', type: 'currency' },
    { key: 'totalValue', labelKey: 'reports.columns.totalValue', type: 'currency' },
  ],
}

export function StockValuationReport() {
  return <GenericReportPage config={stockValuationReportConfig} />
}
