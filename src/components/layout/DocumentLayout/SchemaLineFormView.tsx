import { type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Check, Pencil, Trash2, Wrench, PackageX, X, Plus } from 'lucide-react'
import type { LineFieldContext, LineField, LineSchema } from '../../../types/lineSchema'
import { MaterialSelect } from '../../ui/MaterialSelect'
import { UomSelect } from '../../ui/UomSelect'
import { useUomLookup } from '../../../hooks/useUomLookup'
import { Button } from '../../ui/Button'
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

export interface SchemaLineFormViewProps<
  TLine = Record<string, unknown>,
  TLookups = Record<string, unknown>,
> {
  schema: LineSchema<TLine, TLookups>
  lines: TLine[]
  lookups: TLookups
  locale: 'ar' | 'en'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: any, params?: any) => string
  selectedLineId?: string | number | null
  selectedIndex: number
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
  addDisabled?: boolean
  saveDisabled?: boolean
  renderStatusBadge?: (status: unknown) => ReactNode
  onSelectLine?: (lineId: string | number) => void
  onFieldChange?: (key: keyof TLine & string, value: unknown, isNew: boolean) => void
  onSaveLine?: (lineId?: string | number) => void
  onCancelLine?: () => void
  onStartAddLine?: () => void
  onStartEditLine?: (line: TLine) => void
}

export function SchemaLineFormView<
  TLine extends { id?: string | number } = Record<string, unknown> & { id?: string | number },
  TLookups = Record<string, unknown>,
>({
  schema,
  lines,
  lookups,
  locale,
  t,
  selectedIndex,
  showActions = true,
  editingLineId,
  editLineForm,
  addingLine,
  newLineForm,
  lineSaving = false,
  lookupsLoading = false,
  interactionLocked = false,
  addDisabled = false,
  saveDisabled = false,
  renderStatusBadge,
  onSelectLine,
  onFieldChange,
  onSaveLine,
  onCancelLine,
  onStartAddLine,
  onStartEditLine,
}: SchemaLineFormViewProps<TLine, TLookups>) {
  const { uomLabel, uomSymbol } = useUomLookup()
  const formFields = schema.fields.filter((f) => !f.showIn || f.showIn.includes('form'))
  const currentLine = selectedIndex >= 0 ? lines[selectedIndex] : null
  const isEditingCurrentLine = Boolean(currentLine && editingLineId === String(currentLine.id))
  const activeForm = addingLine ? newLineForm : isEditingCurrentLine ? editLineForm : null
  const isFormMode = addingLine || isEditingCurrentLine

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

  function handlePrev() {
    if (selectedIndex > 0) {
      const prevLine = lines[selectedIndex - 1]
      if (prevLine?.id != null) onSelectLine?.(prevLine.id)
    }
  }

  function handleNext() {
    if (selectedIndex >= 0 && selectedIndex < lines.length - 1) {
      const nextLine = lines[selectedIndex + 1]
      if (nextLine?.id != null) onSelectLine?.(nextLine.id)
    }
  }

  const canPrev = !addingLine && selectedIndex > 0
  const canNext =
    !addingLine && selectedIndex >= 0 && selectedIndex < lines.length - 1

  const isRtl = locale === 'ar'
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft
  const NextIcon = isRtl ? ChevronLeft : ChevronRight

  function renderFieldValue(field: LineField<TLine, TLookups>, line: TLine, isNew = false) {
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

  function renderFieldControl(field: LineField<TLine, TLookups>, form: Partial<TLine>, isNew: boolean) {
    const ctx = getContext(form, isNew)
    const val = (form as Record<string, unknown>)[field.key] ?? ''
    const isReadOnly =
      typeof field.readOnly === 'function' ? field.readOnly(ctx) : Boolean(field.readOnly)

    if (field.type === 'computed' || field.type === 'display' || field.type === 'badge') {
      return (
        <div className="pi-form-field__display" dir={field.dir}>
          {renderFieldValue(field, form as TLine, isNew)}
        </div>
      )
    }

    if (isReadOnly) {
      return (
        <div className="pi-form-field__display" dir={field.dir}>
          {renderFieldValue(field, form as TLine, isNew)}
        </div>
      )
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
          className="pi-form-field__select"
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
          className="pi-form-field__select"
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
          className="pi-form-field__textarea"
          value={String(val)}
          onChange={(e) => onFieldChange?.(field.key, e.target.value, isNew)}
          disabled={lineSaving || isReadOnly || interactionLocked}
          rows={3}
          aria-label={t(field.labelKey)}
        />
      )
    }

    return (
      <input
        type={field.type === 'number' || field.type === 'money' ? 'number' : field.type === 'date' ? 'date' : 'text'}
        min={field.min ?? 0}
        step={field.step ?? 'any'}
        className={`pi-form-field__input${field.dir === 'ltr' ? ' pi-form-field__input--ltr' : ''}`}
        value={String(val)}
        onChange={(e) => onFieldChange?.(field.key, e.target.value, isNew)}
        disabled={lineSaving || isReadOnly || interactionLocked}
        placeholder={field.type === 'money' ? '0.00' : ''}
        aria-label={t(field.labelKey)}
      />
    )
  }

  return (
    <div className="pi-form-line-single-view" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="pi-form-line-single-view__nav">
        <div className="pi-form-line-single-view__nav-controls">
          <button
            type="button"
            className="action-btn action-btn--icon"
            onClick={handlePrev}
            disabled={!canPrev}
            title={t('common.prev')}
            aria-label={t('common.prev')}
          >
            <PrevIcon size={20} />
          </button>

          <span className="pi-form-line-single-view__position">
            {addingLine
              ? t('inventory.common.newLine')
              : lines.length > 0 && selectedIndex >= 0
                ? `${t('inventory.common.item')} ${selectedIndex + 1} ${t('common.of')} ${lines.length}`
                : t('inventory.common.noItems')}
          </span>

          <button
            type="button"
            className="action-btn action-btn--icon"
            onClick={handleNext}
            disabled={!canNext}
            title={t('common.next')}
            aria-label={t('common.next')}
          >
            <NextIcon size={20} />
          </button>
        </div>

        {showActions ? (
          <div className="pi-form-line-single-view__nav-actions">
            {!isFormMode && currentLine ? (
              <>
                {onStartEditLine ? (
                  schema.actionsIconOnly ? (
                    <IconActionButton
                      className="action-btn action-btn--icon"
                      label={t('common.edit')}
                      onClick={() => onStartEditLine(currentLine)}
                      disabled={lineSaving || interactionLocked}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </IconActionButton>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => onStartEditLine(currentLine)}
                      disabled={lineSaving || interactionLocked}
                    >
                      <Pencil size={16} aria-hidden="true" />
                      {t('common.edit')}
                    </Button>
                  )
                ) : null}
                {schema.actions.map((action) => {
                  if (action.key === 'edit') return null
                  const IconComponent = ICON_MAP[action.icon] || Pencil
                  const isDisabled = typeof action.disabled === 'function' ? action.disabled(currentLine) : Boolean(action.disabled)
                  const disabledReasonKey =
                    typeof action.disabledReasonKey === 'function'
                      ? action.disabledReasonKey(currentLine)
                      : action.disabledReasonKey
                  return schema.actionsIconOnly ? (
                    <IconActionButton
                      key={action.key}
                      className={`action-btn action-btn--icon${action.variant === 'danger' ? ' action-btn--cancel' : ''}`}
                      label={t(action.labelKey)}
                      tooltip={isDisabled && disabledReasonKey ? t(disabledReasonKey) : undefined}
                      onClick={() => action.onClick(currentLine)}
                      disabled={lineSaving || interactionLocked || isDisabled}
                    >
                      <IconComponent size={16} aria-hidden="true" />
                    </IconActionButton>
                  ) : (
                    <Button
                      key={action.key}
                      variant={action.variant === 'danger' ? 'cancelDoc' : 'secondary'}
                      onClick={() => action.onClick(currentLine)}
                      disabled={lineSaving || interactionLocked || isDisabled}
                    >
                      <IconComponent size={16} aria-hidden="true" />
                      {t(action.labelKey)}
                    </Button>
                  )
                })}
              </>
            ) : null}

            {isFormMode ? (
              <>
                <Button
                  variant="primary"
                  onClick={() => onSaveLine?.(addingLine ? undefined : currentLine?.id)}
                  disabled={lineSaving || interactionLocked || saveDisabled}
                >
                  <Check size={16} aria-hidden="true" />
                  {t('common.save')}
                </Button>
                <Button
                  variant="secondary"
                  onClick={onCancelLine}
                  disabled={lineSaving}
                >
                  <X size={16} aria-hidden="true" />
                  {t('common.cancel')}
                </Button>
              </>
            ) : null}

            {!addingLine && onStartAddLine ? (
              <Button
                onClick={onStartAddLine}
                disabled={lineSaving || isFormMode || interactionLocked || addDisabled}
              >
                <Plus size={16} aria-hidden="true" />
                {t('common.add')}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {isFormMode && activeForm ? (
        <div className="pi-form-line-single-view__grid">
          {formFields.map((field) => (
            <div key={field.id} data-field-id={field.id} className="pi-form-field">
              <label className="pi-form-field__label">
                {t(field.labelKey)}
                {field.required ? <span className="pi-form-field__required"> *</span> : null}
              </label>
              {renderFieldControl(field, activeForm, Boolean(addingLine))}
            </div>
          ))}
        </div>
      ) : currentLine ? (
        <div className="pi-form-line-single-view__grid">
          {formFields.map((field) => (
            <div key={field.id} data-field-id={field.id} className="pi-form-field">
              <span className="pi-form-field__label">{t(field.labelKey)}</span>
              <div className="pi-form-field__display" dir={field.dir}>
                {renderFieldValue(field, currentLine)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pi-form-lines__empty">
          <p className="pi-form-lines__empty-title">
            {t('inventory.common.noItemsSelected')}
          </p>
        </div>
      )}
    </div>
  )
}
