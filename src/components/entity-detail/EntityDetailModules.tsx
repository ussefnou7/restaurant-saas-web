import type { ReactNode } from 'react'
import { DetailTabPanel, DetailTabs } from './DetailTabs'

export type EntityDetailTabItem = {
  id: string
  label: string
  /** When true the panel stays visible even when another tab is selected. */
  alwaysExpanded?: boolean
}

export interface EntityDetailModulesProps {
  tabs: EntityDetailTabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
  children: ReactNode
  className?: string
}

export function EntityDetailModules({
  tabs,
  activeTab,
  onTabChange,
  children,
  className,
}: EntityDetailModulesProps) {
  return (
    <div className={`entity-detail-modules${className ? ` ${className}` : ''}`}>
      <DetailTabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} variant="sub">
        {children}
      </DetailTabs>
    </div>
  )
}

export interface EntityDetailModulePanelProps {
  id: string
  activeTab: string
  alwaysExpanded?: boolean
  children: ReactNode
}

export function EntityDetailModulePanel({
  id,
  activeTab,
  alwaysExpanded = false,
  children,
}: EntityDetailModulePanelProps) {
  const visible = alwaysExpanded || activeTab === id

  return (
    <DetailTabPanel id={id} active={visible}>
      {children}
    </DetailTabPanel>
  )
}
