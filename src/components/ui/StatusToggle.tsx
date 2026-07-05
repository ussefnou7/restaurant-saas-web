import { useTranslation } from '../../i18n/useTranslation'

interface StatusToggleProps {
  active: boolean
  disabled?: boolean
  onToggle: () => void
  entityName?: string
}

export function StatusToggle({ active, disabled, onToggle, entityName }: StatusToggleProps) {
  const { t } = useTranslation()
  const label = active ? t('common.status.active') : t('common.status.inactive')

  return (
    <button
      type="button"
      className={`status-pill status-pill--${active ? 'active' : 'inactive'} status-pill--interactive`}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      aria-pressed={active}
      aria-label={`${active ? t('common.deactivate') : t('common.activate')}${entityName ? ` ${entityName}` : ''}`}
      title={active ? t('common.deactivate') : t('common.activate')}
    >
      {label}
    </button>
  )
}
