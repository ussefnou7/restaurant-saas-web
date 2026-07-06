import { useEffect, useMemo, useState } from 'react'
import { Trash2, Undo2 } from 'lucide-react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { IconActionButton } from '../../../components/ui/RowActions'
import { Modal } from '../../../components/ui/Modal'
import {
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../../components/ui/Table'
import type {
  PhysicalCountLineResponse,
  PhysicalCountResponse,
  ReconcileLineAction,
} from '../../../types/inventoryOperations'
import { formatDate, formatDateTime } from '../../../utils/format'
import {
  getLineVarianceDisplay,
  getMaterialDisplayName,
  getStatusVariant,
  getVarianceCellClass,
  getActionLabel,
  formatSignedMoney,
  formatVarianceQuantity,
  sumLineVarianceValues,
} from './physicalCountDisplay'

interface PhysicalCountReconcileViewProps {
  count: PhysicalCountResponse
  locale: string
  canManage: boolean
  canRevert: boolean
  canDelete: boolean
  actionLoading: boolean
  reconciling: boolean
  reconcileError: string
  onReconcile: (lines: Array<{ lineId: number; action: ReconcileLineAction }>) => void
  onBackToCounting: () => void
  onRevertToDraft: () => void
  onDelete: () => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export function PhysicalCountReconcileView({
  count,
  locale,
  canManage,
  canRevert,
  canDelete,
  actionLoading,
  reconciling,
  reconcileError,
  onReconcile,
  onBackToCounting,
  onRevertToDraft,
  onDelete,
  t,
}: PhysicalCountReconcileViewProps) {
  const [lineActions, setLineActions] = useState<Record<number, ReconcileLineAction>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  const lineDisplays = useMemo(
    () =>
      count.lines.map((line) => ({
        line,
        display: getLineVarianceDisplay(line),
      })),
    [count.lines],
  )

  const hasProvisionalRows = lineDisplays.some(({ display }) => display?.isProvisional)

  useEffect(() => {
    setLineActions((current) => {
      const next: Record<number, ReconcileLineAction> = { ...current }
      for (const { line, display } of lineDisplays) {
        if (!display || display.variance === 0) continue
        if (next[line.id] == null) next[line.id] = 'ADJUSTMENT'
        if (display.variance > 0 && next[line.id] === 'WASTE') {
          next[line.id] = 'ADJUSTMENT'
        }
      }
      return next
    })
  }, [lineDisplays])

  const totalVarianceValue = useMemo(() => sumLineVarianceValues(count.lines), [count.lines])

  const varianceLines = useMemo(
    () => lineDisplays.filter(({ display }) => display && display.variance !== 0),
    [lineDisplays],
  )

  function setLineAction(lineId: number, action: ReconcileLineAction) {
    setLineActions((current) => ({ ...current, [lineId]: action }))
  }

  function handleConfirmReconcile() {
    const lines = varianceLines.map(({ line }) => ({
      lineId: line.id,
      action: lineActions[line.id] ?? 'ADJUSTMENT',
    }))

    onReconcile(lines)
  }

  return (
    <>
      <div className="physical-count-detail">
        <div className="physical-count-detail__header">
          <div className="physical-count-detail__info">
            <div className="physical-count-detail__code" dir="ltr">{count.code}</div>
            <div className="physical-count-detail__warehouse">{count.warehouseName}</div>
            <div className="physical-count-detail__meta-inline">
              <span className="physical-count-detail__meta-label">{t('inventory.physicalCounts.col.scheduledDate')}</span>
              <span className="physical-count-detail__meta-value" dir="ltr">{formatDate(count.scheduledDate)}</span>
            </div>
            {count.frozenAt ? (
              <div className="physical-count-detail__meta-inline">
                <span className="physical-count-detail__meta-label">{t('inventory.physicalCounts.col.frozenAt')}</span>
                <span className="physical-count-detail__meta-value" dir="ltr">{formatDateTime(count.frozenAt)}</span>
              </div>
            ) : null}
            {count.notes ? (
              <div className="physical-count-detail__notes">
                <span className="physical-count-detail__meta-label">{t('inventory.physicalCounts.fields.notes')}</span>
                <span className="physical-count-detail__meta-value">{count.notes}</span>
              </div>
            ) : null}
          </div>
          <Badge variant={getStatusVariant(count.status)}>
            {t(`inventory.physicalCounts.status.${count.status}`)}
          </Badge>
        </div>

        <div className="physical-count-detail__lines">
          <div className="physical-count-reconcile__header">
            <div>
              <h3 className="physical-count-detail__lines-title">{t('inventory.physicalCounts.reconcile.title')}</h3>
              <p className="physical-count-reconcile__subtitle">{t('inventory.physicalCounts.reconcile.subtitle')}</p>
            </div>
            <Button type="button" variant="secondary" onClick={onBackToCounting} disabled={reconciling}>
              {t('inventory.physicalCounts.counting.backToCounting')}
            </Button>
          </div>

          {hasProvisionalRows ? (
            <div className="physical-count-reconcile__provisional-banner">
              {t('inventory.physicalCounts.reconcile.provisionalBanner')}
            </div>
          ) : null}

          {reconcileError ? <div className="form-error-banner">{reconcileError}</div> : null}

          <DataTable>
            <TableHead>
              <TableRow>
                <Th column="entity">{t('inventory.physicalCounts.lines.material')}</Th>
                <Th className="table-cell--numeric">{t('inventory.physicalCounts.reconcile.col.adjustedExpected')}</Th>
                <Th className="table-cell--numeric">{t('inventory.physicalCounts.lines.counted')}</Th>
                <Th className="table-cell--numeric">{t('inventory.physicalCounts.lines.variance')}</Th>
                <Th className="table-cell--numeric">{t('inventory.physicalCounts.lines.varianceValue')}</Th>
                <Th>{t('inventory.physicalCounts.reconcile.col.action')}</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {lineDisplays.map(({ line, display }) => (
                <ReconcileLineRow
                  key={line.id}
                  line={line}
                  display={display}
                  locale={locale}
                  action={lineActions[line.id] ?? 'ADJUSTMENT'}
                  canManage={canManage}
                  disabled={reconciling}
                  onActionChange={(action) => setLineAction(line.id, action)}
                  t={t}
                />
              ))}
            </TableBody>
          </DataTable>
        </div>
      </div>

      {canManage || canRevert || canDelete ? (
        <div className="physical-count-reconcile__footer">
          <div className="physical-count-reconcile__total">
            <span className="physical-count-reconcile__total-label">
              {t('inventory.physicalCounts.reconcile.totalVarianceValue')}
            </span>
            <span
              className={`physical-count-reconcile__total-value ${getVarianceCellClass(totalVarianceValue)}`}
              dir="ltr"
            >
              {formatSignedMoney(totalVarianceValue)}
            </span>
            {hasProvisionalRows ? (
              <span className="physical-count-reconcile__total-note">
                {t('inventory.physicalCounts.reconcile.provisionalTotalNote')}
              </span>
            ) : null}
          </div>
          <div className="physical-count-detail__actions">
            {canManage ? (
              <Button
                variant="primary"
                onClick={() => setConfirmOpen(true)}
                disabled={reconciling || actionLoading}
              >
                {reconciling ? t('common.loading') : t('inventory.physicalCounts.reconcile.submit')}
              </Button>
            ) : null}
            {canRevert ? (
              <Button
                type="button"
                variant="secondary"
                className="pi-form-actions__unpost"
                disabled={reconciling || actionLoading}
                onClick={onRevertToDraft}
              >
                <Undo2 size={16} aria-hidden />
                {t('inventory.physicalCounts.actions.revertToDraft')}
              </Button>
            ) : null}
            {canDelete ? (
              <IconActionButton
                className="action-btn action-btn--icon action-btn--cancel"
                label={t('inventory.physicalCounts.actions.delete')}
                onClick={onDelete}
                disabled={reconciling || actionLoading}
              >
                <Trash2 size={16} aria-hidden />
              </IconActionButton>
            ) : null}
          </div>
        </div>
      ) : null}

      <Modal
        open={confirmOpen}
        title={t('inventory.physicalCounts.confirm.reconcileTitle')}
        size="wide"
        onClose={() => !reconciling && setConfirmOpen(false)}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
              disabled={reconciling}
            >
              {t('inventory.physicalCounts.confirm.reconcileBack')}
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmReconcile}
              disabled={reconciling || varianceLines.length === 0}
            >
              {reconciling
                ? t('common.loading')
                : t('inventory.physicalCounts.confirm.reconcileConfirm')}
            </Button>
          </>
        }
      >
        <div className="physical-count-reconcile-confirm">
          <p className="confirm-modal-message">
            {t('inventory.physicalCounts.confirm.reconcileIntro')}
          </p>
          <div className="physical-count-reconcile-confirm__table-wrap">
            <table className="physical-count-reconcile-confirm__table">
              <thead>
                <tr>
                  <th>{t('inventory.physicalCounts.lines.material')}</th>
                  <th>{t('inventory.physicalCounts.confirm.reconcileColExpectedCounted')}</th>
                  <th>{t('inventory.physicalCounts.lines.variance')}</th>
                  <th>{t('inventory.physicalCounts.reconcile.col.action')}</th>
                  <th>{t('inventory.physicalCounts.lines.varianceValue')}</th>
                </tr>
              </thead>
              <tbody>
                {varianceLines.map(({ line, display }) => {
                  if (!display) return null
                  const action = lineActions[line.id] ?? 'ADJUSTMENT'
                  return (
                    <tr key={line.id}>
                      <td>
                        <span className="physical-count-reconcile-confirm__material">
                          {getMaterialDisplayName(line, locale)}
                        </span>
                        <span className="entity-cell__code">{line.uomSymbol}</span>
                      </td>
                      <td dir="ltr" className="physical-count-reconcile-confirm__num">
                        {display.expectedDisplay} → {line.countedQuantity}
                      </td>
                      <td
                        dir="ltr"
                        className={`physical-count-reconcile-confirm__num ${getVarianceCellClass(display.variance)}`}
                      >
                        {formatVarianceQuantity(display.variance)}
                      </td>
                      <td>{getActionLabel(action, t)}</td>
                      <td
                        dir="ltr"
                        className={`physical-count-reconcile-confirm__num ${getVarianceCellClass(display.varianceValue)}`}
                      >
                        {formatSignedMoney(display.varianceValue)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="physical-count-reconcile-confirm__total">
            <span className="physical-count-reconcile-confirm__total-label">
              {t('inventory.physicalCounts.reconcile.totalVarianceValue')}
            </span>
            <span
              className={`physical-count-reconcile-confirm__total-value ${getVarianceCellClass(totalVarianceValue)}`}
              dir="ltr"
            >
              {formatSignedMoney(totalVarianceValue)}
            </span>
          </div>
        </div>
      </Modal>
    </>
  )
}

interface ReconcileLineRowProps {
  line: PhysicalCountLineResponse
  display: ReturnType<typeof getLineVarianceDisplay>
  locale: string
  action: ReconcileLineAction
  canManage: boolean
  disabled: boolean
  onActionChange: (action: ReconcileLineAction) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

function ReconcileLineRow({
  line,
  display,
  locale,
  action,
  canManage,
  disabled,
  onActionChange,
  t,
}: ReconcileLineRowProps) {
  if (!display) {
    return (
      <TableRow>
        <Td column="entity">
          <span>{getMaterialDisplayName(line, locale)}</span>
          <span className="entity-cell__code">{line.materialCode}</span>
        </Td>
        <Td colSpan={5}>
          <span className="text-muted">{t('inventory.physicalCounts.reconcile.lineNotCounted')}</span>
        </Td>
      </TableRow>
    )
  }

  const { expectedDisplay, variance, varianceValue, isProvisional, usesFrozenExpected } = display
  const isZeroVariance = variance === 0
  const isSurplus = variance > 0

  return (
    <TableRow className={isProvisional ? 'physical-count-line--provisional' : ''}>
      <Td column="entity">
        <span>{getMaterialDisplayName(line, locale)}</span>
        <span className="entity-cell__code">{line.materialCode}</span>
        <span className="entity-cell__code">{line.uomSymbol}</span>
      </Td>
      <Td dir="ltr" className="table-cell--numeric">
        <span>{expectedDisplay}</span>
        {isProvisional && usesFrozenExpected ? (
          <span className="physical-count-reconcile__provisional-tag">
            {t('inventory.physicalCounts.reconcile.provisionalTag')}
          </span>
        ) : null}
      </Td>
      <Td dir="ltr" className="table-cell--numeric">{line.countedQuantity}</Td>
      <Td dir="ltr" className={`table-cell--numeric ${getVarianceCellClass(variance)}`}>
        <span>{formatVarianceQuantity(variance)}</span>
        {isProvisional ? (
          <span className="physical-count-reconcile__provisional-tag">
            {t('inventory.physicalCounts.reconcile.provisionalTag')}
          </span>
        ) : null}
      </Td>
      <Td dir="ltr" className={`table-cell--numeric ${getVarianceCellClass(variance)}`}>
        {varianceValue != null ? (
          <span>{formatSignedMoney(varianceValue)}</span>
        ) : (
          <span className="text-muted">—</span>
        )}
      </Td>
      <Td>
        {isZeroVariance ? (
          <span className="physical-count-reconcile__no-difference">
            {t('inventory.physicalCounts.reconcile.noDifference')}
          </span>
        ) : canManage ? (
          <div className="physical-count-reconcile__action-cell">
            {isSurplus ? (
              <>
                <span className="physical-count-reconcile__action-fixed">
                  {t('inventory.physicalCounts.reconcile.actionAdjustment')}
                </span>
                <span className="physical-count-reconcile__action-hint">
                  {t('inventory.physicalCounts.reconcile.wasteShortageOnlyHint')}
                </span>
              </>
            ) : (
              <>
                <div
                  className="physical-count-reconcile__action-toggle"
                  role="group"
                  aria-label={t('inventory.physicalCounts.reconcile.col.action')}
                >
                  <button
                    type="button"
                    className={`physical-count-reconcile__action-option${
                      action === 'ADJUSTMENT' ? ' physical-count-reconcile__action-option--active' : ''
                    }`}
                    onClick={() => onActionChange('ADJUSTMENT')}
                    disabled={disabled}
                  >
                    {t('inventory.physicalCounts.reconcile.actionAdjustment')}
                  </button>
                  <button
                    type="button"
                    className={`physical-count-reconcile__action-option${
                      action === 'WASTE' ? ' physical-count-reconcile__action-option--active' : ''
                    }`}
                    onClick={() => onActionChange('WASTE')}
                    disabled={disabled}
                  >
                    {t('inventory.physicalCounts.reconcile.actionWaste')}
                  </button>
                </div>
                <span className="physical-count-reconcile__action-hint">
                  {t('inventory.physicalCounts.reconcile.shortageActionHint')}
                </span>
              </>
            )}
          </div>
        ) : (
          <span>{t(`inventory.physicalCounts.reconcile.action.${action}`)}</span>
        )}
      </Td>
    </TableRow>
  )
}

interface PhysicalCountReconciledViewProps {
  count: PhysicalCountResponse
  locale: string
  t: (key: string, params?: Record<string, string | number>) => string
}

export function PhysicalCountReconciledView({ count, locale, t }: PhysicalCountReconciledViewProps) {
  const totalVarianceValue = useMemo(() => sumLineVarianceValues(count.lines), [count.lines])

  return (
    <div className="physical-count-detail">
      <div className="physical-count-detail__header">
        <div className="physical-count-detail__info">
          <div className="physical-count-detail__code" dir="ltr">{count.code}</div>
          <div className="physical-count-detail__warehouse">{count.warehouseName}</div>
          <div className="physical-count-detail__meta-inline">
            <span className="physical-count-detail__meta-label">{t('inventory.physicalCounts.col.scheduledDate')}</span>
            <span className="physical-count-detail__meta-value" dir="ltr">{formatDate(count.scheduledDate)}</span>
          </div>
          {count.frozenAt ? (
            <div className="physical-count-detail__meta-inline">
              <span className="physical-count-detail__meta-label">{t('inventory.physicalCounts.col.frozenAt')}</span>
              <span className="physical-count-detail__meta-value" dir="ltr">{formatDateTime(count.frozenAt)}</span>
            </div>
          ) : null}
          {count.reconciledAt ? (
            <div className="physical-count-detail__meta-inline">
              <span className="physical-count-detail__meta-label">{t('inventory.physicalCounts.col.reconciledAt')}</span>
              <span className="physical-count-detail__meta-value" dir="ltr">{formatDateTime(count.reconciledAt)}</span>
            </div>
          ) : null}
          {count.notes ? (
            <div className="physical-count-detail__notes">
              <span className="physical-count-detail__meta-label">{t('inventory.physicalCounts.fields.notes')}</span>
              <span className="physical-count-detail__meta-value">{count.notes}</span>
            </div>
          ) : null}
        </div>
        <Badge variant={getStatusVariant(count.status)}>
          {t(`inventory.physicalCounts.status.${count.status}`)}
        </Badge>
      </div>

      <div className="physical-count-detail__lines">
        <h3 className="physical-count-detail__lines-title">{t('inventory.physicalCounts.reconcile.reconciledTitle')}</h3>

        <DataTable>
          <TableHead>
            <TableRow>
              <Th column="entity">{t('inventory.physicalCounts.lines.material')}</Th>
              <Th className="table-cell--numeric">{t('inventory.physicalCounts.reconcile.col.adjustedExpected')}</Th>
              <Th className="table-cell--numeric">{t('inventory.physicalCounts.lines.counted')}</Th>
              <Th className="table-cell--numeric">{t('inventory.physicalCounts.lines.variance')}</Th>
              <Th className="table-cell--numeric">{t('inventory.physicalCounts.lines.varianceValue')}</Th>
              <Th>{t('inventory.physicalCounts.reconcile.col.actionTaken')}</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {count.lines.map((line) => {
              const display = getLineVarianceDisplay(line)
              const variance = display?.variance ?? line.variance
              const varianceValue = display?.varianceValue ?? line.varianceValue

              return (
                <TableRow key={line.id}>
                  <Td column="entity">
                    <span>{getMaterialDisplayName(line, locale)}</span>
                    <span className="entity-cell__code">{line.materialCode}</span>
                    <span className="entity-cell__code">{line.uomSymbol}</span>
                  </Td>
                  <Td dir="ltr" className="table-cell--numeric">{line.adjustedExpectedQuantity ?? line.expectedQuantity}</Td>
                  <Td dir="ltr" className="table-cell--numeric">{line.countedQuantity ?? '—'}</Td>
                  <Td dir="ltr" className={`table-cell--numeric ${getVarianceCellClass(variance)}`}>
                    {variance != null ? formatVarianceQuantity(variance) : <span className="text-muted">—</span>}
                  </Td>
                  <Td dir="ltr" className={`table-cell--numeric ${getVarianceCellClass(variance)}`}>
                    {varianceValue != null ? formatSignedMoney(varianceValue) : <span className="text-muted">—</span>}
                  </Td>
                  <Td>
                    <ReconciledActionCell line={line} t={t} />
                  </Td>
                </TableRow>
              )
            })}
          </TableBody>
        </DataTable>

        <div className="physical-count-reconcile__footer physical-count-reconcile__footer--readonly">
          <div className="physical-count-reconcile__total">
            <span className="physical-count-reconcile__total-label">
              {t('inventory.physicalCounts.reconcile.totalVarianceValue')}
            </span>
            <span
              className={`physical-count-reconcile__total-value ${getVarianceCellClass(totalVarianceValue)}`}
              dir="ltr"
            >
              {formatSignedMoney(totalVarianceValue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReconciledActionCell({
  line,
  t,
}: {
  line: PhysicalCountLineResponse
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  const display = getLineVarianceDisplay(line)
  if (display?.variance === 0 || (line.variance != null && line.variance === 0)) {
    return (
      <span className="physical-count-reconcile__no-difference">
        {t('inventory.physicalCounts.reconcile.noDifference')}
      </span>
    )
  }

  const actionKey = line.actionTaken?.toUpperCase()
  const actionLabel =
    actionKey === 'WASTE'
      ? t('inventory.physicalCounts.reconcile.actionWaste')
      : actionKey === 'ADJUSTMENT'
        ? t('inventory.physicalCounts.reconcile.actionAdjustment')
        : (line.actionTaken || '—')

  return (
    <div className="physical-count-reconcile__reconciled-action">
      <span>{actionLabel}</span>
      {line.adjustmentTransactionId != null ? (
        <span className="physical-count-reconcile__transaction-id" dir="ltr">
          {t('inventory.physicalCounts.reconcile.adjustmentTxn', { id: line.adjustmentTransactionId })}
        </span>
      ) : null}
      {line.wasteTransactionId != null ? (
        <span className="physical-count-reconcile__transaction-id" dir="ltr">
          {t('inventory.physicalCounts.reconcile.wasteTxn', { id: line.wasteTransactionId })}
        </span>
      ) : null}
    </div>
  )
}

interface PhysicalCountCancelledViewProps {
  count: PhysicalCountResponse
  t: (key: string) => string
}

export function PhysicalCountCancelledView({ count, t }: PhysicalCountCancelledViewProps) {
  return (
    <div className="physical-count-detail">
      <div className="physical-count-detail__header">
        <div className="physical-count-detail__info">
          <div className="physical-count-detail__code" dir="ltr">{count.code}</div>
          <div className="physical-count-detail__warehouse">{count.warehouseName}</div>
          <div className="physical-count-detail__meta-inline">
            <span className="physical-count-detail__meta-label">{t('inventory.physicalCounts.col.scheduledDate')}</span>
            <span className="physical-count-detail__meta-value" dir="ltr">{formatDate(count.scheduledDate)}</span>
          </div>
          {count.notes ? (
            <div className="physical-count-detail__notes">
              <span className="physical-count-detail__meta-label">{t('inventory.physicalCounts.fields.notes')}</span>
              <span className="physical-count-detail__meta-value">{count.notes}</span>
            </div>
          ) : null}
        </div>
        <Badge variant={getStatusVariant(count.status)}>
          {t(`inventory.physicalCounts.status.${count.status}`)}
        </Badge>
      </div>

      <div className="physical-count-detail__placeholder">
        <p className="physical-count-detail__placeholder-title">
          {t('inventory.physicalCounts.cancelled.title')}
        </p>
        <p className="physical-count-detail__placeholder-text">
          {t('inventory.physicalCounts.cancelled.message')}
        </p>
      </div>
    </div>
  )
}
