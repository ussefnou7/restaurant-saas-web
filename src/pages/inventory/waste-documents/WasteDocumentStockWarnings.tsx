import { AlertTriangle } from 'lucide-react'
import { useTranslation } from '../../../i18n/useTranslation'
import type { MaterialShortfallResponse } from '../../../types/wasteDocument'

function formatQty(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
}

interface WasteDocumentStockWarningsProps {
  warnings: MaterialShortfallResponse[]
}

export function WasteDocumentStockWarnings({ warnings }: WasteDocumentStockWarningsProps) {
  const { t } = useTranslation()

  if (warnings.length === 0) return null

  return (
    <div className="waste-stock-warnings" role="status">
      <div className="waste-stock-warnings__header">
        <AlertTriangle className="waste-stock-warnings__icon" size={18} aria-hidden="true" />
        <h3 className="waste-stock-warnings__title">{t('inventory.waste.stockWarnings.title')}</h3>
      </div>
      <p className="waste-stock-warnings__intro">{t('inventory.waste.stockWarnings.intro')}</p>
      <ul className="waste-stock-warnings__list">
        {warnings.map((warning) => (
          <li key={warning.materialId} className="waste-stock-warnings__item">
            {warning.notStockedInWarehouse ? (
              <span>
                {t('inventory.waste.stockWarnings.notStocked', {
                  material: warning.materialName,
                  required: formatQty(warning.requiredQty),
                  uom: warning.uomSymbol,
                })}
              </span>
            ) : (
              <span dir="ltr">
                {t('inventory.waste.stockWarnings.shortfall', {
                  material: warning.materialName,
                  required: formatQty(warning.requiredQty),
                  available: formatQty(warning.availableQty),
                  shortfall: formatQty(warning.shortfallQty),
                  uom: warning.uomSymbol,
                })}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
