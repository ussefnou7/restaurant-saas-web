import { useEffect, useState, type FormEvent } from 'react'
import { FieldGrid, FormField, FormInput, StatusSwitch } from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { TenantCodeInput } from '../../components/ui/TenantCodeInput'
import { useTranslation } from '../../i18n/useTranslation'
import * as inventoryService from '../../services/inventoryService'
import type { MaterialCategoryResponse } from '../../types/inventory'
import { TENANT_ENTITY_PREFIXES } from '../../utils/tenantCode'

type FormMode = 'create' | 'edit'

interface MaterialCategoryFormModalProps {
  open: boolean
  mode: FormMode
  category?: MaterialCategoryResponse | null
  onClose: () => void
  onSuccess: () => void
}

const emptyForm = {
  code: '',
  name: '',
  nameAr: '',
  active: true,
  sortOrder: '',
}

export function MaterialCategoryFormModal({
  open,
  mode,
  category,
  onClose,
  onSuccess,
}: MaterialCategoryFormModalProps) {
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
    if (category) {
      setForm({
        code: category.code,
        name: category.name,
        nameAr: category.nameAr ?? '',
        active: category.active,
        sortOrder: category.sortOrder != null ? String(category.sortOrder) : '',
      })
    }
  }, [open, isCreate, category])

  function validate(): string | null {
    if (!form.code.trim()) return t('inventory.categories.validation.codeRequired')
    if (!form.name.trim()) return t('inventory.categories.validation.nameRequired')
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

    const sortOrder = form.sortOrder.trim() ? Number(form.sortOrder) : null

    setSaving(true)
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        nameAr: form.nameAr.trim() || null,
        active: form.active,
        sortOrder: Number.isNaN(sortOrder as number) ? null : sortOrder,
      }

      if (isCreate) {
        await inventoryService.createMaterialCategory(payload)
      } else if (category) {
        await inventoryService.updateMaterialCategory(category.id, payload)
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
          ? t('inventory.categories.modal.addTitle')
          : t('inventory.categories.modal.editTitle')
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="material-category-form" variant="primary" disabled={saving}>
            {saving ? t('branches.actions.saving') : t('common.save')}
          </Button>
        </>
      }
    >
      <form id="material-category-form" className="form form-card" onSubmit={handleSubmit}>
        {error ? <div className="alert-error">{error}</div> : null}
        <FieldGrid columns={2}>
          {isCreate ? (
            <TenantCodeInput
              id="material-category-code"
              label={t('inventory.col.code')}
              entityPrefix={TENANT_ENTITY_PREFIXES.MCAT}
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
          <FormField label={t('inventory.col.name')} htmlFor="category-name">
            <FormInput
              id="category-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('inventory.fields.nameAr')} htmlFor="category-name-ar">
            <FormInput
              id="category-name-ar"
              dir="rtl"
              value={form.nameAr}
              onChange={(e) => setForm((prev) => ({ ...prev, nameAr: e.target.value }))}
              placeholder={t('inventory.fields.nameArPlaceholder')}
              disabled={saving}
            />
          </FormField>
          <FormField label={t('inventory.categories.fields.sortOrder')} htmlFor="category-sort">
            <FormInput
              id="category-sort"
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
