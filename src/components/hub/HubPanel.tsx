import { useId } from 'react'
import { Link } from 'react-router-dom'
import { HubNavChip, type HubNavChipConfig } from './HubNavChip'

export type HubPanelConfig = {
  id: string
  label: string
  chips: HubNavChipConfig[]
  /** Optional link rendered on the far side of the panel header. */
  viewAll?: { label: string; to: string }
}

type HubPanelProps = HubPanelConfig

export function HubPanel({ label, chips, viewAll }: HubPanelProps) {
  const headingId = useId()

  return (
    <section className="hub-panel" aria-labelledby={headingId}>
      <div className="hub-panel__header">
        <h2 id={headingId} className="hub-panel__label">
          {label}
        </h2>
        {viewAll ? (
          <Link className="hub-panel__view-all" to={viewAll.to}>
            {viewAll.label}
          </Link>
        ) : null}
      </div>
      <div className="hub-panel__chips">
        {chips.map((chip) => (
          <HubNavChip key={chip.id} {...chip} />
        ))}
      </div>
    </section>
  )
}
