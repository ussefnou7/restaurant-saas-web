import { BarChart3, ClipboardList, UtensilsCrossed } from 'lucide-react'
import { ModuleHubPage } from '../../components/hub/ModuleHubPage'
import { useTranslation } from '../../i18n/useTranslation'

export function SalesHubPage() {
  const { t } = useTranslation()

  return (
    <ModuleHubPage
      className="sales-hub-page"
      title={t('hubs.sales.title')}
      subtitle={t('hubs.sales.subtitle')}
      cards={[
        {
          id: 'menu',
          icon: UtensilsCrossed,
          title: t('hubs.sales.menu.title'),
          to: '/menu',
        },
        {
          id: 'operations',
          icon: ClipboardList,
          title: t('hubs.sales.operations.title'),
          to: '/orders',
        },
        {
          id: 'reports',
          icon: BarChart3,
          title: t('reports.salesHub.title'),
          to: '/sales/reports',
        },
      ]}
    />
  )
}
