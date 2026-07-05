import { useMemo } from 'react'
import { ListPage } from '../../components/ui/ListPage'
import { PageHeader } from '../../components/ui/PageHeader'
import { useTranslation } from '../../i18n/useTranslation'
import { canViewInventorySetup } from '../../utils/inventoryAccess'
import { InventoryAccessDenied } from '../inventory/InventoryAccessDenied'
import { InventoryHubSections } from './InventoryHubSections'
import { buildInventoryHubUserPermissions } from './inventoryHubPermissions'

export function InventoryHubPage() {
  const { t } = useTranslation()
  const canView = canViewInventorySetup()
  const userPermissions = useMemo(() => buildInventoryHubUserPermissions(), [])

  if (!canView) return <InventoryAccessDenied />

  return (
    <ListPage className="inventory-hub-page">
      <PageHeader title={t('hubs.inventory.title')} description={t('hubs.inventory.subtitle')} />
      <InventoryHubSections userPermissions={userPermissions} />
    </ListPage>
  )
}
