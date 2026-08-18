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
      cardsLabel={t('hubs.section.operations')}
      cards={[
        {
          id: 'menu',
          icon: UtensilsCrossed,
          title: t('hubs.sales.menu.title'),
          description: t('hubs.sales.menu.description'),
          to: '/menu',
        },
        {
          id: 'operations',
          icon: ClipboardList,
          title: t('hubs.sales.operations.title'),
          description: t('hubs.sales.operations.description'),
          to: '/orders',
        },
        {
          id: 'reports',
          icon: BarChart3,
          title: t('reports.salesHub.title'),
          description: t('hubs.sales.reports.description'),
          to: '/sales/reports',
        },
      ]}
    />
  )
}
