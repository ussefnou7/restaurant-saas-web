import { type ReactNode } from 'react'
import { Check, Pencil, Trash2, Wrench, PackageX, X } from 'lucide-react'
import type { LineFieldContext, LineField, LineSchema } from '../../../types/lineSchema'
import { MaterialSelect } from '../../ui/MaterialSelect'
import { UomSelect } from '../../ui/UomSelect'
import { useUomLookup } from '../../../hooks/useUomLookup'
import { IconActionButton } from '../../ui/RowActions'
import { formatDate, formatMoney } from '../../../utils/format'
import type { MaterialResponse } from '../../../types/inventory'

const ICON_MAP: Record<string, typeof Pencil> = {
  Pencil,
  Trash2,
  Wrench,
  PackageX,
  Check,
  X,
}

export interface SchemaLineGridProps<
  TLine = Record<string, unknown>,
  TLookups = Record<string, unknown>,
> {
  schema: LineSchema<TLine, TLookups>
  lines: TLine[]
  lookups: TLookups
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
  lookupsLoading?: boolean
  interactionLocked?: boolean
  saveDisabled?: boolean
  showGridAdd?: boolean
  addDisabled?: boolean
  emptyState?: ReactNode
  renderStatusBadge?: (status: unknown) => ReactNode
  onLineClick?: (line: TLine) => void
  onFieldChange?: (key: keyof TLine & string, value: unknown, isNew: boolean) => void
  onSaveLine?: (lineId?: string | number) => void
  onCancelLine?: () => void
  onStartAddLine?: () => void
}

export function SchemaLineGrid<
  TLine extends { id?: string | number } = Record<string, unknown> & { id?: string | number },
  TLookups = Record<string, unknown>,
>({
  schema,
  lines,
  lookups,
  locale,
  t,
  showActions = true,
  editingLineId,
  editLineForm,
  addingLine,
  newLineForm,
  lineSaving = false,
  lookupsLoading = false,
  interactionLocked = false,
  saveDisabled = false,
  renderStatusBadge,
  emptyState,
  onLineClick,
  onFieldChange,
  onSaveLine,
  onCancelLine,
}: SchemaLineGridProps<TLine, TLookups>) {
  const { uomLabel, uomSymbol } = useUomLookup()
  const candidateGridFields = schema.fields.filter((f) => !f.showIn || f.showIn.includes('grid'))

  function getContext(line: Partial<TLine>, isNew = false): LineFieldContext<TLine, TLookups> {
    return {
      line: line as TLine,
      lookups,
      locale,
      isNew,
      editingLineId,
      allLines: lines,
    }
  }

  function isFieldVisible(field: LineField<TLine, TLookups>, line: Partial<TLine>, isNew = false) {
    return !field.visible || field.visible(getContext(line, isNew))
  }

  const gridFields = candidateGridFields.filter((field) =>
    !field.visible ||
    lines.some((line) => isFieldVisible(field, line)) ||
    Boolean(editLineForm && isFieldVisible(field, editLineForm)) ||
    Boolean(addingLine && newLineForm && isFieldVisible(field, newLineForm, true)),
  )

  function renderCellDisplay(field: LineField<TLine, TLookups>, line: TLine, isNew = false) {
    const ctx = getContext(line, isNew)
    const val = (line as Record<string, unknown>)[field.key]

    if (field.type === 'computed' && field.compute) {
      const computedVal = field.compute(ctx)
      if (computedVal === null || computedVal === undefined) return '—'
      if (typeof computedVal === 'number') {
        return formatMoney(computedVal)
      }
      return String(computedVal)
    }

    if (field.format) return field.format(val, ctx)

    if (field.type === 'display') {
      if (val === null || val === undefined || val === '') return '—'
      return String(val)
    }

    if (field.type === 'badge' && renderStatusBadge) {
      return renderStatusBadge(val)
    }

    if (field.type === 'money') {
      if (val === null || val === undefined || val === '') return '—'
      const num = Number(val)
      if (Number.isNaN(num)) return '—'
      return formatMoney(num)
    }

    if (field.type === 'date') {
      return val ? formatDate(String(val)) : '—'
    }

    if (field.type === 'select' || field.type === 'lookup') {
      if (field.options) {
        const opts = field.options(ctx)
        const match = opts.find((o) => o.value === String(val))
        if (match) return match.label
      }
      if (field.key === 'uomId' || field.id === 'uom') {
        const sym = uomSymbol(String(val))
        return sym !== '—' ? sym : uomLabel(String(val))
      }
      return val != null && val !== '' ? String(val) : '—'
    }

    if (val === null || val === undefined || val === '') return '—'
    return String(val)
  }

  function renderCellInput(field: LineField<TLine, TLookups>, form: Partial<TLine>, isNew: boolean) {
    const ctx = getContext(form, isNew)
    const val = (form as Record<string, unknown>)[field.key] ?? ''
    const isReadOnly =
      typeof field.readOnly === 'function' ? field.readOnly(ctx) : Boolean(field.readOnly)

    if (field.type === 'computed' || field.type === 'display' || field.type === 'badge') {
      return renderCellDisplay(field, form as TLine, isNew)
    }

    if (isReadOnly) {
      return renderCellDisplay(field, form as TLine, isNew)
    }

    if (field.type === 'lookup') {
      const materialsList = ((lookups as Record<string, unknown>)?.materials || []) as MaterialResponse[]
      return (
        <MaterialSelect
          value={String(val)}
          onChange={(mId) => onFieldChange?.(field.key, mId, isNew)}
          materials={materialsList}
          locale={locale}
          disabled={lineSaving || isReadOnly || interactionLocked}
          loading={lookupsLoading}
          placeholder={t('inventory.purchase.lines.selectMaterial')}
          searchPlaceholder={t('common.search')}
          ariaLabel={t(field.labelKey)}
          clearLabel={t('common.actions.clear')}
        />
      )
    }

    if (field.key === 'uomId' || field.id === 'uom') {
      const opts = field.options ? field.options(ctx) : undefined
      return (
        <UomSelect
          className="pi-form-line-row__input"
          value={String(val)}
          onChange={(v) => onFieldChange?.(field.key, v, isNew)}
          options={opts}
          disabled={lineSaving || lookupsLoading || isReadOnly || interactionLocked}
          ariaLabel={t(field.labelKey)}
        />
      )
    }

    if (field.type === 'select') {
      const opts = field.options ? field.options(ctx) : []
      return (
        <select
          className="pi-form-line-row__input"
          value={String(val)}
          onChange={(e) => onFieldChange?.(field.key, e.target.value, isNew)}
          disabled={lineSaving || lookupsLoading || isReadOnly || interactionLocked}
          aria-label={t(field.labelKey)}
        >
          <option value="">{t('common.select')}</option>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          className="pi-form-line-row__input pi-form-line-row__textarea"
          value={String(val)}
          onChange={(e) => onFieldChange?.(field.key, e.target.value, isNew)}
          disabled={lineSaving || isReadOnly || interactionLocked}
          rows={1}
          aria-label={t(field.labelKey)}
        />
      )
    }

    return (
      <input
        type={field.type === 'number' || field.type === 'money' ? 'number' : field.type === 'date' ? 'date' : 'text'}
        min={field.min ?? 0}
        step={field.step ?? 'any'}
        className={`pi-form-line-row__input${field.dir === 'ltr' ? ' pi-form-line-row__input--ltr' : ''}`}
        value={String(val)}
        onChange={(e) => onFieldChange?.(field.key, e.target.value, isNew)}
        disabled={lineSaving || isReadOnly || interactionLocked}
        placeholder={field.type === 'money' ? '0.00' : ''}
        aria-label={t(field.labelKey)}
      />
    )
  }

  function getThClass(field: LineField<TLine, TLookups>) {
    const base = 'pi-form-lines-table__th'
    const numClass =
      field.type === 'number' || field.type === 'money' || field.type === 'computed'
        ? ' pi-form-lines-table__th--num'
        : field.type === 'select'
          ? ' pi-form-lines-table__th--uom'
          : ''
    return `${base}${numClass}`
  }

  function getTdClass(field: LineField<TLine, TLookups>) {
    const base = 'pi-form-lines-table__td'
    const colClass = field.columnClass ? ` ${field.columnClass}` : ''
    const numClass =
      field.type === 'number' || field.type === 'money' || field.type === 'computed'
        ? ' pi-form-lines-table__td--num'
        : field.type === 'select'
          ? ' pi-form-lines-table__td--uom'
          : ''
    return `${base}${colClass}${numClass}`
  }

  function renderRowActions(line: TLine) {
    return (
      <div className="pi-form-lines-table__row-actions">
        {schema.actions.map((action) => {
          const IconComponent = ICON_MAP[action.icon] || Pencil
          const isDisabled =
            typeof action.disabled === 'function' ? action.disabled(line) : Boolean(action.disabled)
          const disabledReasonKey =
            typeof action.disabledReasonKey === 'function'
              ? action.disabledReasonKey(line)
              : action.disabledReasonKey

          return (
            <IconActionButton
              key={action.key}
              className={`action-btn action-btn--icon${action.variant === 'danger' ? ' action-btn--cancel' : ''}`}
              label={t(action.labelKey)}
              tooltip={isDisabled && disabledReasonKey ? t(disabledReasonKey) : undefined}
              onClick={() => action.onClick(line)}
              disabled={lineSaving || editingLineId != null || addingLine || interactionLocked || isDisabled}
            >
              <IconComponent size={16} aria-hidden="true" />
            </IconActionButton>
          )
        })}
      </div>
    )
  }

  function renderEditRowActions(lineId?: string | number) {
    return (
      <div className="pi-form-lines-table__row-actions">
        <IconActionButton
          className="action-btn action-btn--icon action-btn--confirm"
          label={t('common.save')}
          onClick={() => onSaveLine?.(lineId)}
          disabled={lineSaving || interactionLocked || saveDisabled}
        >
          <Check size={16} aria-hidden="true" />
        </IconActionButton>
        <IconActionButton
          className="action-btn action-btn--icon action-btn--cancel"
          label={t('common.cancel')}
          onClick={() => onCancelLine?.()}
          disabled={lineSaving}
        >
          <X size={16} aria-hidden="true" />
        </IconActionButton>
      </div>
    )
  }

  return (
    <>
      <div className="table-wrap pi-form-lines__table-wrap">
      <table className={`pi-form-lines-table${schema.tableClassName ? ` ${schema.tableClassName}` : ''}${showActions ? ' pi-form-lines-table--draft' : ' pi-form-lines-table--readonly'}`}>
        <colgroup>
          {gridFields.map((field) => (
            <col key={field.id} data-field-id={field.id} style={field.tableWidth ? { width: field.tableWidth } : undefined} />
          ))}
          {showActions ? <col className="pi-form-lines-table__col--actions" /> : null}
        </colgroup>
        <thead>
          <tr>
            {gridFields.map((field) => {
              const isNum = field.type === 'number' || field.type === 'money' || field.type === 'computed'
              const isCenter = field.type === 'select' || field.type === 'badge'
              return (
                <th
                  key={field.id}
                  data-field-id={field.id}
                  className={getThClass(field)}
                  data-numeric={isNum ? 'true' : undefined}
                  data-center={isCenter ? 'true' : undefined}
                >
                  {t(field.labelKey)}
                </th>
              )
            })}
            {showActions ? (
              <th className="pi-form-lines-table__th pi-form-lines-table__th--actions" data-center="true">
                {t('inventory.col.actions')}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 && !addingLine && emptyState ? (
            <tr className="pi-form-lines-table__empty-row">
              <td colSpan={gridFields.length + (showActions ? 1 : 0)} className="pi-form-lines-table__empty-cell">
                {emptyState}
              </td>
            </tr>
          ) : null}
          {lines.map((line) => {
            const lineId = line.id
            const isEditing = editingLineId === String(lineId) && editLineForm

            if (isEditing && editLineForm) {
              return (
                <tr key={lineId} className="pi-form-lines-table__row pi-form-lines-table__row--edit">
                  {gridFields.map((field) => {
                    const isNum = field.type === 'number' || field.type === 'money' || field.type === 'computed'
                    const isCenter = field.type === 'select' || field.type === 'badge'
                    return (
                      <td
                        key={field.id}
                        data-field-id={field.id}
                        className={getTdClass(field)}
                        data-numeric={isNum ? 'true' : undefined}
                        data-center={isCenter ? 'true' : undefined}
                      >
                        {isFieldVisible(field, editLineForm)
                          ? renderCellInput(field, editLineForm, false)
                          : null}
                      </td>
                    )
                  })}
                  {showActions ? (
                    <td className="pi-form-lines-table__td pi-form-lines-table__td--actions" data-center="true">
                      {renderEditRowActions(lineId)}
                    </td>
                  ) : null}
                </tr>
              )
            }

            const isRowClickable = Boolean(onLineClick && !isEditing && !addingLine)

            return (
              <tr
                key={lineId}
                className={`pi-form-lines-table__row${isRowClickable ? ' pi-form-lines-table__row--clickable' : ''}`}
                onClick={isRowClickable ? () => onLineClick?.(line) : undefined}
              >
                {gridFields.map((field) => {
                  const isNum = field.type === 'number' || field.type === 'money' || field.type === 'computed'
                  const isCenter = field.type === 'select' || field.type === 'badge'
                  return (
                    <td
                      key={field.id}
                      data-field-id={field.id}
                      className={getTdClass(field)}
                      data-numeric={isNum ? 'true' : undefined}
                      data-center={isCenter ? 'true' : undefined}
                    >
                      {isFieldVisible(field, line) ? renderCellDisplay(field, line) : null}
                    </td>
                  )
                })}
                {showActions ? (
                  <td
                    className="pi-form-lines-table__td pi-form-lines-table__td--actions"
                    data-center="true"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {renderRowActions(line)}
                  </td>
                ) : null}
              </tr>
            )
          })}

          {addingLine && newLineForm ? (
            <tr className="pi-form-lines-table__row pi-form-lines-table__row--edit">
              {gridFields.map((field) => (
                <td key={field.id} data-field-id={field.id} className={getTdClass(field)}>
                  {isFieldVisible(field, newLineForm, true)
                    ? renderCellInput(field, newLineForm, true)
                    : null}
                </td>
              ))}
              {showActions ? (
                <td className="pi-form-lines-table__td pi-form-lines-table__td--actions">
                  {renderEditRowActions()}
                </td>
              ) : null}
            </tr>
          ) : null}
        </tbody>
      </table>
      </div>
    </>
  )
}
