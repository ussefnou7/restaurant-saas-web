import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

export type HubNavChipConfig = {
  id: string
  icon: LucideIcon
  title: string
  to: string
}

type HubNavChipProps = HubNavChipConfig

export function HubNavChip({ icon: Icon, title, to }: HubNavChipProps) {
  return (
    <Link to={to} className="hub-nav-chip">
      <Icon className="hub-nav-chip__icon" size={16} strokeWidth={1.75} aria-hidden="true" />
      <span className="hub-nav-chip__title">{title}</span>
    </Link>
  )
}
