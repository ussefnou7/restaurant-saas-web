import { Badge } from '../../components/ui/Badge'
import { useTranslation } from '../../i18n/useTranslation'
import type { StockBatchResponse } from '../../types/inventoryStock'
import { formatDate, formatMoney, formatNumber } from '../../utils/format'

interface WarehouseStockBatchSubRowProps {
  loading: boolean
  batches?: StockBatchResponse[]
  error?: string
  uomSymbol: string
}

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

export function WarehouseStockBatchSubRow({
  loading,
  batches,
  error,
  uomSymbol,
}: WarehouseStockBatchSubRowProps) {
  const { t } = useTranslation()

  const isPending = batches === undefined && !error

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

  const resolvedBatches = batches ?? []

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
              <th>{t('inventory.warehouses.stocks.batches.col.number')}</th>
              <th>{t('inventory.warehouses.stocks.batches.col.movementDate')}</th>
              <th>{t('inventory.warehouses.stocks.batches.col.originalQty')}</th>
              <th>{t('inventory.warehouses.stocks.batches.col.remainingQty')}</th>
              <th>{t('inventory.warehouses.stocks.batches.col.unitCost')}</th>
              <th>{t('inventory.warehouses.stocks.batches.col.source')}</th>
              <th>{t('inventory.warehouses.stocks.batches.col.status')}</th>
            </tr>
          </thead>
          <tbody>
            {resolvedBatches.map((batch, index) => {
              const isClosed = batch.status === 'CLOSED'
              return (
                <tr
                  key={batch.id}
                  className={
                    isClosed ? 'warehouse-stocks-panel__batch-line warehouse-stocks-panel__batch-line--closed' : 'warehouse-stocks-panel__batch-line'
                  }
                >
                  <td>{index + 1}</td>
                  <td>{formatDate(batch.movementDate)}</td>
                  <td dir="ltr">{formatNumber(batch.originalQuantity)}</td>
                  <td dir="ltr">{formatNumber(batch.remainingQuantity)}</td>
                  <td dir="ltr">{formatMoney(batch.unitCost)}</td>
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
