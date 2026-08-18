import { FileText, RotateCcw, Truck } from 'lucide-react'
import { ModuleHubPage, type HubNavCardConfig } from '../../components/hub/ModuleHubPage'
import { ListPage } from '../../components/ui/ListPage'
import { PageHeader } from '../../components/ui/PageHeader'
import { useTranslation } from '../../i18n/useTranslation'
import { canViewInventorySetup } from '../../utils/inventoryAccess'
import { canViewPurchaseInvoices } from '../../utils/inventoryPurchaseAccess'

export function PurchaseHubPage() {
  const { t } = useTranslation()
  const canViewSuppliers = canViewInventorySetup()
  const canViewPurchasing = canViewPurchaseInvoices()

  const cards: HubNavCardConfig[] = []

  if (canViewSuppliers) {
    cards.push({
      id: 'suppliers',
      icon: Truck,
      title: t('hubs.purchase.suppliers.title'),
      description: t('hubs.purchase.suppliers.description'),
      to: '/purchase/suppliers',
    })
  }

  if (canViewPurchasing) {
    cards.push({
      id: 'invoices',
      icon: FileText,
      title: t('hubs.purchase.invoices.title'),
      description: t('hubs.purchase.invoices.description'),
      to: '/purchase/purchase-invoices',
    })

    cards.push({
      id: 'returns',
      icon: RotateCcw,
      title: t('hubs.purchase.returns.title'),
      description: t('hubs.purchase.returns.description'),
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
      cardsLabel={t('hubs.section.operations')}
      cards={cards}
    />
  )
}
