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
      cards={[
        {
          id: 'dashboard',
          icon: LayoutDashboard,
          title: t('hubs.home.dashboard.title'),
          to: '/dashboard/overview',
        },
        {
          id: 'pos',
          icon: Monitor,
          title: t('hubs.home.pos.title'),
          to: '/pos',
        },
      ]}
    />
  )
}
