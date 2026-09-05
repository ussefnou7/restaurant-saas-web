import { useTranslation } from '../../i18n/useTranslation'

export interface OnOffSwitchProps {
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
  onLabel?: string
  offLabel?: string
}

export function OnOffSwitch({
  checked,
  disabled = false,
  onChange,
  onLabel,
  offLabel,
}: OnOffSwitchProps) {
  const { t } = useTranslation()
  const activeLabel = onLabel ?? t('common.on')
  const inactiveLabel = offLabel ?? t('common.off')

  return (
    <div className={`on-off-switch ${checked ? 'on-off-switch--on' : 'on-off-switch--off'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className="on-off-switch__toggle"
        onClick={() => !disabled && onChange(!checked)}
      >
        <span className="on-off-switch__track">
          <span className="on-off-switch__thumb" />
        </span>
      </button>
      <span className="on-off-switch__label">
        {checked ? activeLabel : inactiveLabel}
      </span>
    </div>
  )
}
