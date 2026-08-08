import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { IconActionButton } from '../../ui/RowActions'
import { useTranslation } from '../../../i18n/useTranslation'

interface DocumentBackButtonProps {
  to?: string
  onClick?: () => void
  disabled?: boolean
}

export function DocumentBackButton({ to, onClick, disabled }: DocumentBackButtonProps) {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()

  function handleClick() {
    if (onClick) {
      onClick()
    } else if (to) {
      navigate(to)
    }
  }

  return (
    <IconActionButton
      className="action-btn action-btn--icon action-btn--header-back"
      label={t('common.back')}
      onClick={handleClick}
      disabled={disabled}
    >
      {locale === 'ar' ? <ArrowRight size={20} aria-hidden /> : <ArrowLeft size={20} aria-hidden />}
    </IconActionButton>
  )
}
