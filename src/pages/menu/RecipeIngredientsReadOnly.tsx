import {
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../components/ui/Table'
import { useTranslation } from '../../i18n/useTranslation'
import type { RecipeItemView } from '../../types/menu'

interface RecipeIngredientsReadOnlyProps {
  items: RecipeItemView[]
  emptyMessage: string
}

export function RecipeIngredientsReadOnly({ items, emptyMessage }: RecipeIngredientsReadOnlyProps) {
  const { t } = useTranslation()

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
              <Td>{item.materialName}</Td>
              <Td dir="ltr" className="table-cell--numeric">{item.quantity}</Td>
              <Td>{item.uomName}</Td>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </div>
  )
}
