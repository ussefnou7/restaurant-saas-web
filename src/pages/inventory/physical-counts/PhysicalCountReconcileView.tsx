import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Info, Trash2, Undo2 } from 'lucide-react'
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
  PostFreezeMovementRowResponse,
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
  formatPhysicalCountQuantity,
  formatPhysicalCountDate,
  formatPhysicalCountDateTime,
  formatSignedMoney,
  formatVarianceQuantity,
  sumLineVarianceValues,
} from './physicalCountDisplay'
import { PhysicalCountDocumentHeader } from './PhysicalCountDocumentHeader'
import { PhysicalCountExpectedQuantity } from './PhysicalCountExpectedQuantity'

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

  const afterCountMovements = useMemo(
    () => [...(movements?.afterCount ?? [])].sort((first, second) => first.createdAt.localeCompare(second.createdAt)),
    [movements],
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
            locale={locale}
            t={t}
          />

          {reconcileError ? <div className="form-error-banner">{reconcileError}</div> : null}

          <DataTable className="physical-count-reconcile__table">
            <TableHead>
              <TableRow>
                <Th column="entity">{t('inventory.physicalCounts.lines.material')}</Th>
                <Th className="table-cell--numeric">{t('inventory.physicalCounts.lines.uom')}</Th>
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
          <AfterCountMovementsWarning
            movements={afterCountMovements}
            locale={locale}
            t={t}
          />
          <div className="physical-count-reconcile-confirm__table-wrap">
            <table className="physical-count-reconcile-confirm__table">
              <thead>
                <tr>
                  <th>{t('inventory.physicalCounts.lines.material')}</th>
                  <th>{t('inventory.physicalCounts.lines.uom')}</th>
                  <th>{t('inventory.physicalCounts.confirm.reconcileColExpectedCounted')}</th>
                  <th>{t('inventory.physicalCounts.lines.variance')}</th>
                  <th>{t('inventory.physicalCounts.lines.varianceValue')}</th>
                </tr>
              </thead>
              <tbody>
                {varianceLines.map(({ line, display }) => {
                  if (!display) return null
                  const uomDisplay = getPhysicalCountUomDisplay(line.uomSymbol, locale, t)
                  return (
                    <tr key={line.id}>
                      <td>
                        <span className="physical-count-reconcile-confirm__material">
                          {getMaterialDisplayName(line, locale)}
                        </span>
                      </td>
                      <td dir={uomDisplay.dir} className="physical-count-reconcile-confirm__num">
                        {uomDisplay.label}
                      </td>
                      <td dir="ltr" className="physical-count-reconcile-confirm__num">
                        {formatPhysicalCountQuantity(display.expectedDisplay)} → {formatPhysicalCountQuantity(line.countedQuantity)}
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
  const uomDisplay = getPhysicalCountUomDisplay(line.uomSymbol, locale, t)

  if (!display) {
    return (
      <TableRow>
        <Td column="entity">
          <span>{getMaterialDisplayName(line, locale)}</span>
        </Td>
        <Td dir={uomDisplay.dir} className="table-cell--numeric">
          {uomDisplay.label}
        </Td>
        <Td dir="ltr" className="table-cell--numeric">
          <PhysicalCountExpectedQuantity line={line} t={t} />
        </Td>
        <Td dir="ltr" className="table-cell--numeric">{formatPhysicalCountQuantity(line.countedQuantity)}</Td>
        <Td colSpan={2}>
          <span className="text-muted">{t('inventory.physicalCounts.reconcile.lineNotCounted')}</span>
        </Td>
      </TableRow>
    )
  }

  const { variance, varianceValue, isProvisional } = display
  const isZeroVariance = variance === 0

  return (
    <TableRow className={isProvisional ? 'physical-count-line--provisional' : ''}>
      <Td column="entity">
        <span>{getMaterialDisplayName(line, locale)}</span>
      </Td>
      <Td dir={uomDisplay.dir} className="table-cell--numeric">
        {uomDisplay.label}
      </Td>
      <Td dir="ltr" className="table-cell--numeric">
        <PhysicalCountExpectedQuantity line={line} t={t} />
      </Td>
      <Td dir="ltr" className="table-cell--numeric">{formatPhysicalCountQuantity(line.countedQuantity)}</Td>
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

function AfterCountMovementsWarning({
  movements,
  locale,
  t,
}: {
  movements: PostFreezeMovementRowResponse[]
  locale: Locale
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  if (movements.length === 0) return null

  return (
    <div className="physical-count-reconcile-confirm__after-count-warning" role="alert">
      <div className="physical-count-reconcile-confirm__after-count-header">
        <AlertTriangle size={18} aria-hidden />
        <p>{t('inventory.physicalCounts.confirm.afterCountWarning')}</p>
      </div>
      <ul className="physical-count-reconcile-confirm__after-count-list">
        {movements.map((movement) => {
          const uomDisplay = getPhysicalCountUomDisplay(movement.uomSymbol, locale, t)
          return (
            <li
              key={`${movement.referenceType ?? 'movement'}-${movement.referenceId ?? movement.createdAt}-${movement.materialId}-${movement.direction}`}
              className="physical-count-reconcile-confirm__after-count-item"
            >
              {t('inventory.physicalCounts.confirm.afterCountItem', {
                material: getMaterialDisplayName(movement, locale),
                direction: t(`inventory.physicalCounts.postFreeze.direction.${movement.direction}`),
                quantity: `${formatPhysicalCountQuantity(movement.quantity)} ${uomDisplay.label}`,
              })}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function PostFreezeMovementsBanner({
  movements,
  locale,
  t,
}: {
  movements: PostFreezeMovementsResponse | null
  locale: Locale
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  const includedRowsByMaterial = useMemo(() => {
    const rowsByMaterial = new Map<number, PostFreezeMovementRowResponse[]>()
    for (const row of movements?.included ?? []) {
      const rows = rowsByMaterial.get(row.materialId) ?? []
      rows.push(row)
      rowsByMaterial.set(row.materialId, rows)
    }

    for (const rows of rowsByMaterial.values()) {
      rows.sort((first, second) => first.createdAt.localeCompare(second.createdAt))
    }

    return rowsByMaterial
  }, [movements])

  const afterCountRowsByMaterial = useMemo(() => {
    const rowsByMaterial = new Map<number, PostFreezeMovementRowResponse[]>()
    for (const row of movements?.afterCount ?? []) {
      const rows = rowsByMaterial.get(row.materialId) ?? []
      rows.push(row)
      rowsByMaterial.set(row.materialId, rows)
    }

    for (const rows of rowsByMaterial.values()) {
      rows.sort((first, second) => first.createdAt.localeCompare(second.createdAt))
    }

    return rowsByMaterial
  }, [movements])

  const hasMovementRows = Boolean((movements?.included.length ?? 0) + (movements?.afterCount.length ?? 0))

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
      {hasMovementRows ? (
        <Button
          type="button"
          variant="secondary"
          className="physical-count-post-freeze__details-action"
          onClick={() => setDetailsOpen(true)}
        >
          {t('inventory.physicalCounts.postFreeze.viewMovementRows')}
        </Button>
      ) : null}
      <Modal
        open={detailsOpen && hasMovementRows}
        title={t('inventory.physicalCounts.postFreeze.movementRowsTitle')}
        size="wide"
        className="physical-count-post-freeze-modal"
        onClose={() => setDetailsOpen(false)}
        footer={
          <Button type="button" variant="secondary" onClick={() => setDetailsOpen(false)}>
            {t('common.close')}
          </Button>
        }
      >
        <PostFreezeMovementRowsModalContent
          materials={movements.materials}
          includedRowsByMaterial={includedRowsByMaterial}
          afterCountRowsByMaterial={afterCountRowsByMaterial}
          locale={locale}
          t={t}
        />
      </Modal>
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
  const formatQuantity = (value: string) => `${formatPhysicalCountQuantity(value)} ${uomDisplay.label}`

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

function PostFreezeMovementRowsModalContent({
  materials,
  includedRowsByMaterial,
  afterCountRowsByMaterial,
  locale,
  t,
}: {
  materials: PostFreezeMaterialMovementResponse[]
  includedRowsByMaterial: Map<number, PostFreezeMovementRowResponse[]>
  afterCountRowsByMaterial: Map<number, PostFreezeMovementRowResponse[]>
  locale: Locale
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  const materialIds = new Set<number>()
  const groups = materials
    .map((material) => {
      materialIds.add(material.materialId)
      return {
        material,
        includedRows: includedRowsByMaterial.get(material.materialId) ?? [],
        afterCountRows: afterCountRowsByMaterial.get(material.materialId) ?? [],
      }
    })
    .filter((group) => group.includedRows.length > 0 || group.afterCountRows.length > 0)

  for (const [materialId, includedRows] of includedRowsByMaterial.entries()) {
    if (materialIds.has(materialId)) continue
    groups.push({
      material: movementMaterialFromRow(includedRows[0]),
      includedRows,
      afterCountRows: afterCountRowsByMaterial.get(materialId) ?? [],
    })
    materialIds.add(materialId)
  }

  for (const [materialId, afterCountRows] of afterCountRowsByMaterial.entries()) {
    if (materialIds.has(materialId)) continue
    groups.push({
      material: movementMaterialFromRow(afterCountRows[0]),
      includedRows: [],
      afterCountRows,
    })
  }

  const showMaterialHeadings = groups.length > 1

  return (
    <div className="physical-count-post-freeze-modal__content">
      {groups.map((group) => (
        <div key={group.material.materialId} className="physical-count-post-freeze-modal__material">
          {showMaterialHeadings ? (
            <h3 className="physical-count-post-freeze-modal__material-title">
              {getMaterialDisplayName(group.material, locale)}
            </h3>
          ) : null}
          {group.includedRows.length > 0 ? (
            <div className="physical-count-post-freeze__rows">
              {group.includedRows.map((row) => (
                <PostFreezeMovementRow
                  key={`${row.referenceType ?? 'movement'}-${row.referenceId ?? row.createdAt}-${row.materialId}-${row.direction}`}
                  row={row}
                  locale={locale}
                  t={t}
                />
              ))}
            </div>
          ) : null}
          {group.afterCountRows.length > 0 ? (
            <div className="physical-count-post-freeze__rows physical-count-post-freeze__rows--after-count">
              <p className="physical-count-post-freeze__rows-heading">
                {t('inventory.physicalCounts.postFreeze.afterCountHeading')}
              </p>
              {group.afterCountRows.map((row) => (
                <PostFreezeMovementRow
                  key={`${row.referenceType ?? 'movement'}-${row.referenceId ?? row.createdAt}-${row.materialId}-${row.direction}`}
                  row={row}
                  locale={locale}
                  t={t}
                  tone="after-count"
                />
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function movementMaterialFromRow(row: PostFreezeMovementRowResponse): PostFreezeMaterialMovementResponse {
  return {
    materialId: row.materialId,
    materialCode: '',
    materialName: row.materialName,
    materialNameAr: row.materialNameAr,
    uomId: row.uomId,
    uomSymbol: row.uomSymbol,
    movementCount: 0,
    quantityIn: '0',
    quantityOut: '0',
    netQuantity: '0',
  }
}

function PostFreezeMovementRow({
  row,
  locale,
  t,
  tone = 'included',
}: {
  row: PostFreezeMovementRowResponse
  locale: Locale
  t: (key: string, params?: Record<string, string | number>) => string
  tone?: 'included' | 'after-count'
}) {
  const materialName = getMaterialDisplayName(row, locale)
  const uomDisplay = getPhysicalCountUomDisplay(row.uomSymbol, locale, t)
  const quantity = `${formatPhysicalCountQuantity(row.quantity)} ${uomDisplay.label}`
  const direction = t(`inventory.physicalCounts.postFreeze.direction.${row.direction}`)
  const source = formatMovementSource(row, t)

  return (
    <div className={`physical-count-post-freeze__row physical-count-post-freeze__row--${tone}`}>
      <p className="physical-count-post-freeze__row-title">
        {t('inventory.physicalCounts.postFreeze.rowTitle', {
          material: materialName,
          direction,
          quantity,
        })}
      </p>
      <p className="physical-count-post-freeze__row-meta">
        {t('inventory.physicalCounts.postFreeze.rowMeta', {
          source,
          receivedDate: formatPhysicalCountDate(row.movementDate),
          registeredAt: formatPhysicalCountDateTime(row.createdAt),
        })}
      </p>
    </div>
  )
}

function formatMovementSource(
  row: PostFreezeMovementRowResponse,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const typeLabel = getReferenceTypeLabel(row.referenceType, t)
  const referenceCode = row.referenceCode?.trim()
  if (!referenceCode) return typeLabel
  return t('inventory.physicalCounts.postFreeze.referenceWithCode', {
    type: typeLabel,
    code: referenceCode,
  })
}

function getReferenceTypeLabel(
  referenceType: string | null,
  t: (key: string) => string,
): string {
  switch (referenceType) {
    case 'PURCHASE_INVOICE':
      return t('inventory.physicalCounts.postFreeze.referenceType.PURCHASE_INVOICE')
    case 'PURCHASE_RETURN':
      return t('inventory.physicalCounts.postFreeze.referenceType.PURCHASE_RETURN')
    case 'ORDER_CONSUMPTION_DOC':
      return t('inventory.physicalCounts.postFreeze.referenceType.ORDER_CONSUMPTION_DOC')
    case 'WASTE_DOCUMENT':
      return t('inventory.physicalCounts.postFreeze.referenceType.WASTE_DOCUMENT')
    case 'PHYSICAL_COUNT':
      return t('inventory.physicalCounts.postFreeze.referenceType.PHYSICAL_COUNT')
    default:
      return t('inventory.physicalCounts.postFreeze.referenceType.UNKNOWN')
  }
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
              <Th className="table-cell--numeric">{t('inventory.physicalCounts.lines.uom')}</Th>
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
              const uomDisplay = getPhysicalCountUomDisplay(line.uomSymbol, locale, t)

              return (
                <TableRow key={line.id}>
                  <Td column="entity">
                    <span>{getMaterialDisplayName(line, locale)}</span>
                  </Td>
                  <Td dir={uomDisplay.dir} className="table-cell--numeric">
                    {uomDisplay.label}
                  </Td>
                  <Td dir="ltr" className="table-cell--numeric">
                    <PhysicalCountExpectedQuantity line={line} t={t} />
                  </Td>
                  <Td dir="ltr" className="table-cell--numeric">{formatPhysicalCountQuantity(line.countedQuantity)}</Td>
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
