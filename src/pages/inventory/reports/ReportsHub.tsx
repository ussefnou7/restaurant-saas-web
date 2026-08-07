import { AlertTriangle, Calculator, TrendingDown, Trash2 } from 'lucide-react'
import { HubNavCard } from '../../../components/hub/HubNavCard'
import { ListPage } from '../../../components/ui/ListPage'
import { PageHeader } from '../../../components/ui/PageHeader'
import { useTranslation } from '../../../i18n/useTranslation'

export function ReportsHub() {
  const { t } = useTranslation()

  const cards = [
    {
      id: 'shrinkage',
      icon: TrendingDown,
      title: t('reports.shrinkage'),
      to: '/inventory/reports/shrinkage',
      className: 'reports-hub-card--primary',
    },
    {
      id: 'waste-analysis',
      icon: Trash2,
      title: t('reports.wasteAnalysis'),
      to: '/inventory/reports/waste-analysis',
    },
    {
      id: 'stock-valuation',
      icon: Calculator,
      title: t('reports.stockValuation'),
      to: '/inventory/reports/stock-valuation',
    },
    {
      id: 'low-stock',
      icon: AlertTriangle,
      title: t('reports.lowStock'),
      to: '/inventory/reports/low-stock',
    },
  ]

  return (
    <ListPage className="inventory-reports-hub-page">
      <PageHeader title={t('reports.hub.title')} description={t('reports.hub.subtitle')} />

      <div className="hub-sections">
        <div className="hub-nav-card-grid hub-nav-card-grid--inventory">
          {cards.map((card) => (
            <HubNavCard key={card.id} {...card} />
          ))}
        </div>
      </div>
    </ListPage>
  )
}
