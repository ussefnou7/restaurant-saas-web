import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  FieldGrid,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  StatusSwitch,
} from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { TenantCodeInput } from '../../components/ui/TenantCodeInput'
import { useTranslation } from '../../i18n/useTranslation'
import * as inventoryService from '../../services/inventoryService'
import type { MaterialCategoryResponse, MaterialResponse, UomResponse } from '../../types/inventory'
import { translateApiError } from '../../utils/errors'
import { getInventoryLocalizedName } from '../../utils/inventoryDisplay'
import { resolveDisplayUomId, resolveStockUomId } from '../../utils/inventoryUom'
import { TENANT_ENTITY_PREFIXES } from '../../utils/tenantCode'

type FormMode = 'create' | 'edit'

interface MaterialFormModalProps {
  open: boolean
  mode: FormMode
  material?: MaterialResponse | null
  categories: MaterialCategoryResponse[]
  onClose: () => void
  onSuccess: () => void
}

function buildSelectableUoms(uoms: UomResponse[], currentIds: number[]): UomResponse[] {
  const active = uoms.filter((uom) => uom.active)
  const extras = currentIds
    .map((id) => uoms.find((uom) => uom.id === id))
    .filter(
      (uom): uom is UomResponse =>
        uom != null && !active.some((activeUom) => activeUom.id === uom.id),
    )

  return [...extras, ...active]
}

const emptyForm = {
  code: '',
  name: '',
  nameAr: '',
  categoryId: '',
  stockUomId: '',
  displayUomId: '',
  minimumStockLevel: '',
  active: true,
  notes: '',
}

export function MaterialFormModal({
  open,
  mode,
  material,
  categories,
  onClose,
  onSuccess,
}: MaterialFormModalProps) {
  const { t, locale } = useTranslation()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingUoms, setLoadingUoms] = useState(false)
  const [uoms, setUoms] = useState<UomResponse[]>([])
  const isCreate = mode === 'create'

  useEffect(() => {
    if (!open) return
    setError('')
    if (isCreate) {
      setForm(emptyForm)
      return
    }
    if (material) {
      setForm({
        code: material.code,
        name: material.name,
        nameAr: material.nameAr ?? '',
        categoryId: String(material.categoryId),
        stockUomId: String(resolveStockUomId(material)),
        displayUomId: String(resolveDisplayUomId(material)),
        minimumStockLevel:
          material.minimumStockLevel != null ? String(material.minimumStockLevel) : '',
        active: material.active,
        notes: material.notes ?? '',
      })
    }
  }, [open, isCreate, material])

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function loadUoms() {
      setLoadingUoms(true)
      try {
        const data = await inventoryService.getUoms(false)
        if (!cancelled) {
          setUoms(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(translateApiError(err, t).message)
          setUoms([])
        }
      } finally {
        if (!cancelled) {
          setLoadingUoms(false)
        }
      }
    }

    void loadUoms()

    return () => {
      cancelled = true
    }
  }, [open, t])

  const categoryOptions = useMemo(
    () => [
      { value: '', label: t('inventory.common.selectCategory') },
      ...categories
        .filter((c) => c.active)
        .map((c) => ({ value: String(c.id), label: c.name })),
    ],
    [categories, t],
  )

  const uomOptions = useMemo(() => {
    const currentIds = material
      ? [resolveStockUomId(material), resolveDisplayUomId(material)]
      : []
    const selectable = buildSelectableUoms(uoms, currentIds)
    const emptyLabel = loadingUoms
      ? t('common.loading')
      : t('inventory.common.selectUom')

    return [
      { value: '', label: emptyLabel },
      ...selectable.map((u) => ({
        value: String(u.id),
        label: getInventoryLocalizedName(u, locale),
      })),
    ]
  }, [locale, loadingUoms, material, t, uoms])

  function validate(): string | null {
    if (!form.code.trim()) return t('inventory.materials.validation.codeRequired')
    if (!form.name.trim()) return t('inventory.materials.validation.nameRequired')
    if (!form.categoryId) return t('inventory.materials.validation.categoryRequired')
    if (!form.stockUomId) return t('inventory.materials.validation.stockUomRequired')
    if (!form.displayUomId) return t('inventory.materials.validation.displayUomRequired')
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

    const minimumStockLevel = form.minimumStockLevel.trim()
      ? Number(form.minimumStockLevel)
      : null

    setSaving(true)
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        nameAr: form.nameAr.trim() || null,
        categoryId: Number(form.categoryId),
        stockUomId: Number(form.stockUomId),
        displayUomId: Number(form.displayUomId),
        minimumStockLevel: Number.isNaN(minimumStockLevel as number) ? null : minimumStockLevel,
        active: form.active,
        notes: form.notes.trim() || null,
      }

      if (isCreate) {
        await inventoryService.createMaterial(payload)
      } else if (material) {
        await inventoryService.updateMaterial(material.id, payload)
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
        isCreate ? t('inventory.materials.modal.addTitle') : t('inventory.materials.modal.editTitle')
      }
      subtitle={
        isCreate
          ? t('inventory.materials.modal.addSubtitle')
          : t('inventory.materials.modal.editSubtitle')
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="material-form" variant="primary" disabled={saving}>
            {saving ? t('branches.actions.saving') : t('common.save')}
          </Button>
        </>
      }
    >
      <form id="material-form" className="form form-card" onSubmit={handleSubmit}>
        {error ? <div className="alert-error">{error}</div> : null}
        <FieldGrid columns={2}>
          {isCreate ? (
            <TenantCodeInput
              id="material-code"
              label={t('inventory.col.code')}
              entityPrefix={TENANT_ENTITY_PREFIXES.MAT}
              value={form.code}
              onChange={(code) => setForm((prev) => ({ ...prev, code }))}
              disabled={saving}
              required
            />
          ) : (
            <FormField label={t('inventory.col.code')}>
              <FormInput type="text" ltr value={form.code} readOnly disabled />
            </FormField>
          )}
          <FormField label={t('inventory.col.name')} htmlFor="material-name">
            <FormInput
              id="material-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('inventory.fields.nameAr')} htmlFor="material-name-ar">
            <FormInput
              id="material-name-ar"
              dir="rtl"
              value={form.nameAr}
              onChange={(e) => setForm((prev) => ({ ...prev, nameAr: e.target.value }))}
              placeholder={t('inventory.fields.nameArPlaceholder')}
              disabled={saving}
            />
          </FormField>
          <FormField label={t('inventory.col.category')}>
            <FormSelect
              value={form.categoryId}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              disabled={saving}
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={t('inventory.col.stockUom')}>
            <FormSelect
              value={form.stockUomId}
              onChange={(e) => setForm((prev) => ({ ...prev, stockUomId: e.target.value }))}
              disabled={saving || loadingUoms}
            >
              {uomOptions.map((opt) => (
                <option key={`stock-${opt.value}`} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
            <p className="form-hint">{t('inventory.col.stockUomHint')}</p>
          </FormField>
          <FormField label={t('inventory.col.displayUom')}>
            <FormSelect
              value={form.displayUomId}
              onChange={(e) => setForm((prev) => ({ ...prev, displayUomId: e.target.value }))}
              disabled={saving || loadingUoms}
            >
              {uomOptions.map((opt) => (
                <option key={`display-${opt.value}`} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
            <p className="form-hint">{t('inventory.col.displayUomHint')}</p>
          </FormField>
          <FormField
            label={t('inventory.materials.fields.minimumStockLevel')}
            htmlFor="material-min-stock"
          >
            <FormInput
              id="material-min-stock"
              type="number"
              min={0}
              ltr
              value={form.minimumStockLevel}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, minimumStockLevel: e.target.value }))
              }
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
          <FormField label={t('inventory.materials.fields.notes')} htmlFor="material-notes" fullWidth>
            <FormTextarea
              id="material-notes"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              disabled={saving}
            />
          </FormField>
        </FieldGrid>
      </form>
    </Modal>
  )
}
