import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useTranslation } from '../../i18n/useTranslation'
import type { StockBatchResponse } from '../../types/inventoryStock'
import { formatDate, formatMoney, formatNumber } from '../../utils/format'

interface WarehouseStockBatchSubRowProps {
  loading: boolean
  batches?: StockBatchResponse[]
  error?: string
  uomSymbol: string
}

const SMALL_DAYS_REMAINING_THRESHOLD = 3

type RemainingSortDirection = 'asc' | 'desc'

function sumRemainingQuantities(batches: StockBatchResponse[]): number {
  const sum = batches.reduce((total, batch) => total + batch.remainingQuantity, 0)
  return Math.round(sum * 1_000_000) / 1_000_000
}

function renderBatchSource(batch: StockBatchResponse, t: ReturnType<typeof useTranslation>['t']) {
  if (batch.sourceType === 'PURCHASE' && batch.sourceInvoiceId != null) {
    return t('inventory.warehouses.stocks.batches.sourcePurchase', { id: batch.sourceInvoiceId })
  }
  return t('inventory.warehouses.stocks.batches.sourceOther')
}

function compareDaysRemaining(
  first: StockBatchResponse,
  second: StockBatchResponse,
  direction: RemainingSortDirection,
): number {
  if (first.daysRemaining === null) return second.daysRemaining === null ? 0 : 1
  if (second.daysRemaining === null) return -1
  return direction === 'asc'
    ? first.daysRemaining - second.daysRemaining
    : second.daysRemaining - first.daysRemaining
}

function formatDays(value: number, locale: 'ar' | 'en'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US').format(value)
}

export function WarehouseStockBatchSubRow({
  loading,
  batches,
  error,
  uomSymbol,
}: WarehouseStockBatchSubRowProps) {
  const { t, locale } = useTranslation()
  const [remainingSortDirection, setRemainingSortDirection] =
    useState<RemainingSortDirection>('asc')

  const isPending = batches === undefined && !error
  const resolvedBatches = batches ?? []
  const sortedBatches = useMemo(
    () => [...(batches ?? [])].sort((first, second) =>
      compareDaysRemaining(first, second, remainingSortDirection)),
    [batches, remainingSortDirection],
  )

  if (loading || isPending) {
    return (
      <div className="warehouse-stocks-panel__batches warehouse-stocks-panel__batches--loading" role="status">
        <span className="list-state__spinner" aria-hidden="true" />
        <span className="warehouse-stocks-panel__batches-loading-text">
          {t('inventory.warehouses.stocks.batches.loading')}
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="warehouse-stocks-panel__batches warehouse-stocks-panel__batches--error">
        <p className="warehouse-stocks-panel__batches-error">{error}</p>
      </div>
    )
  }

  if (resolvedBatches.length === 0) {
    return (
      <div className="warehouse-stocks-panel__batches warehouse-stocks-panel__batches--empty">
        <p className="warehouse-stocks-panel__batches-empty">{t('inventory.warehouses.stocks.batches.empty')}</p>
      </div>
    )
  }

  const remainingTotal = sumRemainingQuantities(resolvedBatches)
  const displayUom = resolvedBatches[0]?.uomSymbol?.trim() || uomSymbol

  return (
    <div className="warehouse-stocks-panel__batches">
      <p className="warehouse-stocks-panel__batches-title">{t('inventory.warehouses.stocks.batches.title')}</p>
      <div className="warehouse-stocks-panel__batches-table-wrap">
        <table className="warehouse-stocks-panel__batches-table">
          <thead>
            <tr>
              <th className="table-cell--numeric">{t('inventory.warehouses.stocks.batches.col.number')}</th>
              <th className="table-cell--numeric">{t('inventory.warehouses.stocks.batches.col.movementDate')}</th>
              <th
                className="table-cell--numeric"
                aria-sort={remainingSortDirection === 'asc' ? 'ascending' : 'descending'}
              >
                <Button
                  variant="ghost"
                  size="action"
                  className="warehouse-stocks-panel__batch-sort"
                  aria-label={t(
                    remainingSortDirection === 'asc'
                      ? 'inventory.warehouses.stocks.batches.sortDescending'
                      : 'inventory.warehouses.stocks.batches.sortAscending',
                  )}
                  onClick={() => setRemainingSortDirection((current) =>
                    current === 'asc' ? 'desc' : 'asc')}
                >
                  {t('inventory.warehouses.stocks.batches.col.daysRemaining')}
                  {remainingSortDirection === 'asc'
                    ? <ArrowUp size={14} aria-hidden="true" />
                    : <ArrowDown size={14} aria-hidden="true" />}
                </Button>
              </th>
              <th className="table-cell--numeric">{t('inventory.warehouses.stocks.batches.col.ageDays')}</th>
              <th className="table-cell--numeric">{t('inventory.warehouses.stocks.batches.col.originalQty')}</th>
              <th className="table-cell--numeric">{t('inventory.warehouses.stocks.batches.col.remainingQty')}</th>
              <th className="table-cell--numeric">{t('inventory.warehouses.stocks.batches.col.unitCost')}</th>
              <th>{t('inventory.warehouses.stocks.batches.col.source')}</th>
              <th>{t('inventory.warehouses.stocks.batches.col.status')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedBatches.map((batch, index) => {
              const isClosed = batch.status === 'CLOSED'
              const remainingClass = batch.daysRemaining !== null && batch.daysRemaining < 0
                ? 'warehouse-stocks-panel__days-value warehouse-stocks-panel__days-value--danger'
                : batch.daysRemaining !== null &&
                    batch.daysRemaining > 0 &&
                    batch.daysRemaining <= SMALL_DAYS_REMAINING_THRESHOLD
                  ? 'warehouse-stocks-panel__days-value warehouse-stocks-panel__days-value--warning'
                  : 'warehouse-stocks-panel__days-value'
              return (
                <tr
                  key={batch.id}
                  className={
                    isClosed ? 'warehouse-stocks-panel__batch-line warehouse-stocks-panel__batch-line--closed' : 'warehouse-stocks-panel__batch-line'
                  }
                >
                  <td className="table-cell--numeric">{index + 1}</td>
                  <td className="table-cell--numeric">{formatDate(batch.movementDate)}</td>
                  <td className="table-cell--numeric">
                    {batch.daysRemaining === null ? '—' : (
                      <span className={remainingClass} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                        {batch.daysRemaining < 0 ? <AlertTriangle size={14} aria-hidden="true" /> : null}
                        {formatDays(batch.daysRemaining, locale)}
                      </span>
                    )}
                  </td>
                  <td className="table-cell--numeric">
                    {batch.ageDays === null ? '—' : (
                      <span dir={locale === 'ar' ? 'rtl' : 'ltr'}>{formatDays(batch.ageDays, locale)}</span>
                    )}
                  </td>
                  <td dir="ltr" className="table-cell--numeric">{formatNumber(batch.originalQuantity)}</td>
                  <td dir="ltr" className="table-cell--numeric">{formatNumber(batch.remainingQuantity)}</td>
                  <td dir="ltr" className="table-cell--numeric">{formatMoney(batch.unitCost)}</td>
                  <td>{renderBatchSource(batch, t)}</td>
                  <td>
                    <Badge variant={isClosed ? 'inactive' : 'success'}>
                      {isClosed
                        ? t('inventory.warehouses.stocks.batches.status.closed')
                        : t('inventory.warehouses.stocks.batches.status.open')}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="warehouse-stocks-panel__batches-footer">
        {t('inventory.warehouses.stocks.batches.remainingTotal', {
          total: formatNumber(remainingTotal),
          uom: displayUom,
        })}
      </p>
    </div>
  )
}
