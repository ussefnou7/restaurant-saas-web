import { useTranslation } from '../../../i18n/useTranslation'
import type { PurchaseInvoiceStatus } from '../../../types/purchaseInvoice'

interface PurchaseInvoiceFormStatusPillProps {
  status: PurchaseInvoiceStatus
}

export function PurchaseInvoiceFormStatusPill({ status }: PurchaseInvoiceFormStatusPillProps) {
  const { t } = useTranslation()

  return (
    <span className={`pi-form-status-pill pi-form-status-pill--${status.toLowerCase()}`}>
      {t(`inventory.purchase.status.${status}`)}
    </span>
  )
}
