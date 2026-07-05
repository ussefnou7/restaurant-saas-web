import { ListPage } from '../../../components/ui/ListPage'
import { PageHeader } from '../../../components/ui/PageHeader'
import { useTranslation } from '../../../i18n/useTranslation'

export function AdminInventoryAccessDenied() {
  const { t } = useTranslation()

  return (
    <ListPage>
      <PageHeader
        title={t('inventory.admin.accessDenied.title')}
        description={t('inventory.admin.accessDenied.subtitle')}
      />
      <p className="page-error-banner">{t('inventory.admin.accessDenied.message')}</p>
    </ListPage>
  )
}
