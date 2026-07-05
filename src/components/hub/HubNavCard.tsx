import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

export type HubNavCardConfig = {
  id: string
  icon: LucideIcon
  title: string
  to: string
}

type HubNavCardProps = HubNavCardConfig

export function HubNavCard({ icon: Icon, title, to }: HubNavCardProps) {
  return (
    <Link to={to} className="hub-nav-card">
      <span className="hub-nav-card__icon" aria-hidden="true">
        <Icon size={28} strokeWidth={1.75} />
      </span>
      <span className="hub-nav-card__title">{title}</span>
    </Link>
  )
}
