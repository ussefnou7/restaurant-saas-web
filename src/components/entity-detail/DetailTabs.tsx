import type { ReactNode } from 'react'

export type DetailTabItem = {
  id: string
  label: string
}

interface DetailTabsProps {
  tabs: DetailTabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
  children: ReactNode
  /** Master tabs sit under the page header; sub tabs sit under overview sections. */
  variant?: 'card' | 'master' | 'sub'
  className?: string
}

export function DetailTabs({
  tabs,
  activeTab,
  onTabChange,
  children,
  variant = 'card',
  className,
}: DetailTabsProps) {
  const isMaster = variant === 'master'
  const isSub = variant === 'sub'
  const rootClass = [
    'detail-tabs',
    isMaster ? 'detail-tabs--master' : '',
    isSub ? 'detail-tabs--sub' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass}>
      <div className="detail-tabs__nav" role="tablist">
        {tabs.map((tab) => {
          const selected = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`tabpanel-${tab.id}`}
              className={`detail-tabs__tab${selected ? ' detail-tabs__tab--active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div
        className={`detail-tabs__panels${isMaster ? ' detail-tabs__panels--master' : ''}${isSub ? ' detail-tabs__panels--sub' : ''}`}
      >
        {children}
      </div>
    </div>
  )
}

interface DetailTabPanelProps {
  id: string
  active: boolean
  children: ReactNode
}

export function DetailTabPanel({ id, active, children }: DetailTabPanelProps) {
  if (!active) return null

  return (
    <div
      id={`tabpanel-${id}`}
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      className="detail-tabs__panel"
    >
      {children}
    </div>
  )
}
