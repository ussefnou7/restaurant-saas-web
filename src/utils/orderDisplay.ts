import type { TranslationKey, TranslationValues } from '../i18n/types'
import type {
  CancellationStage,
  OrderSource,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from '../types/order'

type TranslateFn = (key: TranslationKey, values?: TranslationValues) => string
type BadgeVariant = 'success' | 'warning' | 'danger' | 'muted' | 'primary' | 'inactive'

export function getOrderTypeLabel(orderType: OrderType, t: TranslateFn): string {
  return t(`orders.orderType.${orderType}`)
}

export function getOrderSourceLabel(
  source: OrderSource,
  aggregatorName: string | undefined,
  t: TranslateFn,
): string {
  if (source === 'AGGREGATOR' && aggregatorName) {
    return t('orders.source.aggregatorWithName', { name: aggregatorName })
  }
  return t(`orders.orderSource.${source}`)
}

export function getOrderStatusLabel(status: OrderStatus, t: TranslateFn): string {
  return t(`orders.status.${status}`)
}

export function getOrderStatusBadgeVariant(status: OrderStatus): BadgeVariant {
  switch (status) {
    case 'COMPLETE':
      return 'success'
    case 'CANCELLED':
      return 'danger'
    default:
      return 'muted'
  }
}

export function getCancellationStageLabel(stage: CancellationStage, t: TranslateFn): string {
  return t(`orders.cancellationStage.${stage}`)
}

export function getPaymentMethodLabel(method: PaymentMethod, t: TranslateFn): string {
  return t(`orders.paymentMethod.${method}`)
}

export function formatDisplayAmount(value?: number | null): string {
  if (value === null || value === undefined) return '-'
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ج.م`
}
