import { useEffect, useMemo, useState } from 'react'
import { Info, Trash2, Undo2 } from 'lucide-react'
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
import type { Locale } from '../../../i18n/types'
import type {
  PhysicalCountLineResponse,
  PostFreezeMaterialMovementResponse,
  PostFreezeMovementsResponse,
  PhysicalCountResponse,
} from '../../../types/inventoryOperations'
import * as physicalCountService from '../../../services/physicalCountService'
import {
  getLineVarianceDisplay,
  getMaterialDisplayName,
  getPhysicalCountUomDisplay,
  getVarianceCellClass,
  hasEstimatedVarianceValue,
  formatSignedMoney,
  formatVarianceQuantity,
  sumLineVarianceValues,
} from './physicalCountDisplay'
import { PhysicalCountDocumentHeader } from './PhysicalCountDocumentHeader'

interface PhysicalCountReconcileViewProps {
  count: PhysicalCountResponse
  locale: Locale
  canManage: boolean
  canRevert: boolean
  canDelete: boolean
  actionLoading: boolean
  reconciling: boolean
  reconcileError: string
  onReconcile: () => void
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
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [movements, setMovements] = useState<PostFreezeMovementsResponse | null>(null)
  const [movementsOpen, setMovementsOpen] = useState(false)

  const lineDisplays = useMemo(
    () =>
      count.lines.map((line) => ({
        line,
        display: getLineVarianceDisplay(line),
      })),
    [count.lines],
  )

  useEffect(() => {
    let cancelled = false

    async function loadMovements() {
      try {
        const data = await physicalCountService.getPostFreezeMovements(count.id)
        if (!cancelled) {
          setMovements(data.totalMovementCount > 0 ? data : null)
          setMovementsOpen(false)
        }
      } catch (error) {
        console.error('[physical-counts] Failed to load post-freeze movements', error)
        if (!cancelled) setMovements(null)
      }
    }

    void loadMovements()
    return () => {
      cancelled = true
    }
  }, [count.id])

  const totalVarianceValue = useMemo(() => sumLineVarianceValues(count.lines), [count.lines])

  const varianceLines = useMemo(
    () => lineDisplays.filter(({ display }) => display && display.variance !== 0),
    [lineDisplays],
  )

  const hasEstimatedValues = useMemo(
    () => count.lines.some(hasEstimatedVarianceValue),
    [count.lines],
  )

  return (
    <>
      <div className="physical-count-detail">
        <PhysicalCountDocumentHeader count={count} locale={locale} t={t} />

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

          <PostFreezeMovementsBanner
            movements={movements}
            open={movementsOpen}
            onToggle={() => setMovementsOpen((current) => !current)}
            locale={locale}
            t={t}
          />

          {reconcileError ? <div className="form-error-banner">{reconcileError}</div> : null}

          <DataTable className="physical-count-reconcile__table">
            <TableHead>
              <TableRow>
                <Th column="entity">{t('inventory.physicalCounts.lines.material')}</Th>
                <Th className="table-cell--numeric">
                  <AdjustedExpectedHeader t={t} />
                </Th>
                <Th className="table-cell--numeric">{t('inventory.physicalCounts.lines.counted')}</Th>
                <Th className="table-cell--numeric">{t('inventory.physicalCounts.lines.variance')}</Th>
                <Th className="table-cell--numeric">{t('inventory.physicalCounts.lines.varianceValue')}</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {lineDisplays.map(({ line, display }) => (
                <ReconcileLineRow
                  key={line.id}
                  line={line}
                  display={display}
                  locale={locale}
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
              <VarianceValueDisplay
                value={totalVarianceValue}
                estimated={hasEstimatedValues}
                t={t}
              />
            </span>
            {hasEstimatedValues ? (
              <span className="physical-count-reconcile__total-note">
                {t('inventory.physicalCounts.reconcile.estimateTotalNote')}
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
        className="physical-count-reconcile-confirm-modal"
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
              variant="dangerConfirm"
              onClick={onReconcile}
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
          <div className="physical-count-reconcile-confirm__summary">
            <div className="physical-count-reconcile-confirm__summary-item">
              <span className="physical-count-reconcile-confirm__summary-label">
                {t('inventory.physicalCounts.reconcile.totalVarianceValue')}
              </span>
              <span
                className={`physical-count-reconcile-confirm__summary-value ${getVarianceCellClass(totalVarianceValue)}`}
                dir="ltr"
              >
                <VarianceValueDisplay
                  value={totalVarianceValue}
                  estimated={hasEstimatedValues}
                  t={t}
                />
              </span>
            </div>
            <div className="physical-count-reconcile-confirm__summary-item">
              <span className="physical-count-reconcile-confirm__summary-label">
                {t('inventory.physicalCounts.confirm.movementLines')}
              </span>
              <span className="physical-count-reconcile-confirm__summary-value" dir="ltr">
                {varianceLines.length}
              </span>
            </div>
          </div>
          <p className="physical-count-reconcile-confirm__finality">
            {t('inventory.physicalCounts.confirm.reconcileFinality')}
          </p>
          <div className="physical-count-reconcile-confirm__table-wrap">
            <table className="physical-count-reconcile-confirm__table">
              <thead>
                <tr>
                  <th>{t('inventory.physicalCounts.lines.material')}</th>
                  <th>{t('inventory.physicalCounts.confirm.reconcileColExpectedCounted')}</th>
                  <th>{t('inventory.physicalCounts.lines.variance')}</th>
                  <th>{t('inventory.physicalCounts.lines.varianceValue')}</th>
                </tr>
              </thead>
              <tbody>
                {varianceLines.map(({ line, display }) => {
                  if (!display) return null
                  return (
                    <tr key={line.id}>
                      <td>
                        <span className="physical-count-reconcile-confirm__material">
                          {getMaterialDisplayName(line, locale)}
                        </span>
                        <span className="entity-cell__code">
                          {getPhysicalCountUomDisplay(line.uomSymbol, locale, t).label}
                        </span>
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
                      <td
                        dir="ltr"
                        className={`physical-count-reconcile-confirm__num ${getVarianceCellClass(display.varianceValue)}`}
                      >
                        <VarianceValueDisplay
                          value={display.varianceValue}
                          estimated={hasEstimatedVarianceValue(line)}
                          t={t}
                        />
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
              <VarianceValueDisplay
                value={totalVarianceValue}
                estimated={hasEstimatedValues}
                t={t}
              />
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
  locale: Locale
  t: (key: string, params?: Record<string, string | number>) => string
}

function ReconcileLineRow({
  line,
  display,
  locale,
  t,
}: ReconcileLineRowProps) {
  if (!display) {
    return (
      <TableRow>
        <Td column="entity">
          <span>{getMaterialDisplayName(line, locale)}</span>
        </Td>
        <Td colSpan={4}>
          <span className="text-muted">{t('inventory.physicalCounts.reconcile.lineNotCounted')}</span>
        </Td>
      </TableRow>
    )
  }

  const { expectedDisplay, variance, varianceValue, isProvisional } = display
  const isZeroVariance = variance === 0
  const uomDisplay = getPhysicalCountUomDisplay(line.uomSymbol, locale, t)

  return (
    <TableRow className={isProvisional ? 'physical-count-line--provisional' : ''}>
      <Td column="entity">
        <span>{getMaterialDisplayName(line, locale)}</span>
        <span className="entity-cell__code">{uomDisplay.label}</span>
      </Td>
      <Td dir="ltr" className="table-cell--numeric">
        <span>{expectedDisplay}</span>
      </Td>
      <Td dir="ltr" className="table-cell--numeric">{line.countedQuantity}</Td>
      <Td dir="ltr" className={`table-cell--numeric ${getVarianceCellClass(variance)}`}>
        {isZeroVariance ? (
          <span className="physical-count-reconcile__no-difference">
            {t('inventory.physicalCounts.reconcile.noDifference')}
          </span>
        ) : (
          <span>{formatVarianceQuantity(variance)}</span>
        )}
        {isProvisional ? (
          <span className="physical-count-reconcile__provisional-tag">
            {t('inventory.physicalCounts.reconcile.provisionalTag')}
          </span>
        ) : null}
      </Td>
      <Td dir="ltr" className={`table-cell--numeric ${getVarianceCellClass(varianceValue)}`}>
        {varianceValue != null ? (
          <VarianceValueDisplay
            value={varianceValue}
            estimated={hasEstimatedVarianceValue(line)}
            t={t}
          />
        ) : (
          <span className="text-muted">—</span>
        )}
      </Td>
    </TableRow>
  )
}

function AdjustedExpectedHeader({ t }: { t: (key: string) => string }) {
  const tooltip = t('inventory.physicalCounts.reconcile.col.adjustedExpectedTooltip')

  return (
    <span className="physical-count-reconcile__adjusted-header">
      <span>{t('inventory.physicalCounts.reconcile.col.adjustedExpected')}</span>
      <span
        className="physical-count-reconcile__adjusted-help"
        title={tooltip}
        aria-label={tooltip}
      >
        <Info size={13} aria-hidden />
      </span>
    </span>
  )
}

function VarianceValueDisplay({
  value,
  estimated,
  t,
}: {
  value: number | null | undefined
  estimated: boolean
  t: (key: string) => string
}) {
  return (
    <span className="physical-count-reconcile__variance-value">
      <span>{formatSignedMoney(value)}</span>
      {estimated ? (
        <span
          className="physical-count-reconcile__estimate-marker"
          title={t('inventory.physicalCounts.reconcile.estimateTooltip')}
          aria-label={t('inventory.physicalCounts.reconcile.estimateTooltip')}
        >
          <Info size={13} aria-hidden />
          <span>{t('inventory.physicalCounts.reconcile.estimateMarker')}</span>
        </span>
      ) : null}
    </span>
  )
}

function PostFreezeMovementsBanner({
  movements,
  open,
  onToggle,
  locale,
  t,
}: {
  movements: PostFreezeMovementsResponse | null
  open: boolean
  onToggle: () => void
  locale: Locale
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  if (!movements || movements.totalMovementCount === 0) return null

  return (
    <div className="physical-count-post-freeze">
      <div className="physical-count-post-freeze__main">
        <Info size={18} aria-hidden />
        <div>
          <p className="physical-count-post-freeze__title">
            {t('inventory.physicalCounts.postFreeze.title', {
              movementCount: movements.totalMovementCount,
              materialCount: movements.affectedMaterialCount,
            })}
          </p>
          <p className="physical-count-post-freeze__text">
            {t('inventory.physicalCounts.postFreeze.scopeNote')}
          </p>
        </div>
      </div>
      {movements.materials.length > 0 ? (
        <>
          <Button
            type="button"
            variant="secondary"
            className="physical-count-post-freeze__toggle"
            onClick={onToggle}
          >
            {open
              ? t('inventory.physicalCounts.postFreeze.hideBreakdown')
              : t('inventory.physicalCounts.postFreeze.showBreakdown')}
          </Button>
          {open ? (
            <div className="physical-count-post-freeze__list">
              {movements.materials.map((material) => (
                <PostFreezeMaterialMovement
                  key={material.materialId}
                  material={material}
                  locale={locale}
                  t={t}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function PostFreezeMaterialMovement({
  material,
  locale,
  t,
}: {
  material: PostFreezeMaterialMovementResponse
  locale: Locale
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  const materialName = getMaterialDisplayName(material, locale)
  const uomDisplay = getPhysicalCountUomDisplay(material.uomSymbol, locale, t)
  const formatQuantity = (value: number) => `${value} ${uomDisplay.label}`

  return (
    <div className="physical-count-post-freeze__material">
      <span className="physical-count-post-freeze__material-name">{materialName}</span>
      <span className="physical-count-post-freeze__material-meta">
        {t('inventory.physicalCounts.postFreeze.materialMeta', {
          movementCount: material.movementCount,
          quantityIn: formatQuantity(material.quantityIn),
          quantityOut: formatQuantity(material.quantityOut),
          netQuantity: formatQuantity(material.netQuantity),
        })}
      </span>
    </div>
  )
}

interface PhysicalCountReconciledViewProps {
  count: PhysicalCountResponse
  locale: Locale
  t: (key: string, params?: Record<string, string | number>) => string
}

export function PhysicalCountReconciledView({ count, locale, t }: PhysicalCountReconciledViewProps) {
  const totalVarianceValue = useMemo(() => sumLineVarianceValues(count.lines), [count.lines])
  const hasEstimatedValues = useMemo(
    () => count.lines.some(hasEstimatedVarianceValue),
    [count.lines],
  )

  return (
    <div className="physical-count-detail">
      <PhysicalCountDocumentHeader count={count} locale={locale} t={t} />

      <div className="physical-count-detail__lines">
        <h3 className="physical-count-detail__lines-title">{t('inventory.physicalCounts.reconcile.reconciledTitle')}</h3>

        <DataTable>
          <TableHead>
            <TableRow>
              <Th column="entity">{t('inventory.physicalCounts.lines.material')}</Th>
              <Th className="table-cell--numeric">
                <AdjustedExpectedHeader t={t} />
              </Th>
              <Th className="table-cell--numeric">{t('inventory.physicalCounts.lines.counted')}</Th>
              <Th className="table-cell--numeric">{t('inventory.physicalCounts.lines.variance')}</Th>
              <Th className="table-cell--numeric">{t('inventory.physicalCounts.lines.varianceValue')}</Th>
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
                    <span className="entity-cell__code">
                      {getPhysicalCountUomDisplay(line.uomSymbol, locale, t).label}
                    </span>
                  </Td>
                  <Td dir="ltr" className="table-cell--numeric">
                    {display?.expectedDisplay ?? line.expectedQuantity}
                  </Td>
                  <Td dir="ltr" className="table-cell--numeric">{line.countedQuantity ?? '—'}</Td>
                  <Td dir="ltr" className={`table-cell--numeric ${getVarianceCellClass(variance)}`}>
                    {variance === 0 ? (
                      <span className="physical-count-reconcile__no-difference">
                        {t('inventory.physicalCounts.reconcile.noDifference')}
                      </span>
                    ) : variance != null ? (
                      formatVarianceQuantity(variance)
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </Td>
                  <Td dir="ltr" className={`table-cell--numeric ${getVarianceCellClass(varianceValue)}`}>
                    {varianceValue != null ? (
                      <VarianceValueDisplay
                        value={varianceValue}
                        estimated={hasEstimatedVarianceValue(line)}
                        t={t}
                      />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
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
              <VarianceValueDisplay
                value={totalVarianceValue}
                estimated={hasEstimatedValues}
                t={t}
              />
            </span>
            {hasEstimatedValues ? (
              <span className="physical-count-reconcile__total-note">
                {t('inventory.physicalCounts.reconcile.estimateTotalNote')}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

interface PhysicalCountCancelledViewProps {
  count: PhysicalCountResponse
  locale: Locale
  t: (key: string) => string
}

export function PhysicalCountCancelledView({ count, locale, t }: PhysicalCountCancelledViewProps) {
  return (
    <div className="physical-count-detail">
      <PhysicalCountDocumentHeader count={count} locale={locale} t={t} />

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
