import { Badge } from '../ui/Badge'
import { useTranslation } from '../../i18n/useTranslation'
import type { PurchaseInvoiceStatus } from '../../types/purchaseInvoice'
import {
  getPurchaseInvoiceStatusBadgeVariant,
  getPurchaseInvoiceStatusLabel,
} from '../../utils/purchaseInvoiceDisplay'

interface PurchaseInvoiceStatusBadgesProps {
  status: PurchaseInvoiceStatus
}

export function PurchaseInvoiceStatusBadges({ status }: PurchaseInvoiceStatusBadgesProps) {
  const { t } = useTranslation()

  return (
    <Badge variant={getPurchaseInvoiceStatusBadgeVariant(status)}>
      {getPurchaseInvoiceStatusLabel(status, t)}
    </Badge>
  )
}
