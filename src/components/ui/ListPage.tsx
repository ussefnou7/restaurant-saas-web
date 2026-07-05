import type { ReactNode } from 'react'
import { Button } from './Button'
import { EmptyState } from './EmptyState'
import { LoadingRows } from './LoadingRows'
import { SearchInput } from './SearchInput'
import { StatusQuickFilters, type ActiveInactiveFilter } from './StatusQuickFilters'

interface ListPageProps {
  children: ReactNode
  className?: string
}

export function ListPage({ children, className }: ListPageProps) {
  return <div className={`page list-page${className ? ` ${className}` : ''}`}>{children}</div>
}

interface ListCardProps {
  children: ReactNode
}

export function ListCard({ children }: ListCardProps) {
  return <div className="list-page-card">{children}</div>
}

interface ListCardHeaderProps {
  title: string
  subtitle?: string
  toolbar?: ReactNode
}

export function ListCardHeader({ title, subtitle, toolbar }: ListCardHeaderProps) {
  return (
    <div className="list-card-header">
      <div className="list-card-header__intro">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {toolbar ? <div className="list-card-toolbar">{toolbar}</div> : null}
    </div>
  )
}

interface ListCardBodyProps {
  children: ReactNode
}

export function ListCardBody({ children }: ListCardBodyProps) {
  return <div className="list-card-body">{children}</div>
}

interface ListToolbarSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  ariaLabel: string
}

export function ListToolbarSearch({ value, onChange, placeholder, ariaLabel }: ListToolbarSearchProps) {
  return (
    <SearchInput
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
    />
  )
}

interface StatusFilterSelectProps {
  value: ActiveInactiveFilter
  onChange: (value: ActiveInactiveFilter) => void
  ariaLabel: string
  /** @deprecated Labels come from i18n; kept for call-site compatibility. */
  allLabel?: string
}

export function StatusFilterSelect({ value, onChange, ariaLabel }: StatusFilterSelectProps) {
  return <StatusQuickFilters value={value} onChange={onChange} ariaLabel={ariaLabel} />
}

export { StatusQuickFilters, type ActiveInactiveFilter }

interface ListPrimaryActionProps {
  label: string
  onClick: () => void
}

export function ListPrimaryAction({ label, onClick }: ListPrimaryActionProps) {
  return (
    <Button variant="primary" className="page-header-action" onClick={onClick}>
      {label}
    </Button>
  )
}

interface ListStatsGridProps {
  children: ReactNode
}

export function ListStatsGrid({ children }: ListStatsGridProps) {
  return <div className="list-stats-grid">{children}</div>
}

interface ListPageStatesProps {
  loading: boolean
  loadingMessage?: string
  loadingColumns?: number
  showEmpty: boolean
  emptyTitle: string
  emptyDescription: string
  emptyActionLabel?: string
  onEmptyAction?: () => void
  showFilterEmpty: boolean
  filterEmptyTitle: string
  filterEmptyDescription: string
  showTable: boolean
  table: ReactNode
}

export function ListPageStates({
  loading,
  loadingMessage,
  loadingColumns = 5,
  showEmpty,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  showFilterEmpty,
  filterEmptyTitle,
  filterEmptyDescription,
  showTable,
  table,
}: ListPageStatesProps) {
  if (loading) {
    return (
      <div className="list-card-content">
        {loadingMessage ? (
          <p className="list-loading-message" role="status">
            {loadingMessage}
          </p>
        ) : null}
        <LoadingRows columns={loadingColumns} />
      </div>
    )
  }

  if (showEmpty) {
    return (
      <ListCardBody>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      </ListCardBody>
    )
  }

  if (showFilterEmpty) {
    return (
      <ListCardBody>
        <EmptyState title={filterEmptyTitle} description={filterEmptyDescription} variant="filter" />
      </ListCardBody>
    )
  }

  if (showTable) {
    return <div className="list-card-content table-wrap">{table}</div>
  }

  return null
}
