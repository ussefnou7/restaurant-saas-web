import { GenericReportPage } from '../../../components/reports/GenericReportPage'
import { REPORT_ENDPOINTS } from '../../../api/reports'
import type { LowStockRow, ReportConfig } from '../../../types/reports'

const lowStockReportConfig: ReportConfig<LowStockRow> = {
  id: 'low_stock',
  titleKey: 'reports.lowStock',
  endpoint: REPORT_ENDPOINTS.lowStock,
  type: 'flat',
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
    { key: 'minQuantity', labelKey: 'reports.columns.minQuantity', type: 'number' },
    { key: 'shortfall', labelKey: 'reports.columns.shortfall', type: 'number' },
  ],
}

export function LowStockReport() {
  return <GenericReportPage config={lowStockReportConfig} />
}
