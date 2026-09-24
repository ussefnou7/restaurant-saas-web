import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { FormField, FormSelect } from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { Dropdown } from '../../components/ui/Dropdown'
import { useTranslation } from '../../i18n/useTranslation'
import { getSelectableExpenseShifts } from '../../services/expenseService'
import type { SelectableExpenseShift } from '../../types/expense'
import { translateApiError } from '../../utils/errors'
import { formatDateTime } from '../../utils/format'
import { formatShiftBusinessDate, getShiftStatusLabel } from '../../utils/shiftDisplay'

interface ExpenseShiftPickerProps {
  branchId: number | null
  expenseDate: string
  value: number | null
  onChange: (value: number | null) => void
  disabled: boolean
  error?: string
}

export function ExpenseShiftPicker({ branchId, expenseDate, value, onChange, disabled, error }: ExpenseShiftPickerProps) {
  const { t, locale } = useTranslation()
  const [days, setDays] = useState(7)
  const [shifts, setShifts] = useState<SelectableExpenseShift[]>([])
  const [loading, setLoading] = useState(branchId !== null)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [retry, setRetry] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    onChange(null)
    setShifts([])
    setLoadError(null)
    if (branchId === null) {
      setLoading(false)
      return
    }
    setLoading(true)
    void getSelectableExpenseShifts(branchId, days).then((rows) => {
      if (cancelled) return
      setShifts(rows)
      // The expense date suggests a choice only; it never determines attribution server-side.
      // Match the shift's fixed branch-local business date instead of inferring it from timestamps:
      // an overnight shift deliberately keeps the business date on which it opened (D120/D124).
      const matching = rows.filter((shift) => shift.businessDate === expenseDate)
      // Recent shifts cannot reveal an idle second drawer; use the branch's actual device count.
      if (matching.length === 1 && matching[0].branchDeviceCount === 1) {
        onChange(matching[0].id)
      }
    }).catch((err: unknown) => {
      if (!cancelled) setLoadError(err)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [branchId, days, expenseDate, onChange, retry])

  const selected = shifts.find((shift) => shift.id === value)
  const options = [
    { value: '', label: t('expenses.shift.none') },
    ...shifts.map((shift) => ({
      value: String(shift.id),
      label: (
        <span className="expense-shift-picker__option">
          <span>#{shift.id} · {shift.cashierName || t('common.empty.dash')} · {shift.deviceName}</span>
          <span className="expense-shift-picker__time">
            {formatShiftBusinessDate(shift.businessDate, locale)} · {getShiftStatusLabel(shift.status, t)}
          </span>
          <span className="expense-shift-picker__time">
            {t('shifts.columns.openedAt')}: {formatDateTime(shift.openedAt, locale)}
          </span>
          <span className="expense-shift-picker__time">
            {t('shifts.columns.closedAt')}: {shift.closedAt ? formatDateTime(shift.closedAt, locale) : t('expenses.shift.stillOpen')}
          </span>
          {shift.closed && <span>{t('expenses.shift.closedWarning')}</span>}
        </span>
      ),
    })),
  ]

  return (
    <>
      {branchId !== null && (
        <FormField label={t('expenses.shift.window')}>
          <FormSelect aria-label={t('expenses.shift.window')} value={days} disabled={disabled}
            onChange={(event) => { onChange(null); setDays(Number(event.target.value)) }}>
            {[7, 14, 30, 90, 365].map((window) => (
              <option key={window} value={window}>{t('expenses.shift.days', { days: window })}</option>
            ))}
          </FormSelect>
        </FormField>
      )}
      <FormField label={t('expenses.shift.label')} error={error}
        className={`expense-shift-picker${open ? ' field-box--open' : ''}`}
        helper={branchId === null ? t('expenses.shift.branchRequired') : t('expenses.shift.optional')}>
        <Dropdown value={value === null ? '' : String(value)} options={options}
          ariaLabel={t('expenses.shift.label')} disabled={disabled || branchId === null || loading || loadError !== null}
          onOpen={() => setOpen(true)} onClose={() => setOpen(false)}
          onChange={(next) => onChange(next ? Number(next) : null)} />
        {loading && <span role="status">{t('expenses.shift.loading')}</span>}
        {loadError !== null && (
          <div className="expense-shift-picker__load-error" role="alert">
            <span>{translateApiError(loadError, t).message}</span>
            <Button type="button" variant="secondary" disabled={disabled} onClick={() => setRetry((current) => current + 1)}>
              {t('expenses.shift.retry')}
            </Button>
          </div>
        )}
        {branchId !== null && !loading && loadError === null && shifts.length === 0 && (
          <span role="status">{t('expenses.shift.empty')}</span>
        )}
        {selected?.closed && (
          <div className="expense-shift-picker__warning" role="note">
            <AlertTriangle size={18} aria-hidden />
            <span>{t('expenses.shift.closedWarning')}</span>
          </div>
        )}
      </FormField>
    </>
  )
}
