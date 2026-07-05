import { useTranslation } from '../../i18n/useTranslation'

interface CreatedAtCellProps {
  value: string
}

function formatCreatedAt(value: string, locale: string): { date: string; time: string } {
  const date = new Date(value)
  const intlLocale = locale === 'ar' ? 'ar-EG' : 'en-US'
  return {
    date: date.toLocaleDateString(intlLocale, { year: 'numeric', month: 'short', day: 'numeric' }),
    time: date.toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' }),
  }
}

export function CreatedAtCell({ value }: CreatedAtCellProps) {
  const { locale } = useTranslation()
  const { date, time } = formatCreatedAt(value, locale)
  return (
    <div className="created-at-cell">
      <span className="created-at-date">{date}</span>
      <span className="created-at-time">{time}</span>
    </div>
  )
}
