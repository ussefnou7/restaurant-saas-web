export function formatCurrency(value: number, currency = 'EGP'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(value?: string | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleString()
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
