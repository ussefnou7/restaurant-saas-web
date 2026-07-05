import type { PhysicalCountLineResponse, PhysicalCountStatus } from '../../../types/inventoryOperations'
import { formatMoney } from '../../../utils/format'

export type LineVarianceDisplay = {
  expectedDisplay: number
  variance: number
  varianceValue: number | null
  isProvisional: boolean
  usesFrozenExpected: boolean
}

export function getStatusVariant(status: PhysicalCountStatus): 'muted' | 'warning' | 'success' {
  switch (status) {
    case 'DRAFT':
    case 'CANCELLED':
      return 'muted'
    case 'IN_PROGRESS':
      return 'warning'
    case 'RECONCILED':
      return 'success'
    default:
      return 'muted'
  }
}

export function getLineVarianceDisplay(line: PhysicalCountLineResponse): LineVarianceDisplay | null {
  if (line.countedQuantity == null) return null

  if (line.variance != null) {
    const variance = line.variance
    return {
      expectedDisplay: line.adjustedExpectedQuantity ?? line.expectedQuantity,
      variance,
      varianceValue:
        line.varianceValue ??
        (line.unitCostAtFreeze != null ? variance * line.unitCostAtFreeze : null),
      isProvisional: false,
      usesFrozenExpected: line.adjustedExpectedQuantity == null,
    }
  }

  const expectedBase = line.adjustedExpectedQuantity ?? line.expectedQuantity
  const provisionalVariance = line.countedQuantity - expectedBase

  return {
    expectedDisplay: expectedBase,
    variance: provisionalVariance,
    varianceValue:
      line.varianceValue ??
      (line.unitCostAtFreeze != null ? provisionalVariance * line.unitCostAtFreeze : null),
    isProvisional: true,
    usesFrozenExpected: line.adjustedExpectedQuantity == null,
  }
}

export function formatSignedMoney(value: number | null | undefined): string {
  if (value == null) return '—'
  const absolute = formatMoney(Math.abs(value))
  if (value > 0) return `+${absolute}`
  if (value < 0) return `-${absolute}`
  return absolute
}

export function getActionLabel(
  action: string,
  t: (key: string) => string,
): string {
  if (action === 'WASTE') return t('inventory.physicalCounts.reconcile.actionWaste')
  if (action === 'ADJUSTMENT') return t('inventory.physicalCounts.reconcile.actionAdjustment')
  return action
}

export function getVarianceCellClass(variance: number | null | undefined): string {
  if (variance == null) return ''
  if (variance > 0) return 'variance-positive'
  if (variance < 0) return 'variance-negative'
  return 'variance-zero'
}

export function formatVarianceQuantity(variance: number): string {
  if (variance > 0) return `+${variance}`
  return String(variance)
}

export function getMaterialDisplayName(
  line: Pick<PhysicalCountLineResponse, 'materialName' | 'materialNameAr'>,
  locale: string,
): string {
  if (locale === 'ar' && line.materialNameAr) return line.materialNameAr
  return line.materialName
}

export function sumLineVarianceValues(
  lines: PhysicalCountLineResponse[],
): number {
  return lines.reduce((total, line) => {
    const display = getLineVarianceDisplay(line)
    if (!display || display.variance === 0 || display.varianceValue == null) return total
    return total + display.varianceValue
  }, 0)
}
