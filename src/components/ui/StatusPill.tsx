import { useTranslation } from '../../i18n/useTranslation'

interface StatusPillProps {
  active: boolean
}

/** Read-only active/inactive status pill (same visuals as row toggle). */
export function StatusPill({ active }: StatusPillProps) {
  const { t } = useTranslation()
  const label = active ? t('common.status.active') : t('common.status.inactive')

  return (
    <span
      className={`status-pill status-pill--${active ? 'active' : 'inactive'}`}
      aria-label={label}
    >
      {label}
    </span>
  )
}
