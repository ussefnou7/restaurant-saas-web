import { useId } from 'react'
import { useTranslation } from '../../i18n/useTranslation'

export interface StatusSwitchProps {
  active: boolean
  disabled?: boolean
  onChange: (active: boolean) => void
}

export function StatusSwitch({ active, disabled = false, onChange }: StatusSwitchProps) {
  const { t } = useTranslation()
  const switchId = useId()
  const statusLabel = active ? t('common.status.active') : t('common.status.inactive')

  return (
    <div
      className={`status-switch${active ? ' status-switch--on' : ' status-switch--off'}`}
    >
      <label className="status-switch__toggle toggle-switch" htmlFor={switchId}>
        <input
          id={switchId}
          type="checkbox"
          checked={active}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
          aria-label={statusLabel}
        />
        <span className="toggle-switch-track" aria-hidden="true" />
      </label>
      <span className="status-switch__label">{statusLabel}</span>
    </div>
  )
}
