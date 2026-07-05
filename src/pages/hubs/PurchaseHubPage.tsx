import { FileText, RotateCcw, Truck } from 'lucide-react'
import { ModuleHubPage } from '../../components/hub/ModuleHubPage'
import { ListPage } from '../../components/ui/ListPage'
import { PageHeader } from '../../components/ui/PageHeader'
import { useTranslation } from '../../i18n/useTranslation'
import { canViewInventorySetup } from '../../utils/inventoryAccess'
import { canViewPurchaseInvoices } from '../../utils/inventoryPurchaseAccess'

export function PurchaseHubPage() {
  const { t } = useTranslation()
  const canViewSuppliers = canViewInventorySetup()
  const canViewPurchasing = canViewPurchaseInvoices()

  const cards = []

  if (canViewSuppliers) {
    cards.push({
      id: 'suppliers',
      icon: Truck,
      title: t('hubs.purchase.suppliers.title'),
      to: '/purchase/suppliers',
    })
  }

  if (canViewPurchasing) {
    cards.push({
      id: 'invoices',
      icon: FileText,
      title: t('hubs.purchase.invoices.title'),
      to: '/purchase/purchase-invoices',
    })

    cards.push({
      id: 'returns',
      icon: RotateCcw,
      title: t('hubs.purchase.returns.title'),
      to: '/purchase/purchase-returns',
    })
  }

  if (cards.length === 0) {
    return (
      <ListPage>
        <PageHeader
          title={t('hubs.purchase.title')}
          description={t('hubs.purchase.accessDenied.message')}
        />
        <p className="page-error-banner">{t('hubs.purchase.accessDenied.message')}</p>
      </ListPage>
    )
  }

  return (
    <ModuleHubPage
      className="purchase-hub-page"
      title={t('hubs.purchase.title')}
      subtitle={t('hubs.purchase.subtitle')}
      cards={cards}
    />
  )
}
