import { LayoutDashboard, Monitor } from 'lucide-react'
import { ModuleHubPage } from '../../components/hub/ModuleHubPage'
import { useTranslation } from '../../i18n/useTranslation'

export function HomeHubPage() {
  const { t } = useTranslation()

  return (
    <ModuleHubPage
      className="home-hub-page"
      title={t('hubs.home.title')}
      subtitle={t('hubs.home.subtitle')}
      trail={[]}
      cardsLabel={t('hubs.section.sections')}
      cards={[
        {
          id: 'dashboard',
          icon: LayoutDashboard,
          title: t('hubs.home.dashboard.title'),
          description: t('hubs.home.dashboard.description'),
          to: '/dashboard/overview',
        },
        {
          id: 'pos',
          icon: Monitor,
          title: t('hubs.home.pos.title'),
          description: t('hubs.home.pos.description'),
          to: '/pos',
        },
      ]}
    />
  )
}
