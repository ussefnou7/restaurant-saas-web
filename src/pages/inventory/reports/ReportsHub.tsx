import { AlertTriangle, Calculator, Columns3, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { ModuleHubPage } from '../../../components/hub/ModuleHubPage'
import { getReportCatalogEntry } from '../../../data/reportsCatalog'
import { useTranslation } from '../../../i18n/useTranslation'

export function ReportsHub() {
  const { t } = useTranslation()

  const shrinkage = getReportCatalogEntry('shrinkage')!
  const wasteAnalysis = getReportCatalogEntry('waste-analysis')!
  const lossComparison = getReportCatalogEntry('loss-comparison')!
  const purchasePriceDrift = getReportCatalogEntry('purchase-price-drift')!
  const stockValuation = getReportCatalogEntry('stock-valuation')!
  const lowStock = getReportCatalogEntry('low-stock')!

  return (
    <ModuleHubPage
      className="inventory-reports-hub-page"
      title={t('reports.hub.title')}
      subtitle={t('reports.hub.subtitle')}
      trail={[
        { label: t('hubs.breadcrumb.home'), to: '/dashboard' },
        { label: t('hubs.inventory.title'), to: '/inventory' },
      ]}
      cardsLabel={t('hubs.section.reports')}
      cards={[
        {
          id: shrinkage.id,
          icon: TrendingDown,
          title: t(shrinkage.titleKey),
          description: t(shrinkage.descriptionKey),
          to: shrinkage.route,
        },
        {
          id: wasteAnalysis.id,
          icon: Trash2,
          title: t(wasteAnalysis.titleKey),
          description: t(wasteAnalysis.descriptionKey),
          to: wasteAnalysis.route,
        },
        {
          id: lossComparison.id,
          icon: Columns3,
          title: t(lossComparison.titleKey),
          description: t(lossComparison.descriptionKey),
          to: lossComparison.route,
        },
        {
          id: purchasePriceDrift.id,
          icon: TrendingUp,
          title: t(purchasePriceDrift.titleKey),
          description: t(purchasePriceDrift.descriptionKey),
          to: purchasePriceDrift.route,
        },
        {
          id: stockValuation.id,
          icon: Calculator,
          title: t(stockValuation.titleKey),
          description: t(stockValuation.descriptionKey),
          to: stockValuation.route,
        },
        {
          id: lowStock.id,
          icon: AlertTriangle,
          title: t(lowStock.titleKey),
          description: t(lowStock.descriptionKey),
          to: lowStock.route,
        },
      ]}
    />
  )
}
