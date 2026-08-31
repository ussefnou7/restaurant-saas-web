import { CalendarDays, Clock, CreditCard, UtensilsCrossed } from 'lucide-react'
import { ModuleHubPage } from '../../../components/hub/ModuleHubPage'
import { getReportCatalogEntry } from '../../../data/reportsCatalog'
import { useTranslation } from '../../../i18n/useTranslation'

export function SalesReportsHub() {
  const { t } = useTranslation()

  const salesOverTime = getReportCatalogEntry('sales-over-time')!
  const salesByHour = getReportCatalogEntry('sales-by-hour')!
  const salesByProduct = getReportCatalogEntry('sales-by-product')!
  const salesByPaymentMethod = getReportCatalogEntry('sales-by-payment-method')!

  return (
    <ModuleHubPage
      className="sales-reports-hub-page"
      title={t('reports.salesHub.title')}
      subtitle={t('reports.salesHub.subtitle')}
      trail={[
        { label: t('hubs.breadcrumb.home'), to: '/dashboard' },
        { label: t('hubs.sales.title'), to: '/sales' },
      ]}
      cardsLabel={t('hubs.section.reports')}
      cards={[
        {
          id: salesOverTime.id,
          icon: CalendarDays,
          title: t(salesOverTime.titleKey),
          description: t(salesOverTime.descriptionKey),
          to: salesOverTime.route,
        },
        {
          id: salesByHour.id,
          icon: Clock,
          title: t(salesByHour.titleKey),
          description: t(salesByHour.descriptionKey),
          to: salesByHour.route,
        },
        {
          id: salesByProduct.id,
          icon: UtensilsCrossed,
          title: t(salesByProduct.titleKey),
          description: t(salesByProduct.descriptionKey),
          to: salesByProduct.route,
        },
        {
          id: salesByPaymentMethod.id,
          icon: CreditCard,
          title: t(salesByPaymentMethod.titleKey),
          description: t(salesByPaymentMethod.descriptionKey),
          to: salesByPaymentMethod.route,
        },
      ]}
    />
  )
}
