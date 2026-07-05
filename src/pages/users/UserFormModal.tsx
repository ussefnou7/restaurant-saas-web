import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  FieldGrid,
  FormField,
  FormInput,
  SectionGroup,
  StatusSwitch,
  formDropdownClassName,
} from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { Dropdown } from '../../components/ui/Dropdown'
import { Modal } from '../../components/ui/Modal'
import { useTranslation } from '../../i18n/useTranslation'
import type { TranslationKey } from '../../i18n/types'
import * as branchService from '../../services/branchService'
import * as userService from '../../services/userService'
import type { BranchResponse } from '../../types/branch'
import type { UserResponse } from '../../types/user'
import { translateApiError } from '../../utils/errors'
import { USER_ROLE_OPTIONS } from './userRoles'

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

type FormMode = 'create' | 'edit'

interface UserFormModalProps {
  open: boolean
  mode: FormMode
  user?: UserResponse | null
  onClose: () => void
  onSuccess: () => void
}

const emptyForm = {
  username: '',
  fullName: '',
  phone: '',
  password: '',
  roleCode: '',
  branchId: '',
  active: true,
}

export function UserFormModal({ open, mode, user, onClose, onSuccess }: UserFormModalProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [branches, setBranches] = useState<BranchResponse[]>([])

  const isCreate = mode === 'create'

  const branchOptions = useMemo(
    () => buildBranchOptions(branches, user?.branchId),
    [branches, user?.branchId],
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
    const emptyLabel = loadingOptions
      ? t('users.placeholders.loadingBranches')
      : t('users.placeholders.noBranch')

    return [
      { value: '', label: emptyLabel },
      ...branchOptions.map((branch) => ({
        value: String(branch.id),
        label: `${branch.name} (${branch.code})`,
      })),
    ]
  }, [branchOptions, loadingOptions, t])

  useEffect(() => {
    if (!open) return

    setError('')
    if (isCreate) {
      setForm(emptyForm)
      return
    }

    if (user) {
      setForm({
        username: user.username,
        fullName: user.fullName,
        phone: user.phone ?? '',
        password: '',
        roleCode: user.role.code,
        branchId: user.branchId != null ? String(user.branchId) : '',
        active: user.active,
      })
    }
  }, [open, isCreate, user])

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function loadBranches() {
      setLoadingOptions(true)
      try {
        const data = await branchService.getBranches()
        if (!cancelled) {
          setBranches(data)
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

    void loadBranches()

    return () => {
      cancelled = true
    }
  }, [open, t])

  function parseBranchId(value: string): number | null {
    const trimmed = value.trim()
    if (!trimmed) return null
    const parsed = Number(trimmed)
    return Number.isNaN(parsed) ? null : parsed
  }

  function validate(): string | null {
    if (isCreate && !form.username.trim()) return t('users.validation.usernameRequired')
    if (!form.fullName.trim()) return t('users.validation.fullNameRequired')
    if (isCreate && !form.password.trim()) return t('users.validation.passwordRequired')
    if (!form.roleCode) return t('users.validation.roleRequired')
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
      const branchId = parseBranchId(form.branchId)
      const phone = form.phone.trim() || undefined

      if (isCreate) {
        await userService.createUser({
          username: form.username.trim(),
          fullName: form.fullName.trim(),
          phone,
          password: form.password,
          roleCode: form.roleCode,
          branchId,
          active: form.active,
        })
      } else if (user) {
        await userService.updateUser(user.id, {
          fullName: form.fullName.trim(),
          phone,
          roleCode: form.roleCode,
          branchId,
          active: form.active,
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

  return (
    <Modal
      open={open}
      className="user-form-modal"
      size="medium"
      title={isCreate ? t('users.modal.addTitle') : t('users.modal.editTitle')}
      subtitle={
        isCreate ? t('users.modal.addSubtitle') : t('users.modal.editSubtitle')
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="user-form" variant="primary" disabled={disabled}>
            {saving
              ? isCreate
                ? t('users.actions.creating')
                : t('users.actions.saving')
              : isCreate
                ? t('users.actions.create')
                : t('users.actions.save')}
          </Button>
        </>
      }
    >
      <form id="user-form" className="form form-card" onSubmit={handleSubmit}>
        {error ? <div className="alert-error">{error}</div> : null}
        {loadingOptions ? (
          <p className="field-helper">{t('users.form.loadingBranches')}</p>
        ) : null}

        <SectionGroup title={t('users.sections.basicInfo')}>
          <FieldGrid columns={2}>
            <FormField label={t('users.fields.fullName')} htmlFor="fullName">
              <FormInput
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, fullName: event.target.value }))
                }
                placeholder={t('users.placeholders.fullName')}
                required
                disabled={saving}
              />
            </FormField>

            <FormField label={t('users.fields.username')} htmlFor="username">
              <FormInput
                id="username"
                type="text"
                ltr
                value={form.username}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, username: event.target.value }))
                }
                placeholder={t('users.placeholders.username')}
                required={isCreate}
                disabled={saving || !isCreate}
                readOnly={!isCreate}
              />
            </FormField>

            {isCreate ? (
              <FormField label={t('users.fields.password')} htmlFor="password">
                <FormInput
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  placeholder={t('users.placeholders.password')}
                  required
                  disabled={saving}
                />
              </FormField>
            ) : null}

            <FormField label={t('users.fields.phone')} htmlFor="phone">
              <FormInput
                id="phone"
                type="tel"
                ltr
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder={t('users.placeholders.phone')}
                disabled={saving}
              />
            </FormField>
          </FieldGrid>
        </SectionGroup>

        <SectionGroup title={t('users.sections.access')}>
          <FieldGrid columns={2}>
            <FormField label={t('users.fields.role')}>
              <Dropdown
                value={form.roleCode}
                onChange={(roleCode) => setForm((prev) => ({ ...prev, roleCode }))}
                options={roleDropdownOptions}
                ariaLabel={t('users.fields.role')}
                className={formDropdownClassName()}
                disabled={saving}
              />
            </FormField>

            <FormField label={t('users.fields.branch')} helper={t('users.helpers.branch')}>
              <Dropdown
                value={form.branchId}
                onChange={(branchId) => setForm((prev) => ({ ...prev, branchId }))}
                options={branchDropdownOptions}
                ariaLabel={t('users.fields.branch')}
                className={formDropdownClassName()}
                disabled={disabled}
              />
            </FormField>
          </FieldGrid>
        </SectionGroup>

        <SectionGroup title={t('users.sections.status')}>
          <StatusSwitch
            active={form.active}
            disabled={saving}
            onChange={(active) => setForm((prev) => ({ ...prev, active }))}
          />
        </SectionGroup>
      </form>
    </Modal>
  )
}
