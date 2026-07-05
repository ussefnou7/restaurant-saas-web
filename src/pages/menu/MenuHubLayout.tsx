import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { DetailTabs } from '../../components/entity-detail/DetailTabs'
import { ListPage } from '../../components/ui/ListPage'
import { PageHeader } from '../../components/ui/PageHeader'
import { useTranslation } from '../../i18n/useTranslation'
import { MenuCategoriesProvider } from './MenuCategoriesContext'

const TAB_CATEGORIES = 'categories'
const TAB_PRODUCTS = 'products'

export function MenuHubLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const activeTab = pathname.includes('/menu/products') ? TAB_PRODUCTS : TAB_CATEGORIES

  const tabs = [
    { id: TAB_CATEGORIES, label: t('menu.tabs.categories') },
    { id: TAB_PRODUCTS, label: t('menu.tabs.products') },
  ]

  function setTab(tabId: string) {
    navigate(tabId === TAB_PRODUCTS ? '/menu/products' : '/menu/categories')
  }

  return (
    <MenuCategoriesProvider>
      <ListPage className="menu-hub-page">
        <PageHeader title={t('hubs.menu.title')} description={t('hubs.menu.subtitle')} />
        <DetailTabs tabs={tabs} activeTab={activeTab} onTabChange={setTab} variant="master">
          <div className="detail-tabs__panel menu-hub-page__panel">
            <Outlet />
          </div>
        </DetailTabs>
      </ListPage>
    </MenuCategoriesProvider>
  )
}
