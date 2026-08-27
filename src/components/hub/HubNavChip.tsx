import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

export type HubNavChipConfig = {
  id: string
  icon: LucideIcon
  title: string
  to: string
  /** `warning` tints the icon amber, for alert-style destinations such as low stock. */
  tone?: 'default' | 'warning'
}

type HubNavChipProps = HubNavChipConfig

export function HubNavChip({ icon: Icon, title, to, tone = 'default' }: HubNavChipProps) {
  return (
    <Link to={to} className="hub-nav-chip">
      <Icon
        className={`hub-nav-chip__icon${tone === 'warning' ? ' hub-nav-chip__icon--warning' : ''}`}
        size={20}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <span className="hub-nav-chip__title">{title}</span>
    </Link>
  )
}
