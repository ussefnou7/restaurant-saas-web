import type { TranslationKey } from '../i18n/types'

export type ReportModule = 'inventory' | 'losses' | 'sales' | 'assets'
export type ReportType = 'current-state' | 'date-ranged'

export interface ReportCatalogEntry {
  id: string
  code: string
  codeKey: TranslationKey
  module: ReportModule
  route: string
  type: ReportType
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  answersKey: TranslationKey
  readsKey: TranslationKey
  decisionKey: TranslationKey
  limitationsKey?: TranslationKey
}

export interface ReportModuleGroup {
  id: ReportModule
  labelKey: TranslationKey
  descriptionKey: TranslationKey
}

export const REPORT_MODULE_GROUPS: ReportModuleGroup[] = [
  {
    id: 'inventory',
    labelKey: 'reports.catalog.module.inventory',
    descriptionKey: 'reports.catalog.module.inventoryDesc',
  },
  {
    id: 'losses',
    labelKey: 'reports.catalog.module.losses',
    descriptionKey: 'reports.catalog.module.lossesDesc',
  },
  {
    id: 'sales',
    labelKey: 'reports.catalog.module.sales',
    descriptionKey: 'reports.catalog.module.salesDesc',
  },
]

export const REPORTS_CATALOG: ReportCatalogEntry[] = [
  // 1. Stock Valuation
  {
    id: 'stock-valuation',
    code: 'INV-01',
    codeKey: 'reports.code.stockValuation',
    module: 'inventory',
    route: '/inventory/reports/stock-valuation',
    type: 'current-state',
    titleKey: 'reports.stockValuation',
    descriptionKey: 'reports.stockValuation.subtitle',
    answersKey: 'reports.catalog.stockValuation.answers',
    readsKey: 'reports.catalog.stockValuation.reads',
    decisionKey: 'reports.catalog.stockValuation.decision',
    limitationsKey: 'reports.catalog.stockValuation.limitations',
  },
  // 2. Low Stock
  {
    id: 'low-stock',
    code: 'INV-02',
    codeKey: 'reports.code.lowStock',
    module: 'inventory',
    route: '/inventory/reports/low-stock',
    type: 'current-state',
    titleKey: 'reports.lowStock',
    descriptionKey: 'reports.lowStock.subtitle',
    answersKey: 'reports.catalog.lowStock.answers',
    readsKey: 'reports.catalog.lowStock.reads',
    decisionKey: 'reports.catalog.lowStock.decision',
    limitationsKey: 'reports.catalog.lowStock.limitations',
  },
  // 3. Shrinkage Analysis
  {
    id: 'shrinkage',
    code: 'INV-03',
    codeKey: 'reports.code.shrinkage',
    module: 'losses',
    route: '/inventory/reports/shrinkage',
    type: 'date-ranged',
    titleKey: 'reports.shrinkage',
    descriptionKey: 'reports.shrinkage.subtitle',
    answersKey: 'reports.catalog.shrinkage.answers',
    readsKey: 'reports.catalog.shrinkage.reads',
    decisionKey: 'reports.catalog.shrinkage.decision',
    limitationsKey: 'reports.catalog.shrinkage.limitations',
  },
  // 4. Waste Analysis
  {
    id: 'waste-analysis',
    code: 'INV-04',
    codeKey: 'reports.code.wasteAnalysis',
    module: 'losses',
    route: '/inventory/reports/waste-analysis',
    type: 'date-ranged',
    titleKey: 'reports.wasteAnalysis',
    descriptionKey: 'reports.wasteAnalysis.subtitle',
    answersKey: 'reports.catalog.wasteAnalysis.answers',
    readsKey: 'reports.catalog.wasteAnalysis.reads',
    decisionKey: 'reports.catalog.wasteAnalysis.decision',
    limitationsKey: 'reports.catalog.wasteAnalysis.limitations',
  },
  // 5. Loss Comparison
  {
    id: 'loss-comparison',
    code: 'INV-05',
    codeKey: 'reports.code.lossComparison',
    module: 'losses',
    route: '/inventory/reports/loss-comparison',
    type: 'date-ranged',
    titleKey: 'reports.lossComparison',
    descriptionKey: 'reports.lossComparison.subtitle',
    answersKey: 'reports.catalog.lossComparison.answers',
    readsKey: 'reports.catalog.lossComparison.reads',
    decisionKey: 'reports.catalog.lossComparison.decision',
    limitationsKey: 'reports.catalog.lossComparison.limitations',
  },
  // 6. Purchase Price Drift
  {
    id: 'purchase-price-drift',
    code: 'INV-06',
    codeKey: 'reports.code.purchasePriceDrift',
    module: 'inventory',
    route: '/inventory/reports/purchase-price-drift',
    type: 'date-ranged',
    titleKey: 'reports.purchasePriceDrift',
    descriptionKey: 'reports.purchasePriceDrift.subtitle',
    answersKey: 'reports.catalog.purchasePriceDrift.answers',
    readsKey: 'reports.catalog.purchasePriceDrift.reads',
    decisionKey: 'reports.catalog.purchasePriceDrift.decision',
    limitationsKey: 'reports.catalog.purchasePriceDrift.limitations',
  },
  // 7. Sales Over Time
  {
    id: 'sales-over-time',
    code: 'SLS-01',
    codeKey: 'reports.code.salesOverTime',
    module: 'sales',
    route: '/sales/reports/sales-over-time',
    type: 'date-ranged',
    titleKey: 'reports.salesOverTime',
    descriptionKey: 'reports.salesOverTime.subtitle',
    answersKey: 'reports.catalog.salesOverTime.answers',
    readsKey: 'reports.catalog.salesOverTime.reads',
    decisionKey: 'reports.catalog.salesOverTime.decision',
    limitationsKey: 'reports.catalog.salesOverTime.limitations',
  },
  // 8. Sales By Hour
  {
    id: 'sales-by-hour',
    code: 'SLS-02',
    codeKey: 'reports.code.salesByHour',
    module: 'sales',
    route: '/sales/reports/sales-by-hour',
    type: 'date-ranged',
    titleKey: 'reports.salesByHour',
    descriptionKey: 'reports.salesByHour.subtitle',
    answersKey: 'reports.catalog.salesByHour.answers',
    readsKey: 'reports.catalog.salesByHour.reads',
    decisionKey: 'reports.catalog.salesByHour.decision',
    limitationsKey: 'reports.catalog.salesByHour.limitations',
  },
  // 9. Sales By Product
  {
    id: 'sales-by-product',
    code: 'SLS-03',
    codeKey: 'reports.code.salesByProduct',
    module: 'sales',
    route: '/sales/reports/sales-by-product',
    type: 'date-ranged',
    titleKey: 'reports.salesByProduct',
    descriptionKey: 'reports.salesByProduct.subtitle',
    answersKey: 'reports.catalog.salesByProduct.answers',
    readsKey: 'reports.catalog.salesByProduct.reads',
    decisionKey: 'reports.catalog.salesByProduct.decision',
    limitationsKey: 'reports.catalog.salesByProduct.limitations',
  },
  // 10. Sales By Payment Method
  {
    id: 'sales-by-payment-method',
    code: 'SLS-04',
    codeKey: 'reports.code.salesByPaymentMethod',
    module: 'sales',
    route: '/sales/reports/sales-by-payment-method',
    type: 'date-ranged',
    titleKey: 'reports.salesByPaymentMethod',
    descriptionKey: 'reports.salesByPaymentMethod.subtitle',
    answersKey: 'reports.catalog.salesByPaymentMethod.answers',
    readsKey: 'reports.catalog.salesByPaymentMethod.reads',
    decisionKey: 'reports.catalog.salesByPaymentMethod.decision',
    limitationsKey: 'reports.catalog.salesByPaymentMethod.limitations',
  },
]

export const REPORTS_CATALOG_BY_ID = new Map<string, ReportCatalogEntry>(
  REPORTS_CATALOG.map((entry) => [entry.id, entry]),
)

export function getReportCatalogEntry(id: string): ReportCatalogEntry | undefined {
  return REPORTS_CATALOG_BY_ID.get(id)
}

export function getReportsByModule(module: ReportModule): ReportCatalogEntry[] {
  return REPORTS_CATALOG.filter((entry) => entry.module === module)
}
