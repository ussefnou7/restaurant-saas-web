import { AlertCircle } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'
import { Button } from './Button'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation()

  return (
    <div className="list-state list-state--error" role="alert">
      <AlertCircle className="list-state__icon" size={32} strokeWidth={1.5} aria-hidden="true" />
      <p className="list-state__title">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      ) : null}
    </div>
  )
}
