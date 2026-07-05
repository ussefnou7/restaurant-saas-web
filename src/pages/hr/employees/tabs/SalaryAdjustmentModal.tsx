import { useEffect, useState, type FormEvent } from 'react'
import {
  FieldGrid,
  FormField,
  FormInput,
  FormTextarea,
  formDropdownClassName,
} from '../../../../components/fields'
import { Button } from '../../../../components/ui/Button'
import { Dropdown } from '../../../../components/ui/Dropdown'
import { Modal } from '../../../../components/ui/Modal'
import { useTranslation } from '../../../../i18n/useTranslation'
import * as employeeHrService from '../../../../services/employeeHrService'
import * as salaryAdditionService from '../../../../services/salaryAdditionService'
import type { SalaryAdjustmentType } from '../../../../types/salaryAdjustment'

interface SalaryAdjustmentModalProps {
  open: boolean
  employeeId: number
  onClose: () => void
  onSuccess: () => void
}

function currentDateValue(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function SalaryAdjustmentModal({
  open,
  employeeId,
  onClose,
  onSuccess,
}: SalaryAdjustmentModalProps) {
  const { t } = useTranslation()
  const [type, setType] = useState<SalaryAdjustmentType>('ADDITION')
  const [amount, setAmount] = useState('')
  const [adjustmentDate, setAdjustmentDate] = useState(currentDateValue())
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setType('ADDITION')
    setAmount('')
    setAdjustmentDate(currentDateValue())
    setReason('')
    setNotes('')
    setError('')
  }, [open])

  const typeOptions = [
    { value: 'ADDITION', label: t('payroll.types.addition') },
    { value: 'DEDUCTION', label: t('payroll.types.deduction') },
  ]

  function validate(): string | null {
    if (!amount.trim()) return t('payroll.validation.amountRequired')
    const value = Number(amount)
    if (Number.isNaN(value) || value <= 0) return t('payroll.validation.amountPositive')
    if (!adjustmentDate) return t('payroll.validation.dateRequired')
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
      try {
        await employeeHrService.createEmployeeSalaryAdjustment(employeeId, {
          type,
          amount: Number(amount),
          adjustmentDate,
          reason: reason.trim() || undefined,
          notes: notes.trim() || undefined,
        })
      } catch {
        await salaryAdditionService.createSalaryAddition({
          employeeId,
          title: reason.trim() || t('payroll.types.addition'),
          amount: Number(amount),
          salaryMonth: adjustmentDate,
          notes: notes.trim() || undefined,
          active: true,
        })
      }
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
      title={t('payroll.addAdjustment.title')}
      subtitle={t('payroll.addAdjustment.subtitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="salary-adjustment-form" variant="primary" disabled={saving}>
            {saving ? t('employees.actions.saving') : t('payroll.actions.addAdjustment')}
          </Button>
        </>
      }
    >
      <form
        id="salary-adjustment-form"
        className="form"
        onSubmit={(event) => void handleSubmit(event)}
      >
        {error ? <div className="alert-error">{error}</div> : null}
        <FieldGrid columns={2}>
          <FormField label={t('payroll.fields.adjustmentType')} disabled={saving}>
            <Dropdown
              value={type}
              onChange={(value) => setType(value as SalaryAdjustmentType)}
              options={typeOptions}
              ariaLabel={t('payroll.fields.adjustmentType')}
              className={formDropdownClassName()}
              disabled={saving}
            />
          </FormField>
          <FormField label={t('payroll.fields.amount')} htmlFor="adjustment-amount" disabled={saving}>
            <FormInput
              id="adjustment-amount"
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
          <FormField label={t('payroll.fields.adjustmentDate')} htmlFor="adjustment-date" disabled={saving}>
            <FormInput
              id="adjustment-date"
              type="date"
              ltr
              value={adjustmentDate}
              onChange={(event) => setAdjustmentDate(event.target.value)}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('payroll.fields.reason')} htmlFor="adjustment-reason" disabled={saving}>
            <FormInput
              id="adjustment-reason"
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={saving}
            />
          </FormField>
          <FormField label={t('payroll.fields.notes')} htmlFor="adjustment-notes" fullWidth disabled={saving}>
            <FormTextarea
              id="adjustment-notes"
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
