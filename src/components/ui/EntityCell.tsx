import { CodePill } from './CodePill'

interface EntityCellProps {
  name: string
  code?: string | null
  meta?: string | null
  compact?: boolean
}

export function EntityCell({ name, code, meta, compact = false }: EntityCellProps) {
  const hasMeta = Boolean(code?.trim() || meta?.trim())

  if (compact && hasMeta) {
    const secondary = code?.trim() || meta?.trim()
    return (
      <div className="entity-cell entity-cell--compact">
        <span className="entity-cell__name">{name}</span>
        <span className="entity-cell__secondary" dir={code?.trim() ? 'ltr' : undefined}>
          {secondary}
        </span>
      </div>
    )
  }

  return (
    <div className={`entity-cell${compact ? ' entity-cell--compact' : ''}`}>
      <span className="entity-cell__name">{name}</span>
      {hasMeta && !compact ? (
        <div className="entity-cell__meta-row">
          {code?.trim() ? <CodePill code={code} /> : null}
          {meta?.trim() ? <span className="entity-cell__meta">{meta}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
