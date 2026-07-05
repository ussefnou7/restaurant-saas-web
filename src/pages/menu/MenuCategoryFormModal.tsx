import { useEffect, useState, type FormEvent } from 'react'
import { FieldGrid, FormField, FormInput, StatusSwitch } from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useTranslation } from '../../i18n/useTranslation'
import * as menuService from '../../services/menuService'
import type { MenuCategory } from '../../types/menu'
import { parseNonNegativeNumber } from './menuNumberUtils'

type FormMode = 'create' | 'edit'

interface MenuCategoryFormModalProps {
  open: boolean
  mode: FormMode
  category?: MenuCategory | null
  onClose: () => void
  onSuccess: () => void
}

const emptyForm = {
  name: '',
  sortOrder: '0',
  active: true,
}

export function MenuCategoryFormModal({
  open,
  mode,
  category,
  onClose,
  onSuccess,
}: MenuCategoryFormModalProps) {
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
        name: category.name,
        sortOrder: String(category.sortOrder ?? 0),
        active: category.active,
      })
    }
  }, [open, isCreate, category])

  function validate(): string | null {
    if (!form.name.trim()) return t('menu.categories.validation.nameRequired')
    const sortOrder = parseNonNegativeNumber(form.sortOrder)
    if (sortOrder === null) return t('menu.categories.validation.sortOrderInvalid')
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

    const sortOrder = parseNonNegativeNumber(form.sortOrder) ?? 0

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        sortOrder,
        active: form.active,
      }

      if (isCreate) {
        await menuService.createMenuCategory(payload)
      } else if (category) {
        await menuService.updateMenuCategory(category.id, payload)
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
        isCreate ? t('menu.categories.modal.addTitle') : t('menu.categories.modal.editTitle')
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="menu-category-form" variant="primary" disabled={saving}>
            {saving ? t('branches.actions.saving') : t('common.save')}
          </Button>
        </>
      }
    >
      <form id="menu-category-form" className="form form-card" onSubmit={handleSubmit}>
        {error ? <div className="alert-error">{error}</div> : null}
        <FieldGrid columns={2}>
          <FormField label={t('menu.fields.name')} htmlFor="menu-category-name">
            <FormInput
              id="menu-category-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('menu.fields.sortOrder')} htmlFor="menu-category-sort">
            <FormInput
              id="menu-category-sort"
              type="number"
              ltr
              min={0}
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
