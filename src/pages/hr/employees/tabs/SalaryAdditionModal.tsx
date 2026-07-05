import { useEffect, useState, type FormEvent } from 'react'
import { FieldGrid, FormField, FormInput, FormTextarea } from '../../../../components/fields'
import { Button } from '../../../../components/ui/Button'
import { Modal } from '../../../../components/ui/Modal'
import { useTranslation } from '../../../../i18n/useTranslation'
import * as salaryAdditionService from '../../../../services/salaryAdditionService'

interface SalaryAdditionModalProps {
  open: boolean
  employeeId: number
  onClose: () => void
  onSuccess: () => void
}

function currentMonthValue(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}-01`
}

export function SalaryAdditionModal({
  open,
  employeeId,
  onClose,
  onSuccess,
}: SalaryAdditionModalProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [salaryMonth, setSalaryMonth] = useState(currentMonthValue())
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setAmount('')
    setSalaryMonth(currentMonthValue())
    setNotes('')
    setError('')
  }, [open])

  function validate(): string | null {
    if (!title.trim()) return t('payroll.validation.titleRequired')
    if (!amount.trim()) return t('payroll.validation.amountRequired')
    const value = Number(amount)
    if (Number.isNaN(value) || value <= 0) return t('payroll.validation.amountPositive')
    if (!salaryMonth) return t('payroll.validation.monthRequired')
    return null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    try {
      await salaryAdditionService.createSalaryAddition({
        employeeId,
        title: title.trim(),
        amount: Number(amount),
        salaryMonth,
        notes: notes.trim() || undefined,
        active: true,
      })
      onSuccess()
      onClose()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      size="default"
      title={t('payroll.addAddition.title')}
      subtitle={t('payroll.addAddition.subtitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="salary-addition-form" variant="primary" disabled={saving}>
            {saving ? t('employees.actions.saving') : t('payroll.actions.addAdjustment')}
          </Button>
        </>
      }
    >
      <form id="salary-addition-form" className="form" onSubmit={(event) => void handleSubmit(event)}>
        {error ? <div className="alert-error">{error}</div> : null}
        <FieldGrid columns={2}>
          <FormField label={t('payroll.fields.title')} htmlFor="addition-title" disabled={saving}>
            <FormInput
              id="addition-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('payroll.fields.amount')} htmlFor="addition-amount" disabled={saving}>
            <FormInput
              id="addition-amount"
              type="number"
              min="0"
              step="0.01"
              ltr
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('payroll.fields.salaryMonth')} htmlFor="addition-month" disabled={saving}>
            <FormInput
              id="addition-month"
              type="date"
              ltr
              value={salaryMonth}
              onChange={(event) => setSalaryMonth(event.target.value)}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('payroll.fields.notes')} htmlFor="addition-notes" fullWidth disabled={saving}>
            <FormTextarea
              id="addition-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              disabled={saving}
            />
          </FormField>
        </FieldGrid>
      </form>
    </Modal>
  )
}
