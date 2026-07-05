import { useEffect, useState, type FormEvent } from 'react'
import { FormField, FormTextarea } from '../fields'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

type ConfirmVariant = 'primary' | 'dangerConfirm' | 'secondary'

interface PurchaseDocumentReasonModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  reasonLabel: string
  reasonRequired?: boolean
  reasonRequiredMessage?: string
  confirmVariant?: ConfirmVariant
  maxReasonLength?: number
  loading?: boolean
  loadingLabel?: string
  onConfirm: (reason: string) => void
  onClose: () => void
}

export function PurchaseDocumentReasonModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  reasonLabel,
  reasonRequired = false,
  reasonRequiredMessage,
  confirmVariant = 'primary',
  maxReasonLength = 500,
  loading = false,
  loadingLabel,
  onConfirm,
  onClose,
}: PurchaseDocumentReasonModalProps) {
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
    if (reasonRequired && !trimmed) {
      setReasonError(reasonRequiredMessage ?? '')
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
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            type="submit"
            form="purchase-document-reason-form"
            disabled={loading}
          >
            {loading ? loadingLabel : confirmLabel}
          </Button>
        </>
      }
    >
      <form id="purchase-document-reason-form" className="form" onSubmit={handleSubmit}>
        <p className="confirm-modal-message">{message}</p>
        <FormField label={reasonLabel} htmlFor="document-action-reason" error={reasonError}>
          <FormTextarea
            id="document-action-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value)
              if (reasonError) setReasonError('')
            }}
            rows={3}
            maxLength={maxReasonLength}
            disabled={loading}
          />
        </FormField>
      </form>
    </Modal>
  )
}
