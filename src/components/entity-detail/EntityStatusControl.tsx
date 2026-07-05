import { StatusBadgeView, StatusSwitch } from '../fields'

export interface EntityStatusControlProps {
  active: boolean
  editable?: boolean
  disabled?: boolean
  onChange?: (active: boolean) => void
}

export function EntityStatusControl({
  active,
  editable = false,
  disabled = false,
  onChange,
}: EntityStatusControlProps) {
  if (editable && onChange) {
    return <StatusSwitch active={active} disabled={disabled} onChange={onChange} />
  }

  return <StatusBadgeView active={active} />
}
