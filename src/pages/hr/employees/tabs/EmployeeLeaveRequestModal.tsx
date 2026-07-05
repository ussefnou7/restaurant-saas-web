import { useEffect, useMemo, useState, type FormEvent } from 'react'
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
import * as leaveRequestService from '../../../../services/leaveRequestService'
import type { LeaveBalanceResponse } from '../../../../types/leaveBalance'
import { isForbiddenError, translateApiError } from '../../../../utils/errors'
import { calculateInclusiveDays } from '../../../../utils/leaveRequest'
import { formatLeaveBalanceOptionLabel } from '../../../../utils/leaveDisplay'

interface EmployeeLeaveRequestModalProps {
  open: boolean
  employeeId: number
  onClose: () => void
  onSuccess: () => void
}

const emptyForm = {
  leaveTypeId: '',
  fromDate: '',
  toDate: '',
  reason: '',
}

export function EmployeeLeaveRequestModal({
  open,
  employeeId,
  onClose,
  onSuccess,
}: EmployeeLeaveRequestModalProps) {
  const { t, locale } = useTranslation()
  const [form, setForm] = useState(emptyForm)
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceResponse[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const daysCount = useMemo(
    () => calculateInclusiveDays(form.fromDate, form.toDate),
    [form.fromDate, form.toDate],
  )

  useEffect(() => {
    if (!open) return
    setForm(emptyForm)
    setError('')
  }, [open])

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function loadBalances() {
      setLoadingOptions(true)
      try {
        const data = await employeeHrService.getEmployeeLeaveBalances(employeeId)
        if (!cancelled) {
          setLeaveBalances(data.filter((item) => item.active))
        }
      } catch (err) {
        if (!cancelled) {
          if (isForbiddenError(err)) {
            setError(t('leaveAssign.errors.forbidden'))
          } else {
            setError(translateApiError(err, t).message)
          }
        }
      } finally {
        if (!cancelled) setLoadingOptions(false)
      }
    }

    void loadBalances()
    return () => {
      cancelled = true
    }
  }, [open, employeeId, t])

  const leaveTypeOptions = useMemo(
    () => [
      { value: '', label: t('leaves.validation.leaveTypeRequired') },
      ...leaveBalances.map((balance) => ({
        value: String(balance.leaveTypeId),
        label: formatLeaveBalanceOptionLabel(balance, locale, t('leaveAssign.units.days')),
      })),
    ],
    [leaveBalances, locale, t],
  )

  function validate(): string | null {
    if (!form.leaveTypeId) return t('leaves.validation.leaveTypeRequired')
    if (!form.fromDate) return t('leaves.validation.fromDateRequired')
    if (!form.toDate) return t('leaves.validation.toDateRequired')
    if (daysCount <= 0) return t('leaves.validation.invalidRange')
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
        await employeeHrService.createEmployeeLeaveRequest(employeeId, {
          leaveTypeId: Number(form.leaveTypeId),
          fromDate: form.fromDate,
          toDate: form.toDate,
          daysCount,
          reason: form.reason.trim() || undefined,
        })
      } catch {
        await leaveRequestService.createLeaveRequest({
          employeeId,
          leaveTypeId: Number(form.leaveTypeId),
          fromDate: form.fromDate,
          toDate: form.toDate,
          daysCount,
          reason: form.reason.trim() || undefined,
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

  const disabled = saving || loadingOptions
  const noActiveBalances = !loadingOptions && leaveBalances.length === 0

  return (
    <Modal
      open={open}
      size="default"
      title={t('leaves.create.title')}
      subtitle={t('leaves.create.subtitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="employee-leave-form"
            variant="primary"
            disabled={disabled || noActiveBalances}
          >
            {saving ? t('employees.actions.saving') : t('leaves.actions.createRequest')}
          </Button>
        </>
      }
    >
      <form id="employee-leave-form" className="form" onSubmit={(event) => void handleSubmit(event)}>
        {error ? <div className="alert-error">{error}</div> : null}
        {noActiveBalances ? (
          <div className="alert-error">{t('leaveAssign.empty.subtitle')}</div>
        ) : null}
        <FieldGrid columns={2}>
          <FormField label={t('leaves.fields.leaveType')} disabled={disabled || noActiveBalances}>
            <Dropdown
              value={form.leaveTypeId}
              onChange={(leaveTypeId) => setForm((prev) => ({ ...prev, leaveTypeId }))}
              options={leaveTypeOptions}
              ariaLabel={t('leaves.fields.leaveType')}
              className={formDropdownClassName()}
              disabled={disabled || noActiveBalances}
            />
          </FormField>
          <FormField label={t('leaves.fields.fromDate')} htmlFor="leave-from" disabled={saving}>
            <FormInput
              id="leave-from"
              type="date"
              ltr
              value={form.fromDate}
              onChange={(event) => setForm((prev) => ({ ...prev, fromDate: event.target.value }))}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('leaves.fields.toDate')} htmlFor="leave-to" disabled={saving}>
            <FormInput
              id="leave-to"
              type="date"
              ltr
              value={form.toDate}
              onChange={(event) => setForm((prev) => ({ ...prev, toDate: event.target.value }))}
              disabled={saving}
              required
            />
          </FormField>
          {daysCount > 0 ? (
            <p className="field-helper field-box--full">
              {t('leaves.create.daysPreview', { count: daysCount })}
            </p>
          ) : null}
          <FormField label={t('leaves.fields.reason')} htmlFor="leave-reason" fullWidth disabled={saving}>
            <FormTextarea
              id="leave-reason"
              value={form.reason}
              onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
              rows={2}
              disabled={saving}
            />
          </FormField>
        </FieldGrid>
      </form>
    </Modal>
  )
}
