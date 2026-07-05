import { ListPage } from '../../components/ui/ListPage'
import { PageHeader } from '../../components/ui/PageHeader'
import { useTranslation } from '../../i18n/useTranslation'

export function StockAccessDenied() {
  const { t } = useTranslation()

  return (
    <ListPage>
      <PageHeader
        title={t('inventory.stock.accessDenied.title')}
        description={t('inventory.stock.accessDenied.subtitle')}
      />
      <p className="page-error-banner">{t('inventory.stock.accessDenied.message')}</p>
    </ListPage>
  )
}
