import { useTranslation } from '../../i18n/useTranslation'
import type { OrderConsumptionStatus } from '../../types/orderConsumption'

const STATUS_VARIANTS: Record<
  OrderConsumptionStatus,
  'muted' | 'warning' | 'success' | 'danger'
> = {
  PENDING: 'muted',
  IN_PROGRESS: 'warning',
  POSTED: 'success',
  CONFLICT: 'danger',
}

export function OrderConsumptionStatusBadge({ status }: { status: OrderConsumptionStatus }) {
  const { t } = useTranslation()
  return (
    <span className={`order-consumption-status order-consumption-status--${STATUS_VARIANTS[status]}`}>
      {t(`orderConsumption.status.${status}`)}
    </span>
  )
}
