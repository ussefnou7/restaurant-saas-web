import { ActionMenu, type ActionMenuItem } from './ActionMenu'
import { EditActionButton, PermissionsActionButton, RowActionGroup } from './RowActions'

interface TableRowActionsProps {
  onEdit: () => void
  disabled?: boolean
  editLabel?: string
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  menuItems: ActionMenuItem[]
  menuAriaLabel?: string
}

export function TableRowActions({
  onEdit,
  disabled,
  editLabel,
  secondaryAction,
  menuItems,
  menuAriaLabel,
}: TableRowActionsProps) {
  const showMenu = menuItems.length > 0

  return (
    <RowActionGroup>
      <EditActionButton onClick={onEdit} disabled={disabled} label={editLabel} />
      {secondaryAction ? (
        <PermissionsActionButton
          onClick={secondaryAction.onClick}
          disabled={disabled}
          label={secondaryAction.label}
        />
      ) : null}
      {showMenu ? (
        <ActionMenu disabled={disabled} ariaLabel={menuAriaLabel} items={menuItems} />
      ) : null}
    </RowActionGroup>
  )
}
