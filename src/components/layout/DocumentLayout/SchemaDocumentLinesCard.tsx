import { type ReactNode } from 'react'
import { LayoutGrid, FileText, Plus } from 'lucide-react'
import type { LineSchema } from '../../../types/lineSchema'
import { Button } from '../../ui/Button'
import { DocumentLinesCard } from './DocumentLinesCard'
import { SchemaLineGrid } from './SchemaLineGrid'
import { SchemaLineFormView } from './SchemaLineFormView'

export interface SchemaDocumentLinesCardProps<
  TLine = Record<string, unknown>,
  TLookups = Record<string, unknown>,
> {
  title: ReactNode
  schema: LineSchema<TLine, TLookups>
  lines: TLine[]
  lookups: TLookups
  viewMode: 'grid' | 'form'
  selectedLineId?: string | number | null
  selectedIndex: number
  locale: 'ar' | 'en'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: any, params?: any) => string
  showActions?: boolean
  editingLineId?: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editLineForm?: any
  addingLine?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newLineForm?: any
  lineSaving?: boolean
  lineError?: string
  interactionLocked?: boolean
  addDisabled?: boolean
  saveDisabled?: boolean
  showGridAdd?: boolean
  lookupsLoading?: boolean
  renderStatusBadge?: (status: unknown) => ReactNode
  emptyState?: ReactNode
  extraFooter?: ReactNode
  onFieldChange?: (key: keyof TLine & string, value: unknown, isNew: boolean) => void
  onSaveLine?: (lineId?: string | number) => void
  onCancelLine?: () => void
  onStartAddLine?: () => void
  onStartEditLine?: (line: TLine) => void
  onViewModeChange: (mode: 'grid' | 'form', targetLineId?: string | number | null) => void
  onSelectLine: (lineId: string | number) => void
}

export function SchemaDocumentLinesCard<
  TLine extends { id?: string | number } = Record<string, unknown> & { id?: string | number },
  TLookups = Record<string, unknown>,
>({
  title,
  schema,
  lines,
  lookups,
  viewMode,
  selectedLineId,
  selectedIndex,
  locale,
  t,
  showActions = true,
  editingLineId,
  editLineForm,
  addingLine,
  newLineForm,
  lineSaving = false,
  lineError,
  interactionLocked = false,
  addDisabled = false,
  saveDisabled = false,
  lookupsLoading = false,
  renderStatusBadge,
  emptyState,
  extraFooter,
  onFieldChange,
  onSaveLine,
  onCancelLine,
  onStartAddLine,
  onStartEditLine,
  onViewModeChange,
  onSelectLine,
}: SchemaDocumentLinesCardProps<TLine, TLookups>) {

  function handleGridRowClick(line: TLine) {
    if (line?.id != null) {
      onSelectLine(line.id)
    }
  }

  return (
    <DocumentLinesCard
      title={title}
      actions={
        <div className="pi-form-lines__header-right">
          {viewMode === 'grid' && !addingLine && onStartAddLine ? (
            <Button
              onClick={onStartAddLine}
              disabled={lineSaving || interactionLocked || addDisabled}
            >
              <Plus size={16} aria-hidden="true" />
              {t('common.add')}
            </Button>
          ) : null}
          <div className="pi-form-lines__view-toggle" role="group" aria-label={t('common.view')}>
            <button
              type="button"
              className={`pi-form-lines__toggle-btn${viewMode === 'grid' ? ' pi-form-lines__toggle-btn--active' : ''}`}
              onClick={() => onViewModeChange('grid')}
              title={t('inventory.common.gridView')}
            >
              <LayoutGrid size={16} aria-hidden="true" />
              <span>{t('inventory.common.grid')}</span>
            </button>
            <button
              type="button"
              className={`pi-form-lines__toggle-btn${viewMode === 'form' ? ' pi-form-lines__toggle-btn--active' : ''}`}
              onClick={() => onViewModeChange('form')}
              title={t('inventory.common.formView')}
            >
              <FileText size={16} aria-hidden="true" />
              <span>{t('inventory.common.form')}</span>
            </button>
          </div>
        </div>
      }
    >
      {viewMode === 'grid' ? (
        <SchemaLineGrid
          schema={schema}
          lines={lines}
          lookups={lookups}
          locale={locale}
          t={t}
          showActions={showActions}
          editingLineId={editingLineId}
          editLineForm={editLineForm}
          addingLine={addingLine}
          newLineForm={newLineForm}
          lineSaving={lineSaving}
          lookupsLoading={lookupsLoading}
          interactionLocked={interactionLocked}
          saveDisabled={saveDisabled}
          renderStatusBadge={renderStatusBadge}
          emptyState={emptyState}
          onLineClick={handleGridRowClick}
          onFieldChange={onFieldChange}
          onSaveLine={onSaveLine}
          onCancelLine={onCancelLine}
        />
      ) : (
        <SchemaLineFormView
          schema={schema}
          lines={lines}
          lookups={lookups}
          locale={locale}
          t={t}
          selectedLineId={selectedLineId}
          selectedIndex={selectedIndex}
          showActions={showActions}
          editingLineId={editingLineId}
          editLineForm={editLineForm}
          addingLine={addingLine}
          newLineForm={newLineForm}
          lineSaving={lineSaving}
          lookupsLoading={lookupsLoading}
          interactionLocked={interactionLocked}
          addDisabled={addDisabled}
          saveDisabled={saveDisabled}
          renderStatusBadge={renderStatusBadge}
          onSelectLine={onSelectLine}
          onFieldChange={onFieldChange}
          onSaveLine={onSaveLine}
          onCancelLine={onCancelLine}
          onStartAddLine={onStartAddLine}
          onStartEditLine={onStartEditLine}
        />
      )}
      {lineError ? (
        <div className="pi-form-lines__inline-error" role="alert">
          {lineError}
        </div>
      ) : null}
      {extraFooter}
    </DocumentLinesCard>
  )
}
