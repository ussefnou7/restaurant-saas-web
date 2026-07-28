import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  Landmark,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Shield,
  ShoppingCart,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react'
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher'
import { useTranslation } from '../i18n/useTranslation'
import type { TranslationKey } from '../i18n/types'
import { authService } from '../services/authService'

type TopNavItem = {
  id: string
  labelKey: TranslationKey
  path: string
  icon: LucideIcon
  subItems?: Array<{
    labelKey: TranslationKey
    path: string
    icon: LucideIcon
  }>
}

const topNavItems: TopNavItem[] = [
  { id: 'home', labelKey: 'layout.nav.main', path: '/dashboard', icon: LayoutDashboard },
  { id: 'menu', labelKey: 'layout.nav.menu', path: '/menu', icon: UtensilsCrossed },
  { id: 'sales', labelKey: 'layout.nav.sales', path: '/sales', icon: Receipt },
  { id: 'inventory', labelKey: 'layout.nav.inventory', path: '/inventory', icon: Boxes },
  {
    id: 'assets',
    labelKey: 'layout.nav.assets',
    path: '/assets',
    icon: Landmark,
    subItems: [
      { labelKey: 'layout.nav.assetsRegister', path: '/assets', icon: Landmark },
      { labelKey: 'layout.nav.assetDisposals', path: '/assets/disposals', icon: Package },
      { labelKey: 'layout.nav.assetMaintenance', path: '/assets/maintenance', icon: Wrench },
    ],
  },
  { id: 'purchase', labelKey: 'layout.nav.purchase', path: '/purchase', icon: ShoppingCart },
  { id: 'hr', labelKey: 'layout.nav.hr', path: '/hr', icon: BriefcaseBusiness },
  { id: 'reports', labelKey: 'layout.nav.reports', path: '/reports', icon: BarChart3 },
  { id: 'admin', labelKey: 'layout.nav.management', path: '/admin', icon: Shield },
]

function isNavItemActive(pathname: string, item: TopNavItem): boolean {
  switch (item.id) {
    case 'home':
      return (
        pathname === '/dashboard' ||
        pathname.startsWith('/dashboard/') ||
        pathname === '/pos'
      )
    case 'sales':
      return (
        pathname === '/sales' ||
        pathname.startsWith('/orders')
      )
    case 'menu':
      return pathname.startsWith('/menu')
    case 'inventory':
      return pathname.startsWith('/inventory')
    case 'assets':
      return pathname.startsWith('/assets')
    case 'purchase':
      return pathname.startsWith('/purchase')
    case 'hr':
      return pathname.startsWith('/hr')
    case 'reports':
      return pathname.startsWith('/reports')
    case 'admin':
      return (
        pathname === '/admin' ||
        pathname.startsWith('/branches') ||
        pathname.startsWith('/devices') ||
        pathname.startsWith('/users') ||
        pathname.startsWith('/settings')
      )
    default:
      return false
  }
}

export function ClientLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  function handleLogout() {
    authService.logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">{t('layout.appName')}</h1>
        </div>
        <nav className="sidebar-nav sidebar-nav--flat" aria-label={t('layout.sidebar.aria')}>
          {topNavItems.map((item) => {
            const Icon = item.icon
            const active = isNavItemActive(pathname, item)
            return (
              <div key={item.id} className="sidebar-nav-group">
                <NavLink
                  to={item.path}
                  className={`sidebar-nav-item${active ? ' active' : ''}`}
                >
                  <Icon className="sidebar-nav-item__icon" aria-hidden="true" />
                  <span>{t(item.labelKey)}</span>
                </NavLink>
                {active && item.subItems ? (
                  <div className="sidebar-subnav">
                    {item.subItems.map((subItem) => {
                      const SubIcon = subItem.icon
                      return (
                        <NavLink
                          key={subItem.path}
                          to={subItem.path}
                          end={subItem.path === item.path}
                          className={({ isActive }) =>
                            `sidebar-subnav-item${isActive ? ' active' : ''}`
                          }
                        >
                          <SubIcon className="sidebar-subnav-item__icon" aria-hidden="true" />
                          <span>{t(subItem.labelKey)}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <LanguageSwitcher />
          <button type="button" className="logout-button sidebar-logout" onClick={handleLogout}>
            <LogOut className="sidebar-nav-item__icon" aria-hidden="true" />
            <span>{t('layout.logout')}</span>
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
