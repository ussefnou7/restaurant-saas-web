import {
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../components/ui/Table'
import { useTranslation } from '../../i18n/useTranslation'
import { useUomLookup } from '../../hooks/useUomLookup'
import type { RecipeItemView } from '../../types/menu'
import { getInventoryLocalizedName } from '../../utils/inventoryDisplay'

interface RecipeIngredientsReadOnlyProps {
  items: RecipeItemView[]
  emptyMessage: string
}

export function RecipeIngredientsReadOnly({ items, emptyMessage }: RecipeIngredientsReadOnlyProps) {
  const { t, locale } = useTranslation()
  const { uomLabel, uomSymbol } = useUomLookup()

  if (items.length === 0) {
    return <p className="recipe-manage-modal__ingredients-empty">{emptyMessage}</p>
  }

  return (
    <div className="recipe-manage-modal__ingredients-table-wrap">
      <DataTable>
        <TableHead>
          <TableRow>
            <Th>{t('menu.recipe.col.material')}</Th>
            <Th className="table-cell--numeric">{t('menu.recipe.col.quantity')}</Th>
            <Th>{t('menu.recipe.col.uom')}</Th>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={`${item.materialId}-${item.uomId}`}>
              <Td>{getInventoryLocalizedName(item, locale)}</Td>
              <Td dir="ltr" className="table-cell--numeric">{item.quantity}</Td>
              <Td>
                {uomSymbol(item.uomId) !== '—'
                  ? uomSymbol(item.uomId)
                  : uomLabel(item.uomId) !== '—'
                    ? uomLabel(item.uomId)
                    : t('common.empty.dash')}
              </Td>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </div>
  )
}
