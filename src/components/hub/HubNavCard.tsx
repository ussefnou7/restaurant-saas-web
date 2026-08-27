import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

export type HubNavCardConfig = {
  id: string
  icon: LucideIcon
  title: string
  description?: string
  to: string
}

type HubNavCardProps = HubNavCardConfig

export function HubNavCard({ icon: Icon, title, description, to }: HubNavCardProps) {
  return (
    <Link to={to} className="hub-nav-card">
      <span className="hub-nav-card__icon" aria-hidden="true">
        <Icon size={22} strokeWidth={1.75} />
      </span>
      <span className="hub-nav-card__title">{title}</span>
      {description ? <span className="hub-nav-card__description">{description}</span> : null}
    </Link>
  )
}
