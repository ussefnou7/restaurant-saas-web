import { ListPage } from '../../../components/ui/ListPage'
import { PageHeader } from '../../../components/ui/PageHeader'
import { useTranslation } from '../../../i18n/useTranslation'

export function PurchaseInvoiceAccessDenied() {
  const { t } = useTranslation()

  return (
    <ListPage>
      <PageHeader
        title={t('inventory.purchase.accessDenied.title')}
        description={t('inventory.purchase.accessDenied.subtitle')}
      />
      <p className="page-error-banner">{t('inventory.purchase.accessDenied.message')}</p>
    </ListPage>
  )
}
