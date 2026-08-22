import type { ReactNode } from 'react'
import { DetailField } from '../../../components/fields'
import { DocumentHeader } from '../../../components/layout/DocumentLayout'
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
    <DocumentHeader
      title={t('inventory.physicalCounts.form.viewTitle')}
      statusBadge={
        <Badge variant={getHeaderStatusVariant(count.status)}>
          {t(`inventory.physicalCounts.status.${count.status}`)}
        </Badge>
      }
      actions={actions}
      reference={
        <span className="pi-form-header-card__invoice-number" dir="ltr">
          {count.code}
        </span>
      }
    >
      <div className="pi-form-header-grid">
        <DetailField
          label={t('inventory.purchase.fields.warehouse')}
          value={warehouseName}
        />
        <DetailField
          label={t('inventory.physicalCounts.col.scheduledDate')}
          value={formatPhysicalCountDate(count.scheduledDate)}
          dir="ltr"
        />
        {count.frozenAt ? (
          <DetailField
            label={t('inventory.physicalCounts.col.frozenAt')}
            value={formatPhysicalCountDateTime(count.frozenAt)}
            dir="ltr"
          />
        ) : null}
        {count.reconciledAt ? (
          <DetailField
            label={t('inventory.physicalCounts.col.reconciledAt')}
            value={formatPhysicalCountDateTime(count.reconciledAt)}
            dir="ltr"
          />
        ) : null}
        {count.notes ? (
          <DetailField
            label={t('inventory.physicalCounts.fields.notes')}
            value={count.notes}
            fullWidth
          />
        ) : null}
      </div>
    </DocumentHeader>
  )
}

