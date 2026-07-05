import { CompactDateCell } from '../ui/CompactDateCell'

export interface EntityAuditFooterProps {
  createdAt?: string | null
  updatedAt?: string | null
  createdAtLabel: string
  updatedAtLabel: string
}

export function EntityAuditFooter({
  createdAt,
  updatedAt,
  createdAtLabel,
  updatedAtLabel,
}: EntityAuditFooterProps) {
  return (
    <div className="entity-overview-card__audit">
      <span className="entity-overview-card__audit-item">
        <span className="entity-overview-card__audit-label">{createdAtLabel}:</span>{' '}
        <CompactDateCell value={createdAt ?? ''} />
      </span>
      <span className="entity-overview-card__audit-sep" aria-hidden="true">
        ·
      </span>
      <span className="entity-overview-card__audit-item">
        <span className="entity-overview-card__audit-label">{updatedAtLabel}:</span>{' '}
        <CompactDateCell value={updatedAt ?? ''} />
      </span>
    </div>
  )
}
