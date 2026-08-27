import { BarChart3, Landmark, Package, Wrench } from 'lucide-react'
import { ModuleHubPage } from '../../components/hub/ModuleHubPage'
import { useTranslation } from '../../i18n/useTranslation'

export function AssetsHubPage() {
  const { t } = useTranslation()

  return (
    <ModuleHubPage
      className="assets-page assets-hub-page"
      title={t('assets.list.title')}
      subtitle={t('assets.list.subtitle')}
      cardsLabel={t('hubs.section.operations')}
      cards={[
        {
          id: 'assets',
          icon: Landmark,
          title: t('assets.hub.assets'),
          description: t('hubs.assets.assets.description'),
          to: '/assets/list',
        },
        {
          id: 'disposals',
          icon: Package,
          title: t('assets.disposals.nav'),
          description: t('hubs.assets.disposals.description'),
          to: '/assets/disposals',
        },
        {
          id: 'maintenance',
          icon: Wrench,
          title: t('assets.maintenanceList.nav'),
          description: t('hubs.assets.maintenance.description'),
          to: '/assets/maintenance',
        },
      ]}
      panels={[
        {
          id: 'reports',
          label: t('assets.hub.reportsSection'),
          chips: [
            {
              id: 'reports',
              icon: BarChart3,
              title: t('assets.list.reports'),
              to: '/assets/reports',
            },
          ],
        },
      ]}
    />
  )
}
