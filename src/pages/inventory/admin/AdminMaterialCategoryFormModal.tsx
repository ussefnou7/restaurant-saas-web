import { useEffect, useState, type FormEvent } from 'react'
import { FieldGrid, FormField, FormInput, StatusSwitch } from '../../../components/fields'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { useTranslation } from '../../../i18n/useTranslation'
import * as adminInventoryService from '../../../services/adminInventoryService'
import type { AdminMaterialCategoryResponse } from '../../../types/inventory'

type FormMode = 'create' | 'edit'

interface AdminMaterialCategoryFormModalProps {
  open: boolean
  mode: FormMode
  category?: AdminMaterialCategoryResponse | null
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

export function AdminMaterialCategoryFormModal({
  open,
  mode,
  category,
  onClose,
  onSuccess,
}: AdminMaterialCategoryFormModalProps) {
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
        name: category.nameEn ?? category.name,
        nameAr: category.nameAr ?? '',
        active: category.active,
        sortOrder: category.sortOrder != null ? String(category.sortOrder) : '',
      })
    }
  }, [open, isCreate, category])

  function validate(): string | null {
    if (!form.code.trim()) return t('inventory.admin.categories.validation.codeRequired')
    if (!form.name.trim()) return t('inventory.admin.categories.validation.nameRequired')
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

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      nameAr: form.nameAr.trim() || null,
      active: form.active,
      sortOrder: Number.isNaN(sortOrder as number) ? null : sortOrder,
    }

    setSaving(true)
    try {
      if (isCreate) {
        await adminInventoryService.createAdminMaterialCategory(payload)
      } else if (category) {
        await adminInventoryService.updateAdminMaterialCategory(category.id, payload)
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
          ? t('inventory.admin.categories.modal.addTitle')
          : t('inventory.admin.categories.modal.editTitle')
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="admin-material-category-form"
            variant="primary"
            disabled={saving}
          >
            {saving ? t('branches.actions.saving') : t('common.save')}
          </Button>
        </>
      }
    >
      <form id="admin-material-category-form" className="form form-card" onSubmit={handleSubmit}>
        {error ? <div className="alert-error">{error}</div> : null}
        <FieldGrid columns={2}>
          <FormField label={t('inventory.col.code')} htmlFor="admin-category-code">
            <FormInput
              id="admin-category-code"
              ltr
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              disabled={saving || !isCreate}
              readOnly={!isCreate}
              required
            />
          </FormField>
          <FormField label={t('inventory.col.name')} htmlFor="admin-category-name">
            <FormInput
              id="admin-category-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('inventory.fields.nameAr')} htmlFor="admin-category-name-ar">
            <FormInput
              id="admin-category-name-ar"
              dir="rtl"
              value={form.nameAr}
              onChange={(e) => setForm((prev) => ({ ...prev, nameAr: e.target.value }))}
              placeholder={t('inventory.fields.nameArPlaceholder')}
              disabled={saving}
            />
          </FormField>
          <FormField
            label={t('inventory.categories.fields.sortOrder')}
            htmlFor="admin-category-sort"
          >
            <FormInput
              id="admin-category-sort"
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
