import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { FieldGrid, FormField, FormInput, FormTextarea, StatusSwitch } from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { Dropdown } from '../../components/ui/Dropdown'
import { LoadingRows } from '../../components/ui/LoadingRows'
import { Modal } from '../../components/ui/Modal'
import { useTranslation } from '../../i18n/useTranslation'
import * as menuService from '../../services/menuService'
import type { MenuCategory, Product } from '../../types/menu'
import { useMenuCategories } from './MenuCategoriesContext'
import {
  formatMenuPrice,
  parseNonNegativeNumber,
  QUICK_ADD_CATEGORY_VALUE,
} from './menuNumberUtils'
import { MenuQuickAddCategoryModal } from './MenuQuickAddCategoryModal'

type FormMode = 'create' | 'edit'

interface MenuProductFormModalProps {
  open: boolean
  mode: FormMode
  product?: Product | null
  onClose: () => void
  onSuccess: () => void
}

const emptyForm = {
  name: '',
  description: '',
  sellingPrice: '',
  menuCategoryId: '',
  active: true,
}

export function MenuProductFormModal({
  open,
  mode,
  product,
  onClose,
  onSuccess,
}: MenuProductFormModalProps) {
  const { t } = useTranslation()
  const { categories, loading: categoriesLoading, refreshCategories } = useMenuCategories()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const isCreate = mode === 'create'

  const activeCategories = useMemo(
    () => categories.filter((category) => category.active),
    [categories],
  )

  const categoryOptions = useMemo(
    () => [
      ...activeCategories.map((category) => ({
        value: String(category.id),
        label: category.name,
      })),
      {
        value: QUICK_ADD_CATEGORY_VALUE,
        label: t('menu.products.quickAddCategory.option'),
      },
    ],
    [activeCategories, t],
  )

  useEffect(() => {
    if (!open) return
    void refreshCategories()
  }, [open, refreshCategories])

  useEffect(() => {
    if (!open) return
    setError('')
    if (isCreate) {
      setForm(emptyForm)
      return
    }
    if (product) {
      setForm({
        name: product.name,
        description: product.description ?? '',
        sellingPrice: String(product.sellingPrice),
        menuCategoryId: String(product.menuCategoryId),
        active: product.active,
      })
    }
  }, [open, isCreate, product])

  useEffect(() => {
    if (!open || !isCreate || activeCategories.length === 0) return
    setForm((prev) => {
      if (prev.menuCategoryId) return prev
      return { ...prev, menuCategoryId: String(activeCategories[0].id) }
    })
  }, [open, isCreate, activeCategories])

  function handleCategoryChange(value: string) {
    if (value === QUICK_ADD_CATEGORY_VALUE) {
      setQuickAddOpen(true)
      return
    }
    setForm((prev) => ({ ...prev, menuCategoryId: value }))
  }

  function validate(): string | null {
    if (!form.name.trim()) return t('menu.products.validation.nameRequired')
    const sellingPrice = parseNonNegativeNumber(form.sellingPrice)
    if (sellingPrice === null) return t('menu.products.validation.priceInvalid')
    if (!form.menuCategoryId || form.menuCategoryId === QUICK_ADD_CATEGORY_VALUE) {
      return t('menu.products.validation.categoryRequired')
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

    const sellingPrice = parseNonNegativeNumber(form.sellingPrice) ?? 0

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        sellingPrice,
        menuCategoryId: Number(form.menuCategoryId),
      }

      if (isCreate) {
        await menuService.createProduct(payload)
      } else if (product) {
        await menuService.updateProduct(product.id, payload)
        if (form.active !== product.active) {
          await menuService.toggleProductActive(product.id)
        }
      }
      onSuccess()
      onClose()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  async function handleQuickCategoryCreated(category: MenuCategory) {
    await refreshCategories()
    setForm((prev) => ({ ...prev, menuCategoryId: String(category.id) }))
  }

  return (
    <>
      <Modal
        open={open}
        size="medium"
        title={isCreate ? t('menu.products.modal.addTitle') : t('menu.products.modal.editTitle')}
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              form="menu-product-form"
              variant="primary"
              disabled={saving || categoriesLoading}
            >
              {saving ? t('branches.actions.saving') : t('common.save')}
            </Button>
          </>
        }
      >
        <form id="menu-product-form" className="form form-card" onSubmit={handleSubmit}>
          {error ? <div className="alert-error">{error}</div> : null}
          {categoriesLoading ? (
            <LoadingRows columns={2} rows={3} />
          ) : (
            <FieldGrid columns={2}>
              <FormField label={t('menu.fields.name')} htmlFor="menu-product-name">
                <FormInput
                  id="menu-product-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={saving}
                  required
                />
              </FormField>
              <FormField label={t('menu.fields.category')} htmlFor="menu-product-category">
                <Dropdown
                  value={form.menuCategoryId}
                  onChange={handleCategoryChange}
                  options={categoryOptions}
                  ariaLabel={t('menu.fields.category')}
                  disabled={saving}
                />
              </FormField>
              <FormField label={t('menu.fields.sellingPrice')} htmlFor="menu-product-price">
                <FormInput
                  id="menu-product-price"
                  type="number"
                  ltr
                  min={0}
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={(e) => setForm((prev) => ({ ...prev, sellingPrice: e.target.value }))}
                  disabled={saving}
                  placeholder={formatMenuPrice(0, 'en')}
                />
              </FormField>
              {!isCreate ? (
                <FormField label={t('common.status')}>
                  <StatusSwitch
                    active={form.active}
                    disabled={saving}
                    onChange={(active) => setForm((prev) => ({ ...prev, active }))}
                  />
                </FormField>
              ) : null}
              <FormField label={t('menu.fields.description')} htmlFor="menu-product-description">
                <FormTextarea
                  id="menu-product-description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  disabled={saving}
                  rows={3}
                />
              </FormField>
            </FieldGrid>
          )}
        </form>
      </Modal>

      <MenuQuickAddCategoryModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onCreated={(category) => void handleQuickCategoryCreated(category)}
      />
    </>
  )
}
