import type { TranslationDictionary } from '../../types'

export const reportsEn: TranslationDictionary = {
  'reports.accessDenied': 'You do not have permission to view reports.',
  'reports.loading': 'Loading report...',
  'reports.actions.refresh': 'Refresh',
  'reports.actions.exportCsv': 'CSV',
  'reports.actions.exportPdf': 'PDF',

  'reports.filters.title': 'Filters',
  'reports.filters.branch': 'Branch',
  'reports.filters.warehouse': 'Storage Location',
  'reports.filters.category': 'Material Group',
  'reports.filters.dateFrom': 'From',
  'reports.filters.dateTo': 'To',
  'reports.filters.allBranches': 'All branches',
  'reports.filters.allWarehouses': 'All storage locations',
  'reports.filters.allCategories': 'All material groups',
  'reports.filters.selectBranchFirst': 'Select branch first',

  'reports.empty.title': 'No report rows',
  'reports.empty.subtitle': 'Adjust the filters and refresh the report.',

  'reports.stockValuation.title': 'Stock Valuation',
  'reports.stockValuation.subtitle': 'Inventory value by material and storage location.',

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

  'reports.pagination.summary': '{{from}}-{{to}} of {{total}}',
  'reports.pagination.prev': 'Previous',
  'reports.pagination.next': 'Next',
  'reports.pagination.pageOf': 'Page {{page}} of {{totalPages}}',
}
