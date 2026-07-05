import type { ReactNode } from 'react'
import { ListPage } from '../ui/ListPage'
import { PageHeader } from '../ui/PageHeader'
import { HubNavCard, type HubNavCardConfig } from './HubNavCard'
import { HubNavChip, type HubNavChipConfig } from './HubNavChip'

export type { HubNavCardConfig, HubNavChipConfig }

export type HubSetupSection = {
  label: string
  chips: HubNavChipConfig[]
}

interface ModuleHubPageProps {
  className?: string
  title: string
  subtitle: string
  cards: HubNavCardConfig[]
  setupSection?: HubSetupSection
  beforeCards?: ReactNode
}

export function ModuleHubPage({
  className,
  title,
  subtitle,
  cards,
  setupSection,
  beforeCards,
}: ModuleHubPageProps) {
  return (
    <ListPage className={className ?? 'module-hub-page'}>
      <PageHeader title={title} description={subtitle} />

      {beforeCards}

      <div className="hub-sections">
        <div className="hub-nav-card-grid">
          {cards.map((card) => (
            <HubNavCard key={card.id} {...card} />
          ))}
        </div>

        {setupSection && setupSection.chips.length > 0 ? (
          <section className="hub-setup-section" aria-label={setupSection.label}>
            <div className="hub-setup-section__divider">
              <h2 className="hub-setup-section__label">{setupSection.label}</h2>
            </div>
            <div className="hub-nav-chip-row">
              {setupSection.chips.map((chip) => (
                <HubNavChip key={chip.id} {...chip} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </ListPage>
  )
}
