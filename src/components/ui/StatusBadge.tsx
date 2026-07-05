import { StatusPill } from './StatusPill'

interface StatusBadgeProps {
  active: boolean
}

export function StatusBadge({ active }: StatusBadgeProps) {
  return <StatusPill active={active} />
}
