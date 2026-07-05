import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  FieldGrid,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  SectionGroup,
} from '../../../components/fields'
import { Modal } from '../../../components/ui/Modal'
import { useTranslation } from '../../../i18n/useTranslation'
import * as employeeHrService from '../../../services/employeeHrService'
import * as employeeService from '../../../services/employeeService'
import * as leaveRequestService from '../../../services/leaveRequestService'
import type { EmployeeResponse } from '../../../types/employee'
import type { LeaveBalanceResponse } from '../../../types/leaveBalance'
import { isForbiddenError, translateApiError } from '../../../utils/errors'
import { calculateInclusiveDays } from '../../../utils/leaveRequest'
import { formatLeaveBalanceOptionLabel } from '../../../utils/leaveDisplay'

interface LeaveRequestFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const emptyForm = {
  employeeId: '',
  leaveTypeId: '',
  fromDate: '',
  toDate: '',
  reason: '',
}

export function LeaveRequestFormModal({ open, onClose, onSuccess }: LeaveRequestFormModalProps) {
  const { t, locale } = useTranslation()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [loadingBalances, setLoadingBalances] = useState(false)
  const [employees, setEmployees] = useState<EmployeeResponse[]>([])
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceResponse[]>([])

  const daysCount = useMemo(
    () => calculateInclusiveDays(form.fromDate, form.toDate),
    [form.fromDate, form.toDate],
  )

  useEffect(() => {
    if (!open) return
    setForm(emptyForm)
    setError('')
    setLeaveBalances([])
  }, [open])

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function loadEmployees() {
      setLoadingOptions(true)
      try {
        const employeeData = await employeeService.getEmployees()
        if (!cancelled) {
          setEmployees(employeeData.filter((employee) => employee.active))
        }
      } catch (err) {
        if (!cancelled) {
          setError(translateApiError(err, t).message)
        }
      } finally {
        if (!cancelled) {
          setLoadingOptions(false)
        }
      }
    }

    void loadEmployees()

    return () => {
      cancelled = true
    }
  }, [open, t])

  useEffect(() => {
    if (!open || !form.employeeId) {
      setLeaveBalances([])
      return
    }

    let cancelled = false

    async function loadBalances() {
      setLoadingBalances(true)
      setError('')
      try {
        const data = await employeeHrService.getEmployeeLeaveBalances(form.employeeId)
        if (!cancelled) {
          setLeaveBalances(data.filter((item) => item.active))
          setForm((prev) => ({ ...prev, leaveTypeId: '' }))
        }
      } catch (err) {
        if (!cancelled) {
          setLeaveBalances([])
          if (isForbiddenError(err)) {
            setError(t('leaveAssign.errors.forbidden'))
          } else {
            setError(translateApiError(err, t).message)
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingBalances(false)
        }
      }
    }

    void loadBalances()

    return () => {
      cancelled = true
    }
  }, [open, form.employeeId, t])

  function validate(): string | null {
    if (!form.employeeId) return t('leaves.validation.employeeRequired')
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
      await leaveRequestService.createLeaveRequest({
        employeeId: Number(form.employeeId),
        leaveTypeId: Number(form.leaveTypeId),
        fromDate: form.fromDate,
        toDate: form.toDate,
        daysCount,
        reason: form.reason.trim() || undefined,
      })
      onSuccess()
      onClose()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  const disabled = saving || loadingOptions || loadingBalances
  const noActiveBalances = Boolean(form.employeeId) && !loadingBalances && leaveBalances.length === 0

  return (
    <Modal
      open={open}
      size="wide"
      title={t('leaves.create.title')}
      subtitle={t('leaves.create.subtitle')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            form="leave-request-form"
            className="button-primary"
            disabled={disabled || noActiveBalances}
          >
            {saving ? t('common.loading') : t('leaves.actions.createRequest')}
          </button>
        </>
      }
    >
      <form id="leave-request-form" className="form" onSubmit={handleSubmit}>
        {error ? <div className="alert-error">{error}</div> : null}
        {loadingOptions || loadingBalances ? (
          <p className="field-helper">{t('common.loading')}</p>
        ) : null}
        {noActiveBalances ? (
          <div className="alert-error">{t('leaveAssign.empty.subtitle')}</div>
        ) : null}

        <SectionGroup title={t('leaves.fields.leaveType')}>
          <FieldGrid columns={2}>
            <FormField label={t('employees.col.employee')} htmlFor="leaveEmployeeId" disabled={disabled}>
              <FormSelect
                id="leaveEmployeeId"
                value={form.employeeId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    employeeId: event.target.value,
                    leaveTypeId: '',
                  }))
                }
                required
                disabled={disabled}
              >
                <option value="">{t('leaves.validation.employeeRequired')}</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName} ({employee.employeeCode})
                  </option>
                ))}
              </FormSelect>
            </FormField>

            <FormField label={t('leaves.fields.leaveType')} htmlFor="leaveTypeId" disabled={disabled}>
              <FormSelect
                id="leaveTypeId"
                value={form.leaveTypeId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, leaveTypeId: event.target.value }))
                }
                required
                disabled={disabled || !form.employeeId || noActiveBalances}
              >
                <option value="">{t('leaves.validation.leaveTypeRequired')}</option>
                {leaveBalances.map((balance) => (
                  <option key={balance.id} value={balance.leaveTypeId}>
                    {formatLeaveBalanceOptionLabel(balance, locale, t('leaveAssign.units.days'))}
                  </option>
                ))}
              </FormSelect>
            </FormField>
          </FieldGrid>
        </SectionGroup>

        <SectionGroup title={t('leaves.fields.daysCount')}>
          <FieldGrid columns={2}>
            <FormField label={t('leaves.fields.fromDate')} htmlFor="fromDate" disabled={disabled}>
              <FormInput
                id="fromDate"
                type="date"
                ltr
                value={form.fromDate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, fromDate: event.target.value }))
                }
                required
                disabled={disabled}
              />
            </FormField>

            <FormField label={t('leaves.fields.toDate')} htmlFor="toDate" disabled={disabled}>
              <FormInput
                id="toDate"
                type="date"
                ltr
                value={form.toDate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, toDate: event.target.value }))
                }
                required
                disabled={disabled}
              />
            </FormField>

            <FormField label={t('leaves.fields.daysCount')} htmlFor="daysCount" disabled>
              <FormInput
                id="daysCount"
                type="text"
                ltr
                value={daysCount > 0 ? String(daysCount) : ''}
                readOnly
                disabled
              />
            </FormField>
          </FieldGrid>
        </SectionGroup>

        <SectionGroup title={t('leaves.fields.reason')}>
          <FieldGrid columns={2}>
            <FormField label={t('leaves.fields.reason')} htmlFor="leaveReason" fullWidth disabled={disabled}>
              <FormTextarea
                id="leaveReason"
                value={form.reason}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, reason: event.target.value }))
                }
                rows={3}
                disabled={disabled}
              />
            </FormField>
          </FieldGrid>
        </SectionGroup>
      </form>
    </Modal>
  )
}
