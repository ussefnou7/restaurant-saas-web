import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../i18n/useTranslation'
import { HubNavCard, type HubNavCardConfig } from './HubNavCard'
import { HubPanel, type HubPanelConfig } from './HubPanel'
import type { HubNavChipConfig } from './HubNavChip'

export type { HubNavCardConfig, HubNavChipConfig, HubPanelConfig }

export type HubBreadcrumbItem = {
  label: string
  to: string
}

interface ModuleHubPageProps {
  className?: string
  title: string
  subtitle: string
  /**
   * Ancestor crumbs; the hub title is appended automatically as the current crumb.
   * Defaults to a single Home crumb. Pass `[]` on the Home hub itself to hide the trail.
   */
  trail?: HubBreadcrumbItem[]
  /** Label above the card grid, e.g. "Daily operations". */
  cardsLabel?: string
  cards: HubNavCardConfig[]
  /** Secondary destinations, rendered as chip panels under the card grid. */
  panels?: HubPanelConfig[]
  beforeCards?: ReactNode
}

export function ModuleHubPage({
  className,
  title,
  subtitle,
  trail,
  cardsLabel,
  cards,
  panels,
  beforeCards,
}: ModuleHubPageProps) {
  const { t } = useTranslation()
  const crumbs = trail ?? [{ label: t('hubs.breadcrumb.home'), to: '/dashboard' }]
  const visiblePanels = panels?.filter((panel) => panel.chips.length > 0) ?? []

  return (
    <div className={`page module-hub${className ? ` ${className}` : ''}`}>
      <div className="module-hub__shell">
        <header className="module-hub__header">
          {crumbs.length > 0 ? (
            <nav className="module-hub__breadcrumb" aria-label={t('hubs.breadcrumb.label')}>
              {crumbs.map((crumb) => (
                <span key={crumb.to} className="module-hub__crumb">
                  <Link to={crumb.to}>{crumb.label}</Link>
                  <span className="module-hub__crumb-separator" aria-hidden="true">
                    /
                  </span>
                </span>
              ))}
              <span className="module-hub__crumb module-hub__crumb--current" aria-current="page">
                {title}
              </span>
            </nav>
          ) : null}
          <h1 className="module-hub__title">{title}</h1>
          <p className="module-hub__subtitle">{subtitle}</p>
        </header>

        <div className="module-hub__body">
          {beforeCards}

          {cardsLabel ? <h2 className="module-hub__section-label">{cardsLabel}</h2> : null}

          <div className="hub-nav-card-grid">
            {cards.map((card) => (
              <HubNavCard key={card.id} {...card} />
            ))}
          </div>

          {visiblePanels.length > 0 ? (
            <div
              className={`hub-panel-row${visiblePanels.length === 1 ? ' hub-panel-row--single' : ''}`}
            >
              {visiblePanels.map((panel) => (
                <HubPanel key={panel.id} {...panel} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
