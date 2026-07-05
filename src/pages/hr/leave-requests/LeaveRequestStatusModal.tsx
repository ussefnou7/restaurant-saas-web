import { useEffect, useState, type FormEvent } from 'react'
import { FormField, FormTextarea } from '../../../components/fields'
import { Modal } from '../../../components/ui/Modal'
import type { LeaveRequestResponse } from '../../../types/leaveRequest'

type StatusActionMode = 'approve' | 'reject' | 'cancel'

interface LeaveRequestStatusModalProps {
  open: boolean
  mode: StatusActionMode | null
  request: LeaveRequestResponse | null
  loading: boolean
  onClose: () => void
  onSubmit: (statusNote?: string) => void
}

const modalCopy: Record<
  StatusActionMode,
  { title: string; subtitle: string; confirmLabel: string; noteLabel?: string; noteRequired?: boolean }
> = {
  approve: {
    title: 'Approve Leave Request',
    subtitle: 'Confirm approval for this pending leave request.',
    confirmLabel: 'Approve',
  },
  reject: {
    title: 'Reject Leave Request',
    subtitle: 'Provide an optional note explaining why this request is rejected.',
    confirmLabel: 'Reject',
    noteLabel: 'Rejection note',
  },
  cancel: {
    title: 'Cancel Leave Request',
    subtitle: 'Cancel this pending leave request.',
    confirmLabel: 'Cancel Request',
    noteLabel: 'Cancellation note',
  },
}

export function LeaveRequestStatusModal({
  open,
  mode,
  request,
  loading,
  onClose,
  onSubmit,
}: LeaveRequestStatusModalProps) {
  const [statusNote, setStatusNote] = useState('')

  useEffect(() => {
    if (!open) return
    setStatusNote('')
  }, [open, mode, request?.id])

  if (!mode) return null

  const copy = modalCopy[mode]

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit(statusNote.trim() || undefined)
  }

  return (
    <Modal
      open={open}
      title={copy.title}
      subtitle={copy.subtitle}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={loading}>
            Close
          </button>
          <button
            type="submit"
            form="leave-request-status-form"
            className={mode === 'reject' ? 'button-danger' : 'button-primary'}
            disabled={loading}
          >
            {loading ? 'Saving…' : copy.confirmLabel}
          </button>
        </>
      }
    >
      <form id="leave-request-status-form" className="form" onSubmit={handleSubmit}>
        {request ? (
          <p className="confirm-modal-message">
            {request.employeeName ?? 'Employee'} · {request.leaveTypeName ?? 'Leave type'} ·{' '}
            {request.fromDate} to {request.toDate}
          </p>
        ) : null}

        {copy.noteLabel ? (
          <FormField label={copy.noteLabel} htmlFor="statusNote" disabled={loading}>
            <FormTextarea
              id="statusNote"
              value={statusNote}
              onChange={(event) => setStatusNote(event.target.value)}
              placeholder="Optional note"
              rows={3}
              disabled={loading}
            />
          </FormField>
        ) : null}
      </form>
    </Modal>
  )
}
