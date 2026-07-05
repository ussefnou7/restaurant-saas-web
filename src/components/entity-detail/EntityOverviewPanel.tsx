import type { FormEvent, ReactNode } from 'react'
import { DetailsCard } from '../fields'
import { Button } from '../ui/Button'
import { EntityAuditFooter } from './EntityAuditFooter'
import { EntityStatusControl } from './EntityStatusControl'

export interface EntityOverviewPanelProps {
  title: string
  active: boolean
  editing: boolean
  saving?: boolean
  saveError?: string
  onCancel: () => void
  onSubmit: (event: FormEvent) => void
  toolbarActions?: ReactNode
  onActiveChange?: (active: boolean) => void
  createdAt?: string | null
  updatedAt?: string | null
  createdAtLabel: string
  updatedAtLabel: string
  cancelLabel: string
  saveLabel: string
  savingLabel: string
  children: ReactNode
}

export function EntityOverviewPanel({
  title,
  active,
  editing,
  saving = false,
  saveError,
  onCancel,
  onSubmit,
  toolbarActions,
  onActiveChange,
  createdAt,
  updatedAt,
  createdAtLabel,
  updatedAtLabel,
  cancelLabel,
  saveLabel,
  savingLabel,
  children,
}: EntityOverviewPanelProps) {
  const statusActive = active

  function renderHeadActions() {
    if (editing) {
      return (
        <>
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
            {cancelLabel}
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={saving}>
            {saving ? savingLabel : saveLabel}
          </Button>
        </>
      )
    }

    return toolbarActions
  }

  function renderOverviewCard() {
    return (
      <DetailsCard
        className="entity-overview-card"
        title={title}
        headExtra={
          <EntityStatusControl
            active={statusActive}
            editable={editing}
            disabled={saving}
            onChange={onActiveChange}
          />
        }
        actions={renderHeadActions()}
        footer={
          <EntityAuditFooter
            createdAt={createdAt}
            updatedAt={updatedAt}
            createdAtLabel={createdAtLabel}
            updatedAtLabel={updatedAtLabel}
          />
        }
      >
        {children}
      </DetailsCard>
    )
  }

  if (!editing) {
    return <div className="entity-overview">{renderOverviewCard()}</div>
  }

  return (
    <div className="entity-overview entity-overview--editing">
      <form className="entity-overview__form form-card" onSubmit={onSubmit}>
        {saveError ? <div className="alert-error">{saveError}</div> : null}
        {renderOverviewCard()}
      </form>
    </div>
  )
}
