import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  FieldGrid,
  FormField,
  FormInput,
  FormSelect,
  StatusSwitch,
} from '../../../components/fields'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { useTranslation } from '../../../i18n/useTranslation'
import * as adminInventoryService from '../../../services/adminInventoryService'
import type {
  AdminMaterialCategoryResponse,
  MaterialCatalogResponse,
  UomResponse,
} from '../../../types/inventory'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { resolveDisplayUomId, resolveStockUomId } from '../../../utils/inventoryUom'

type FormMode = 'create' | 'edit'

interface AdminMaterialCatalogFormModalProps {
  open: boolean
  mode: FormMode
  item?: MaterialCatalogResponse | null
  categories: AdminMaterialCategoryResponse[]
  uoms: UomResponse[]
  onClose: () => void
  onSuccess: () => void
}

const emptyForm = {
  code: '',
  name: '',
  nameAr: '',
  categoryId: '',
  stockUomId: '',
  displayUomId: '',
  active: true,
}

export function AdminMaterialCatalogFormModal({
  open,
  mode,
  item,
  categories,
  uoms,
  onClose,
  onSuccess,
}: AdminMaterialCatalogFormModalProps) {
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
    if (item) {
      setForm({
        code: item.code,
        name: item.name,
        nameAr: item.nameAr ?? '',
        categoryId: String(item.categoryId),
        stockUomId: String(resolveStockUomId(item)),
        displayUomId: String(resolveDisplayUomId(item)),
        active: item.active,
      })
    }
  }, [open, isCreate, item])

  const categoryOptions = useMemo(
    () => [
      { value: '', label: t('inventory.common.selectCategory') },
      ...categories
        .filter((c) => c.active)
        .map((c) => ({
          value: String(c.id),
          label: getInventoryLocalizedName(c, locale),
        })),
    ],
    [categories, locale, t],
  )

  const uomOptions = useMemo(
    () => [
      { value: '', label: t('inventory.common.selectUom') },
      ...uoms
        .filter((u) => u.active)
        .map((u) => ({
          value: String(u.id),
          label: getInventoryLocalizedName(u, locale),
        })),
    ],
    [locale, t, uoms],
  )

  function validate(): string | null {
    if (!form.code.trim()) return t('inventory.admin.catalog.validation.codeRequired')
    if (!form.name.trim()) return t('inventory.admin.catalog.validation.nameRequired')
    if (!form.categoryId) return t('inventory.admin.catalog.validation.categoryRequired')
    if (!form.stockUomId) return t('inventory.admin.catalog.validation.stockUomRequired')
    if (!form.displayUomId) return t('inventory.admin.catalog.validation.displayUomRequired')
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
      categoryId: Number(form.categoryId),
      stockUomId: Number(form.stockUomId),
      displayUomId: Number(form.displayUomId),
      active: form.active,
    }

    setSaving(true)
    try {
      if (isCreate) {
        await adminInventoryService.createAdminMaterialCatalog(payload)
      } else if (item) {
        await adminInventoryService.updateAdminMaterialCatalog(item.id, payload)
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
        isCreate
          ? t('inventory.admin.catalog.modal.addTitle')
          : t('inventory.admin.catalog.modal.editTitle')
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="admin-material-catalog-form"
            variant="primary"
            disabled={saving}
          >
            {saving ? t('branches.actions.saving') : t('common.save')}
          </Button>
        </>
      }
    >
      <form id="admin-material-catalog-form" className="form form-card" onSubmit={handleSubmit}>
        {error ? <div className="alert-error">{error}</div> : null}
        <FieldGrid columns={2}>
          <FormField label={t('inventory.col.code')} htmlFor="admin-catalog-code">
            <FormInput
              id="admin-catalog-code"
              ltr
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              disabled={saving || !isCreate}
              readOnly={!isCreate}
              required
            />
          </FormField>
          <FormField label={t('inventory.col.name')} htmlFor="admin-catalog-name">
            <FormInput
              id="admin-catalog-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('inventory.fields.nameAr')} htmlFor="admin-catalog-name-ar">
            <FormInput
              id="admin-catalog-name-ar"
              dir="rtl"
              value={form.nameAr}
              onChange={(e) => setForm((prev) => ({ ...prev, nameAr: e.target.value }))}
              placeholder={t('inventory.fields.nameArPlaceholder')}
              disabled={saving}
            />
          </FormField>
          <FormField label={t('inventory.col.category')} htmlFor="admin-catalog-category">
            <FormSelect
              id="admin-catalog-category"
              value={form.categoryId}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              disabled={saving}
              required
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={t('inventory.col.adminStockUom')} htmlFor="admin-catalog-stock-uom">
            <FormSelect
              id="admin-catalog-stock-uom"
              value={form.stockUomId}
              onChange={(e) => setForm((prev) => ({ ...prev, stockUomId: e.target.value }))}
              disabled={saving}
              required
            >
              {uomOptions.map((opt) => (
                <option key={`stock-${opt.value}`} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
            <p className="form-hint">{t('inventory.col.stockUomHint')}</p>
          </FormField>
          <FormField label={t('inventory.col.adminDisplayUom')} htmlFor="admin-catalog-display-uom">
            <FormSelect
              id="admin-catalog-display-uom"
              value={form.displayUomId}
              onChange={(e) => setForm((prev) => ({ ...prev, displayUomId: e.target.value }))}
              disabled={saving}
              required
            >
              {uomOptions.map((opt) => (
                <option key={`display-${opt.value}`} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
            <p className="form-hint">{t('inventory.col.displayUomHint')}</p>
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
