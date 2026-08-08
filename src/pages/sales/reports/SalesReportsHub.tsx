import { CalendarDays, Clock, CreditCard, UtensilsCrossed } from 'lucide-react'
import { HubNavCard } from '../../../components/hub/HubNavCard'
import { ListPage } from '../../../components/ui/ListPage'
import { PageHeader } from '../../../components/ui/PageHeader'
import { useTranslation } from '../../../i18n/useTranslation'

export function SalesReportsHub() {
  const { t } = useTranslation()

  const cards = [
    {
      id: 'sales-over-time',
      icon: CalendarDays,
      title: t('reports.salesOverTime'),
      to: '/sales/reports/sales-over-time',
      className: 'reports-hub-card--primary',
    },
    {
      id: 'sales-by-hour',
      icon: Clock,
      title: t('reports.salesByHour'),
      to: '/sales/reports/sales-by-hour',
    },
    {
      id: 'sales-by-product',
      icon: UtensilsCrossed,
      title: t('reports.salesByProduct'),
      to: '/sales/reports/sales-by-product',
    },
    {
      id: 'sales-by-payment-method',
      icon: CreditCard,
      title: t('reports.salesByPaymentMethod'),
      to: '/sales/reports/sales-by-payment-method',
    },
  ]

  return (
    <ListPage className="sales-reports-hub-page">
      <PageHeader title={t('reports.salesHub.title')} description={t('reports.salesHub.subtitle')} />

      <div className="hub-sections">
        <div className="hub-nav-card-grid hub-nav-card-grid--inventory">
          {cards.map((card) => (
            <HubNavCard key={card.id} {...card} />
          ))}
        </div>
      </div>
    </ListPage>
  )
}
