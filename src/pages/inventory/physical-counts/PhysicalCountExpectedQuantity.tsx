import { Clock3 } from 'lucide-react'
import type { PhysicalCountLineResponse } from '../../../types/inventoryOperations'
import { formatPhysicalCountQuantity, getExpectedQuantityDisplay } from './physicalCountDisplay'

export function PhysicalCountExpectedQuantity({
  line,
  t,
}: {
  line: PhysicalCountLineResponse
  t: (key: string) => string
}) {
  const provisionalTooltip = t('inventory.physicalCounts.reconcile.provisionalExpectedTooltip')

  return (
    <span className="physical-count-reconcile__variance-value">
      <span>{formatPhysicalCountQuantity(getExpectedQuantityDisplay(line))}</span>
      {line.adjustedExpectedQuantityProvisional ? (
        <span
          className="physical-count-reconcile__estimate-marker physical-count-reconcile__estimate-marker--provisional"
          title={provisionalTooltip}
          aria-label={provisionalTooltip}
        >
          <Clock3 size={13} aria-hidden />
          <span>{t('inventory.physicalCounts.reconcile.provisionalExpectedMarker')}</span>
        </span>
      ) : null}
    </span>
  )
}
