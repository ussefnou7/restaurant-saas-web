import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Circle, Trash2, Undo2 } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { IconActionButton } from '../../../components/ui/RowActions'
import {
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../../components/ui/Table'
import { FormInput, FormTextarea } from '../../../components/fields'
import type { Locale } from '../../../i18n/types'
import type { PhysicalCountLineResponse, PhysicalCountResponse } from '../../../types/inventoryOperations'
import { PhysicalCountDocumentHeader } from './PhysicalCountDocumentHeader'
import { PhysicalCountExpectedQuantity } from './PhysicalCountExpectedQuantity'
import {
  formatPhysicalCountDateTime,
  formatPhysicalCountQuantity,
  getMaterialDisplayName,
  getPhysicalCountUomDisplay,
} from './physicalCountDisplay'

type LineDraft = {
  countedQuantity: string
  notes: string
}

function buildLineDrafts(lines: PhysicalCountLineResponse[]): Record<number, LineDraft> {
  return Object.fromEntries(
    lines.map((line) => [
      line.id,
      {
        countedQuantity: line.countedQuantity != null ? String(line.countedQuantity) : '',
        notes: line.notes ?? '',
      },
    ]),
  )
}

interface PhysicalCountInProgressViewProps {
  count: PhysicalCountResponse
  locale: Locale
  canManage: boolean
  canRevert: boolean
  canDelete: boolean
  actionLoading: boolean
  saving: boolean
  savedAt: string | null
  saveError: string
  onSave: (lines: Array<{ lineId: number; countedQuantity: number; notes?: string }>) => void
  onProceedToReconcile: () => void
  onRevertToDraft: () => void
  onDelete: () => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export function PhysicalCountInProgressView({
  count,
  locale,
  canManage,
  canRevert,
  canDelete,
  actionLoading,
  saving,
  savedAt,
  saveError,
  onSave,
  onProceedToReconcile,
  onRevertToDraft,
  onDelete,
  t,
}: PhysicalCountInProgressViewProps) {
  const [lineDrafts, setLineDrafts] = useState<Record<number, LineDraft>>(() => buildLineDrafts(count.lines))
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    setLineDrafts(buildLineDrafts(count.lines))
  }, [count])

  const countedLines = useMemo(
    () => count.lines.filter((line) => line.countedQuantity != null).length,
    [count.lines],
  )

  const allCounted = count.lines.length > 0 && count.lines.every((line) => line.countedQuantity != null)

  const hasLinesToSave = useMemo(
    () => count.lines.some((line) => (lineDrafts[line.id]?.countedQuantity.trim() ?? '') !== ''),
    [count.lines, lineDrafts],
  )

  const displayError = validationError || saveError

  function updateLineDraft(lineId: number, patch: Partial<LineDraft>) {
    if (validationError) setValidationError('')
    setLineDrafts((current) => ({
      ...current,
      [lineId]: { ...current[lineId], ...patch },
    }))
  }

  function handleSave() {
    const linesToSave: Array<{ lineId: number; countedQuantity: number; notes?: string }> = []

    for (const line of count.lines) {
      const draft = lineDrafts[line.id]
      if (!draft || draft.countedQuantity.trim() === '') continue

      const parsed = Number(draft.countedQuantity)
      if (Number.isNaN(parsed) || parsed < 0) {
        setValidationError(t('inventory.physicalCounts.validation.countedQuantityInvalid'))
        return
      }

      linesToSave.push({
        lineId: line.id,
        countedQuantity: parsed,
        notes: draft.notes.trim() || undefined,
      })
    }

    if (linesToSave.length === 0) {
      setValidationError(t('inventory.physicalCounts.counting.nothingToSave'))
      return
    }

    setValidationError('')
    onSave(linesToSave)
  }

  return (
    <>
      <div className="physical-count-detail">
        <PhysicalCountDocumentHeader count={count} locale={locale} t={t} />

        <div className="physical-count-detail__lines">
          <div className="physical-count-counting__header">
            <div>
              <h3 className="physical-count-detail__lines-title">{t('inventory.physicalCounts.counting.title')}</h3>
              <p className="physical-count-counting__progress">
                {t('inventory.physicalCounts.counting.progress', {
                  counted: countedLines,
                  total: count.lines.length,
                })}
              </p>
            </div>
            {savedAt ? (
              <span className="physical-count-counting__saved">
                {t('inventory.physicalCounts.counting.savedAt', { time: formatPhysicalCountDateTime(savedAt) })}
              </span>
            ) : null}
          </div>

          {displayError ? <div className="form-error-banner">{displayError}</div> : null}

          <DataTable className="physical-count-counting__table">
            <TableHead>
              <TableRow>
                <Th className="physical-count-counting__status-col">{t('inventory.physicalCounts.counting.col.status')}</Th>
                <Th column="entity">{t('inventory.physicalCounts.lines.material')}</Th>
                <Th className="table-cell--numeric">{t('inventory.physicalCounts.lines.uom')}</Th>
                <Th className="table-cell--numeric">{t('inventory.physicalCounts.lines.expected')}</Th>
                <Th className="table-cell--numeric physical-count-counting__counted-col">{t('inventory.physicalCounts.lines.counted')}</Th>
                <Th>{t('inventory.physicalCounts.counting.col.lineNotes')}</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {count.lines.map((line) => {
                const draft = lineDrafts[line.id]
                const isCounted = line.countedQuantity != null
                const parsedDraft = draft?.countedQuantity.trim() === '' ? null : Number(draft?.countedQuantity)
                const hasInvalidDraft =
                  parsedDraft != null && (Number.isNaN(parsedDraft) || parsedDraft < 0)
                const uomDisplay = getPhysicalCountUomDisplay(line.uomSymbol, locale, t)

                return (
                  <TableRow
                    key={line.id}
                    className={isCounted ? '' : 'physical-count-line--uncounted'}
                  >
                    <Td className="physical-count-counting__status-cell">
                      {isCounted ? (
                        <span className="physical-count-counting__status physical-count-counting__status--counted">
                          <CheckCircle2 size={16} aria-hidden />
                          {t('inventory.physicalCounts.counting.counted')}
                        </span>
                      ) : (
                        <span className="physical-count-counting__status physical-count-counting__status--pending">
                          <Circle size={16} aria-hidden />
                          {t('inventory.physicalCounts.counting.uncounted')}
                        </span>
                      )}
                    </Td>
                    <Td column="entity">
                      <span>{getMaterialDisplayName(line, locale)}</span>
                    </Td>
                    <Td dir={uomDisplay.dir} className="table-cell--numeric">{uomDisplay.label}</Td>
                    <Td dir="ltr" className="table-cell--numeric">
                      <PhysicalCountExpectedQuantity line={line} t={t} />
                    </Td>
                    <Td className="table-cell--numeric physical-count-counting__editable-cell">
                      {canManage ? (
                        <FormInput
                          type="number"
                          ltr
                          min={0}
                          step="any"
                          className={`physical-count-counting__qty-input${hasInvalidDraft ? ' physical-count-counting__qty-input--error' : ''}`}
                          value={draft?.countedQuantity ?? ''}
                          onChange={(event) =>
                            updateLineDraft(line.id, { countedQuantity: event.target.value })
                          }
                          disabled={saving}
                          aria-label={t('inventory.physicalCounts.lines.counted')}
                        />
                      ) : (
                        <span dir="ltr">
                          {line.countedQuantity != null
                            ? formatPhysicalCountQuantity(line.countedQuantity)
                            : <span className="text-muted">—</span>}
                        </span>
                      )}
                    </Td>
                    <Td>
                      {canManage ? (
                        <FormTextarea
                          className="physical-count-counting__notes-input"
                          value={draft?.notes ?? ''}
                          onChange={(event) => updateLineDraft(line.id, { notes: event.target.value })}
                          disabled={saving}
                          rows={1}
                          aria-label={t('inventory.physicalCounts.counting.col.lineNotes')}
                        />
                      ) : (
                        <span>{line.notes ?? <span className="text-muted">—</span>}</span>
                      )}
                    </Td>
                  </TableRow>
                )
              })}
            </TableBody>
          </DataTable>
        </div>
      </div>

      {canManage || canRevert || canDelete ? (
        <div className="physical-count-detail__actions">
          {canManage ? (
            <>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={saving || actionLoading || !hasLinesToSave}
              >
                {saving ? t('common.loading') : t('inventory.physicalCounts.counting.save')}
              </Button>
              <Button
                variant="secondary"
                onClick={onProceedToReconcile}
                disabled={saving || actionLoading || !allCounted}
                title={!allCounted ? t('inventory.physicalCounts.counting.proceedDisabledHint') : undefined}
              >
                {t('inventory.physicalCounts.counting.proceedToReconcile')}
              </Button>
            </>
          ) : null}
          {canRevert ? (
            <Button
              type="button"
              variant="secondary"
              className="pi-form-actions__unpost"
              disabled={actionLoading || saving}
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
              disabled={actionLoading || saving}
            >
              <Trash2 size={16} aria-hidden />
            </IconActionButton>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
