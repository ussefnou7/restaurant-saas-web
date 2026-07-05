import { useTranslation } from '../../i18n/useTranslation'
import { Button } from './Button'
import { Modal } from './Modal'

type ConfirmVariant = 'primary' | 'dangerConfirm'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: ConfirmVariant
  loading?: boolean
  loadingLabel?: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'dangerConfirm',
  loading = false,
  loadingLabel,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="default"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={loading}>
            {loading
              ? (loadingLabel ?? t('common.deleting'))
              : (confirmLabel ?? t('common.confirm'))}
          </Button>
        </>
      }
    >
      <p className="confirm-modal-message">{message}</p>
    </Modal>
  )
}
