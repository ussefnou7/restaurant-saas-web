import { Pencil } from 'lucide-react'
import { Button } from '../ui/Button'
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
    <>
      <Button
        variant={active ? 'cancelDoc' : 'primary'}
        onClick={onToggleStatus}
        disabled={statusBusy}
        aria-label={statusLabel}
        title={statusLabel}
      >
        {active ? <IconPause /> : <IconPlay />}
        <span>{statusLabel}</span>
      </Button>

      {showDelete && onDelete ? (
        <IconActionButton
          className="action-btn action-btn--icon action-btn--delete-danger"
          label={deleteLabel ?? ''}
          onClick={onDelete}
        >
          <IconTrash />
        </IconActionButton>
      ) : null}

      <IconActionButton
        className="action-btn action-btn--icon"
        label={editLabel}
        onClick={onEdit}
      >
        <Pencil size={20} aria-hidden />
      </IconActionButton>
    </>
  )
}
