import { useTranslation } from '../../i18n/useTranslation'

interface CompactDateCellProps {
  value: string
}

export function CompactDateCell({ value }: CompactDateCellProps) {
  const { locale } = useTranslation()
  const intlLocale = locale === 'ar' ? 'ar-EG' : 'en-US'
  const formatted = new Date(value).toLocaleDateString(intlLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return <span className="compact-date-cell">{formatted}</span>
}
