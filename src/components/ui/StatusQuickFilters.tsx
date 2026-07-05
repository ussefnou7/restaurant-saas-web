import { useTranslation } from '../../i18n/useTranslation'

export type ActiveInactiveFilter = 'all' | 'active' | 'inactive'

interface StatusQuickFiltersProps {
  value: ActiveInactiveFilter
  onChange: (value: ActiveInactiveFilter) => void
  ariaLabel: string
}

const OPTIONS: ActiveInactiveFilter[] = ['all', 'active', 'inactive']

export function StatusQuickFilters({ value, onChange, ariaLabel }: StatusQuickFiltersProps) {
  const { t } = useTranslation()

  const labels: Record<ActiveInactiveFilter, string> = {
    all: t('common.filters.all'),
    active: t('common.status.active'),
    inactive: t('common.status.inactive'),
  }

  return (
    <div className="status-quick-filters" role="group" aria-label={ariaLabel}>
      {OPTIONS.map((option) => {
        const selected = value === option
        return (
          <button
            key={option}
            type="button"
            className={`status-quick-filters__option status-quick-filters__option--${option}${selected ? ' status-quick-filters__option--selected' : ''}`}
            aria-pressed={selected}
            onClick={() => onChange(option)}
          >
            {labels[option]}
          </button>
        )
      })}
    </div>
  )
}
