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
      cardsLabel={t('hubs.section.sections')}
      cards={[
        {
          id: 'sales-reports',
          icon: BarChart3,
          title: t('hubs.reports.sales.title'),
          description: t('hubs.reports.sales.description'),
          to: '/reports/overview',
        },
        {
          id: 'inventory-reports',
          icon: Boxes,
          title: t('hubs.reports.inventory.title'),
          description: t('hubs.reports.inventory.description'),
          to: '/inventory/reports',
        },
      ]}
    />
  )
}
