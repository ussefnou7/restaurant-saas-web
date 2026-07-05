import { useEffect, useState, type FormEvent } from 'react'
import { FormField, FormInput } from '../fields'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface PurchaseDocumentCancelModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  reasonLabel: string
  reasonRequiredMessage: string
  loading?: boolean
  loadingLabel?: string
  onConfirm: (reason: string) => void
  onClose: () => void
}

export function PurchaseDocumentCancelModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  reasonLabel,
  reasonRequiredMessage,
  loading = false,
  loadingLabel,
  onConfirm,
  onClose,
}: PurchaseDocumentCancelModalProps) {
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  useEffect(() => {
    if (!open) return
    setReason('')
    setReasonError('')
  }, [open])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = reason.trim()
    if (!trimmed) {
      setReasonError(reasonRequiredMessage)
      return
    }
    onConfirm(trimmed)
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="default"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel ?? 'إلغاء'}
          </Button>
          <Button
            variant="dangerConfirm"
            type="submit"
            form="purchase-document-cancel-form"
            disabled={loading}
          >
            {loading ? (loadingLabel ?? 'جاري التحميل…') : (confirmLabel ?? 'تأكيد')}
          </Button>
        </>
      }
    >
      <form id="purchase-document-cancel-form" className="form" onSubmit={handleSubmit}>
        <p className="confirm-modal-message">{message}</p>
        <FormField label={reasonLabel} htmlFor="cancel-reason" error={reasonError}>
          <FormInput
            id="cancel-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              if (reasonError) setReasonError('')
            }}
            disabled={loading}
          />
        </FormField>
      </form>
    </Modal>
  )
}
