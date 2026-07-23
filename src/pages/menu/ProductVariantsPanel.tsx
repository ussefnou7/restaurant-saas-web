import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { LoadingRows } from '../../components/ui/LoadingRows'
import { useTranslation } from '../../i18n/useTranslation'
import { useLocalized } from '../../i18n/useLocalized'
import * as menuService from '../../services/menuService'
import type { Product, Recipe } from '../../types/menu'
import { translateApiError } from '../../utils/errors'
import { formatMenuPrice } from './menuNumberUtils'
import { RecipeIngredientsReadOnly } from './RecipeIngredientsReadOnly'
import { RecipeManageModal } from './RecipeManageModal'

interface ProductVariantsPanelProps {
  parent: Product
  onAddVariant?: () => void
  onEditVariant?: (variant: Product) => void
  onDeleteVariant?: (variant: Product) => void
}

export function ProductVariantsPanel({
  parent,
  onAddVariant,
  onEditVariant,
  onDeleteVariant,
}: ProductVariantsPanelProps) {
  const { t, locale } = useTranslation()
  const { localized } = useLocalized()

  const [variants, setVariants] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [recipes, setRecipes] = useState<Record<number, Recipe | null>>({})
  const [recipeLoadingId, setRecipeLoadingId] = useState<number | null>(null)
  const [recipeChild, setRecipeChild] = useState<Product | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setVariants(await menuService.getProductVariants(parent.id))
    } catch (err) {
      setError(translateApiError(err, t).message)
      setVariants([])
    } finally {
      setLoading(false)
    }
  }, [parent.id, t])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const loadRecipe = useCallback(async (variantId: number) => {
    setRecipeLoadingId(variantId)
    try {
      const recipe = await menuService.getActiveProductRecipe(variantId)
      setRecipes((current) => ({ ...current, [variantId]: recipe }))
    } catch {
      setRecipes((current) => ({ ...current, [variantId]: null }))
    } finally {
      setRecipeLoadingId(null)
    }
  }, [])

  function toggle(variant: Product) {
    if (expandedId === variant.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(variant.id)
    if (!(variant.id in recipes)) {
      void loadRecipe(variant.id)
    }
  }

  if (loading) {
    return <LoadingRows columns={2} rows={3} />
  }

  return (
    <div className="product-variants">
      {error ? <div className="page-error-banner">{error}</div> : null}

      <div className="product-variants__header">
        <div>
          <h3>{t('menu.editor.tab.variants')}</h3>
          <p>{t('menu.variants.summary', { count: variants.length })}</p>
        </div>
        {onAddVariant ? (
          <Button variant="primary" size="sm" onClick={onAddVariant}>
            <Plus size={16} aria-hidden="true" />
            {t('menu.variants.add')}
          </Button>
        ) : null}
      </div>

      {variants.length === 0 ? (
        <p className="product-variants__empty">{t('menu.variants.empty')}</p>
      ) : (
        <ul className="product-variants__list">
          {variants.map((variant) => {
            const expanded = expandedId === variant.id
            const label =
              localized({ en: variant.variantLabel, ar: variant.variantLabelAr }) ||
              variant.name ||
              t('menu.variants.noLabel')
            const recipe = recipes[variant.id]
            const description =
              localized({ en: variant.description, ar: variant.descriptionAr }) || variant.name

            return (
              <li key={variant.id} className="product-variants__item">
                <button
                  type="button"
                  className="product-variants__item-toggle"
                  onClick={() => toggle(variant)}
                  aria-expanded={expanded}
                >
                  <span
                    className={`product-variants__chevron${
                      expanded ? ' product-variants__chevron--expanded' : ''
                    }`}
                    aria-hidden="true"
                  >
                    <ChevronLeft size={16} />
                  </span>
                  <span className="product-variants__label-chip">{label}</span>
                  <span className="product-variants__summary">{description}</span>
                  <span className="product-variants__item-price" dir="ltr">
                    {formatMenuPrice(variant.sellingPrice, locale)}
                  </span>
                </button>

                {expanded ? (
                  <div className="product-variants__detail">
                    {recipeLoadingId === variant.id ? (
                      <LoadingRows columns={3} rows={2} />
                    ) : (
                      <RecipeIngredientsReadOnly
                        items={recipe?.items ?? []}
                        emptyMessage={t('menu.recipe.active.empty.description')}
                      />
                    )}
                    <div className="product-variants__detail-actions">
                      {onEditVariant ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onEditVariant(variant)}
                        >
                          <Pencil size={15} aria-hidden="true" />
                          {t('common.edit')}
                        </Button>
                      ) : null}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setRecipeChild(variant)}
                      >
                        {t('menu.variants.manageRecipe')}
                      </Button>
                      {onDeleteVariant ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onDeleteVariant(variant)}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                          {t('common.delete')}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      <RecipeManageModal
        open={recipeChild !== null}
        product={recipeChild}
        onClose={() => {
          const child = recipeChild
          setRecipeChild(null)
          if (child) {
            setRecipes((current) => {
              const next = { ...current }
              delete next[child.id]
              return next
            })
            if (expandedId === child.id) void loadRecipe(child.id)
          }
        }}
      />
    </div>
  )
}
