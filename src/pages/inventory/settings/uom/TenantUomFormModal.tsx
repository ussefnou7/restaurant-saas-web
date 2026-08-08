import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { FieldGrid, FormField, FormInput, FormSelect } from '../../../../components/fields'
import { Button } from '../../../../components/ui/Button'
import { Modal } from '../../../../components/ui/Modal'
import { TenantCodeInput } from '../../../../components/ui/TenantCodeInput'
import { useTranslation } from '../../../../i18n/useTranslation'
import * as uomService from '../../../../services/uomService'
import type { UomResponse, UomType } from '../../../../types/inventory'
import { translateApiError } from '../../../../utils/errors'
import { TENANT_ENTITY_PREFIXES } from '../../../../utils/tenantCode'
import { getTenantUomTypeLabel, TENANT_UOM_TYPES } from './tenantUomDisplay'

type FormState = {
  code: string
  name: string
  nameAr: string
  symbol: string
  typeFilter: UomType
  baseUom: string
  factorToBase: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

const emptyForm: FormState = {
  code: '',
  name: '',
  nameAr: '',
  symbol: '',
  typeFilter: 'COUNT',
  baseUom: '',
  factorToBase: '1',
}

interface TenantUomFormModalProps {
  open: boolean
  uoms: UomResponse[]
  onClose: () => void
  onSuccess: (uom: UomResponse) => void
}

function validateForm(
  form: FormState,
  t: (key: string, values?: Record<string, string | number>) => string,
): FieldErrors {
  const errors: FieldErrors = {}
  const code = form.code.trim()

  if (!code) {
    errors.code = t('inventory.uom.validation.codeRequired')
  } else if (/\s/.test(code)) {
    errors.code = t('inventory.uom.validation.codeNoSpaces')
  }

  if (!form.name.trim()) {
    errors.name = t('inventory.uom.validation.nameRequired')
  }

  if (!form.symbol.trim()) {
    errors.symbol = t('inventory.uom.validation.symbolRequired')
  }

  if (!form.baseUom) {
    errors.baseUom = t('inventory.uom.validation.baseUomRequired')
  }

  const factor = Number(form.factorToBase)
  if (!form.factorToBase.trim()) {
    errors.factorToBase = t('inventory.uom.validation.factorRequired')
  } else if (!Number.isFinite(factor) || factor <= 0) {
    errors.factorToBase = t('inventory.uom.validation.factorPositive')
  }

  return errors
}

export function TenantUomFormModal({
  open,
  uoms,
  onClose,
  onSuccess,
}: TenantUomFormModalProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setSubmitError('')
    setFieldErrors({})
    setForm(emptyForm)
  }, [open])

  const baseUomOptions = useMemo(() => {
    const candidates = uoms.filter((item) => item.type === form.typeFilter)

    const activeOptions = candidates
      .filter((item) => item.active)
      .map((item) => ({
        id: item.id,
        label: `${item.nameAr?.trim() || item.name} (${item.symbol || item.code})`,
        symbol: item.symbol || item.code,
        active: true,
      }))

    const selectedBaseId = form.baseUom ? Number(form.baseUom) : null
    const alreadyIncluded = activeOptions.some((opt) => opt.id === selectedBaseId)

    if (selectedBaseId && !alreadyIncluded) {
      const inactiveParentInList = uoms.find((item) => item.id === selectedBaseId)
      const labelName = inactiveParentInList
        ? inactiveParentInList.nameAr?.trim() || inactiveParentInList.name
        : String(selectedBaseId)
      const symbol = inactiveParentInList?.symbol || ''

      const inactiveOption = {
        id: selectedBaseId,
        label: `${labelName} ${t('inventory.uom.inactiveSuffix')}`,
        symbol: symbol,
        active: false,
      }
      return [inactiveOption, ...activeOptions]
    }

    return activeOptions
  }, [uoms, form.typeFilter, form.baseUom, t])

  const selectedBaseOption = useMemo(() => {
    if (!form.baseUom) return null
    return baseUomOptions.find((opt) => String(opt.id) === form.baseUom) || null
  }, [baseUomOptions, form.baseUom])

  const factorLabel = useMemo(() => {
    if (!selectedBaseOption) return t('inventory.uom.fields.factorToBase')
    const unitSymbol = form.symbol.trim() || t('inventory.uom.unit')
    const baseSymbol = selectedBaseOption.symbol || ''
    return t('inventory.uom.fields.factorLabel', { symbol: unitSymbol, baseSymbol })
  }, [selectedBaseOption, form.symbol, t])

  function handleBaseUomChange(baseUomIdStr: string) {
    const selectedUnit = uoms.find((item) => String(item.id) === baseUomIdStr)
    setForm((prev) => ({
      ...prev,
      baseUom: baseUomIdStr,
      typeFilter: selectedUnit?.type ?? prev.typeFilter,
    }))
  }

  function handleTypeFilterChange(newType: UomType) {
    setForm((prev) => {
      const currentBaseUnit = uoms.find((item) => String(item.id) === prev.baseUom)
      const baseStillValid = currentBaseUnit?.type === newType
      return {
        ...prev,
        typeFilter: newType,
        baseUom: baseStillValid ? prev.baseUom : '',
      }
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitError('')
    const errors = validateForm(form, t)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    try {
      const created = await uomService.createTenantUom({
        code: form.code.trim(),
        name: form.name.trim(),
        nameAr: form.nameAr.trim() || null,
        symbol: form.symbol.trim(),
        baseUom: Number(form.baseUom),
        factorToBase: Number(form.factorToBase),
      })
      onSuccess(created)
      onClose()
    } catch (err) {
      const translated = translateApiError(err, t)
      setSubmitError(translated.message)
      if (translated.fieldErrors) {
        setFieldErrors((prev) => ({ ...prev, ...translated.fieldErrors }))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      size="medium"
      title={t('inventory.uom.modal.addTitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="tenant-uom-form" variant="primary" disabled={saving}>
            {saving ? (
              <>
                <span className="list-state__spinner" aria-hidden="true" />
                {' ' + t('branches.actions.saving')}
              </>
            ) : (
              t('common.save')
            )}
          </Button>
        </>
      }
    >
      <form id="tenant-uom-form" className="form form-card" dir="rtl" onSubmit={handleSubmit}>
        {submitError ? <div className="alert-error">{submitError}</div> : null}
        <FieldGrid columns={2}>
          <TenantCodeInput
            id="tenant-uom-code"
            label={t('inventory.uom.fields.code')}
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
          <FormField label={t('inventory.uom.fields.name')} htmlFor="tenant-uom-name" error={fieldErrors.name}>
            <FormInput
              id="tenant-uom-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('inventory.uom.fields.nameAr')} htmlFor="tenant-uom-name-ar">
            <FormInput
              id="tenant-uom-name-ar"
              dir="rtl"
              value={form.nameAr}
              onChange={(e) => setForm((prev) => ({ ...prev, nameAr: e.target.value }))}
              disabled={saving}
            />
          </FormField>
          <FormField label={t('inventory.uom.fields.symbol')} htmlFor="tenant-uom-symbol" error={fieldErrors.symbol}>
            <FormInput
              id="tenant-uom-symbol"
              ltr
              value={form.symbol}
              onChange={(e) => setForm((prev) => ({ ...prev, symbol: e.target.value }))}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('inventory.uom.fields.typeFilter')} htmlFor="tenant-uom-type-filter">
            <FormSelect
              id="tenant-uom-type-filter"
              value={form.typeFilter}
              onChange={(e) => handleTypeFilterChange(e.target.value as UomType)}
              disabled={saving}
            >
              {TENANT_UOM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {getTenantUomTypeLabel(type)}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={t('inventory.uom.fields.baseUom')} htmlFor="tenant-uom-base" error={fieldErrors.baseUom}>
            <FormSelect
              id="tenant-uom-base"
              value={form.baseUom}
              onChange={(e) => handleBaseUomChange(e.target.value)}
              disabled={saving}
            >
              <option value="">{t('inventory.uom.fields.baseUomSelect')}</option>
              {baseUomOptions.map((opt) => (
                <option key={opt.id} value={String(opt.id)}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField
            label={factorLabel}
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
