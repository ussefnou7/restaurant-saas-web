import { Badge } from '../ui/Badge'
import { useTranslation } from '../../i18n/useTranslation'
import type { RequestSource, RequestStatus } from '../../types/orderRequest'
import {
  getRequestSourceLabel,
  getRequestStatusBadgeVariant,
  getRequestStatusLabel,
} from '../../utils/orderRequestDisplay'

export function RequestSourceBadge({
  source,
  aggregatorName,
}: {
  source: RequestSource
  aggregatorName?: string
}) {
  const { t } = useTranslation()
  return <Badge variant="primary">{getRequestSourceLabel(source, aggregatorName, t)}</Badge>
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const { t } = useTranslation()
  return (
    <Badge variant={getRequestStatusBadgeVariant(status)}>
      {getRequestStatusLabel(status, t)}
    </Badge>
  )
}
