import type { TranslationDictionary } from '../../types'

export const reportsEn: TranslationDictionary = {
  'reports.hub.title': 'Reports',
  'reports.hub.subtitle': 'Inventory reports for stock value and replenishment attention',

  'reports.loading': 'Loading report...',
  'reports.actions.refresh': 'Refresh',
  'reports.actions.exportCsv': 'CSV',
  'reports.actions.exportPdf': 'PDF',

  'reports.filters.title': 'Filters',
  'reports.filters.branch': 'Branch',
  'reports.filters.warehouse': 'Storage Location',
  'reports.filters.category': 'Material Group',
  'reports.filters.allBranches': 'All branches',
  'reports.filters.allWarehouses': 'All storage locations',
  'reports.filters.allCategories': 'All material groups',
  'reports.filters.selectBranchFirst': 'Select branch first',

  'reports.empty.title': 'No report rows',
  'reports.empty.subtitle': 'Adjust the filters and refresh the report.',

  'reports.stockValuation': 'Stock Valuation',
  'reports.stockValuation.subtitle': 'Inventory value by material and storage location.',
  'reports.lowStock': 'Low Stock',
  'reports.lowStock.subtitle': 'Materials below minimum quantity by storage location.',

  'reports.columns.warehouseId': 'Warehouse ID',
  'reports.columns.warehouseName': 'Warehouse',
  'reports.columns.warehouseNameAr': 'Warehouse Arabic Name',
  'reports.columns.materialId': 'Material ID',
  'reports.columns.materialName': 'Material',
  'reports.columns.materialNameAr': 'Material Arabic Name',
  'reports.columns.categoryId': 'Category ID',
  'reports.columns.categoryName': 'Category',
  'reports.columns.categoryNameAr': 'Category Arabic Name',
  'reports.columns.quantity': 'Quantity',
  'reports.columns.averageCost': 'Average Cost',
  'reports.columns.totalValue': 'Total Value',
  'reports.columns.minQuantity': 'Minimum Quantity',
  'reports.columns.shortfall': 'Shortfall',
}
