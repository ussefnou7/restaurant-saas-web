import { useEffect, useState, type FormEvent } from 'react'
import { FieldGrid, FormField, FormInput } from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useTranslation } from '../../i18n/useTranslation'
import * as menuService from '../../services/menuService'
import type { MenuCategory } from '../../types/menu'
import { parseNonNegativeNumber } from './menuNumberUtils'

interface MenuQuickAddCategoryModalProps {
  open: boolean
  onClose: () => void
  onCreated: (category: MenuCategory) => void
}

const emptyForm = {
  name: '',
  sortOrder: '0',
}

export function MenuQuickAddCategoryModal({
  open,
  onClose,
  onCreated,
}: MenuQuickAddCategoryModalProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(emptyForm)
    setError('')
  }, [open])

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
      const created = await menuService.createMenuCategory({
        name: form.name.trim(),
        sortOrder,
        active: true,
      })
      onCreated(created)
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
      title={t('menu.products.quickAddCategory.title')}
      subtitle={t('menu.products.quickAddCategory.subtitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="menu-quick-category-form" variant="primary" disabled={saving}>
            {saving ? t('branches.actions.saving') : t('common.save')}
          </Button>
        </>
      }
    >
      <form id="menu-quick-category-form" className="form form-card" onSubmit={handleSubmit}>
        {error ? <div className="alert-error">{error}</div> : null}
        <FieldGrid columns={2}>
          <FormField label={t('menu.fields.name')} htmlFor="menu-quick-category-name">
            <FormInput
              id="menu-quick-category-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('menu.fields.sortOrder')} htmlFor="menu-quick-category-sort">
            <FormInput
              id="menu-quick-category-sort"
              type="number"
              ltr
              min={0}
              value={form.sortOrder}
              onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
              disabled={saving}
            />
          </FormField>
        </FieldGrid>
      </form>
    </Modal>
  )
}
