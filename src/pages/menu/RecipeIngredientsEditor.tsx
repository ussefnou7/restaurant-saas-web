import { Plus, Trash2 } from 'lucide-react'
import { FormInput } from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { MaterialSelect } from '../../components/ui/MaterialSelect'
import { SelectFilter } from '../../components/ui/SelectFilter'
import { useTranslation } from '../../i18n/useTranslation'
import type { Locale } from '../../i18n/types'
import type { MaterialResponse, UomResponse } from '../../types/inventory'
import type { EditableRecipeRow } from './recipeFormUtils'

interface RecipeIngredientsEditorProps {
  rows: EditableRecipeRow[]
  materials: MaterialResponse[]
  uoms: UomResponse[]
  locale: Locale
  disabled?: boolean
  onAdd: () => void
  onRemove: (key: string) => void
  onChange: (key: string, patch: Partial<EditableRecipeRow>) => void
}

export function RecipeIngredientsEditor({
  rows,
  materials,
  uoms,
  locale,
  disabled = false,
  onAdd,
  onRemove,
  onChange,
}: RecipeIngredientsEditorProps) {
  const { t } = useTranslation()
  const usedMaterialIds = rows
    .map((row) => row.materialId)
    .filter(Boolean)
    .map((id) => Number(id))
  const uomOptions = uoms
    .filter((uom) => uom.active)
    .map((uom) => ({
      value: String(uom.id),
      label: uom.symbol ?? uom.code ?? uom.name,
    }))

  return (
    <section className="recipe-ingredients-editor">
      <div className="recipe-ingredients-editor__header">
        <div>
          <h3>{t('menu.recipe.ingredientsTitle')}</h3>
          <p>{t('menu.recipe.ingredientsSummary', { count: rows.length })}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="recipe-ingredients-editor__empty">{t('menu.recipe.empty')}</p>
      ) : (
        <div className="recipe-ingredients-editor__grid" role="table">
          <div className="recipe-ingredients-editor__head" role="row">
            <span role="columnheader">{t('menu.recipe.col.material')}</span>
            <span role="columnheader">{t('menu.recipe.col.quantity')}</span>
            <span role="columnheader">{t('menu.recipe.col.uom')}</span>
            <span aria-hidden="true" />
          </div>

          <div className="recipe-ingredients-editor__rows" role="rowgroup">
            {rows.map((row) => {
              const excludeIds = usedMaterialIds.filter((id) => id !== Number(row.materialId))
              return (
                <div className="recipe-ingredients-editor__row" role="row" key={row.key}>
                  <div role="cell">
                    <MaterialSelect
                      value={row.materialId}
                      onChange={(materialId) => onChange(row.key, { materialId })}
                      materials={materials}
                      excludeMaterialIds={excludeIds}
                      locale={locale}
                      disabled={disabled}
                      placeholder={t('menu.recipe.selectMaterial')}
                      searchPlaceholder={t('common.search')}
                      ariaLabel={t('menu.recipe.selectMaterial')}
                    />
                  </div>
                  <div role="cell">
                    <FormInput
                      type="number"
                      ltr
                      min={0}
                      step="0.0001"
                      value={row.quantity}
                      onChange={(event) => onChange(row.key, { quantity: event.target.value })}
                      disabled={disabled}
                      aria-label={t('menu.recipe.col.quantity')}
                    />
                  </div>
                  <div role="cell">
                    <SelectFilter
                      value={row.uomId}
                      onChange={(uomId) => onChange(row.key, { uomId })}
                      options={uomOptions}
                      ariaLabel={t('menu.recipe.col.uom')}
                      disabled={disabled || uomOptions.length === 0}
                    />
                  </div>
                  <div role="cell" className="recipe-ingredients-editor__remove">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(row.key)}
                      disabled={disabled}
                      aria-label={t('menu.recipe.removeIngredient')}
                      title={t('menu.recipe.removeIngredient')}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        className="recipe-ingredients-editor__add"
        onClick={onAdd}
        disabled={disabled}
      >
        <Plus size={16} aria-hidden="true" />
        {t('menu.recipe.addIngredient')}
      </button>
    </section>
  )
}
