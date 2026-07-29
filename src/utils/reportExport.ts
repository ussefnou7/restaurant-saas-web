import autoTable from 'jspdf-autotable'
import { jsPDF } from 'jspdf'
import type { ColumnMeta, ReportCellValue, ReportRow } from '../types/reports'

function serializeValue(value: ReportCellValue): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

function csvEscape(value: string): string {
  if (!/[",\n\r]/.test(value)) return value
  return `"${value.replaceAll('"', '""')}"`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportCsv<T extends ReportRow>(
  columns: ColumnMeta<T>[],
  rows: T[],
  filename: string,
): void {
  const header = columns.map((column) => csvEscape(column.labelKey)).join(',')
  const body = rows.map((row) =>
    columns.map((column) =>
      csvEscape(serializeValue((row as Record<string, ReportCellValue>)[String(column.key)])),
    ).join(','),
  )
  const csv = [header, ...body].join('\n')
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${filename}.csv`)
}

export function exportPdf<T extends ReportRow>(
  columns: ColumnMeta<T>[],
  rows: T[],
  filename: string,
  title: string,
): void {
  const document = new jsPDF({ orientation: 'landscape' })
  document.text(title, 14, 14)
  autoTable(document, {
    startY: 20,
    head: [columns.map((column) => column.labelKey)],
    body: rows.map((row) =>
      columns.map((column) =>
        serializeValue((row as Record<string, ReportCellValue>)[String(column.key)]),
      ),
    ),
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [17, 24, 39],
    },
  })
  document.save(`${filename}.pdf`)
}
