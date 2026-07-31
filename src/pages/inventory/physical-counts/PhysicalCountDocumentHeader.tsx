import type { ReactNode } from 'react'
import { Badge } from '../../../components/ui/Badge'
import type { Locale } from '../../../i18n/types'
import type { PhysicalCountResponse } from '../../../types/inventoryOperations'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { formatPhysicalCountDate, formatPhysicalCountDateTime, getStatusVariant } from './physicalCountDisplay'

interface PhysicalCountDocumentHeaderProps {
  count: PhysicalCountResponse
  locale: Locale
  actions?: ReactNode
  t: (key: string) => string
}

function getHeaderStatusVariant(status: PhysicalCountResponse['status']): 'muted' | 'warning' | 'success' {
  if (status === 'DRAFT') return 'warning'
  return getStatusVariant(status)
}

export function PhysicalCountDocumentHeader({
  count,
  locale,
  actions,
  t,
}: PhysicalCountDocumentHeaderProps) {
  const warehouseName = getInventoryLocalizedName({ name: count.warehouseName }, locale)

  return (
    <div className="physical-count-detail__header">
      <div className="physical-count-detail__topbar">
        <Badge variant={getHeaderStatusVariant(count.status)}>
          {t(`inventory.physicalCounts.status.${count.status}`)}
        </Badge>
        {actions ? <div className="physical-count-detail__header-actions">{actions}</div> : null}
      </div>

      <h2 className="physical-count-detail__code" dir="ltr">{count.code}</h2>

      <div className="physical-count-detail__divider" />

      <div className="physical-count-detail__info">
        <div className="physical-count-detail__warehouse physical-count-detail__info-item--warehouse">
          <span className="physical-count-detail__meta-label">{t('inventory.purchase.fields.warehouse')}</span>
          <span className="physical-count-detail__meta-value">{warehouseName}</span>
        </div>
        <div className="physical-count-detail__meta-inline physical-count-detail__info-item--scheduled">
          <span className="physical-count-detail__meta-label">{t('inventory.physicalCounts.col.scheduledDate')}</span>
          <span className="physical-count-detail__meta-value" dir="ltr">{formatPhysicalCountDate(count.scheduledDate)}</span>
        </div>
        {count.frozenAt ? (
          <div className="physical-count-detail__meta-inline physical-count-detail__info-item--frozen">
            <span className="physical-count-detail__meta-label">{t('inventory.physicalCounts.col.frozenAt')}</span>
            <span className="physical-count-detail__meta-value" dir="ltr">{formatPhysicalCountDateTime(count.frozenAt)}</span>
          </div>
        ) : null}
        {count.reconciledAt ? (
          <div className="physical-count-detail__meta-inline physical-count-detail__info-item--reconciled">
            <span className="physical-count-detail__meta-label">{t('inventory.physicalCounts.col.reconciledAt')}</span>
            <span className="physical-count-detail__meta-value" dir="ltr">{formatPhysicalCountDateTime(count.reconciledAt)}</span>
          </div>
        ) : null}
        {count.notes ? (
          <div className="physical-count-detail__notes">
            <span className="physical-count-detail__meta-label">{t('inventory.physicalCounts.fields.notes')}</span>
            <span className="physical-count-detail__meta-value">{count.notes}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
