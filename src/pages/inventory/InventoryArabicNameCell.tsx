import { useTranslation } from '../../i18n/useTranslation'
import { getInventoryArabicName } from '../../utils/inventoryDisplay'
import type { InventoryNamedEntity } from '../../utils/inventoryDisplay'

export function InventoryArabicNameCell({ entity }: { entity: InventoryNamedEntity }) {
  const { t } = useTranslation()
  const value = getInventoryArabicName(entity)

  if (!value) {
    return <span className="text-muted">{t('common.empty.dash')}</span>
  }

  return <span dir="rtl">{value}</span>
}
