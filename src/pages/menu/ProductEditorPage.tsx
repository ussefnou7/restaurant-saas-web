import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, Image as ImageIcon, Save, Trash2 } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { FieldGrid, FormField, FormInput, FormTextarea, StatusSwitch } from '../../components/fields'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Dropdown } from '../../components/ui/Dropdown'
import { LoadingRows } from '../../components/ui/LoadingRows'
import { useNotify } from '../../components/ui/NotificationContext'
import { DetailTabPanel, DetailTabs } from '../../components/entity-detail/DetailTabs'
import { useTranslation } from '../../i18n/useTranslation'
import * as menuService from '../../services/menuService'
import type { Product } from '../../types/menu'
import { translateApiError } from '../../utils/errors'
import { useMenuCategories } from './MenuCategoriesContext'
import { formatMenuPrice, parseNonNegativeNumber } from './menuNumberUtils'
import { ProductAddOnsTab } from './tabs/ProductAddOnsTab'
import { ProductRecipeTab } from './tabs/ProductRecipeTab'
import { ProductVariantsTab } from './tabs/ProductVariantsTab'

type ProductRole = 'standalone' | 'parent' | 'variant'

const emptyForm = {
  name: '',
  nameEn: '',
  description: '',
  descriptionAr: '',
  sellingPrice: '',
  menuCategoryId: '',
  isMenu: true,
}

function getProductRole(product: Product | null): ProductRole {
  if (product?.parentProductId != null) return 'variant'
  if (product?.parent || product?.isParent) return 'parent'
  return 'standalone'
}

export function ProductEditorPage() {
  const { t, locale } = useTranslation()
  const notify = useNotify()
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { categories, loading: categoriesLoading, refreshCategories } = useMenuCategories()
  const productId = id ? Number(id) : null
  const isCreate = productId == null

  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<Product[]>([])
  const [form, setForm] = useState(emptyForm)
  const [savedSnapshot, setSavedSnapshot] = useState('')
  const [loading, setLoading] = useState(!isCreate)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('recipe')

  const role = getProductRole(product)
  const isParent = role === 'parent'
  const isVariant = role === 'variant'
  const dirty = JSON.stringify(form) !== savedSnapshot

  const loadProduct = useCallback(async () => {
    if (isCreate || productId == null) return
    setLoading(true)
    setError('')
    try {
      const nextProduct = await menuService.getProduct(productId)
      setProduct(nextProduct)
      const nextForm = {
        name: nextProduct.name,
        nameEn: '',
        description: nextProduct.description ?? '',
        descriptionAr: nextProduct.descriptionAr ?? '',
        sellingPrice: String(nextProduct.sellingPrice),
        menuCategoryId: String(nextProduct.menuCategoryId),
        isMenu: nextProduct.isMenu,
      }
      setForm(nextForm)
      setSavedSnapshot(JSON.stringify(nextForm))
      if (nextProduct.parent || nextProduct.isParent) {
        const nextVariants = await menuService.getProductVariants(nextProduct.id)
        setVariants(nextVariants)
        setActiveTab('variants')
      } else if (nextProduct.parentProductId != null) {
        setVariants([])
        setActiveTab('recipe')
      } else {
        setVariants([])
        setActiveTab('recipe')
      }
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [isCreate, productId, t])

  useEffect(() => {
    void refreshCategories()
  }, [refreshCategories])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!isCreate) {
        void loadProduct()
        return
      }
      const categoryId = searchParams.get('categoryId') ?? ''
      const nextForm = {
        ...emptyForm,
        menuCategoryId: categoryId,
      }
      setForm(nextForm)
      setSavedSnapshot(JSON.stringify(nextForm))
      setProduct(null)
      setLoading(false)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [isCreate, loadProduct, searchParams])

  useEffect(() => {
    if (!isCreate || form.menuCategoryId || categories.length === 0) return
    const firstActive = categories.find((category) => category.active)
    if (!firstActive) return
    const timer = window.setTimeout(() => {
      setForm((current) => ({ ...current, menuCategoryId: String(firstActive.id) }))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [categories, form.menuCategoryId, isCreate])

  const categoryOptions = useMemo(
    () =>
      categories
        .filter((category) => category.active || String(category.id) === form.menuCategoryId)
        .map((category) => ({
          value: String(category.id),
          label: category.name,
        })),
    [categories, form.menuCategoryId],
  )

  const tabs = useMemo(() => {
    if (isCreate) {
      return [
        { id: 'recipe', label: t('menu.editor.tabs.recipe') },
        { id: 'addons', label: t('menu.editor.tabs.addons') },
      ]
    }
    if (isParent) {
      return [
        { id: 'variants', label: t('menu.editor.tabs.variants') },
        { id: 'addons', label: t('menu.editor.tabs.addons') },
      ]
    }
    if (isVariant) return [{ id: 'recipe', label: t('menu.editor.tabs.recipe') }]
    return [
      { id: 'recipe', label: t('menu.editor.tabs.recipe') },
      { id: 'addons', label: t('menu.editor.tabs.addons') },
    ]
  }, [isCreate, isParent, isVariant, t])

  const effectiveActiveTab = tabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : tabs[0]?.id ?? 'recipe'

  const variantPriceRange = useMemo(() => {
    const prices = variants.map((variant) => variant.sellingPrice).filter(Number.isFinite).sort((a, b) => a - b)
    if (prices.length === 0) return t('common.empty.dash')
    if (prices.length === 1) return formatMenuPrice(prices[0], locale)
    return `${formatMenuPrice(prices[0], locale)} – ${formatMenuPrice(prices.at(-1)!, locale)}`
  }, [locale, t, variants])

  function validate(): string | null {
    if (!form.name.trim()) return t('menu.products.validation.nameRequired')
    if (!form.menuCategoryId) return t('menu.products.validation.categoryRequired')
    if (!isParent && parseNonNegativeNumber(form.sellingPrice) === null) {
      return t('menu.products.validation.priceInvalid')
    }
    return null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      descriptionAr: form.descriptionAr.trim() || null,
      sellingPrice: isParent && product ? product.sellingPrice : parseNonNegativeNumber(form.sellingPrice) ?? 0,
      menuCategoryId: Number(form.menuCategoryId),
      parentProductId: product?.parentProductId ?? null,
      variantLabel: product?.variantLabel ?? null,
      variantLabelAr: product?.variantLabelAr ?? null,
      isMenu: isVariant ? false : form.isMenu,
    }

    try {
      if (isCreate) {
        const created = await menuService.createProduct(payload)
        notify.success(t('menu.toast.createSuccess'))
        navigate(`/menu/products/${created.id}/edit`, { replace: true })
      } else if (product) {
        const updated = await menuService.updateProduct(product.id, payload)
        notify.success(t('menu.toast.updateSuccess'))
        setProduct(updated)
        const nextForm = {
          name: updated.name,
          nameEn: form.nameEn,
          description: updated.description ?? '',
          descriptionAr: updated.descriptionAr ?? '',
          sellingPrice: String(updated.sellingPrice),
          menuCategoryId: String(updated.menuCategoryId),
          isMenu: updated.isMenu,
        }
        setForm(nextForm)
        setSavedSnapshot(JSON.stringify(nextForm))
      }
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!product) return
    setDeleting(true)
    setError('')
    try {
      await menuService.deleteProduct(product.id)
      notify.success(t('menu.toast.deleteSuccess'))
      navigate('/menu')
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setDeleting(false)
    }
  }

  const title = isCreate
    ? t('menu.editor.title.new')
    : t('menu.editor.title.edit', { name: product?.name ?? t('common.empty.dash') })

  return (
    <main className="product-editor">
      <div className="product-editor__topbar">
        <div className="product-editor__heading">
          <Button variant="secondary" size="sm" onClick={() => navigate('/menu/products')}>
            <ArrowLeft size={16} aria-hidden="true" />
            {t('menu.editor.back')}
          </Button>
          <div>
            <h1>{title}</h1>
            <p>{t('menu.editor.subtitle')}</p>
          </div>
        </div>
        <div className="product-editor__topbar-actions">
          {!isCreate ? (
            <Button
              variant="secondary"
              className="product-editor__delete-button"
              disabled={saving || loading || deleting}
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 size={16} aria-hidden="true" />
              {t('product.delete.confirm.title')}
            </Button>
          ) : null}
          <Button
            type="submit"
            form="product-editor-form"
            variant="primary"
            disabled={saving || loading || categoriesLoading || !dirty}
          >
            <Save size={16} aria-hidden="true" />
            {saving ? t('branches.actions.saving') : t('common.save')}
          </Button>
        </div>
      </div>

      {error ? <div className="page-error-banner">{error}</div> : null}
      {confirmingDelete ? (
        <div className="product-editor__delete-confirm">
          <span>{t('product.delete.confirm.message')}</span>
          <Button
            variant="secondary"
            size="sm"
            className="product-editor__delete-confirm-action"
            onClick={() => void confirmDelete()}
            disabled={deleting}
          >
            <Trash2 size={15} aria-hidden="true" />
            {t('product.delete.confirm.action')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setConfirmingDelete(false)}
            disabled={deleting}
          >
            {t('product.delete.confirm.cancel')}
          </Button>
        </div>
      ) : null}

      {loading ? (
        <LoadingRows columns={2} rows={5} />
      ) : (
        <>
          <form id="product-editor-form" className="product-editor__card" onSubmit={handleSubmit}>
            <div className="product-editor__card-head">
              <Badge variant="primary">{t(`menu.editor.role.${role}`)}</Badge>
              <div className="product-editor__image-slot" aria-label={t('menu.editor.fields.image')}>
                <ImageIcon size={20} aria-hidden="true" />
                <span>{t('menu.editor.fields.image')}</span>
              </div>
            </div>

            <FieldGrid columns={2} className="product-editor__fields">
              <FormField label={t('menu.editor.fields.nameAr')} htmlFor="product-editor-name" required>
                <FormInput
                  id="product-editor-name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  disabled={saving}
                  required
                />
              </FormField>
              <FormField label={t('menu.editor.fields.nameEn')} htmlFor="product-editor-name-en">
                <FormInput
                  id="product-editor-name-en"
                  value={form.nameEn}
                  onChange={(event) => setForm((current) => ({ ...current, nameEn: event.target.value }))}
                  disabled={saving}
                />
              </FormField>
              <FormField label={t('menu.fields.category')} htmlFor="product-editor-category" required>
                <Dropdown
                  value={form.menuCategoryId}
                  onChange={(menuCategoryId) => setForm((current) => ({ ...current, menuCategoryId }))}
                  options={categoryOptions}
                  ariaLabel={t('menu.fields.category')}
                  disabled={saving || categoriesLoading}
                />
              </FormField>
              <FormField label={isParent ? t('menu.editor.fields.priceRange') : t('menu.editor.fields.price')} htmlFor="product-editor-price">
                {isParent ? (
                  <div className="product-editor__price-range" dir="ltr">{variantPriceRange}</div>
                ) : (
                  <FormInput
                    id="product-editor-price"
                    type="number"
                    ltr
                    min={0}
                    step="0.01"
                    value={form.sellingPrice}
                    onChange={(event) => setForm((current) => ({ ...current, sellingPrice: event.target.value }))}
                    disabled={saving}
                  />
                )}
              </FormField>
              <FormField label={t('menu.editor.fields.descAr')} htmlFor="product-editor-description-ar">
                <FormTextarea
                  id="product-editor-description-ar"
                  value={form.descriptionAr}
                  onChange={(event) => setForm((current) => ({ ...current, descriptionAr: event.target.value }))}
                  disabled={saving}
                  rows={4}
                />
              </FormField>
              <FormField label={t('menu.editor.fields.descEn')} htmlFor="product-editor-description">
                <FormTextarea
                  id="product-editor-description"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  disabled={saving}
                  rows={4}
                />
              </FormField>
              {!isVariant ? (
                <div className="product-editor__visibility field-box--full">
                  <div>
                    <strong>{t('menu.editor.fields.isMenu')}</strong>
                    <span>
                      {isParent
                        ? t('menu.editor.fields.isMenuParentHint')
                        : t('menu.editor.fields.isMenuHint')}
                    </span>
                  </div>
                  <StatusSwitch
                    active={form.isMenu}
                    disabled={saving}
                    onChange={(isMenu) => setForm((current) => ({ ...current, isMenu }))}
                  />
                </div>
              ) : null}
            </FieldGrid>
          </form>

          {isCreate || product ? (
            <DetailTabs
              tabs={tabs}
              activeTab={effectiveActiveTab}
              onTabChange={setActiveTab}
              variant="sub"
              className="product-editor__tabs"
            >
              <DetailTabPanel id="recipe" active={effectiveActiveTab === 'recipe'}>
                {product ? <ProductRecipeTab product={product} /> : <p className="product-editor__tab-placeholder">{t('menu.editor.tabsHint')}</p>}
              </DetailTabPanel>
              <DetailTabPanel id="variants" active={effectiveActiveTab === 'variants' && Boolean(product)}>
                {product ? <ProductVariantsTab parent={product} onChanged={() => void loadProduct()} /> : null}
              </DetailTabPanel>
              <DetailTabPanel id="addons" active={effectiveActiveTab === 'addons'}>
                {product ? <ProductAddOnsTab product={product} /> : <p className="product-editor__tab-placeholder">{t('menu.editor.tabsHint')}</p>}
              </DetailTabPanel>
            </DetailTabs>
          ) : null}
        </>
      )}
    </main>
  )
}
