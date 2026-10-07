import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  Banknote,
  Boxes,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Landmark,
  LayoutDashboard,
  LogOut,
  Receipt,
  Shield,
  ShoppingCart,
} from 'lucide-react'
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher'
import { Logo } from '../components/ui/Logo'
import { useTranslation } from '../i18n/useTranslation'
import type { TranslationKey } from '../i18n/types'
import { canOpenScreen } from '../access/screenAccess'
import { SCREEN_MAP, type ScreenId } from '../access/screen-map'
import { useAuthSession } from '../access/useAuthSession'
import { authService } from '../services/authService'

type TopNavItem = {
  /**
   * A SCREEN_MAP id when the module is gated. `home` and `admin` are hubs with no gate of their
   * own — everything inside them is gated individually, so hiding the hub would hide screens the
   * user can legitimately open.
   */
  id: ScreenId | 'home' | 'admin'
  labelKey: TranslationKey
  path: string
  icon: LucideIcon
}

const topNavItems: TopNavItem[] = [
  { id: 'home', labelKey: 'layout.nav.main', path: '/dashboard', icon: LayoutDashboard },
  { id: 'sales', labelKey: 'layout.nav.sales', path: '/sales', icon: Receipt },
  { id: 'inventory', labelKey: 'layout.nav.inventory', path: '/inventory', icon: Boxes },
  { id: 'assets', labelKey: 'layout.nav.assets', path: '/assets', icon: Landmark },
  { id: 'purchase', labelKey: 'layout.nav.purchase', path: '/purchase', icon: ShoppingCart },
  { id: 'expenses', labelKey: 'layout.nav.expenses', path: '/expenses', icon: Banknote },
  { id: 'hr', labelKey: 'layout.nav.hr', path: '/hr', icon: BriefcaseBusiness },
  { id: 'admin', labelKey: 'layout.nav.management', path: '/admin', icon: Shield },
]

const SIDEBAR_COLLAPSED_KEY = 'restoro.sidebar.collapsed'

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
        pathname.startsWith('/orders') ||
        pathname.startsWith('/menu')
      )
    case 'inventory':
      return pathname.startsWith('/inventory')
    case 'assets':
      return pathname.startsWith('/assets')
    case 'purchase':
      return pathname.startsWith('/purchase')
    case 'expenses':
      return pathname.startsWith('/expenses')
    case 'hr':
      return pathname.startsWith('/hr')
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
  const { t, direction } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useAuthSession()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
    } catch {
      return false
    }
  })

  function handleLogout() {
    authService.logout()
    navigate('/login')
  }

  function handleSidebarToggle() {
    setIsSidebarCollapsed((current) => {
      const next = !current
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      } catch {
        // The layout still works when storage is unavailable.
      }
      return next
    })
  }

  // Same map the route guard reads, so a visible link always opens.
  const visibleNavItems = topNavItems.filter((item) => {
    if (item.id === 'home' || item.id === 'admin') return true
    return canOpenScreen(user, item.id) || SCREEN_MAP[item.id].onDenied !== 'hide'
  })

  const CollapseIcon = direction === 'rtl'
    ? (isSidebarCollapsed ? ChevronLeft : ChevronRight)
    : (isSidebarCollapsed ? ChevronRight : ChevronLeft)
  const toggleLabel = t(
    isSidebarCollapsed ? 'layout.sidebar.expand' : 'layout.sidebar.collapse',
  )

  return (
    <div className="app-shell">
      <aside className={`sidebar${isSidebarCollapsed ? ' sidebar--collapsed' : ''}`}>
        <div className="sidebar-header">
          <NavLink to="/dashboard" className="sidebar-brand-link" aria-label={t('layout.appName')}>
            <div className="sidebar-brand-logo sidebar-brand-logo--full">
              <Logo variant="horizontal" size="sm" />
            </div>
            <div className="sidebar-brand-logo sidebar-brand-logo--mark">
              <Logo variant="mark" size={38} />
            </div>
          </NavLink>
          <button
            type="button"
            className="sidebar-collapse-toggle"
            onClick={handleSidebarToggle}
            aria-label={toggleLabel}
            title={toggleLabel}
            aria-expanded={!isSidebarCollapsed}
            aria-controls="primary-navigation"
          >
            <CollapseIcon aria-hidden="true" />
          </button>
        </div>
        <nav
          id="primary-navigation"
          className="sidebar-nav sidebar-nav--flat"
          aria-label={t('layout.sidebar.aria')}
        >
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            const active = isNavItemActive(pathname, item)
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={`sidebar-nav-item${active ? ' active' : ''}`}
                aria-label={t(item.labelKey)}
                title={isSidebarCollapsed ? t(item.labelKey) : undefined}
              >
                <Icon className="sidebar-nav-item__icon" aria-hidden="true" />
                <span className="sidebar-nav-item__label">{t(item.labelKey)}</span>
              </NavLink>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <LanguageSwitcher />
          <button
            type="button"
            className="logout-button sidebar-logout"
            onClick={handleLogout}
            aria-label={t('layout.logout')}
            title={isSidebarCollapsed ? t('layout.logout') : undefined}
          >
            <LogOut className="sidebar-nav-item__icon" aria-hidden="true" />
            <span className="sidebar-logout__label">{t('layout.logout')}</span>
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
