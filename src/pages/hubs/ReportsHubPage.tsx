import { BarChart3, Boxes } from 'lucide-react'
import { ModuleHubPage } from '../../components/hub/ModuleHubPage'
import { useTranslation } from '../../i18n/useTranslation'

export function ReportsHubPage() {
  const { t } = useTranslation()

  return (
    <ModuleHubPage
      className="reports-hub-page"
      title={t('hubs.reports.title')}
      subtitle={t('hubs.reports.subtitle')}
      cards={[
        {
          id: 'sales-reports',
          icon: BarChart3,
          title: t('hubs.reports.sales.title'),
          to: '/reports/overview',
        },
        {
          id: 'inventory-reports',
          icon: Boxes,
          title: t('hubs.reports.inventory.title'),
          to: '/inventory/stock-balances',
        },
      ]}
    />
  )
}
