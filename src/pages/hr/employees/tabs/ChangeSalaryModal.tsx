import { useEffect, useState, type FormEvent } from 'react'
import { FieldGrid, FormField, FormInput, FormTextarea } from '../../../../components/fields'
import { Button } from '../../../../components/ui/Button'
import { Modal } from '../../../../components/ui/Modal'
import { useTranslation } from '../../../../i18n/useTranslation'
import * as employeeHrService from '../../../../services/employeeHrService'
import * as employeeService from '../../../../services/employeeService'
import type { EmployeeResponse } from '../../../../types/employee'
import { getEmployeeFormNames } from '../../../../utils/employeeDisplay'

interface ChangeSalaryModalProps {
  open: boolean
  employee: EmployeeResponse
  onClose: () => void
  onSuccess: (employee: EmployeeResponse) => void
}

function currentDateValue(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function ChangeSalaryModal({
  open,
  employee,
  onClose,
  onSuccess,
}: ChangeSalaryModalProps) {
  const { t } = useTranslation()
  const [salary, setSalary] = useState(String(employee.salary))
  const [effectiveFrom, setEffectiveFrom] = useState(currentDateValue())
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setSalary(String(employee.salary))
    setEffectiveFrom(currentDateValue())
    setNotes('')
    setError('')
  }, [open, employee.salary])

  function validate(): string | null {
    if (!salary.trim()) return t('employees.validation.salaryRequired')
    const value = Number(salary)
    if (Number.isNaN(value) || value <= 0) return t('employees.validation.salaryPositive')
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
        await employeeHrService.createEmployeeSalary(employee.id, {
          amount: Number(salary),
          effectiveFrom,
          notes: notes.trim() || undefined,
        })
        const refreshed = await employeeService.getEmployee(employee.id)
        onSuccess(refreshed)
        onClose()
        return
      } catch {
        const names = getEmployeeFormNames(employee)
        const updated = await employeeService.updateEmployee(employee.id, {
          branchId: employee.branchId,
          jobId: employee.jobId,
          appUserId: employee.appUserId ?? null,
          employeeCode: employee.employeeCode,
          fullName: names.fullName,
          fullNameAr: employee.fullNameAr ?? null,
          phone: employee.phone ?? undefined,
          email: employee.email ?? undefined,
          nationalId: employee.nationalId ?? undefined,
          address: employee.address ?? undefined,
          hireDate: employee.hireDate.split('T')[0] ?? employee.hireDate,
          salary: Number(salary),
          active: employee.active,
          notes: employee.notes ?? undefined,
        })
        onSuccess(updated)
        onClose()
      }
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
      title={t('payroll.changeSalary.title')}
      subtitle={t('payroll.changeSalary.subtitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="change-salary-form" variant="primary" disabled={saving}>
            {saving ? t('employees.actions.saving') : t('payroll.actions.changeSalary')}
          </Button>
        </>
      }
    >
      <form id="change-salary-form" className="form" onSubmit={(event) => void handleSubmit(event)}>
        {error ? <div className="alert-error">{error}</div> : null}
        <FieldGrid columns={2}>
          <FormField label={t('payroll.fields.salaryAmount')} htmlFor="change-salary-amount" disabled={saving}>
            <FormInput
              id="change-salary-amount"
              type="number"
              min="0"
              step="0.01"
              ltr
              value={salary}
              onChange={(event) => setSalary(event.target.value)}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('payroll.fields.effectiveFrom')} htmlFor="change-salary-effective" disabled={saving}>
            <FormInput
              id="change-salary-effective"
              type="date"
              ltr
              value={effectiveFrom}
              onChange={(event) => setEffectiveFrom(event.target.value)}
              disabled={saving}
            />
          </FormField>
          <FormField label={t('payroll.fields.notes')} htmlFor="change-salary-notes" fullWidth disabled={saving}>
            <FormTextarea
              id="change-salary-notes"
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
