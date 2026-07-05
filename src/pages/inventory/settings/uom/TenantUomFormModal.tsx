import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { FieldGrid, FormField, FormInput, FormSelect } from '../../../../components/fields'
import { Button } from '../../../../components/ui/Button'
import { Modal } from '../../../../components/ui/Modal'
import { TenantCodeInput } from '../../../../components/ui/TenantCodeInput'
import { TENANT_ENTITY_PREFIXES } from '../../../../utils/tenantCode'
import * as uomService from '../../../../services/uomService'
import type { UomResponse, UomType } from '../../../../types/inventory'
import { getTenantUomTypeLabel, TENANT_UOM_TYPES } from './tenantUomDisplay'

type FormState = {
  code: string
  name: string
  nameAr: string
  symbol: string
  type: UomType
  baseUom: string
  factorToBase: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

const emptyForm: FormState = {
  code: '',
  name: '',
  nameAr: '',
  symbol: '',
  type: 'COUNT',
  baseUom: '',
  factorToBase: '1',
}

interface TenantUomFormModalProps {
  open: boolean
  uoms: UomResponse[]
  onClose: () => void
  onSuccess: (created: UomResponse) => void
}

function validateForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {}
  const code = form.code.trim()

  if (!code) {
    errors.code = 'الكود مطلوب'
  } else if (/\s/.test(code)) {
    errors.code = 'الكود لا يجب أن يحتوي على مسافات'
  }

  if (!form.name.trim()) {
    errors.name = 'الاسم مطلوب'
  }

  if (!form.symbol.trim()) {
    errors.symbol = 'الرمز مطلوب'
  }

  if (!form.type) {
    errors.type = 'النوع مطلوب'
  }

  if (!form.baseUom) {
    errors.baseUom = 'الوحدة الأساسية مطلوبة'
  }

  const factor = Number(form.factorToBase)
  if (!form.factorToBase.trim()) {
    errors.factorToBase = 'معامل التحويل مطلوب'
  } else if (!Number.isFinite(factor) || factor <= 0) {
    errors.factorToBase = 'معامل التحويل يجب أن يكون رقماً أكبر من صفر'
  }

  return errors
}

export function TenantUomFormModal({ open, uoms, onClose, onSuccess }: TenantUomFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  const activeBaseUomOptions = useMemo(
    () =>
      uoms.filter((uom) => uom.active).map((uom) => ({
        id: uom.id,
        label: `${uom.nameAr?.trim() || uom.name} (${uom.code})`,
      })),
    [uoms],
  )

  useEffect(() => {
    if (!open) return
    setForm(emptyForm)
    setFieldErrors({})
  }, [open])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const errors = validateForm(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    try {
      const created = await uomService.createTenantUom({
        code: form.code.trim(),
        name: form.name.trim(),
        nameAr: form.nameAr.trim() || null,
        symbol: form.symbol.trim(),
        type: form.type,
        baseUom: Number(form.baseUom),
        factorToBase: Number(form.factorToBase),
      })
      onSuccess(created)
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
      title="إضافة وحدة مخصصة"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            إلغاء
          </Button>
          <Button type="submit" form="tenant-uom-form" variant="primary" disabled={saving}>
            {saving ? (
              <>
                <span className="list-state__spinner" aria-hidden="true" />
                {' جاري الحفظ…'}
              </>
            ) : (
              'حفظ'
            )}
          </Button>
        </>
      }
    >
      <form id="tenant-uom-form" className="form form-card" dir="rtl" onSubmit={handleSubmit}>
        <FieldGrid columns={2}>
          <TenantCodeInput
            id="tenant-uom-code"
            label="كود الوحدة"
            entityPrefix={TENANT_ENTITY_PREFIXES.UOM}
            value={form.code}
            onChange={(code) => setForm((prev) => ({ ...prev, code }))}
            disabled={saving}
            required
            placeholder="0001"
            helperText="أدخل اللاحقة فقط بعد البادئة. يتم إنشاء الكود الكامل تلقائياً."
            tenantUnavailableText="رمز المستأجر غير متاح. سجّل الدخول مرة أخرى لتعيين البادئة."
            error={fieldErrors.code}
          />
          <FormField label="الاسم" htmlFor="tenant-uom-name" error={fieldErrors.name}>
            <FormInput
              id="tenant-uom-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label="الاسم بالعربية" htmlFor="tenant-uom-name-ar">
            <FormInput
              id="tenant-uom-name-ar"
              dir="rtl"
              value={form.nameAr}
              onChange={(e) => setForm((prev) => ({ ...prev, nameAr: e.target.value }))}
              disabled={saving}
            />
          </FormField>
          <FormField label="الرمز" htmlFor="tenant-uom-symbol" error={fieldErrors.symbol}>
            <FormInput
              id="tenant-uom-symbol"
              ltr
              value={form.symbol}
              onChange={(e) => setForm((prev) => ({ ...prev, symbol: e.target.value }))}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label="النوع" htmlFor="tenant-uom-type" error={fieldErrors.type}>
            <FormSelect
              id="tenant-uom-type"
              value={form.type}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, type: e.target.value as UomType }))
              }
              disabled={saving}
            >
              {TENANT_UOM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {getTenantUomTypeLabel(type)}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="الوحدة الأساسية" htmlFor="tenant-uom-base" error={fieldErrors.baseUom}>
            <FormSelect
              id="tenant-uom-base"
              value={form.baseUom}
              onChange={(e) => setForm((prev) => ({ ...prev, baseUom: e.target.value }))}
              disabled={saving}
            >
              <option value="">اختر الوحدة الأساسية</option>
              {activeBaseUomOptions.map((opt) => (
                <option key={opt.id} value={String(opt.id)}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField
            label="معامل التحويل"
            htmlFor="tenant-uom-factor"
            error={fieldErrors.factorToBase}
          >
            <FormInput
              id="tenant-uom-factor"
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
        </FieldGrid>
      </form>
    </Modal>
  )
}
