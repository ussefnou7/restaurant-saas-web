import { StatusPill } from '../ui/StatusPill'

export interface StatusBadgeViewProps {
  active: boolean
}

/** Read-only status pill for detail headers and view mode. */
export function StatusBadgeView({ active }: StatusBadgeViewProps) {
  return (
    <div className="status-badge-view">
      <StatusPill active={active} />
    </div>
  )
}
