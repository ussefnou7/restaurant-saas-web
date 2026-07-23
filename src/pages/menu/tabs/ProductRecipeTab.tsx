import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { LoadingRows } from '../../../components/ui/LoadingRows'
import { useNotify } from '../../../components/ui/NotificationContext'
import { useTranslation } from '../../../i18n/useTranslation'
import * as inventoryService from '../../../services/inventoryService'
import * as menuService from '../../../services/menuService'
import * as uomService from '../../../services/uomService'
import type { MaterialResponse, UomResponse } from '../../../types/inventory'
import type { Product, Recipe, RecipeItemRequest } from '../../../types/menu'
import { getApiErrorCode, translateApiError } from '../../../utils/errors'
import { parsePositiveNumber } from '../menuNumberUtils'
import { RecipeIngredientsEditor } from '../RecipeIngredientsEditor'
import { RecipeIngredientsReadOnly } from '../RecipeIngredientsReadOnly'
import {
  createRow,
  getMaterialStockUomId,
  rowsFromRecipeItems,
  serializeRows,
  formatRecipeVersionDate,
  type EditableRecipeRow,
} from '../recipeFormUtils'

interface ProductRecipeTabProps {
  product: Product
  nested?: boolean
}

function recipeTotal(recipe: Recipe | null): string {
  if (!recipe) return '0'
  const total = recipe.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  return Number.isInteger(total) ? String(total) : total.toFixed(2)
}

function hasRecipeItems(recipe: Recipe): boolean {
  return Array.isArray(recipe.items) && recipe.items.length > 0
}

export function ProductRecipeTab({ product, nested = false }: ProductRecipeTabProps) {
  const { t, locale } = useTranslation()
  const notify = useNotify()

  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null)
  const [history, setHistory] = useState<Recipe[]>([])
  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const [uoms, setUoms] = useState<UomResponse[]>([])
  const [rows, setRows] = useState<EditableRecipeRow[]>([])
  const [savedSnapshot, setSavedSnapshot] = useState('')
  const [loading, setLoading] = useState(true)
  const [lookupsLoading, setLookupsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [expandedVersionIds, setExpandedVersionIds] = useState<Set<number>>(new Set())
  const [versionDetails, setVersionDetails] = useState<Record<number, Recipe>>({})
  const [versionLoadingIds, setVersionLoadingIds] = useState<Set<number>>(new Set())
  const [versionErrors, setVersionErrors] = useState<Record<number, string>>({})
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [confirming, setConfirming] = useState(false)

  const isDirty = useMemo(() => serializeRows(rows) !== savedSnapshot, [rows, savedSnapshot])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setFormError('')
    try {
      const [active, versions] = await Promise.all([
        menuService.getActiveProductRecipe(product.id),
        menuService.getProductRecipes(product.id),
      ])
      setActiveRecipe(active)
      setHistory(versions)
      const nextRows = active ? rowsFromRecipeItems(active.items) : [createRow()]
      setRows(nextRows)
      setSavedSnapshot(serializeRows(nextRows))
      setEditing(active === null)
      setConfirming(false)
    } catch (err) {
      setActiveRecipe(null)
      setHistory([])
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [product.id, t])

  const loadLookups = useCallback(async () => {
    setLookupsLoading(true)
    try {
      const [materialList, uomList] = await Promise.all([
        inventoryService.getMaterials({ active: true }),
        uomService.getTenantUoms(),
      ])
      setMaterials(materialList)
      setUoms(uomList)
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setLookupsLoading(false)
    }
  }, [t])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
      void loadLookups()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load, loadLookups])

  function updateRow(key: string, patch: Partial<EditableRecipeRow>) {
    setRows((current) =>
      current.map((row) => {
        if (row.key !== key) return row
        const next = { ...row, ...patch }
        if (patch.materialId && patch.materialId !== row.materialId) {
          const material = materials.find((item) => String(item.id) === patch.materialId)
          const defaultUomId = material ? getMaterialStockUomId(material) : undefined
          next.uomId = defaultUomId ? String(defaultUomId) : ''
        }
        return next
      }),
    )
  }

  function validateRows(): string | null {
    if (rows.length === 0) return null
    const seenMaterials = new Set<number>()
    for (const row of rows) {
      if (!row.materialId) return t('menu.recipe.validation.materialRequired')
      const materialId = Number(row.materialId)
      if (seenMaterials.has(materialId)) return t('menu.recipe.validation.duplicateMaterial')
      seenMaterials.add(materialId)
      if (parsePositiveNumber(row.quantity) === null) return t('menu.recipe.validation.quantityInvalid')
      if (!row.uomId) return t('menu.recipe.validation.uomRequired')
    }
    return null
  }

  function requestSubmit() {
    setFormError('')
    const validationError = validateRows()
    if (validationError) {
      setFormError(validationError)
      return
    }
    setConfirming(true)
  }

  async function submitRecipe() {
    const payload: RecipeItemRequest[] = rows.map((row) => ({
      materialId: Number(row.materialId),
      quantity: parsePositiveNumber(row.quantity) ?? 0,
      uomId: Number(row.uomId),
    }))
    setSaving(true)
    try {
      await menuService.createProductRecipe(product.id, payload)
      notify.success(t('menu.recipe.toast.createSuccess'))
      await load()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  async function loadVersionDetails(recipeId: number) {
    if (versionDetails[recipeId] || versionLoadingIds.has(recipeId)) return
    setVersionLoadingIds((current) => new Set(current).add(recipeId))
    try {
      const recipe = await menuService.getRecipe(recipeId)
      setVersionDetails((current) => ({ ...current, [recipeId]: recipe }))
    } catch (err) {
      const message =
        getApiErrorCode(err) === 'RECIPE_NOT_FOUND'
          ? t('menu.recipe.version.notFound')
          : translateApiError(err, t).message
      setVersionErrors((current) => ({ ...current, [recipeId]: message }))
    } finally {
      setVersionLoadingIds((current) => {
        const next = new Set(current)
        next.delete(recipeId)
        return next
      })
    }
  }

  function toggleVersion(recipe: Recipe) {
    const expanded = expandedVersionIds.has(recipe.id)
    setExpandedVersionIds((current) => {
      const next = new Set(current)
      if (expanded) next.delete(recipe.id)
      else next.add(recipe.id)
      return next
    })
    if (!expanded && !hasRecipeItems(recipe)) void loadVersionDetails(recipe.id)
  }

  const rootClass = `product-recipe-tab${nested ? ' product-recipe-tab--nested' : ''}`

  return (
    <section className={rootClass}>
      {error ? <div className="page-error-banner">{error}</div> : null}
      <div className="product-recipe-tab__header">
        <div>
          <h3>{t('menu.recipe.ingredientsTitle')}</h3>
          <p>
            {activeRecipe
              ? t('menu.recipe.ingredientsSummaryWithTotal', {
                  count: activeRecipe.items.length,
                  total: recipeTotal(activeRecipe),
                })
              : t('menu.recipe.active.empty.description')}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setEditing(true)
            setConfirming(false)
          }}
          disabled={loading || lookupsLoading || saving}
        >
          <Plus size={16} aria-hidden="true" />
          {activeRecipe ? t('menu.recipe.active.createNewVersion') : t('menu.recipe.active.createRecipe')}
        </Button>
      </div>

      {loading ? (
        <LoadingRows columns={3} rows={3} />
      ) : editing ? (
        <div className="product-recipe-tab__builder">
          {formError ? <div className="alert-error">{formError}</div> : null}
          {activeRecipe ? <p className="product-recipe-tab__note">{t('menu.recipe.versioningNote')}</p> : null}
          <RecipeIngredientsEditor
            rows={rows}
            materials={materials}
            uoms={uoms}
            locale={locale}
            disabled={saving || lookupsLoading}
            onAdd={() => setRows((current) => [...current, createRow()])}
            onRemove={(key) => setRows((current) => current.filter((row) => row.key !== key))}
            onChange={updateRow}
          />
          <div className="product-recipe-tab__form-actions">
            <Button variant="secondary" size="sm" onClick={() => setEditing(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={requestSubmit} disabled={saving || lookupsLoading || !isDirty}>
              {saving ? t('branches.actions.saving') : t('menu.recipe.form.submit')}
            </Button>
          </div>
          {confirming ? (
            <div className="product-recipe-tab__confirm">
              <span>{t('menu.recipe.confirm.message')}</span>
              <Button variant="primary" size="sm" onClick={() => void submitRecipe()} disabled={saving}>
                {t('menu.recipe.confirm.confirm')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirming(false)} disabled={saving}>
                {t('common.cancel')}
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <RecipeIngredientsReadOnly
          items={activeRecipe?.items ?? []}
          emptyMessage={t('menu.recipe.active.empty.description')}
        />
      )}

      <div className="product-recipe-tab__history">
        <button
          type="button"
          className="product-recipe-tab__history-toggle"
          onClick={() => setHistoryOpen((current) => !current)}
          aria-expanded={historyOpen}
        >
          <span>{t('menu.recipe.history.title')}</span>
          {historyOpen ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
        </button>
        {historyOpen ? (
          <ul className="product-recipe-tab__history-list">
            {history.length === 0 ? <li className="product-recipe-tab__history-empty">{t('menu.recipe.history.empty')}</li> : null}
            {history.map((recipe) => {
              const expanded = expandedVersionIds.has(recipe.id)
              const items = hasRecipeItems(recipe) ? recipe.items : versionDetails[recipe.id]?.items ?? []
              return (
                <li key={recipe.id} className="product-recipe-tab__history-item">
                  <button type="button" onClick={() => toggleVersion(recipe)} aria-expanded={expanded}>
                    <span>{formatRecipeVersionDate(recipe.createdAt, locale)}</span>
                    {recipe.isActive ? <Badge variant="success">{t('menu.recipe.version.activeBadge')}</Badge> : null}
                    {expanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                  </button>
                  {expanded ? (
                    <div className="product-recipe-tab__history-detail">
                      {versionErrors[recipe.id] ? <div className="page-error-banner">{versionErrors[recipe.id]}</div> : null}
                      {versionLoadingIds.has(recipe.id) ? (
                        <LoadingRows columns={3} rows={2} />
                      ) : (
                        <RecipeIngredientsReadOnly items={items} emptyMessage={t('menu.recipe.active.noIngredients')} />
                      )}
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
