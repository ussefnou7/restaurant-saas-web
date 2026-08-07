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
  'reports.shrinkage': 'Shrinkage Analysis',
  'reports.shrinkage.subtitle': 'Materials with unexplainable physical count shortfalls and their financial impact.',
  'reports.wasteAnalysis': 'Waste Analysis',
  'reports.wasteAnalysis.subtitle': 'Track deliberate inventory write-offs by cause and financial impact.',

  'reports.filters.dateFrom': 'From Date',
  'reports.filters.dateTo': 'To Date',
  'reports.filters.negativesOnly': 'Shortages/Waste only',
  'reports.filters.reasonCode': 'Reason',
  'reports.filters.allReasons': 'All reasons',

  'reports.summary.totalNetValue': 'Total Net Value',
  'reports.summary.affectedMaterials': 'Affected Materials',

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
  'reports.columns.netQuantity': 'Net Quantity',
  'reports.columns.netValue': 'Net Value',
  'reports.columns.movementCount': 'Movements',
  'reports.columns.reason': 'Reason',

  'reports.markers.unconvertibleUom': 'UOM conversion unavailable',
  'reports.markers.unconvertibleUomTooltip': 'Material unit setup is incomplete; quantity cannot be expressed in display UOM.',
  'reports.markers.inactive': 'Inactive',

  'reports.empty.missingDateRangeTitle': 'Date range required',
  'reports.empty.missingDateRangeSubtitle': 'Please select a valid date range to load report data.',
  'reports.empty.noDataTitle': 'No discrepancies found',
  'reports.empty.noDataSubtitle': 'No shrinkage or waste recorded for the selected period and filters.',
}

