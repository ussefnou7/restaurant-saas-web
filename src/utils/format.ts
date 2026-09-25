export function formatCurrency(value: number, currency = 'EGP'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(value?: string | null, locale?: string): string {
  void locale
  if (!value) return '-'
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }
  const date = new Date(value)
  if (isNaN(date.getTime())) return String(value)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function formatDateTime(value?: string | null, locale?: string): string {
  void locale
  if (!value) return '-'
  const date = new Date(value)
  if (isNaN(date.getTime())) return String(value)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const sec = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`
}

export function formatMoney(value?: number | null): string {
  if (value === null || value === undefined) return '-'
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function todayLocalDate(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
