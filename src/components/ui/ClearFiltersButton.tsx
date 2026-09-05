import { RotateCcw } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'

export interface ClearFiltersButtonProps {
  onClick: () => void
  disabled?: boolean
  className?: string
  label?: string
}

export function ClearFiltersButton({
  onClick,
  disabled = false,
  className = '',
  label,
}: ClearFiltersButtonProps) {
  const { t } = useTranslation()
  const buttonText = label || t('common.clear')

  return (
    <button
      type="button"
      className={`filter-reset-btn${className ? ` ${className}` : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={buttonText}
      aria-label={buttonText}
    >
      <RotateCcw size={14} aria-hidden="true" />
      <span>{buttonText}</span>
    </button>
  )
}
