import { useEffect, useState, type FormEvent } from 'react'
import {
  DetailField,
  DetailsCard,
  FieldGrid,
  FormField,
  FormInput,
  FormTextarea,
  SectionGroup,
} from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { CompactDateCell } from '../../components/ui/CompactDateCell'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useTranslation } from '../../i18n/useTranslation'
import * as branchService from '../../services/branchService'
import type { BranchResponse } from '../../types/branch'
import { getBranchFormNames, getLocalizedBranchAddress } from '../../utils/branchDisplay'

type EditForm = {
  name: string
  nameAr: string
  phone: string
  address: string
  active: boolean
}

function formFromBranch(branch: BranchResponse): EditForm {
  const { name, nameAr } = getBranchFormNames(branch)
  return {
    name,
    nameAr,
    phone: branch.phone ?? '',
    address: branch.address ?? '',
    active: branch.active,
  }
}

interface BranchOverviewPanelProps {
  branch: BranchResponse
  editing: boolean
  onCancel: () => void
  onSaved: (branch: BranchResponse) => void
}

export function BranchOverviewPanel({
  branch,
  editing,
  onCancel,
  onSaved,
}: BranchOverviewPanelProps) {
  const { t, locale } = useTranslation()
  const [form, setForm] = useState<EditForm>(() => formFromBranch(branch))
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  const displayAddress = getLocalizedBranchAddress(branch, locale)
  const { name: primaryName, nameAr } = getBranchFormNames(branch)
  const emptyDash = t('common.empty.dash')

  useEffect(() => {
    if (!editing) {
      setForm(formFromBranch(branch))
      setSaveError('')
    }
  }, [branch, editing])

  function validate(): string | null {
    if (!form.name.trim()) return t('branchDetails.validation.nameRequired')
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
      const updated = await branchService.updateBranch(branch.id, {
        name: form.name.trim(),
        code: branch.code,
        nameAr: form.nameAr.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        active: form.active,
      })
      onSaved(updated)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    const phoneDisplay = branch.phone?.trim()
    const addressDisplay = displayAddress.trim()

    return (
      <div className="branch-overview">
        <header className="branch-overview__intro">
          <h3 className="branch-overview__title">{t('branchDetails.overview.title')}</h3>
          <p className="branch-overview__subtitle">{t('branchDetails.overview.subtitle')}</p>
        </header>
        <DetailsCard>
          <SectionGroup title={t('branchDetails.sections.profile')} divider={false}>
            <FieldGrid columns={2}>
              <DetailField label={t('branchDetails.fields.name')} value={primaryName} />
              {nameAr.trim() ? (
                <DetailField label={t('branchDetails.fields.nameAr')} value={nameAr} />
              ) : null}
              <DetailField label={t('branchDetails.fields.code')} value={branch.code} dir="ltr" />
              <DetailField
                label={t('branchDetails.fields.phone')}
                value={phoneDisplay || emptyDash}
                dir="ltr"
                empty={!phoneDisplay}
              />
              <DetailField
                label={t('branchDetails.fields.address')}
                value={addressDisplay || emptyDash}
                fullWidth
                empty={!addressDisplay}
              />
              <DetailField label={t('branchDetails.fields.status')}>
                <StatusBadge active={branch.active} />
              </DetailField>
              <DetailField
                label={t('branchDetails.fields.createdAt')}
                value={<CompactDateCell value={branch.createdAt} />}
              />
              <DetailField
                label={t('branchDetails.fields.updatedAt')}
                value={<CompactDateCell value={branch.updatedAt} />}
              />
            </FieldGrid>
          </SectionGroup>
        </DetailsCard>
      </div>
    )
  }

  return (
    <div className="branch-overview branch-overview--editing">
      <header className="branch-overview__intro">
        <h3 className="branch-overview__title">{t('branchDetails.overview.title')}</h3>
        <p className="branch-overview__subtitle">{t('branchDetails.overview.subtitle')}</p>
      </header>

      <form className="branch-overview__form" onSubmit={(event) => void handleSave(event)}>
        {saveError ? <div className="alert-error">{saveError}</div> : null}

        <DetailsCard>
          <FieldGrid columns={2}>
            <FormField label={t('branchDetails.fields.name')} htmlFor="branch-overview-name">
              <FormInput
                id="branch-overview-name"
                type="text"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder={t('branchDetails.placeholders.name')}
                required
                disabled={saving}
              />
            </FormField>

            <FormField label={t('branchDetails.fields.nameAr')} htmlFor="branch-overview-nameAr">
              <FormInput
                id="branch-overview-nameAr"
                type="text"
                value={form.nameAr}
                onChange={(event) => setForm((prev) => ({ ...prev, nameAr: event.target.value }))}
                placeholder={t('branchDetails.placeholders.nameAr')}
                disabled={saving}
              />
            </FormField>

            <FormField label={t('branchDetails.fields.code')} htmlFor="branch-overview-code" disabled>
              <FormInput
                id="branch-overview-code"
                type="text"
                ltr
                code
                value={branch.code}
                readOnly
                disabled
                className="branch-overview__readonly"
              />
            </FormField>

            <FormField label={t('branchDetails.fields.phone')} htmlFor="branch-overview-phone">
              <FormInput
                id="branch-overview-phone"
                type="tel"
                ltr
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder={t('branchDetails.placeholders.phone')}
                disabled={saving}
              />
            </FormField>

            <FormField label={t('branchDetails.fields.address')} htmlFor="branch-overview-address" fullWidth>
              <FormTextarea
                id="branch-overview-address"
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                placeholder={t('branchDetails.placeholders.address')}
                rows={3}
                disabled={saving}
              />
            </FormField>

            <FormField label={t('branchDetails.fields.status')} fullWidth>
              <div className="user-active-row">
                <label className="toggle-switch user-active-row__toggle" htmlFor="branch-overview-active">
                  <input
                    id="branch-overview-active"
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, active: event.target.checked }))
                    }
                    disabled={saving}
                  />
                  <span className="toggle-switch-track" aria-hidden="true" />
                </label>
                <div className="user-active-row__text">
                  <span className="user-active-row__label">{t('common.active')}</span>
                  <span className="field-helper">{t('branchDetails.helpers.active')}</span>
                </div>
              </div>
            </FormField>
          </FieldGrid>
        </DetailsCard>

        <footer className="branch-overview__form-footer">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
            {t('branchDetails.actions.cancelEdit')}
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? t('branches.actions.saving') : t('branchDetails.actions.saveChanges')}
          </Button>
        </footer>
      </form>
    </div>
  )
}
