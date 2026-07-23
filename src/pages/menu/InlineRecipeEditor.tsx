import { Clock3, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { LoadingRows } from '../../components/ui/LoadingRows'
import { useTranslation } from '../../i18n/useTranslation'
import * as menuService from '../../services/menuService'
import type { Product, Recipe } from '../../types/menu'
import { translateApiError } from '../../utils/errors'
import { RecipeIngredientsReadOnly } from './RecipeIngredientsReadOnly'
import { RecipeManageModal } from './RecipeManageModal'
import { RecipeVersionFormModal } from './RecipeVersionFormModal'

interface InlineRecipeEditorProps {
  product: Product
}

export function InlineRecipeEditor({ product }: InlineRecipeEditorProps) {
  const { t } = useTranslation()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [versionFormOpen, setVersionFormOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setRecipe(await menuService.getActiveProductRecipe(product.id))
    } catch (loadError) {
      setRecipe(null)
      setError(translateApiError(loadError, t).message)
    } finally {
      setLoading(false)
    }
  }, [product.id, t])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  return (
    <div className="inline-recipe-editor">
      {error ? <div className="page-error-banner">{error}</div> : null}

      <div className="inline-recipe-editor__header">
        <div>
          <h3>{t('menu.recipe.ingredientsTitle')}</h3>
          <p>
            {recipe
              ? t('menu.recipe.ingredientsSummary', { count: recipe.items.length })
              : t('menu.recipe.active.empty.description')}
          </p>
        </div>
        <div className="inline-recipe-editor__actions">
          <Button variant="secondary" size="sm" onClick={() => setHistoryOpen(true)} disabled={loading}>
            <Clock3 size={16} aria-hidden="true" />
            {t('menu.recipe.history.title')}
          </Button>
          <Button variant="primary" size="sm" onClick={() => setVersionFormOpen(true)} disabled={loading}>
            <Plus size={16} aria-hidden="true" />
            {recipe ? t('menu.recipe.active.createNewVersion') : t('menu.recipe.active.createRecipe')}
          </Button>
        </div>
      </div>

      {recipe ? <p className="inline-recipe-editor__version-note">{t('menu.recipe.versioningNote')}</p> : null}

      {loading ? (
        <LoadingRows columns={3} rows={3} />
      ) : (
        <RecipeIngredientsReadOnly
          items={recipe?.items ?? []}
          emptyMessage={t('menu.recipe.active.empty.description')}
        />
      )}

      <RecipeVersionFormModal
        open={versionFormOpen}
        product={product}
        initialItems={recipe?.items ?? []}
        isFirstVersion={recipe === null}
        onClose={() => setVersionFormOpen(false)}
        onSuccess={() => void load()}
      />

      <RecipeManageModal
        open={historyOpen}
        product={product}
        onClose={() => {
          setHistoryOpen(false)
          void load()
        }}
      />
    </div>
  )
}
