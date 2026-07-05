import { Pencil } from 'lucide-react'
import { IconActionButton } from '../ui/RowActions'
import { IconPause, IconPlay, IconTrash } from '../ui/icons'

export interface EntityOverviewActionsProps {
  editLabel: string
  deleteLabel?: string
  statusLabel: string
  active: boolean
  statusBusy?: boolean
  showDelete?: boolean
  onEdit: () => void
  onDelete?: () => void
  onToggleStatus: () => void
}

export function EntityOverviewActions({
  editLabel,
  deleteLabel,
  statusLabel,
  active,
  statusBusy = false,
  showDelete = true,
  onEdit,
  onDelete,
  onToggleStatus,
}: EntityOverviewActionsProps) {
  return (
    <div className="entity-overview__actions">
      <div className="action-icon-group">
        <IconActionButton
          className="action-btn action-btn--icon action-btn--icon-edit"
          label={editLabel}
          onClick={onEdit}
        >
          <Pencil size={16} aria-hidden />
        </IconActionButton>

        {showDelete && onDelete ? (
          <IconActionButton
            className="action-btn action-btn--icon action-btn--icon-delete"
            label={deleteLabel ?? ''}
            onClick={onDelete}
          >
            <IconTrash />
          </IconActionButton>
        ) : null}
      </div>

      <button
        type="button"
        className={`action-btn action-btn--status${
          active ? ' action-btn--deactivate' : ' action-btn--activate'
        }`}
        onClick={onToggleStatus}
        disabled={statusBusy}
        aria-label={statusLabel}
        title={statusLabel}
      >
        {active ? <IconPause /> : <IconPlay />}
        <span>{statusLabel}</span>
      </button>
    </div>
  )
}
