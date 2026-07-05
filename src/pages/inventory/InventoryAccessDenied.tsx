import { ListPage } from '../../components/ui/ListPage'
import { PageHeader } from '../../components/ui/PageHeader'
import { useTranslation } from '../../i18n/useTranslation'

export function InventoryAccessDenied() {
  const { t } = useTranslation()

  return (
    <ListPage>
      <PageHeader title={t('inventory.accessDenied.title')} description={t('inventory.accessDenied.subtitle')} />
      <p className="page-error-banner">{t('inventory.accessDenied.message')}</p>
    </ListPage>
  )
}
