import { useTranslation } from '../../i18n/useTranslation'
import type { OrderConsumptionType } from '../../types/orderConsumption'

const TYPE_VARIANTS: Record<OrderConsumptionType, 'ordinary' | 'waste'> = {
  ORDINARY: 'ordinary',
  WASTE: 'waste',
}

/** D20: the only thing that tells a waste doc from an ordinary one — they are otherwise identical. */
export function OrderConsumptionTypeBadge({ type }: { type: OrderConsumptionType }) {
  const { t } = useTranslation()
  return (
    <span className={`order-consumption-type order-consumption-type--${TYPE_VARIANTS[type]}`}>
      {t(`orderConsumption.type.${type}`)}
    </span>
  )
}
