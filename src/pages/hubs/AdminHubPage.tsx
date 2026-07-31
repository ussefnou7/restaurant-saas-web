import { MapPinned, MonitorSmartphone, Settings, Store, Users } from 'lucide-react'
import { ModuleHubPage } from '../../components/hub/ModuleHubPage'
import { useTranslation } from '../../i18n/useTranslation'
import { canManageDevices } from '../../utils/deviceAccess'
import { canViewTables } from '../../utils/tableAccess'

export function AdminHubPage() {
  const { t } = useTranslation()
  const showDevices = canManageDevices()
  const showTables = canViewTables()

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
        ...(showDevices
          ? [
              {
                id: 'devices',
                icon: MonitorSmartphone,
                title: t('hubs.admin.devices.title'),
                to: '/devices',
              },
            ]
          : []),
        ...(showTables
          ? [
              {
                id: 'tables',
                icon: MapPinned,
                title: t('hubs.admin.tables.title'),
                to: '/tables',
              },
            ]
          : []),
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
