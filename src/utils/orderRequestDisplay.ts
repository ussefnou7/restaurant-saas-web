import type { TranslationKey, TranslationValues } from '../i18n/types'
import type { RequestSource, RequestStatus } from '../types/orderRequest'

type TranslateFn = (key: TranslationKey, values?: TranslationValues) => string
type BadgeVariant = 'success' | 'warning' | 'danger' | 'muted' | 'primary' | 'inactive'

export function getRequestSourceLabel(
  source: RequestSource,
  aggregatorName: string | undefined,
  t: TranslateFn,
): string {
  if (source === 'AGGREGATOR' && aggregatorName) {
    return t('orders.request.source.aggregatorWithName', { name: aggregatorName })
  }
  return t(`orders.request.source.${source}`)
}

export function getRequestStatusLabel(status: RequestStatus, t: TranslateFn): string {
  return t(`orders.request.status.${status}`)
}

export function getRequestStatusBadgeVariant(status: RequestStatus): BadgeVariant {
  switch (status) {
    case 'RECEIVED':
      return 'muted'
    case 'SENT_TO_POS':
      return 'primary'
    case 'LINKED':
      return 'success'
    default:
      return 'muted'
  }
}

export function getRequestUnlinkedMessage(status: RequestStatus, t: TranslateFn): string {
  switch (status) {
    case 'RECEIVED':
      return t('orders.request.detail.notLinkedReceived')
    case 'SENT_TO_POS':
      return t('orders.request.detail.notLinkedSentToPos')
    default:
      return t('orders.request.detail.notLinked')
  }
}
