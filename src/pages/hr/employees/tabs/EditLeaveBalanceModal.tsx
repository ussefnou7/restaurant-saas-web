import { useEffect, useState, type FormEvent } from 'react'
import {
  DetailField,
  FieldGrid,
  FormField,
  FormInput,
  FormTextarea,
  StatusSwitch,
} from '../../../../components/fields'
import { Button } from '../../../../components/ui/Button'
import { Modal } from '../../../../components/ui/Modal'
import { useTranslation } from '../../../../i18n/useTranslation'
import * as employeeHrService from '../../../../services/employeeHrService'
import type { LeaveBalanceResponse } from '../../../../types/leaveBalance'
import { formatDecimalDays, getLocalizedLeaveTypeName } from '../../../../utils/leaveDisplay'

interface EditLeaveBalanceModalProps {
  open: boolean
  balance: LeaveBalanceResponse | null
  onClose: () => void
  onSuccess: () => void
}

const emptyForm = {
  openingBalance: '',
  assignedDays: '',
  active: true,
  notes: '',
}

export function EditLeaveBalanceModal({
  open,
  balance,
  onClose,
  onSuccess,
}: EditLeaveBalanceModalProps) {
  const { t, locale } = useTranslation()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !balance) return

    setError('')
    setForm({
      openingBalance: String(balance.openingBalance ?? 0),
      assignedDays: String(balance.assignedDays ?? 0),
      active: balance.active,
      notes: balance.notes?.trim() ?? '',
    })
  }, [open, balance])

  function validate(): string | null {
    if (form.openingBalance.trim() === '') {
      return t('leaveAssign.validation.openingBalanceMin')
    }
    const openingBalance = Number(form.openingBalance)
    if (Number.isNaN(openingBalance) || openingBalance < 0) {
      return t('leaveAssign.validation.openingBalanceMin')
    }

    if (form.assignedDays.trim() === '') {
      return t('leaveAssign.validation.assignedDaysMin')
    }
    const assignedDays = Number(form.assignedDays)
    if (Number.isNaN(assignedDays) || assignedDays < 0) {
      return t('leaveAssign.validation.assignedDaysMin')
    }

    return null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!balance) return

    setError('')
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    try {
      await employeeHrService.updateLeaveBalance(balance.id, {
        openingBalance: Number(form.openingBalance),
        assignedDays: Number(form.assignedDays),
        active: form.active,
        notes: form.notes.trim() || undefined,
      })
      onSuccess()
      onClose()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  if (!balance) return null

  const leaveTypeName = getLocalizedLeaveTypeName(balance, locale)

  return (
    <Modal
      open={open}
      size="default"
      title={t('leaveAssign.actions.edit')}
      subtitle={t('leaveAssign.subtitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="edit-leave-balance-form" variant="primary" disabled={saving}>
            {saving ? t('common.loading') : t('leaveAssign.actions.save')}
          </Button>
        </>
      }
    >
      <form
        id="edit-leave-balance-form"
        className="form"
        onSubmit={(event) => void handleSubmit(event)}
      >
        {error ? <div className="alert-error">{error}</div> : null}

        <FieldGrid columns={2}>
          <DetailField label={t('leaveAssign.fields.leaveType')} value={leaveTypeName} />
          <DetailField
            label={t('leaveAssign.fields.year')}
            value={balance.year}
            dir="ltr"
          />
          <DetailField
            label={t('leaveAssign.fields.usedDays')}
            value={formatDecimalDays(balance.usedDays)}
            dir="ltr"
          />
          <DetailField
            label={t('leaveAssign.fields.remainingDays')}
            value={formatDecimalDays(balance.remainingDays)}
            dir="ltr"
          />

          <FormField label={t('leaveAssign.fields.openingBalance')} htmlFor="leaveOpeningBalance">
            <FormInput
              id="leaveOpeningBalance"
              type="number"
              min={0}
              step="0.5"
              ltr
              value={form.openingBalance}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, openingBalance: event.target.value }))
              }
              required
              disabled={saving}
            />
          </FormField>

          <FormField label={t('leaveAssign.fields.assignedDays')} htmlFor="leaveAssignedDays">
            <FormInput
              id="leaveAssignedDays"
              type="number"
              min={0}
              step="0.5"
              ltr
              value={form.assignedDays}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, assignedDays: event.target.value }))
              }
              required
              disabled={saving}
            />
          </FormField>

          <FormField label={t('leaveAssign.fields.status')} htmlFor="leaveBalanceActive">
            <StatusSwitch
              active={form.active}
              disabled={saving}
              onChange={(active) => setForm((prev) => ({ ...prev, active }))}
            />
          </FormField>

          <FormField label={t('leaveAssign.fields.notes')} htmlFor="leaveBalanceNotes" fullWidth>
            <FormTextarea
              id="leaveBalanceNotes"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              rows={2}
              disabled={saving}
            />
          </FormField>
        </FieldGrid>
      </form>
    </Modal>
  )
}
