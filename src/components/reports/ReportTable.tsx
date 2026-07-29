import { ListPagination } from '../ui/ListPagination'
import {
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../ui/Table'
import { useTranslation } from '../../i18n/useTranslation'
import type { ColumnMeta, ReportRow } from '../../types/reports'
import { formatDate } from '../../utils/format'

type ReportTableProps<T extends ReportRow> = {
  columns: ColumnMeta[]
  rows: T[]
  paginated: boolean
  page?: number
  size?: number
  total?: number
  onPageChange?: (page: number) => void
}

function formatNumberValue(value: string | number | null | undefined, locale: string): string {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return String(value)
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US-u-nu-latn', {
    maximumFractionDigits: 6,
  }).format(numeric)
}

function formatCurrencyValue(value: string | number | null | undefined, locale: string): string {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return String(value)
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US-u-nu-latn', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(numeric)
}

function formatCell(
  row: ReportRow,
  column: ColumnMeta,
  locale: string,
): string {
  const value = row[column.key]
  switch (column.type) {
    case 'currency':
      return formatCurrencyValue(value, locale)
    case 'number':
      return formatNumberValue(value, locale)
    case 'date':
      return formatDate(typeof value === 'string' ? value : undefined, locale)
    case 'text':
    default:
      return value === null || value === undefined || value === '' ? '-' : String(value)
  }
}

export function ReportTable<T extends ReportRow>({
  columns,
  rows,
  paginated,
  page = 0,
  size = 20,
  total = rows.length,
  onPageChange,
}: ReportTableProps<T>) {
  const { t, locale } = useTranslation()
  const totalPages = Math.max(1, Math.ceil(total / size))

  return (
    <>
      <DataTable className="report-table">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <Th key={column.key} column={column.type === 'date' ? 'date' : 'default'}>
                {t(column.label)}
              </Th>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={String(row.id ?? rowIndex)}>
              {columns.map((column) => (
                <Td
                  key={column.key}
                  cellAlign={column.type === 'number' || column.type === 'currency' ? 'end' : 'start'}
                  column={column.type === 'date' ? 'date' : 'default'}
                  dir={column.type === 'number' || column.type === 'currency' || column.type === 'date' ? 'ltr' : undefined}
                >
                  {formatCell(row, column, locale)}
                </Td>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
      {paginated && onPageChange ? (
        <ListPagination
          page={page}
          totalPages={totalPages}
          totalElements={total}
          pageSize={size}
          onPageChange={onPageChange}
          translationPrefix="reports.pagination"
        />
      ) : null}
    </>
  )
}
