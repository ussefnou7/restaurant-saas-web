import type { ReactNode } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { IconPause, IconPlay } from './icons'

interface RowActionGroupProps {
  children: ReactNode
}

export function RowActionGroup({ children }: RowActionGroupProps) {
  return <div className="action-group">{children}</div>
}

interface EditActionButtonProps {
  onClick: () => void
  disabled?: boolean
  label?: string
}

export function EditActionButton({ onClick, disabled, label }: EditActionButtonProps) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      className="action-btn action-btn--neutral"
      onClick={onClick}
      disabled={disabled}
    >
      {label ?? t('common.edit')}
    </button>
  )
}

interface PermissionsActionButtonProps {
  onClick: () => void
  disabled?: boolean
  label?: string
}

export function PermissionsActionButton({ onClick, disabled, label }: PermissionsActionButtonProps) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      className="action-btn action-btn--permissions"
      onClick={onClick}
      disabled={disabled}
    >
      {label ?? t('users.permissions')}
    </button>
  )
}

interface ActivateActionButtonProps {
  onClick: () => void
  disabled?: boolean
  entityName: string
}

export function ActivateActionButton({ onClick, disabled, entityName }: ActivateActionButtonProps) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      className="action-btn action-btn--status action-btn--activate"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${t('common.activate')} ${entityName}`}
      title={t('common.activate')}
    >
      <IconPlay />
      <span>{t('common.activate')}</span>
    </button>
  )
}

interface DeactivateActionButtonProps {
  onClick: () => void
  disabled?: boolean
  entityName: string
}

export function DeactivateActionButton({ onClick, disabled, entityName }: DeactivateActionButtonProps) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      className="action-btn action-btn--status action-btn--deactivate"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${t('common.deactivate')} ${entityName}`}
      title={t('common.deactivate')}
    >
      <IconPause />
      <span>{t('common.deactivate')}</span>
    </button>
  )
}

interface IconActionButtonProps {
  onClick: () => void
  disabled?: boolean
  className: string
  label: string
  tooltip?: string
  children: ReactNode
}

export function IconActionButton({
  onClick,
  disabled,
  className,
  label,
  tooltip,
  children,
}: IconActionButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={tooltip ?? label}
      data-tooltip={tooltip}
    >
      {children}
    </button>
  )
}
