import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { FieldGrid, FormField, FormInput, FormTextarea, StatusSwitch } from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { DetailTabs, DetailTabPanel } from '../../components/entity-detail/DetailTabs'
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
import { ProductAddOnsPanel } from './ProductAddOnsPanel'
import { ProductRecipePanel } from './ProductRecipePanel'
import type { ProductEditorRole } from './ProductRolePickerModal'
import { ProductVariantsPanel } from './ProductVariantsPanel'

type FormMode = 'create' | 'edit'

interface MenuProductFormModalProps {
  open: boolean
  mode: FormMode
  product?: Product | null
  initialRole?: ProductEditorRole
  initialParentId?: number | null
  onClose: () => void
  onSuccess: () => void
  onRequestCreateVariant?: (parent: Product) => void
  onRequestEditProduct?: (product: Product) => void
  onRequestDeleteProduct?: (product: Product) => void
}

const emptyForm = {
  name: '',
  description: '',
  descriptionAr: '',
  variantLabel: '',
  variantLabelAr: '',
  sellingPrice: '',
  menuCategoryId: '',
  parentProductId: '',
  active: true,
  isMenu: true,
}

export function MenuProductFormModal({
  open,
  mode,
  product,
  initialRole = 'standard',
  initialParentId = null,
  onClose,
  onSuccess,
  onRequestCreateVariant,
  onRequestEditProduct,
  onRequestDeleteProduct,
}: MenuProductFormModalProps) {
  const { t } = useTranslation()
  const { categories, loading: categoriesLoading, refreshCategories } = useMenuCategories()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('recipe')
  const [parentCandidates, setParentCandidates] = useState<Product[]>([])
  const [parentsLoading, setParentsLoading] = useState(false)
  const [parentsError, setParentsError] = useState('')
  const isCreate = mode === 'create'

  const role: ProductEditorRole = isCreate
    ? initialRole
    : product?.parentProductId != null
      ? 'variant'
      : product?.parent
        ? 'parent'
        : product && !product.isMenu
          ? 'addOn'
          : 'standard'
  const isVariantChild = role === 'variant'
  const isParent = role === 'parent'
  const isAddOnOnly = role === 'addOn'
  const locksMenuVisibility = isVariantChild || (isCreate && isAddOnOnly)

  const activeCategories = useMemo(
    () => categories.filter((category) => category.active),
    [categories],
  )

  // Role-driven tabs: standalone → Recipe·Add-Ons, parent → Variants·Add-Ons, variant → Recipe.
  const tabItems = useMemo(() => {
    const items: { id: string; label: string }[] = []
    if (isParent) {
      items.push({ id: 'variants', label: t('menu.editor.tab.variants') })
    } else {
      items.push({ id: 'recipe', label: t('menu.editor.tab.recipe') })
    }
    if (!isVariantChild) {
      items.push({ id: 'addOns', label: t('menu.editor.tab.addOns') })
    }
    return items
  }, [isParent, isVariantChild, t])

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

  const parentOptions = useMemo(
    () => [
      { value: '', label: t('menu.fields.parentProductPlaceholder') },
      ...parentCandidates.map((candidate) => ({
        value: String(candidate.id),
        label: candidate.name,
      })),
    ],
    [parentCandidates, t],
  )

  const loadParentCandidates = useCallback(async () => {
    setParentsLoading(true)
    setParentsError('')
    try {
      const products = await menuService.getProducts()
      setParentCandidates(
        products.filter(
          (candidate) =>
            candidate.parentProductId == null &&
            candidate.isMenu &&
            candidate.id !== product?.id,
        ),
      )
    } catch {
      setParentCandidates([])
      setParentsError(t('menu.roles.parentLoadError'))
    } finally {
      setParentsLoading(false)
    }
  }, [product?.id, t])

  useEffect(() => {
    if (!open) return
    void refreshCategories()
  }, [open, refreshCategories])

  useEffect(() => {
    if (!open) return
    // The form draft intentionally resets when a different product or create role opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError('')
    // Default to the first tab available for this product's role.
    setActiveTab(product?.parent ? 'variants' : 'recipe')
    if (isCreate) {
      setForm({
        ...emptyForm,
        parentProductId: initialParentId == null ? '' : String(initialParentId),
        isMenu: initialRole !== 'variant' && initialRole !== 'addOn',
      })
      return
    }
    if (product) {
      setForm({
        name: product.name,
        description: product.description ?? '',
        descriptionAr: product.descriptionAr ?? '',
        variantLabel: product.variantLabel ?? '',
        variantLabelAr: product.variantLabelAr ?? '',
        sellingPrice: String(product.sellingPrice),
        menuCategoryId: String(product.menuCategoryId),
        parentProductId: product.parentProductId == null ? '' : String(product.parentProductId),
        active: product.active,
        isMenu: product.isMenu,
      })
    }
  }, [open, initialParentId, initialRole, isCreate, product])

  useEffect(() => {
    if (!open || !isVariantChild) return
    const timer = window.setTimeout(() => void loadParentCandidates(), 0)
    return () => window.clearTimeout(timer)
  }, [open, isVariantChild, loadParentCandidates])

  useEffect(() => {
    if (!open || !isCreate || activeCategories.length === 0) return
    // Defaulting the category is part of initializing a newly opened draft.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    if (isVariantChild && !form.parentProductId) {
      return t('menu.products.validation.parentRequired')
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
        descriptionAr: form.descriptionAr.trim() || null,
        sellingPrice,
        menuCategoryId: Number(form.menuCategoryId),
        // Variant identity is only meaningful for variant children; the server forces isMenu=false.
        parentProductId: isVariantChild ? Number(form.parentProductId) : null,
        variantLabel: isVariantChild ? form.variantLabel.trim() || null : null,
        variantLabelAr: isVariantChild ? form.variantLabelAr.trim() || null : null,
        isMenu: locksMenuVisibility ? false : form.isMenu,
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
        size="large"
        className="menu-product-editor-modal"
        title={isCreate ? t('menu.products.modal.addTitle') : t('menu.products.modal.editTitle')}
        subtitle={t('menu.products.modal.subtitle')}
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
        <div className="menu-product-editor__rolebar">
          <span className={`menu-product-role menu-product-role--${role}`}>
            {role === 'variant'
              ? t('menu.roles.variantOf', {
                  name:
                    parentCandidates.find((candidate) => String(candidate.id) === form.parentProductId)
                      ?.name ?? product?.name ?? t('menu.roles.variant'),
                })
              : t(`menu.roles.${role}`)}
          </span>
          {!isCreate ? (
            <StatusSwitch
              active={form.active}
              disabled={saving}
              onChange={(active) => setForm((prev) => ({ ...prev, active }))}
            />
          ) : null}
        </div>

        <form id="menu-product-form" className="form form-card menu-product-editor__form" onSubmit={handleSubmit}>
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
              {isVariantChild ? (
                <FormField
                  label={t('menu.fields.parentProduct')}
                  helper={parentsError || undefined}
                  className="menu-product-editor__parent-field"
                >
                  <Dropdown
                    value={form.parentProductId}
                    onChange={(parentProductId) =>
                      setForm((prev) => ({ ...prev, parentProductId }))
                    }
                    options={parentOptions}
                    ariaLabel={t('menu.fields.parentProduct')}
                    disabled={saving || parentsLoading}
                  />
                </FormField>
              ) : null}
              {isVariantChild ? (
                <>
                  <FormField
                    label={t('menu.fields.variantLabel')}
                    htmlFor="menu-product-variant-label"
                  >
                    <FormInput
                      id="menu-product-variant-label"
                      value={form.variantLabel}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, variantLabel: e.target.value }))
                      }
                      disabled={saving}
                    />
                  </FormField>
                  <FormField
                    label={t('menu.fields.variantLabelAr')}
                    htmlFor="menu-product-variant-label-ar"
                  >
                    <FormInput
                      id="menu-product-variant-label-ar"
                      value={form.variantLabelAr}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, variantLabelAr: e.target.value }))
                      }
                      disabled={saving}
                    />
                  </FormField>
                </>
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
              <FormField
                label={t('menu.fields.descriptionAr')}
                htmlFor="menu-product-description-ar"
              >
                <FormTextarea
                  id="menu-product-description-ar"
                  value={form.descriptionAr}
                  onChange={(e) => setForm((prev) => ({ ...prev, descriptionAr: e.target.value }))}
                  disabled={saving}
                  rows={3}
                />
              </FormField>
              <div className="menu-product-editor__visibility field-box--full">
                <div className="menu-product-editor__image-slot" aria-label={t('menu.fields.image')}>
                  <ImageIcon size={20} aria-hidden="true" />
                  <span>{t('menu.fields.image')}</span>
                </div>
                <div className="menu-product-editor__visibility-copy">
                  <strong>{t('menu.fields.isMenu')}</strong>
                  <span>
                    {isVariantChild
                      ? t('menu.fields.variantMenuHint')
                      : isAddOnOnly
                        ? t('menu.fields.addOnMenuHint')
                        : t('menu.fields.isMenuHint')}
                  </span>
                </div>
                <StatusSwitch
                  active={form.isMenu}
                  disabled={saving || locksMenuVisibility}
                  onChange={(isMenu) => setForm((prev) => ({ ...prev, isMenu }))}
                />
              </div>
            </FieldGrid>
          )}
        </form>

        {!isCreate && product ? (
          <DetailTabs
            tabs={tabItems}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="sub"
            className="menu-product-form__tabs"
          >
            <DetailTabPanel id="recipe" active={activeTab === 'recipe' && !isParent}>
              <ProductRecipePanel product={product} />
            </DetailTabPanel>
            <DetailTabPanel id="variants" active={activeTab === 'variants' && isParent}>
              <ProductVariantsPanel
                parent={product}
                onAddVariant={
                  onRequestCreateVariant ? () => onRequestCreateVariant(product) : undefined
                }
                onEditVariant={onRequestEditProduct}
                onDeleteVariant={onRequestDeleteProduct}
              />
            </DetailTabPanel>
            <DetailTabPanel id="addOns" active={activeTab === 'addOns' && !isVariantChild}>
              <ProductAddOnsPanel product={product} />
            </DetailTabPanel>
          </DetailTabs>
        ) : null}
      </Modal>

      <MenuQuickAddCategoryModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onCreated={(category) => void handleQuickCategoryCreated(category)}
      />
    </>
  )
}
