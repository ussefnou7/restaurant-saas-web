import { useEffect, useState, type FormEvent } from 'react'
import { FieldGrid, FormField, FormInput, FormSelect, StatusSwitch } from '../../../components/fields'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { useTranslation } from '../../../i18n/useTranslation'
import * as adminInventoryService from '../../../services/adminInventoryService'
import type { UomResponse, UomType } from '../../../types/inventory'

const UOM_TYPES: UomType[] = ['WEIGHT', 'VOLUME', 'COUNT']

type FormMode = 'create' | 'edit'

interface AdminUomFormModalProps {
  open: boolean
  mode: FormMode
  uom?: UomResponse | null
  onClose: () => void
  onSuccess: () => void
}

const emptyForm = {
  code: '',
  name: '',
  nameAr: '',
  symbol: '',
  type: 'COUNT' as UomType,
  baseCode: '',
  factorToBase: '1',
  active: true,
  sortOrder: '',
}

export function AdminUomFormModal({
  open,
  mode,
  uom,
  onClose,
  onSuccess,
}: AdminUomFormModalProps) {
  const { t } = useTranslation()
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
    if (uom) {
      setForm({
        code: uom.code,
        name: uom.name,
        nameAr: uom.nameAr ?? '',
        symbol: uom.symbol ?? '',
        type: uom.type ?? 'COUNT',
        baseCode: uom.baseCode ?? '',
        factorToBase: uom.factorToBase != null ? String(uom.factorToBase) : '1',
        active: uom.active,
        sortOrder: uom.sortOrder != null ? String(uom.sortOrder) : '',
      })
    }
  }, [open, isCreate, uom])

  function validate(): string | null {
    if (!form.code.trim()) return t('inventory.admin.uoms.validation.codeRequired')
    if (!form.name.trim()) return t('inventory.admin.uoms.validation.nameRequired')
    if (!form.symbol.trim()) return t('inventory.admin.uoms.validation.symbolRequired')
    if (!form.baseCode.trim()) return t('inventory.admin.uoms.validation.baseCodeRequired')
    const factor = Number(form.factorToBase)
    if (!Number.isFinite(factor) || factor <= 0) {
      return t('inventory.admin.uoms.validation.factorRequired')
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

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      nameAr: form.nameAr.trim() || null,
      symbol: form.symbol.trim(),
      type: form.type,
      baseCode: form.baseCode.trim(),
      factorToBase: Number(form.factorToBase),
      active: form.active,
      sortOrder: form.sortOrder.trim() ? Number(form.sortOrder) : null,
    }

    setSaving(true)
    try {
      if (isCreate) {
        await adminInventoryService.createAdminUom(payload)
      } else if (uom) {
        await adminInventoryService.updateAdminUom(uom.id, payload)
      }
      onSuccess()
      onClose()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      size="medium"
      title={
        isCreate ? t('inventory.admin.uoms.modal.addTitle') : t('inventory.admin.uoms.modal.editTitle')
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="admin-uom-form" variant="primary" disabled={saving}>
            {saving ? t('branches.actions.saving') : t('common.save')}
          </Button>
        </>
      }
    >
      <form id="admin-uom-form" className="form form-card" onSubmit={handleSubmit}>
        {error ? <div className="alert-error">{error}</div> : null}
        <FieldGrid columns={2}>
          <FormField label={t('inventory.col.code')} htmlFor="admin-uom-code">
            <FormInput
              id="admin-uom-code"
              ltr
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              disabled={saving || !isCreate}
              readOnly={!isCreate}
              required
            />
          </FormField>
          <FormField label={t('inventory.col.name')} htmlFor="admin-uom-name">
            <FormInput
              id="admin-uom-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('inventory.fields.nameAr')} htmlFor="admin-uom-name-ar">
            <FormInput
              id="admin-uom-name-ar"
              dir="rtl"
              value={form.nameAr}
              onChange={(e) => setForm((prev) => ({ ...prev, nameAr: e.target.value }))}
              placeholder={t('inventory.fields.nameArPlaceholder')}
              disabled={saving}
            />
          </FormField>
          <FormField label={t('inventory.admin.uoms.fields.symbol')} htmlFor="admin-uom-symbol">
            <FormInput
              id="admin-uom-symbol"
              ltr
              value={form.symbol}
              onChange={(e) => setForm((prev) => ({ ...prev, symbol: e.target.value }))}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('inventory.col.type')} htmlFor="admin-uom-type">
            <FormSelect
              id="admin-uom-type"
              value={form.type}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, type: e.target.value as UomType }))
              }
              disabled={saving}
            >
              {UOM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={t('inventory.admin.uoms.fields.baseCode')} htmlFor="admin-uom-base">
            <FormInput
              id="admin-uom-base"
              ltr
              value={form.baseCode}
              onChange={(e) => setForm((prev) => ({ ...prev, baseCode: e.target.value }))}
              disabled={saving}
              required
            />
          </FormField>
          <FormField
            label={t('inventory.admin.uoms.fields.factorToBase')}
            htmlFor="admin-uom-factor"
          >
            <FormInput
              id="admin-uom-factor"
              type="number"
              ltr
              min={0}
              step="any"
              value={form.factorToBase}
              onChange={(e) => setForm((prev) => ({ ...prev, factorToBase: e.target.value }))}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('inventory.categories.fields.sortOrder')} htmlFor="admin-uom-sort">
            <FormInput
              id="admin-uom-sort"
              type="number"
              ltr
              value={form.sortOrder}
              onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
              disabled={saving}
            />
          </FormField>
          <FormField label={t('common.status')}>
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
