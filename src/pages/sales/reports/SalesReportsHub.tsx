import { CalendarDays, Clock, CreditCard, UtensilsCrossed } from 'lucide-react'
import { ModuleHubPage } from '../../../components/hub/ModuleHubPage'
import { useTranslation } from '../../../i18n/useTranslation'

export function SalesReportsHub() {
  const { t } = useTranslation()

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
          id: 'sales-over-time',
          icon: CalendarDays,
          title: t('reports.salesOverTime'),
          description: t('reports.salesOverTime.subtitle'),
          to: '/sales/reports/sales-over-time',
        },
        {
          id: 'sales-by-hour',
          icon: Clock,
          title: t('reports.salesByHour'),
          description: t('reports.salesByHour.subtitle'),
          to: '/sales/reports/sales-by-hour',
        },
        {
          id: 'sales-by-product',
          icon: UtensilsCrossed,
          title: t('reports.salesByProduct'),
          description: t('reports.salesByProduct.subtitle'),
          to: '/sales/reports/sales-by-product',
        },
        {
          id: 'sales-by-payment-method',
          icon: CreditCard,
          title: t('reports.salesByPaymentMethod'),
          description: t('reports.salesByPaymentMethod.subtitle'),
          to: '/sales/reports/sales-by-payment-method',
        },
      ]}
    />
  )
}
