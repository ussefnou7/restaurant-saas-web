import {
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../ui/Table'
import { useTranslation } from '../../i18n/useTranslation'
import type { ColumnMeta, ReportCellValue, ReportRow } from '../../types/reports'

type ReportTableProps<T extends ReportRow> = {
  columns: ColumnMeta<T>[]
  rows: T[]
  paginated?: boolean
  page?: number
  onPageChange?: (page: number) => void
}

function splitDecimal(value: string): { sign: string; integer: string; fraction: string } | null {
  const trimmed = value.trim()
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(trimmed)
  if (!match) return null
  return {
    sign: match[1],
    integer: match[2],
    fraction: match[3] ?? '',
  }
}

function groupInteger(integer: string, locale: string): string {
  const groupSeparator = locale === 'ar' ? ',' : ','
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator)
}

function trimFraction(fraction: string, minimumDigits: number): string {
  const trimmed = fraction.replace(/0+$/, '')
  if (trimmed.length >= minimumDigits) return trimmed
  return trimmed.padEnd(minimumDigits, '0')
}

function formatDecimalString(
  value: ReportCellValue,
  locale: string,
  minimumFractionDigits = 0,
): string {
  if (value === null || value === undefined || value === '') return '-'
  const textValue = String(value)
  const decimal = splitDecimal(textValue)
  if (!decimal) return textValue
  const fraction = trimFraction(decimal.fraction, minimumFractionDigits)
  const formattedInteger = groupInteger(decimal.integer, locale)
  return `${decimal.sign}${formattedInteger}${fraction ? `.${fraction}` : ''}`
}

function formatCurrencyValue(value: ReportCellValue, locale: string): string {
  const formatted = formatDecimalString(value, locale, 2)
  if (formatted === '-') return formatted
  return locale === 'ar' ? `${formatted} ج.م` : `EGP ${formatted}`
}

function formatCell(
  row: ReportRow,
  column: ColumnMeta<ReportRow>,
  locale: string,
): string {
  const value = (row as Record<string, ReportCellValue>)[String(column.key)]
  switch (column.type) {
    case 'currency':
      return formatCurrencyValue(value, locale)
    case 'number':
      return formatDecimalString(value, locale)
    case 'text':
    default:
      return value === null || value === undefined || value === '' ? '-' : String(value)
  }
}

export function ReportTable<T extends ReportRow>({
  columns,
  rows,
  paginated = false,
  page,
  onPageChange,
}: ReportTableProps<T>) {
  const { t, locale } = useTranslation()
  void paginated
  void page
  void onPageChange

  return (
    <DataTable className="report-table">
      <TableHead>
        <TableRow>
          {columns.map((column) => (
            <Th key={String(column.key)}>
              {t(column.labelKey)}
            </Th>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, rowIndex) => (
          <TableRow key={String((row as { id?: ReportCellValue }).id ?? rowIndex)}>
            {columns.map((column) => (
              <Td
                key={String(column.key)}
                cellAlign={column.type === 'number' || column.type === 'currency' ? 'end' : 'start'}
                dir={column.type === 'number' || column.type === 'currency' ? 'ltr' : undefined}
              >
                {formatCell(row, column as ColumnMeta<ReportRow>, locale)}
              </Td>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  )
}
