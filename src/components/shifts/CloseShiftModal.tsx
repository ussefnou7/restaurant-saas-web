import { useEffect, useState, type FormEvent } from 'react'
import { Lock } from 'lucide-react'
import { DetailField, FormField, FormInput } from '../fields'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { useNotify } from '../ui/NotificationContext'
import { useTranslation } from '../../i18n/useTranslation'
import * as shiftService from '../../services/shiftService'
import type { ShiftListItemResponse } from '../../types/shift'
import { translateApiError } from '../../utils/errors'
import { formatDate, formatDateTime } from '../../utils/format'

export interface CloseShiftModalProps {
  shift: ShiftListItemResponse | null
  open: boolean
  onClose: () => void
  onSuccess: (updatedShift?: ShiftListItemResponse) => void
}

export function CloseShiftModal({
  shift,
  open,
  onClose,
  onSuccess,
}: CloseShiftModalProps) {
  const { t, locale } = useTranslation()
  const notify = useNotify()

  const [closingCount, setClosingCount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')

  useEffect(() => {
    if (open) {
      setClosingCount('')
      setError('')
      setFieldError('')
    }
  }, [open, shift?.id])

  if (!open || !shift) return null

  function validateCount(value: string): string | null {
    const trimmed = value.trim()
    if (!trimmed) {
      return t('shifts.close.validationRequired')
    }
    const num = Number(trimmed)
    if (Number.isNaN(num)) {
      return t('shifts.close.validationNumber')
    }
    if (num < 0) {
      return t('shifts.close.validationMin')
    }
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!shift) return

    setError('')
    const validationErr = validateCount(closingCount)
    if (validationErr) {
      setFieldError(validationErr)
      return
    }

    setSubmitting(true)
    try {
      const updated = await shiftService.closeShift(shift.id, {
        closingCount: Number(closingCount.trim()),
      })
      notify.success(t('shifts.close.success', { id: shift.id }))
      onSuccess(updated)
      onClose()
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setSubmitting(false)
    }
  }

  const isFormValid = closingCount.trim().length > 0 && !validateCount(closingCount)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('shifts.close.title', { id: shift.id })}
      subtitle={t('shifts.close.subtitle')}
      size="default"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t('shifts.close.cancel')}
          </Button>
          <Button
            type="submit"
            form="close-shift-form"
            variant="primary"
            disabled={submitting || !isFormValid}
          >
            <Lock size={16} aria-hidden="true" />
            <span>{submitting ? t('shifts.close.submitting') : t('shifts.close.submit')}</span>
          </Button>
        </>
      }
    >
      <div className="shift-close-fields">
        <DetailField
          label={t('shifts.close.cashier')}
          value={shift.cashierName ?? t('common.empty.dash')}
          className="field-box--sm"
        />
        <DetailField
          label={t('shifts.close.device')}
          value={shift.deviceName}
          className="field-box--sm"
        />
        <DetailField
          label={t('shifts.close.branch')}
          value={shift.branchName}
          className="field-box--sm"
        />
        <DetailField
          label={t('shifts.close.businessDate')}
          value={formatDate(shift.businessDate, locale)}
          className="field-box--sm"
        />
        <DetailField
          label={t('shifts.close.openedAt')}
          value={formatDateTime(shift.openedAt, locale)}
          className="field-box--sm field-box--full"
        />
      </div>

      {error ? <div className="page-error-banner">{error}</div> : null}

      <form id="close-shift-form" className="shift-close-form" onSubmit={handleSubmit} noValidate>
        <FormField
          label={t('shifts.close.closingCount')}
          required
          error={fieldError}
          helper={!fieldError ? t('shifts.close.closingCountHelp') : undefined}
          htmlFor="closing-count-input"
        >
          <FormInput
            id="closing-count-input"
            type="number"
            step="0.01"
            min="0"
            placeholder={t('shifts.close.closingCountPlaceholder')}
            value={closingCount}
            onChange={(e) => {
              setClosingCount(e.target.value)
              if (fieldError) setFieldError('')
            }}
            disabled={submitting}
            required
            autoFocus
            ltr
          />
        </FormField>
      </form>
    </Modal>
  )
}
