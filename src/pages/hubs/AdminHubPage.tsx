import { Settings, Store, Users } from 'lucide-react'
import { ModuleHubPage } from '../../components/hub/ModuleHubPage'
import { useTranslation } from '../../i18n/useTranslation'

export function AdminHubPage() {
  const { t } = useTranslation()

  return (
    <ModuleHubPage
      className="admin-hub-page"
      title={t('hubs.admin.title')}
      subtitle={t('hubs.admin.subtitle')}
      cards={[
        {
          id: 'branches',
          icon: Store,
          title: t('hubs.admin.branches.title'),
          to: '/branches',
        },
        {
          id: 'users',
          icon: Users,
          title: t('hubs.admin.users.title'),
          to: '/users',
        },
        {
          id: 'settings',
          icon: Settings,
          title: t('hubs.admin.settings.title'),
          to: '/settings',
        },
      ]}
    />
  )
}
