import { useEffect, useState, type FormEvent } from 'react'
import { AlertTriangle, Ban } from 'lucide-react'
import { FormField, FormTextarea } from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useTranslation } from '../../i18n/useTranslation'
import * as expenseService from '../../services/expenseService'
import type { ExpenseResponse } from '../../types/expense'
import { translateApiError } from '../../utils/errors'
import { canVoidExpense } from '../../utils/expenseAccess'
import { formatMoney } from '../../utils/format'

interface ExpenseVoidModalProps {
  expense: ExpenseResponse | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ExpenseVoidModal({
  expense,
  isOpen,
  onClose,
  onSuccess,
}: ExpenseVoidModalProps) {
  const { t } = useTranslation()
  const canVoid = canVoidExpense()

  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setReason('')
      setError('')
      setValidationError('')
    }
  }, [isOpen])

  if (!isOpen || !expense || !canVoid) return null

  const isReasonValid = reason.trim().length > 0 && reason.trim().length <= 500

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!expense) return

    if (!reason.trim()) {
      setValidationError(t('expenses.void.reasonRequired'))
      return
    }

    if (reason.trim().length > 500) {
      setValidationError(t('errors.VALIDATION_FAILED.field', { constraint: 'max 500' }))
      return
    }

    setSubmitting(true)
    try {
      await expenseService.voidExpense(expense.id, { reason: reason.trim() })
      onSuccess()
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={t('expenses.void.title', { id: expense.id })}
      size="default"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t('expenses.void.cancel')}
          </Button>
          <Button
            type="submit"
            form="expense-void-form"
            variant="danger"
            disabled={submitting || !isReasonValid}
          >
            <Ban size={16} aria-hidden="true" />
            <span>{submitting ? t('expenses.void.submitting') : t('expenses.void.submit')}</span>
          </Button>
        </>
      }
    >
      <form id="expense-void-form" onSubmit={handleSubmit} noValidate>
        <div className="expenses-boundary-notice" role="alert">
          <AlertTriangle
            size={20}
            className="expenses-boundary-notice__icon"
            aria-hidden="true"
            style={{ color: 'var(--color-danger)' }}
          />
          <div>
            <strong>{t('expenses.void.permanentNotice')}</strong>
            <div style={{ marginBlockStart: 'var(--space-xs)' }}>
              {t('expenses.columns.amount')}: <code>{formatMoney(expense.amount)}</code> —{' '}
              {t('expenses.columns.date')}: <code>{expense.expenseDate}</code>
            </div>
          </div>
        </div>

        {error ? <div className="page-error-banner">{error}</div> : null}

        <FormField
          label={t('expenses.void.reasonLabel')}
          required
          error={validationError}
        >
          <FormTextarea
            rows={4}
            maxLength={500}
            placeholder={t('expenses.void.reasonPlaceholder')}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setValidationError('')
            }}
            disabled={submitting}
            required
            autoFocus
          />
        </FormField>
      </form>
    </Modal>
  )
}
