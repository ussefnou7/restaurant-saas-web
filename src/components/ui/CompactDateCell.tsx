import { useTranslation } from '../../i18n/useTranslation'

interface CompactDateCellProps {
  value?: string | null
}

export function CompactDateCell({ value }: CompactDateCellProps) {
  const { locale } = useTranslation()

  if (!value || typeof value !== 'string' || !value.trim()) {
    return <span className="compact-date-cell">—</span>
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return <span className="compact-date-cell">—</span>
  }

  const intlLocale = locale === 'ar' ? 'ar-EG' : 'en-US'
  const formatted = date.toLocaleDateString(intlLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return <span className="compact-date-cell">{formatted}</span>
}
