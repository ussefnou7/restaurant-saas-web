import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import {
  FieldGrid,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  SectionGroup,
  StatusSwitch,
} from '../../../components/fields'
import { Modal } from '../../../components/ui/Modal'
import { TenantCodeInput } from '../../../components/ui/TenantCodeInput'
import { useTranslation } from '../../../i18n/useTranslation'
import * as branchService from '../../../services/branchService'
import * as employeeService from '../../../services/employeeService'
import * as jobService from '../../../services/jobService'
import * as userService from '../../../services/userService'
import type { BranchResponse } from '../../../types/branch'
import type { EmployeeResponse } from '../../../types/employee'
import type { JobResponse } from '../../../types/job'
import type { UserResponse } from '../../../types/user'
import { translateApiError } from '../../../utils/errors'

type FormMode = 'create' | 'edit'

interface EmployeeFormModalProps {
  open: boolean
  mode: FormMode
  employee?: EmployeeResponse | null
  onClose: () => void
  onSuccess: () => void
}

const emptyForm = {
  branchId: '',
  jobId: '',
  appUserId: '',
  employeeCode: '',
  fullName: '',
  fullNameAr: '',
  phone: '',
  email: '',
  nationalId: '',
  address: '',
  hireDate: '',
  salary: '',
  active: true,
  notes: '',
}

function toDateInputValue(value?: string | null): string {
  if (!value) return ''
  return value.split('T')[0] ?? ''
}

function buildBranchOptions(
  branches: BranchResponse[],
  currentBranchId?: number | null,
): BranchResponse[] {
  const active = branches.filter((branch) => branch.active)
  if (!currentBranchId) return active

  const current = branches.find((branch) => branch.id === currentBranchId)
  if (!current || active.some((branch) => branch.id === currentBranchId)) {
    return active
  }

  return [current, ...active]
}

function buildJobOptions(jobs: JobResponse[], currentJobId?: number | null): JobResponse[] {
  const active = jobs.filter((job) => job.active)
  if (!currentJobId) return active

  const current = jobs.find((job) => job.id === currentJobId)
  if (!current || active.some((job) => job.id === currentJobId)) {
    return active
  }

  return [current, ...active]
}

function getEmployeeFormNames(employee: EmployeeResponse) {
  return {
    fullName: employee.fullNameEn ?? employee.fullName,
    fullNameAr: employee.fullNameAr ?? '',
  }
}

export function EmployeeFormModal({
  open,
  mode,
  employee,
  onClose,
  onSuccess,
}: EmployeeFormModalProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [jobs, setJobs] = useState<JobResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])

  const isCreate = mode === 'create'

  useEffect(() => {
    if (!open) return

    setError('')
    if (isCreate) {
      setForm(emptyForm)
    } else if (employee) {
      const names = getEmployeeFormNames(employee)
      setForm({
        branchId: String(employee.branchId),
        jobId: String(employee.jobId),
        appUserId: employee.appUserId ? String(employee.appUserId) : '',
        employeeCode: employee.employeeCode,
        fullName: names.fullName,
        fullNameAr: names.fullNameAr,
        phone: employee.phone ?? '',
        email: employee.email ?? '',
        nationalId: employee.nationalId ?? '',
        address: employee.address ?? '',
        hireDate: toDateInputValue(employee.hireDate),
        salary: String(employee.salary),
        active: employee.active,
        notes: employee.notes ?? '',
      })
    }
  }, [open, isCreate, employee])

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function loadOptions() {
      setLoadingOptions(true)
      try {
        const [branchData, jobData, userData] = await Promise.all([
          branchService.getBranches(),
          jobService.getJobs(),
          userService.getUsers(),
        ])
        if (!cancelled) {
          setBranches(branchData)
          setJobs(jobData)
          setUsers(userData)
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

    void loadOptions()

    return () => {
      cancelled = true
    }
  }, [open, t])

  const branchOptions = useMemo(
    () => buildBranchOptions(branches, employee?.branchId),
    [branches, employee?.branchId],
  )

  const jobOptions = useMemo(
    () => buildJobOptions(jobs, employee?.jobId),
    [jobs, employee?.jobId],
  )

  function validate(): string | null {
    if (!form.branchId) return t('employees.validation.branchRequired')
    if (!form.jobId) return t('employees.validation.jobRequired')
    if (!form.employeeCode.trim()) return t('employees.validation.employeeCodeRequired')
    if (!form.fullName.trim()) return t('employees.validation.fullNameRequired')
    if (!form.hireDate) return t('employees.validation.hireDateRequired')
    if (!form.salary.trim()) return t('employees.validation.salaryRequired')

    const salary = Number(form.salary)
    if (Number.isNaN(salary) || salary <= 0) {
      return t('employees.validation.salaryPositive')
    }

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
      const trimmedAr = form.fullNameAr.trim()
      const payload = {
        branchId: Number(form.branchId),
        jobId: Number(form.jobId),
        appUserId: form.appUserId ? Number(form.appUserId) : null,
        employeeCode: form.employeeCode.trim(),
        fullName: form.fullName.trim(),
        fullNameAr: trimmedAr ? trimmedAr : null,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        nationalId: form.nationalId.trim() || undefined,
        address: form.address.trim() || undefined,
        hireDate: form.hireDate,
        salary: Number(form.salary),
        active: form.active,
        notes: form.notes.trim() || undefined,
      }

      if (isCreate) {
        await employeeService.createEmployee(payload)
      } else if (employee) {
        await employeeService.updateEmployee(employee.id, payload)
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

  return (
    <Modal
      open={open}
      size="medium"
      className="employee-form-modal"
      title={isCreate ? t('employees.modal.addTitle') : t('employees.modal.editTitle')}
      subtitle={
        isCreate ? t('employees.modal.addSubtitle') : t('employees.modal.editSubtitle')
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="employee-form" variant="primary" disabled={disabled}>
            {saving
              ? isCreate
                ? t('employees.actions.creating')
                : t('employees.actions.saving')
              : isCreate
                ? t('employees.actions.create')
                : t('employees.actions.save')}
          </Button>
        </>
      }
    >
      <form id="employee-form" className="form form-card" onSubmit={handleSubmit}>
        {error ? <div className="alert-error">{error}</div> : null}
        {loadingOptions ? (
          <p className="field-box__helper">{t('employees.form.loadingOptions')}</p>
        ) : null}

        <SectionGroup title={t('employees.sections.basicInfo')} divider={false}>
          <FieldGrid columns={2}>
            <FormField label={t('employees.fields.fullName')} htmlFor="fullName">
              <FormInput
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, fullName: event.target.value }))
                }
                placeholder={t('employees.placeholders.fullName')}
                required
                disabled={disabled}
              />
            </FormField>

            <FormField label={t('employees.fields.fullNameAr')} htmlFor="fullNameAr">
              <FormInput
                id="fullNameAr"
                type="text"
                value={form.fullNameAr}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, fullNameAr: event.target.value }))
                }
                placeholder={t('employees.placeholders.fullNameAr')}
                disabled={disabled}
              />
            </FormField>

            <TenantCodeInput
              id="employeeCode"
              label={t('employees.fields.employeeCode')}
              entityPrefix="EMP"
              value={form.employeeCode}
              onChange={(employeeCode) => setForm((prev) => ({ ...prev, employeeCode }))}
              disabled={disabled}
              required
              placeholder={t('employees.placeholders.employeeCodeSuffix')}
              helperText={t('employees.helpers.employeeCode')}
              tenantUnavailableText={t('employees.helpers.tenantCodeUnavailable')}
            />

            <FormField label={t('employees.fields.nationalId')} htmlFor="nationalId">
              <FormInput
                id="nationalId"
                type="text"
                ltr
                value={form.nationalId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, nationalId: event.target.value }))
                }
                placeholder={t('employees.placeholders.nationalId')}
                disabled={disabled}
              />
            </FormField>
          </FieldGrid>
        </SectionGroup>

        <SectionGroup title={t('employees.sections.assignment')}>
          <FieldGrid columns={2}>
            <FormField label={t('employees.fields.branch')} htmlFor="branchId">
              <FormSelect
                id="branchId"
                value={form.branchId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, branchId: event.target.value }))
                }
                required
                disabled={disabled}
              >
                <option value="">{t('employees.placeholders.selectBranch')}</option>
                {branchOptions.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </FormSelect>
            </FormField>

            <FormField label={t('employees.fields.job')} htmlFor="jobId">
              <FormSelect
                id="jobId"
                value={form.jobId}
                onChange={(event) => setForm((prev) => ({ ...prev, jobId: event.target.value }))}
                required
                disabled={disabled}
              >
                <option value="">{t('employees.placeholders.selectJob')}</option>
                {jobOptions.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.name} ({job.code})
                  </option>
                ))}
              </FormSelect>
            </FormField>

            <FormField
              label={t('employees.fields.linkedAppUser')}
              htmlFor="appUserId"
              helper={t('employees.helpers.linkedAppUser')}
              fullWidth
            >
              <FormSelect
                id="appUserId"
                value={form.appUserId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, appUserId: event.target.value }))
                }
                disabled={disabled}
              >
                <option value="">{t('employees.placeholders.noLinkedUser')}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} (@{user.username})
                  </option>
                ))}
              </FormSelect>
            </FormField>
          </FieldGrid>
        </SectionGroup>

        <SectionGroup title={t('employees.sections.contact')}>
          <FieldGrid columns={2}>
            <FormField label={t('employees.fields.phone')} htmlFor="phone">
              <FormInput
                id="phone"
                type="tel"
                ltr
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder={t('employees.placeholders.phone')}
                disabled={disabled}
              />
            </FormField>

            <FormField label={t('employees.fields.email')} htmlFor="email">
              <FormInput
                id="email"
                type="email"
                ltr
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder={t('employees.placeholders.email')}
                disabled={disabled}
              />
            </FormField>

            <FormField label={t('employees.fields.address')} htmlFor="address" fullWidth>
              <FormTextarea
                id="address"
                value={form.address}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, address: event.target.value }))
                }
                placeholder={t('employees.placeholders.address')}
                rows={2}
                disabled={disabled}
              />
            </FormField>
          </FieldGrid>
        </SectionGroup>

        <SectionGroup title={t('employees.sections.employment')}>
          <FieldGrid columns={2}>
            <FormField label={t('employees.fields.hireDate')} htmlFor="hireDate">
              <FormInput
                id="hireDate"
                type="date"
                ltr
                value={form.hireDate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, hireDate: event.target.value }))
                }
                required
                disabled={disabled}
              />
            </FormField>

            <FormField label={t('employees.fields.salary')} htmlFor="salary">
              <FormInput
                id="salary"
                type="number"
                min="0"
                step="0.01"
                ltr
                value={form.salary}
                onChange={(event) => setForm((prev) => ({ ...prev, salary: event.target.value }))}
                placeholder="5000.00"
                required
                disabled={disabled}
              />
            </FormField>

            <div className="field-box--full">
              <StatusSwitch
                active={form.active}
                disabled={disabled}
                onChange={(active) => setForm((prev) => ({ ...prev, active }))}
              />
            </div>

            <FormField label={t('employees.fields.notes')} htmlFor="notes" fullWidth>
              <FormTextarea
                id="notes"
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder={t('employees.placeholders.notes')}
                rows={2}
                disabled={disabled}
              />
            </FormField>
          </FieldGrid>
        </SectionGroup>
      </form>
    </Modal>
  )
}
