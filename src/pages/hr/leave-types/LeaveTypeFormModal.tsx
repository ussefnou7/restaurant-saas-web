import { useEffect, useState, type FormEvent } from 'react'
import {
  DetailField,
  FieldGrid,
  FormField,
  FormInput,
  FormTextarea,
  StatusSwitch,
} from '../../../components/fields'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { TenantCodeInput } from '../../../components/ui/TenantCodeInput'
import { useTranslation } from '../../../i18n/useTranslation'
import * as leaveTypeService from '../../../services/leaveTypeService'
import type { LeaveTypeResponse } from '../../../types/leaveType'
import {
  formatDecimalDays,
  getLocalizedLeaveTypeResponseName,
} from '../../../utils/leaveDisplay'

type FormMode = 'create' | 'edit'

interface LeaveTypeFormModalProps {
  open: boolean
  mode: FormMode
  leaveType?: LeaveTypeResponse | null
  onClose: () => void
  onSuccess: () => void
}

const emptyForm = {
  code: '',
  nameEn: '',
  nameAr: '',
  descriptionEn: '',
  descriptionAr: '',
  defaultDays: '',
  paid: true,
  active: true,
}

export function LeaveTypeFormModal({
  open,
  mode,
  leaveType,
  onClose,
  onSuccess,
}: LeaveTypeFormModalProps) {
  const { t, locale } = useTranslation()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isCreate = mode === 'create'

  useEffect(() => {
    if (!open) return

    setError('')
    if (isCreate) {
      setForm(emptyForm)
      return
    }

    if (leaveType) {
      setForm({
        code: leaveType.code,
        nameEn: leaveType.nameEn ?? leaveType.name ?? '',
        nameAr: leaveType.nameAr ?? '',
        descriptionEn: leaveType.descriptionEn ?? '',
        descriptionAr: leaveType.descriptionAr ?? '',
        defaultDays: String(leaveType.defaultDays ?? 0),
        paid: leaveType.paid,
        active: leaveType.active,
      })
    }
  }, [open, isCreate, leaveType])

  function validate(): string | null {
    if (!form.code.trim()) return t('leaveTypes.validation.codeRequired')
    if (!form.nameEn.trim() && !form.nameAr.trim()) {
      return t('leaveTypes.validation.nameRequired')
    }
    if (form.defaultDays.trim() === '') return t('leaveTypes.validation.defaultDaysRequired')
    const defaultDays = Number(form.defaultDays)
    if (Number.isNaN(defaultDays) || defaultDays < 0) {
      return t('leaveTypes.validation.defaultDaysMin')
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
      const payload = {
        code: form.code.trim(),
        nameEn: form.nameEn.trim() || undefined,
        nameAr: form.nameAr.trim() || undefined,
        descriptionEn: form.descriptionEn.trim() || undefined,
        descriptionAr: form.descriptionAr.trim() || undefined,
        defaultDays: Number(form.defaultDays),
        paid: form.paid,
        active: form.active,
      }

      if (isCreate) {
        await leaveTypeService.createLeaveType(payload)
      } else if (leaveType) {
        await leaveTypeService.updateLeaveType(leaveType.id, payload)
      }

      onSuccess()
      onClose()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  const modalTitle = isCreate ? t('leaveTypes.actions.add') : t('leaveTypes.actions.edit')
  const readOnlyName = leaveType ? getLocalizedLeaveTypeResponseName(leaveType, locale) : ''

  return (
    <Modal
      open={open}
      size="wide"
      title={modalTitle}
      subtitle={t('leaveTypes.subtitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="leave-type-form" variant="primary" disabled={saving}>
            {saving
              ? t('common.loading')
              : isCreate
                ? t('leaveTypes.actions.create')
                : t('leaveTypes.actions.save')}
          </Button>
        </>
      }
    >
      <form id="leave-type-form" className="form" onSubmit={(event) => void handleSubmit(event)}>
        {error ? <div className="alert-error">{error}</div> : null}

        {!isCreate && leaveType ? (
          <FieldGrid columns={2}>
            <DetailField label={t('leaveTypes.col.leaveType')} value={readOnlyName} />
            <DetailField
              label={t('leaveTypes.fields.defaultDays')}
              value={formatDecimalDays(leaveType.defaultDays)}
              dir="ltr"
            />
          </FieldGrid>
        ) : null}

        <FieldGrid columns={2}>
          <TenantCodeInput
            id="leaveTypeCode"
            label={t('leaveTypes.fields.code')}
            entityPrefix="LEAVE"
            value={form.code}
            onChange={(code) => setForm((prev) => ({ ...prev, code }))}
            disabled={saving || !isCreate}
            required
            placeholder="ANNUAL"
          />

          <FormField
            label={t('leaveTypes.fields.defaultDays')}
            htmlFor="leaveTypeDefaultDays"
            helper={t('leaveTypes.helpers.defaultDays')}
          >
            <FormInput
              id="leaveTypeDefaultDays"
              type="number"
              min={0}
              step="0.5"
              ltr
              value={form.defaultDays}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, defaultDays: event.target.value }))
              }
              required
              disabled={saving}
            />
          </FormField>

          <FormField label={t('leaveTypes.fields.nameEn')} htmlFor="leaveTypeNameEn">
            <FormInput
              id="leaveTypeNameEn"
              type="text"
              value={form.nameEn}
              onChange={(event) => setForm((prev) => ({ ...prev, nameEn: event.target.value }))}
              disabled={saving}
            />
          </FormField>

          <FormField label={t('leaveTypes.fields.nameAr')} htmlFor="leaveTypeNameAr">
            <FormInput
              id="leaveTypeNameAr"
              type="text"
              value={form.nameAr}
              onChange={(event) => setForm((prev) => ({ ...prev, nameAr: event.target.value }))}
              disabled={saving}
            />
          </FormField>

          <FormField label={t('leaveTypes.fields.descriptionEn')} htmlFor="leaveTypeDescEn" fullWidth>
            <FormTextarea
              id="leaveTypeDescEn"
              value={form.descriptionEn}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, descriptionEn: event.target.value }))
              }
              rows={2}
              disabled={saving}
            />
          </FormField>

          <FormField label={t('leaveTypes.fields.descriptionAr')} htmlFor="leaveTypeDescAr" fullWidth>
            <FormTextarea
              id="leaveTypeDescAr"
              value={form.descriptionAr}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, descriptionAr: event.target.value }))
              }
              rows={2}
              disabled={saving}
            />
          </FormField>

          <FormField label={t('leaveTypes.fields.paid')} htmlFor="leaveTypePaid">
            <div className="checkbox-card">
              <input
                id="leaveTypePaid"
                type="checkbox"
                checked={form.paid}
                onChange={(event) => setForm((prev) => ({ ...prev, paid: event.target.checked }))}
                disabled={saving}
              />
              <div className="checkbox-card-text">
                <label htmlFor="leaveTypePaid">{t('leaveTypes.fields.paid')}</label>
              </div>
            </div>
          </FormField>

          <FormField label={t('leaveTypes.fields.active')} htmlFor="leaveTypeActive">
            <StatusSwitch
              active={form.active}
              disabled={saving}
              onChange={(active) => setForm((prev) => ({ ...prev, active }))}
            />
          </FormField>
        </FieldGrid>
      </form>
    </Modal>
  )
}
