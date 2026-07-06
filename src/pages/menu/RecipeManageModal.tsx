import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronUp } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingRows } from '../../components/ui/LoadingRows'
import { Modal } from '../../components/ui/Modal'
import { useTranslation } from '../../i18n/useTranslation'
import * as menuService from '../../services/menuService'
import type { Product, Recipe } from '../../types/menu'
import { getApiErrorCode, translateApiError } from '../../utils/errors'
import { RecipeIngredientsReadOnly } from './RecipeIngredientsReadOnly'
import { RecipeVersionFormModal } from './RecipeVersionFormModal'
import { formatRecipeVersionDate } from './recipeFormUtils'

interface RecipeManageModalProps {
  open: boolean
  product: Product | null
  onClose: () => void
}

function hasRecipeItems(recipe: Recipe): boolean {
  return Array.isArray(recipe.items) && recipe.items.length > 0
}

export function RecipeManageModal({ open, product, onClose }: RecipeManageModalProps) {
  const { t, locale } = useTranslation()

  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null)
  const [activeLoading, setActiveLoading] = useState(false)
  const [activeError, setActiveError] = useState('')

  const [history, setHistory] = useState<Recipe[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)

  const [expandedVersionIds, setExpandedVersionIds] = useState<Set<number>>(new Set())
  const [versionDetails, setVersionDetails] = useState<Record<number, Recipe>>({})
  const [versionLoadingIds, setVersionLoadingIds] = useState<Set<number>>(new Set())
  const [versionErrors, setVersionErrors] = useState<Record<number, string>>({})

  const [formOpen, setFormOpen] = useState(false)
  const [formIsFirstVersion, setFormIsFirstVersion] = useState(false)

  const loadActiveRecipe = useCallback(async () => {
    if (!product) return

    setActiveLoading(true)
    setActiveError('')
    try {
      const recipe = await menuService.getActiveProductRecipe(product.id)
      setActiveRecipe(recipe)
    } catch (err) {
      setActiveRecipe(null)
      setActiveError(translateApiError(err, t).message)
    } finally {
      setActiveLoading(false)
    }
  }, [product, t])

  const loadHistory = useCallback(async () => {
    if (!product) return

    setHistoryLoading(true)
    setHistoryError('')
    try {
      const recipes = await menuService.getProductRecipes(product.id)
      setHistory(recipes)
    } catch (err) {
      setHistory([])
      setHistoryError(translateApiError(err, t).message)
    } finally {
      setHistoryLoading(false)
    }
  }, [product, t])

  const refreshAll = useCallback(async () => {
    setExpandedVersionIds(new Set())
    setVersionDetails({})
    setVersionErrors({})
    setVersionLoadingIds(new Set())
    await Promise.all([loadActiveRecipe(), loadHistory()])
  }, [loadActiveRecipe, loadHistory])

  useEffect(() => {
    if (!open || !product) {
      setActiveRecipe(null)
      setActiveError('')
      setHistory([])
      setHistoryError('')
      setHistoryOpen(false)
      setExpandedVersionIds(new Set())
      setVersionDetails({})
      setVersionErrors({})
      setVersionLoadingIds(new Set())
      setFormOpen(false)
      return
    }

    void refreshAll()
  }, [open, product, refreshAll])

  async function loadVersionDetails(recipeId: number) {
    if (versionDetails[recipeId] || versionLoadingIds.has(recipeId)) return

    setVersionLoadingIds((current) => new Set(current).add(recipeId))
    setVersionErrors((current) => {
      const next = { ...current }
      delete next[recipeId]
      return next
    })

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

  function toggleVersionExpanded(recipe: Recipe) {
    const recipeId = recipe.id
    const isExpanded = expandedVersionIds.has(recipeId)

    if (isExpanded) {
      setExpandedVersionIds((current) => {
        const next = new Set(current)
        next.delete(recipeId)
        return next
      })
      return
    }

    setExpandedVersionIds((current) => new Set(current).add(recipeId))
    if (!hasRecipeItems(recipe)) {
      void loadVersionDetails(recipeId)
    }
  }

  function openCreateForm(firstVersion: boolean) {
    setFormIsFirstVersion(firstVersion)
    setFormOpen(true)
  }

  function getVersionItems(recipe: Recipe): Recipe['items'] {
    if (hasRecipeItems(recipe)) return recipe.items
    return versionDetails[recipe.id]?.items ?? []
  }

  const hasActiveRecipe = activeRecipe !== null

  return (
    <>
      <Modal
        open={open}
        size="large"
        className="recipe-manage-modal"
        title={t('menu.recipe.title')}
        subtitle={product ? t('menu.recipe.subtitle', { name: product.name }) : undefined}
        onClose={onClose}
        footer={
          <Button variant="secondary" onClick={onClose}>
            {t('common.close')}
          </Button>
        }
      >
        <section className="recipe-manage-modal__section" aria-labelledby="recipe-active-heading">
          <div className="recipe-manage-modal__section-header">
            <h3 id="recipe-active-heading" className="recipe-manage-modal__section-title">
              {t('menu.recipe.active.title')}
            </h3>
            {hasActiveRecipe ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => openCreateForm(false)}
                disabled={activeLoading}
              >
                {t('menu.recipe.active.createNewVersion')}
              </Button>
            ) : null}
          </div>

          {activeError ? <div className="page-error-banner">{activeError}</div> : null}

          {activeLoading ? (
            <LoadingRows columns={3} rows={3} />
          ) : hasActiveRecipe ? (
            <RecipeIngredientsReadOnly
              items={activeRecipe.items}
              emptyMessage={t('menu.recipe.active.noIngredients')}
            />
          ) : (
            <EmptyState
              title={t('menu.recipe.active.empty.title')}
              description={t('menu.recipe.active.empty.description')}
              actionLabel={t('menu.recipe.active.createRecipe')}
              onAction={() => openCreateForm(true)}
            />
          )}
        </section>

        <section className="recipe-manage-modal__section recipe-manage-modal__section--history">
          <button
            type="button"
            className="recipe-manage-modal__history-toggle"
            onClick={() => setHistoryOpen((current) => !current)}
            aria-expanded={historyOpen}
          >
            <span className="recipe-manage-modal__history-toggle-label">
              {t('menu.recipe.history.title')}
            </span>
            {historyOpen ? (
              <ChevronUp size={18} aria-hidden="true" />
            ) : (
              <ChevronDown size={18} aria-hidden="true" />
            )}
          </button>

          {historyOpen ? (
            <div className="recipe-manage-modal__history-body">
              {historyError ? <div className="page-error-banner">{historyError}</div> : null}

              {historyLoading ? (
                <LoadingRows columns={2} rows={3} />
              ) : history.length === 0 ? (
                <p className="recipe-manage-modal__history-empty">{t('menu.recipe.history.empty')}</p>
              ) : (
                <ul className="recipe-manage-modal__history-list">
                  {history.map((recipe) => {
                    const isExpanded = expandedVersionIds.has(recipe.id)
                    const isLoadingVersion = versionLoadingIds.has(recipe.id)
                    const versionError = versionErrors[recipe.id]
                    const versionItems = getVersionItems(recipe)

                    return (
                      <li key={recipe.id} className="recipe-manage-modal__history-item">
                        <button
                          type="button"
                          className="recipe-manage-modal__history-item-toggle"
                          onClick={() => toggleVersionExpanded(recipe)}
                          aria-expanded={isExpanded}
                        >
                          <span
                            className={`recipe-manage-modal__history-chevron${
                              isExpanded
                                ? ''
                                : ' recipe-manage-modal__history-chevron--collapsed'
                            }`}
                            aria-hidden="true"
                          >
                            {isExpanded ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronLeft size={16} />
                            )}
                          </span>
                          <span className="recipe-manage-modal__history-date" dir="ltr">
                            {formatRecipeVersionDate(recipe.createdAt, locale)}
                          </span>
                          {recipe.isActive ? (
                            <Badge variant="success">{t('menu.recipe.version.activeBadge')}</Badge>
                          ) : null}
                        </button>

                        {isExpanded ? (
                          <div className="recipe-manage-modal__history-detail">
                            {isLoadingVersion ? (
                              <LoadingRows columns={3} rows={2} />
                            ) : versionError ? (
                              <div className="alert-error">{versionError}</div>
                            ) : (
                              <RecipeIngredientsReadOnly
                                items={versionItems}
                                emptyMessage={t('menu.recipe.active.noIngredients')}
                              />
                            )}
                          </div>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </section>
      </Modal>

      <RecipeVersionFormModal
        open={formOpen}
        product={product}
        initialItems={activeRecipe?.items ?? []}
        isFirstVersion={formIsFirstVersion}
        onClose={() => setFormOpen(false)}
        onSuccess={() => void refreshAll()}
      />
    </>
  )
}
