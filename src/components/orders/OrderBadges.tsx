import { Badge } from '../ui/Badge'
import { useTranslation } from '../../i18n/useTranslation'
import type { OrderSource, OrderStatus, OrderType } from '../../types/order'
import {
  getOrderSourceLabel,
  getOrderStatusBadgeVariant,
  getOrderStatusLabel,
  getOrderTypeLabel,
} from '../../utils/orderDisplay'

export function OrderTypeBadge({ orderType }: { orderType: OrderType }) {
  const { t } = useTranslation()
  return <Badge variant="muted">{getOrderTypeLabel(orderType, t)}</Badge>
}

export function OrderSourceBadge({
  source,
  aggregatorName,
}: {
  source: OrderSource
  aggregatorName?: string
}) {
  const { t } = useTranslation()
  return <Badge variant="primary">{getOrderSourceLabel(source, aggregatorName, t)}</Badge>
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation()
  return (
    <Badge variant={getOrderStatusBadgeVariant(status)}>{getOrderStatusLabel(status, t)}</Badge>
  )
}
