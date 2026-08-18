import { AlertTriangle, Calculator, Columns3, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { ModuleHubPage } from '../../../components/hub/ModuleHubPage'
import { useTranslation } from '../../../i18n/useTranslation'

export function ReportsHub() {
  const { t } = useTranslation()

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
          id: 'shrinkage',
          icon: TrendingDown,
          title: t('reports.shrinkage'),
          description: t('reports.shrinkage.subtitle'),
          to: '/inventory/reports/shrinkage',
        },
        {
          id: 'waste-analysis',
          icon: Trash2,
          title: t('reports.wasteAnalysis'),
          description: t('reports.wasteAnalysis.subtitle'),
          to: '/inventory/reports/waste-analysis',
        },
        {
          id: 'loss-comparison',
          icon: Columns3,
          title: t('reports.lossComparison'),
          description: t('reports.lossComparison.subtitle'),
          to: '/inventory/reports/loss-comparison',
        },
        {
          id: 'purchase-price-drift',
          icon: TrendingUp,
          title: t('reports.purchasePriceDrift'),
          description: t('reports.purchasePriceDrift.subtitle'),
          to: '/inventory/reports/purchase-price-drift',
        },
        {
          id: 'stock-valuation',
          icon: Calculator,
          title: t('reports.stockValuation'),
          description: t('reports.stockValuation.subtitle'),
          to: '/inventory/reports/stock-valuation',
        },
        {
          id: 'low-stock',
          icon: AlertTriangle,
          title: t('reports.lowStock'),
          description: t('reports.lowStock.subtitle'),
          to: '/inventory/reports/low-stock',
        },
      ]}
    />
  )
}
