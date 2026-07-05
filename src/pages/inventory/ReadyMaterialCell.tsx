import type { Locale } from '../../i18n/types'
import type { InventoryNamedEntity } from '../../utils/inventoryDisplay'
import { getInventoryBilingualLines } from '../../utils/inventoryDisplay'

interface ReadyMaterialCellProps {
  material: InventoryNamedEntity
  locale: Locale
}

export function ReadyMaterialCell({ material, locale }: ReadyMaterialCellProps) {
  const { primary, secondary, code } = getInventoryBilingualLines(material, locale)

  return (
    <div className="ready-material-cell">
      <span className="ready-material-cell__primary">{primary}</span>
      {secondary ? (
        <span
          className="ready-material-cell__secondary"
          dir={locale === 'ar' ? 'ltr' : 'rtl'}
        >
          {secondary}
        </span>
      ) : null}
      {code ? <span className="ready-material-cell__code">{code}</span> : null}
    </div>
  )
}
