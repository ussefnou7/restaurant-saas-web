import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { DetailTabs } from '../../components/entity-detail/DetailTabs'
import { ListPage } from '../../components/ui/ListPage'
import { PageHeader } from '../../components/ui/PageHeader'
import { useTranslation } from '../../i18n/useTranslation'

const TAB_ORDERS = 'orders'
const TAB_REQUESTS = 'order-requests'
const TAB_CUSTOMERS = 'customers'

export function OrdersHubLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const activeTab = pathname.includes('/orders/order-requests')
    ? TAB_REQUESTS
    : pathname.includes('/orders/customers')
      ? TAB_CUSTOMERS
    : TAB_ORDERS

  const tabs = [
    { id: TAB_ORDERS, label: t('orders.tabs.orders') },
    { id: TAB_REQUESTS, label: t('orders.tabs.orderRequests') },
    { id: TAB_CUSTOMERS, label: t('customers.tabs.customers') },
  ]

  function setTab(tabId: string) {
    if (tabId === TAB_REQUESTS) {
      navigate('/orders/order-requests')
      return
    }
    navigate(tabId === TAB_CUSTOMERS ? '/orders/customers' : '/orders/list')
  }

  return (
    <ListPage className="orders-hub-page">
      <PageHeader title={t('orders.hub.title')} description={t('orders.hub.subtitle')} />
      <DetailTabs tabs={tabs} activeTab={activeTab} onTabChange={setTab} variant="master">
        <div className="detail-tabs__panel orders-hub-page__panel">
          <Outlet />
        </div>
      </DetailTabs>
    </ListPage>
  )
}
