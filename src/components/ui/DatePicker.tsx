import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'
import { todayLocalDate } from '../../utils/format'

const AR_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const AR_WEEKDAYS = ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة']
const EN_WEEKDAYS = ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function formatToIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function parseIsoDate(isoString?: string | null): { year: number; month: number; day: number } | null {
  if (!isoString) return null
  const parts = isoString.split('-')
  if (parts.length !== 3) return null
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null
  return { year, month, day }
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  ariaLabel?: string
  minDate?: string
  maxDate?: string
  disabled?: boolean
  allowClear?: boolean
  size?: 'toolbar' | 'md' | 'full'
  className?: string
  id?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  label,
  ariaLabel,
  minDate,
  maxDate,
  disabled = false,
  allowClear = true,
  size = 'toolbar',
  className = '',
  id,
}: DatePickerProps) {
  const { t, locale } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const generatedId = useId()
  const elementId = id || generatedId

  const isRtl = locale === 'ar'
  const months = isRtl ? AR_MONTHS : EN_MONTHS
  const weekdays = isRtl ? AR_WEEKDAYS : EN_WEEKDAYS

  const parsedValue = useMemo(() => parseIsoDate(value), [value])
  const todayIso = useMemo(() => todayLocalDate(), [])
  const parsedToday = useMemo(() => parseIsoDate(todayIso)!, [todayIso])

  // View state for the calendar navigation
  const [viewYear, setViewYear] = useState<number>(() => parsedValue?.year ?? parsedToday.year)
  const [viewMonth, setViewMonth] = useState<number>(() => parsedValue?.month ?? parsedToday.month)

  // Sync calendar view month/year when value changes or calendar opens
  const openCalendar = useCallback(() => {
    if (disabled) return
    if (parsedValue) {
      setViewYear(parsedValue.year)
      setViewMonth(parsedValue.month)
    } else {
      setViewYear(parsedToday.year)
      setViewMonth(parsedToday.month)
    }
    setIsOpen(true)
  }, [disabled, parsedToday.month, parsedToday.year, parsedValue])

  const closeCalendar = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Close on outside click and Escape key
  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: globalThis.MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeCalendar()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeCalendar()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeCalendar, isOpen])

  const handlePrevMonth = (e: ReactMouseEvent) => {
    e.stopPropagation()
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((prev) => prev - 1)
    } else {
      setViewMonth((prev) => prev - 1)
    }
  }

  const handleNextMonth = (e: ReactMouseEvent) => {
    e.stopPropagation()
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((prev) => prev + 1)
    } else {
      setViewMonth((prev) => prev + 1)
    }
  }

  const handleSelectDate = (isoString: string) => {
    onChange(isoString)
    closeCalendar()
  }

  const handleClear = (e: ReactMouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  const handleSelectToday = () => {
    if (minDate && todayIso < minDate) return
    if (maxDate && todayIso > maxDate) return
    onChange(todayIso)
    closeCalendar()
  }

  // Calendar grid computation
  const calendarCells = useMemo(() => {
    const daysInCurrentMonth = getDaysInMonth(viewYear, viewMonth)
    // Day of week for 1st day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
    // For Saturday-first indexing: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
    const firstDayJs = new Date(viewYear, viewMonth, 1).getDay()
    const firstDayOffset = (firstDayJs + 1) % 7

    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)

    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear

    const cells: Array<{
      dayNumber: number
      isoString: string
      isCurrentMonth: boolean
      isToday: boolean
      isSelected: boolean
      isDisabled: boolean
    }> = []

    // Previous month leading days
    for (let i = firstDayOffset - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      const iso = formatToIsoDate(prevYear, prevMonth, day)
      const isDisabled = Boolean((minDate && iso < minDate) || (maxDate && iso > maxDate))
      cells.push({
        dayNumber: day,
        isoString: iso,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        isSelected: iso === value,
        isDisabled,
      })
    }

    // Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const iso = formatToIsoDate(viewYear, viewMonth, day)
      const isDisabled = Boolean((minDate && iso < minDate) || (maxDate && iso > maxDate))
      cells.push({
        dayNumber: day,
        isoString: iso,
        isCurrentMonth: true,
        isToday: iso === todayIso,
        isSelected: iso === value,
        isDisabled,
      })
    }

    // Next month trailing days to complete full weeks (multiples of 7)
    const remaining = (7 - (cells.length % 7)) % 7
    for (let day = 1; day <= remaining; day++) {
      const iso = formatToIsoDate(nextYear, nextMonth, day)
      const isDisabled = Boolean((minDate && iso < minDate) || (maxDate && iso > maxDate))
      cells.push({
        dayNumber: day,
        isoString: iso,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        isSelected: iso === value,
        isDisabled,
      })
    }

    return cells
  }, [maxDate, minDate, todayIso, value, viewMonth, viewYear])

  const displayPlaceholder = placeholder || label || t('common.selectDate')
  const formattedDisplay = value || displayPlaceholder

  return (
    <div
      ref={rootRef}
      className={`date-picker date-picker--${size}${disabled ? ' date-picker--disabled' : ''}${
        isOpen ? ' date-picker--open' : ''
      }${className ? ` ${className}` : ''}`}
    >
      <button
        id={elementId}
        type="button"
        className="date-picker__trigger"
        onClick={() => (isOpen ? closeCalendar() : openCalendar())}
        disabled={disabled}
        aria-label={ariaLabel || displayPlaceholder}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span className="date-picker__trigger-icon">
          <Calendar size={15} aria-hidden="true" />
        </span>

        <span className={`date-picker__trigger-text${!value ? ' date-picker__trigger-text--placeholder' : ''}`}>
          {formattedDisplay}
        </span>

        {allowClear && value && !disabled ? (
          <span
            role="button"
            tabIndex={0}
            className="date-picker__clear-btn"
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                onChange('')
              }
            }}
            title={t('common.clear')}
            aria-label={t('common.clear')}
          >
            <X size={14} aria-hidden="true" />
          </span>
        ) : (
          <ChevronDown
            size={15}
            className={`date-picker__chevron${isOpen ? ' date-picker__chevron--open' : ''}`}
            aria-hidden="true"
          />
        )}
      </button>

      {isOpen ? (
        <div
          className="date-picker__panel"
          role="dialog"
          aria-label={ariaLabel || displayPlaceholder}
        >
          {/* Header */}
          <div className="date-picker__header">
            <button
              type="button"
              className="date-picker__nav-btn"
              onClick={isRtl ? handleNextMonth : handlePrevMonth}
              title={t('common.prev')}
              aria-label={t('common.prev')}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>

            <div className="date-picker__title">
              <span className="date-picker__month-name">{months[viewMonth]}</span>
              <span className="date-picker__year-num">{viewYear}</span>
            </div>

            <button
              type="button"
              className="date-picker__nav-btn"
              onClick={isRtl ? handlePrevMonth : handleNextMonth}
              title={t('common.next')}
              aria-label={t('common.next')}
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="date-picker__weekdays" role="row">
            {weekdays.map((wd, index) => (
              <span key={index} className="date-picker__weekday" role="columnheader">
                {wd}
              </span>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="date-picker__grid" role="grid">
            {calendarCells.map((cell) => {
              const classNames = [
                'date-picker__day',
                !cell.isCurrentMonth ? 'date-picker__day--outside' : '',
                cell.isToday ? 'date-picker__day--today' : '',
                cell.isSelected ? 'date-picker__day--selected' : '',
                cell.isDisabled ? 'date-picker__day--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <button
                  key={cell.isoString}
                  type="button"
                  className={classNames}
                  disabled={cell.isDisabled}
                  onClick={() => handleSelectDate(cell.isoString)}
                  aria-label={cell.isoString}
                  aria-selected={cell.isSelected}
                >
                  <span className="date-picker__day-text">{cell.dayNumber}</span>
                </button>
              )
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className="date-picker__footer">
            <button
              type="button"
              className="date-picker__footer-btn date-picker__footer-btn--today"
              onClick={handleSelectToday}
              disabled={Boolean((minDate && todayIso < minDate) || (maxDate && todayIso > maxDate))}
            >
              {t('common.today')}
            </button>

            {value ? (
              <button
                type="button"
                className="date-picker__footer-btn date-picker__footer-btn--clear"
                onClick={() => {
                  onChange('')
                  closeCalendar()
                }}
              >
                {t('common.clear')}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
