import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  DetailField,
  FieldGrid,
  FormField,
  FormInput,
  FormTextarea,
  SectionGroup,
  formDropdownClassName,
} from '../../../components/fields'
import {
  EntityOverviewPanel,
  type EntityOverviewPanelProps,
} from '../../../components/entity-detail/EntityOverviewPanel'
import { CompactDateCell } from '../../../components/ui/CompactDateCell'
import { Dropdown } from '../../../components/ui/Dropdown'
import { useTranslation } from '../../../i18n/useTranslation'
import * as branchService from '../../../services/branchService'
import * as employeeService from '../../../services/employeeService'
import * as jobService from '../../../services/jobService'
import * as userService from '../../../services/userService'
import type { BranchResponse } from '../../../types/branch'
import type { EmployeeResponse } from '../../../types/employee'
import type { JobResponse } from '../../../types/job'
import type { UserResponse } from '../../../types/user'
import { getLocalizedBranchName } from '../../../utils/branchDisplay'
import {
  getEmployeeBranchName,
  getEmployeeFormNames,
  getEmployeeJobName,
} from '../../../utils/employeeDisplay'

type EditForm = {
  fullName: string
  fullNameAr: string
  phone: string
  email: string
  nationalId: string
  address: string
  branchId: string
  jobId: string
  appUserId: string
  hireDate: string
  active: boolean
  notes: string
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
  if (!current || active.some((branch) => branch.id === currentBranchId)) return active
  return [current, ...active]
}

function buildJobOptions(jobs: JobResponse[], currentJobId?: number | null): JobResponse[] {
  const active = jobs.filter((job) => job.active)
  if (!currentJobId) return active
  const current = jobs.find((job) => job.id === currentJobId)
  if (!current || active.some((job) => job.id === currentJobId)) return active
  return [current, ...active]
}

function formFromEmployee(employee: EmployeeResponse): EditForm {
  const names = getEmployeeFormNames(employee)
  return {
    fullName: names.fullName,
    fullNameAr: names.fullNameAr,
    phone: employee.phone ?? '',
    email: employee.email ?? '',
    nationalId: employee.nationalId ?? '',
    address: employee.address ?? '',
    branchId: String(employee.branchId),
    jobId: String(employee.jobId),
    appUserId: employee.appUserId ? String(employee.appUserId) : '',
    hireDate: toDateInputValue(employee.hireDate),
    active: employee.active,
    notes: employee.notes ?? '',
  }
}

interface EmployeeOverviewPanelProps
  extends Pick<EntityOverviewPanelProps, 'editing' | 'onCancel' | 'toolbarActions'> {
  employee: EmployeeResponse
  onSaved: (employee: EmployeeResponse) => void
}

export function EmployeeOverviewPanel({
  employee,
  editing,
  onCancel,
  onSaved,
  toolbarActions,
}: EmployeeOverviewPanelProps) {
  const { t, locale } = useTranslation()
  const [form, setForm] = useState<EditForm>(() => formFromEmployee(employee))
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [jobs, setJobs] = useState<JobResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])

  const jobLabel = getEmployeeJobName(employee, locale)
  const branchLabel = getEmployeeBranchName(employee, locale)
  const { fullName, fullNameAr } = getEmployeeFormNames(employee)

  const linkedUserLabel = useMemo(() => {
    if (!employee.appUserId) return t('common.empty.dash')
    const user = users.find((item) => item.id === employee.appUserId)
    return user ? `${user.fullName} (@${user.username})` : `#${employee.appUserId}`
  }, [employee.appUserId, t, users])

  useEffect(() => {
    if (!editing) {
      setForm(formFromEmployee(employee))
      setSaveError('')
    }
  }, [employee, editing])

  useEffect(() => {
    let cancelled = false

    async function loadUsers() {
      try {
        const userData = await userService.getUsers()
        if (!cancelled) setUsers(userData)
      } catch {
        if (!cancelled) setUsers([])
      }
    }

    void loadUsers()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!editing) return

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
      } catch {
        if (!cancelled) {
          setBranches([])
          setJobs([])
          setUsers([])
        }
      } finally {
        if (!cancelled) setLoadingOptions(false)
      }
    }

    void loadOptions()
    return () => {
      cancelled = true
    }
  }, [editing])

  const branchOptions = useMemo(
    () => buildBranchOptions(branches, employee.branchId),
    [branches, employee.branchId],
  )

  const jobOptions = useMemo(
    () => buildJobOptions(jobs, employee.jobId),
    [jobs, employee.jobId],
  )

  const branchDropdownOptions = useMemo(
    () => [
      { value: '', label: t('employees.placeholders.selectBranch') },
      ...branchOptions.map((branch) => ({
        value: String(branch.id),
        label: `${getLocalizedBranchName(branch, locale)} (${branch.code})`,
      })),
    ],
    [branchOptions, locale, t],
  )

  const jobDropdownOptions = useMemo(
    () => [
      { value: '', label: t('employees.placeholders.selectJob') },
      ...jobOptions.map((job) => ({
        value: String(job.id),
        label: `${job.name} (${job.code})`,
      })),
    ],
    [jobOptions, t],
  )

  const userDropdownOptions = useMemo(
    () => [
      { value: '', label: t('employees.placeholders.noLinkedUser') },
      ...users.map((user) => ({
        value: String(user.id),
        label: `${user.fullName} (@${user.username})`,
      })),
    ],
    [t, users],
  )

  function validate(): string | null {
    if (!form.fullName.trim()) return t('employees.validation.fullNameRequired')
    if (!form.branchId) return t('employees.validation.branchRequired')
    if (!form.jobId) return t('employees.validation.jobRequired')
    if (!form.hireDate) return t('employees.validation.hireDateRequired')
    return null
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setSaveError('')

    const validationError = validate()
    if (validationError) {
      setSaveError(validationError)
      return
    }

    setSaving(true)
    try {
      const trimmedAr = form.fullNameAr.trim()
      const updated = await employeeService.updateEmployee(employee.id, {
        branchId: Number(form.branchId),
        jobId: Number(form.jobId),
        appUserId: form.appUserId ? Number(form.appUserId) : null,
        employeeCode: employee.employeeCode,
        fullName: form.fullName.trim(),
        fullNameAr: trimmedAr ? trimmedAr : null,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        nationalId: form.nationalId.trim() || undefined,
        address: form.address.trim() || undefined,
        hireDate: form.hireDate,
        salary: employee.salary,
        active: form.active,
        notes: form.notes.trim() || undefined,
      })
      onSaved(updated)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  const emptyDash = t('common.empty.dash')
  const disabled = saving || loadingOptions
  const statusActive = editing ? form.active : employee.active

  function renderPersonalFields() {
    if (!editing) {
      return (
        <FieldGrid columns={3}>
          <DetailField label={t('employees.fields.fullName')} value={fullName} />
          <DetailField
            label={t('employees.fields.fullNameAr')}
            value={fullNameAr.trim() || emptyDash}
            empty={!fullNameAr.trim()}
            emptyValue={emptyDash}
          />
          <DetailField
            label={t('employees.fields.phone')}
            value={employee.phone?.trim() || emptyDash}
            empty={!employee.phone?.trim()}
            emptyValue={emptyDash}
            dir="ltr"
          />
          <DetailField
            label={t('employees.fields.email')}
            value={employee.email?.trim() || emptyDash}
            empty={!employee.email?.trim()}
            emptyValue={emptyDash}
            dir="ltr"
          />
          <DetailField
            label={t('employees.fields.nationalId')}
            value={employee.nationalId?.trim() || emptyDash}
            empty={!employee.nationalId?.trim()}
            emptyValue={emptyDash}
            dir="ltr"
          />
          <DetailField
            label={t('employees.fields.address')}
            value={employee.address?.trim() || emptyDash}
            empty={!employee.address?.trim()}
            emptyValue={emptyDash}
            fullWidth
          />
        </FieldGrid>
      )
    }

    return (
      <FieldGrid columns={3}>
        <FormField label={t('employees.fields.fullName')} htmlFor="emp-overview-fullName">
          <FormInput
            id="emp-overview-fullName"
            type="text"
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            placeholder={t('employees.placeholders.fullName')}
            required
            disabled={saving}
          />
        </FormField>
        <FormField label={t('employees.fields.fullNameAr')} htmlFor="emp-overview-fullNameAr">
          <FormInput
            id="emp-overview-fullNameAr"
            type="text"
            value={form.fullNameAr}
            onChange={(event) => setForm((prev) => ({ ...prev, fullNameAr: event.target.value }))}
            placeholder={t('employees.placeholders.fullNameAr')}
            disabled={saving}
          />
        </FormField>
        <FormField label={t('employees.fields.phone')} htmlFor="emp-overview-phone">
          <FormInput
            id="emp-overview-phone"
            type="tel"
            ltr
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            placeholder={t('employees.placeholders.phone')}
            disabled={saving}
          />
        </FormField>
        <FormField label={t('employees.fields.email')} htmlFor="emp-overview-email">
          <FormInput
            id="emp-overview-email"
            type="email"
            ltr
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder={t('employees.placeholders.email')}
            disabled={saving}
          />
        </FormField>
        <FormField label={t('employees.fields.nationalId')} htmlFor="emp-overview-nationalId">
          <FormInput
            id="emp-overview-nationalId"
            type="text"
            ltr
            value={form.nationalId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, nationalId: event.target.value }))
            }
            placeholder={t('employees.placeholders.nationalId')}
            disabled={saving}
          />
        </FormField>
        <FormField label={t('employees.fields.address')} htmlFor="emp-overview-address" fullWidth>
          <FormTextarea
            id="emp-overview-address"
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            placeholder={t('employees.placeholders.address')}
            rows={2}
            disabled={saving}
          />
        </FormField>
      </FieldGrid>
    )
  }

  function renderEmploymentFields() {
    if (!editing) {
      return (
        <FieldGrid columns={3}>
          <DetailField label={t('employees.fields.branch')} value={branchLabel} />
          <DetailField label={t('employees.fields.job')} value={jobLabel} />
          <DetailField
            label={t('employees.fields.linkedAppUser')}
            value={linkedUserLabel}
            empty={!employee.appUserId}
            emptyValue={emptyDash}
          />
          <DetailField
            label={t('employees.fields.hireDate')}
            value={<CompactDateCell value={employee.hireDate} />}
          />
          {employee.notes?.trim() ? (
            <DetailField label={t('employees.fields.notes')} value={employee.notes} fullWidth />
          ) : null}
        </FieldGrid>
      )
    }

    return (
      <FieldGrid columns={3}>
        <FormField label={t('employees.fields.branch')}>
          <Dropdown
            value={form.branchId}
            onChange={(branchId) => setForm((prev) => ({ ...prev, branchId }))}
            options={branchDropdownOptions}
            ariaLabel={t('employees.fields.branch')}
            className={formDropdownClassName()}
            disabled={disabled}
          />
        </FormField>
        <FormField label={t('employees.fields.job')}>
          <Dropdown
            value={form.jobId}
            onChange={(jobId) => setForm((prev) => ({ ...prev, jobId }))}
            options={jobDropdownOptions}
            ariaLabel={t('employees.fields.job')}
            className={formDropdownClassName()}
            disabled={disabled}
          />
        </FormField>
        <FormField
          label={t('employees.fields.linkedAppUser')}
          helper={t('employees.helpers.linkedAppUser')}
          fullWidth
        >
          <Dropdown
            value={form.appUserId}
            onChange={(appUserId) => setForm((prev) => ({ ...prev, appUserId }))}
            options={userDropdownOptions}
            ariaLabel={t('employees.fields.linkedAppUser')}
            className={formDropdownClassName()}
            disabled={disabled}
          />
        </FormField>
        <FormField label={t('employees.fields.hireDate')} htmlFor="emp-overview-hireDate">
          <FormInput
            id="emp-overview-hireDate"
            type="date"
            ltr
            value={form.hireDate}
            onChange={(event) => setForm((prev) => ({ ...prev, hireDate: event.target.value }))}
            required
            disabled={saving}
          />
        </FormField>
        <FormField label={t('employees.fields.notes')} htmlFor="emp-overview-notes" fullWidth>
          <FormTextarea
            id="emp-overview-notes"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder={t('employees.placeholders.notes')}
            rows={2}
            disabled={saving}
          />
        </FormField>
      </FieldGrid>
    )
  }

  return (
    <EntityOverviewPanel
      title={t('employees.overview.title')}
      active={statusActive}
      editing={editing}
      saving={saving || loadingOptions}
      saveError={saveError}
      onCancel={onCancel}
      onSubmit={(event) => void handleSave(event)}
      toolbarActions={toolbarActions}
      onActiveChange={(active) => setForm((prev) => ({ ...prev, active }))}
      createdAt={employee.createdAt}
      updatedAt={employee.updatedAt}
      createdAtLabel={t('employees.fields.createdAt')}
      updatedAtLabel={t('employees.fields.updatedAt')}
      cancelLabel={t('employees.details.actions.cancelEdit')}
      saveLabel={t('employees.details.actions.saveChanges')}
      savingLabel={t('employees.actions.saving')}
    >
      <SectionGroup title={t('employees.sections.personalInfo')} divider={false}>
        {renderPersonalFields()}
      </SectionGroup>

      <SectionGroup title={t('employees.sections.employmentInfo')}>
        {renderEmploymentFields()}
      </SectionGroup>
    </EntityOverviewPanel>
  )
}
