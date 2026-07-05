import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  DetailField,
  FieldGrid,
  FormField,
  FormInput,
  SectionGroup,
  formDropdownClassName,
} from '../../components/fields'
import {
  EntityOverviewPanel,
  type EntityOverviewPanelProps,
} from '../../components/entity-detail/EntityOverviewPanel'
import { Dropdown } from '../../components/ui/Dropdown'
import type { TranslationKey } from '../../i18n/types'
import { useTranslation } from '../../i18n/useTranslation'
import * as branchService from '../../services/branchService'
import * as userService from '../../services/userService'
import type { BranchResponse } from '../../types/branch'
import type { UserResponse } from '../../types/user'
import { getLocalizedBranchName, getLocalizedRoleName, getLocalizedUserBranchName } from '../../utils/roleDisplay'
import { USER_ROLE_OPTIONS } from './userRoles'

type EditForm = {
  fullName: string
  phone: string
  roleCode: string
  branchId: string
  active: boolean
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

function formFromUser(user: UserResponse): EditForm {
  return {
    fullName: user.fullName,
    phone: user.phone ?? '',
    roleCode: user.role.code,
    branchId: user.branchId != null ? String(user.branchId) : '',
    active: user.active,
  }
}

type UserOverviewPanelProps = Pick<
  EntityOverviewPanelProps,
  'editing' | 'onCancel' | 'toolbarActions'
> & {
  user: UserResponse
  onSaved: (user: UserResponse) => void
}

export function UserOverviewPanel({
  user,
  editing,
  onCancel,
  onSaved,
  toolbarActions,
}: UserOverviewPanelProps) {
  const { t, locale } = useTranslation()
  const [form, setForm] = useState<EditForm>(() => formFromUser(user))
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [loadingBranches, setLoadingBranches] = useState(false)

  const roleLabel = getLocalizedRoleName(user.role, locale)
  const branchLabel = getLocalizedUserBranchName(user, locale)
  const branchDisplay = branchLabel.trim() ? branchLabel : t('common.empty.dash')
  const emptyDash = t('common.empty.dash')

  useEffect(() => {
    if (!editing) {
      setForm(formFromUser(user))
      setSaveError('')
    }
  }, [user, editing])

  useEffect(() => {
    if (!editing) return

    let cancelled = false

    async function loadBranches() {
      setLoadingBranches(true)
      try {
        const data = await branchService.getBranches()
        if (!cancelled) setBranches(data)
      } catch {
        if (!cancelled) setBranches([])
      } finally {
        if (!cancelled) setLoadingBranches(false)
      }
    }

    void loadBranches()
    return () => {
      cancelled = true
    }
  }, [editing])

  const branchOptions = useMemo(
    () => buildBranchOptions(branches, user.branchId),
    [branches, user.branchId],
  )

  const roleDropdownOptions = useMemo(
    () => [
      { value: '', label: t('users.placeholders.selectRole') },
      ...USER_ROLE_OPTIONS.map((role) => ({
        value: role.code,
        label: t(`users.roles.${role.code}` as TranslationKey),
      })),
    ],
    [t],
  )

  const branchDropdownOptions = useMemo(() => {
    const emptyLabel = loadingBranches
      ? t('users.placeholders.loadingBranches')
      : t('users.placeholders.noBranch')

    return [
      { value: '', label: emptyLabel },
      ...branchOptions.map((branch) => ({
        value: String(branch.id),
        label: `${getLocalizedBranchName(branch, locale)} (${branch.code})`,
      })),
    ]
  }, [branchOptions, loadingBranches, locale, t])

  const parseBranchId = useCallback((value: string): number | null => {
    const trimmed = value.trim()
    if (!trimmed) return null
    const parsed = Number(trimmed)
    return Number.isNaN(parsed) ? null : parsed
  }, [])

  function validate(): string | null {
    if (!form.fullName.trim()) return t('users.validation.fullNameRequired')
    if (!form.roleCode) return t('users.validation.roleRequired')
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
      const updated = await userService.updateUser(user.id, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        roleCode: form.roleCode,
        branchId: parseBranchId(form.branchId),
        active: form.active,
      })
      onSaved(updated)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  const disabled = saving || loadingBranches
  const statusActive = editing ? form.active : user.active

  function renderAccountFields() {
    if (!editing) {
      const phoneDisplay = user.phone?.trim()

      return (
        <FieldGrid columns={3}>
          <DetailField label={t('userDetails.fields.fullName')} value={user.fullName} />
          <DetailField
            label={t('userDetails.fields.username')}
            value={`@${user.username}`}
            dir="ltr"
          />
          <DetailField
            label={t('userDetails.fields.phone')}
            value={phoneDisplay || emptyDash}
            empty={!phoneDisplay}
            emptyValue={emptyDash}
            dir="ltr"
          />
        </FieldGrid>
      )
    }

    return (
      <FieldGrid columns={3}>
        <FormField label={t('userDetails.fields.fullName')} htmlFor="user-overview-fullName">
          <FormInput
            id="user-overview-fullName"
            type="text"
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            placeholder={t('users.placeholders.fullName')}
            required
            disabled={saving}
          />
        </FormField>

        <FormField label={t('userDetails.fields.username')} htmlFor="user-overview-username" disabled>
          <FormInput
            id="user-overview-username"
            type="text"
            ltr
            value={user.username}
            readOnly
            disabled
          />
        </FormField>

        <FormField label={t('userDetails.fields.phone')} htmlFor="user-overview-phone">
          <FormInput
            id="user-overview-phone"
            type="tel"
            ltr
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            placeholder={t('users.placeholders.phone')}
            disabled={saving}
          />
        </FormField>
      </FieldGrid>
    )
  }

  function renderAccessFields() {
    if (!editing) {
      return (
        <FieldGrid columns={3}>
          <DetailField label={t('userDetails.fields.role')} value={roleLabel} />
          <DetailField label={t('userDetails.fields.branch')} value={branchDisplay} />
        </FieldGrid>
      )
    }

    return (
      <FieldGrid columns={3}>
        <FormField label={t('userDetails.fields.role')}>
          <Dropdown
            value={form.roleCode}
            onChange={(roleCode) => setForm((prev) => ({ ...prev, roleCode }))}
            options={roleDropdownOptions}
            ariaLabel={t('userDetails.fields.role')}
            className={formDropdownClassName()}
            disabled={saving}
          />
        </FormField>

        <FormField label={t('userDetails.fields.branch')} helper={t('users.helpers.branch')}>
          <Dropdown
            value={form.branchId}
            onChange={(branchId) => setForm((prev) => ({ ...prev, branchId }))}
            options={branchDropdownOptions}
            ariaLabel={t('userDetails.fields.branch')}
            className={formDropdownClassName()}
            disabled={disabled}
          />
        </FormField>
      </FieldGrid>
    )
  }

  return (
    <EntityOverviewPanel
      title={t('userDetails.overview.title')}
      active={statusActive}
      editing={editing}
      saving={saving}
      saveError={saveError}
      onCancel={onCancel}
      onSubmit={(event) => void handleSave(event)}
      toolbarActions={toolbarActions}
      onActiveChange={(active) => setForm((prev) => ({ ...prev, active }))}
      createdAt={user.createdAt}
      updatedAt={user.updatedAt}
      createdAtLabel={t('userDetails.fields.createdAt')}
      updatedAtLabel={t('userDetails.fields.updatedAt')}
      cancelLabel={t('userDetails.actions.cancelEdit')}
      saveLabel={t('userDetails.actions.saveChanges')}
      savingLabel={t('users.actions.saving')}
    >
      <SectionGroup title={t('userDetails.sections.accountInfo')} divider={false}>
        {renderAccountFields()}
      </SectionGroup>

      <SectionGroup title={t('userDetails.sections.accessInfo')}>
        {renderAccessFields()}
      </SectionGroup>
    </EntityOverviewPanel>
  )
}
