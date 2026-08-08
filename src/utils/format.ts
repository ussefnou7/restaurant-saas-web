export function formatCurrency(value: number, currency = 'EGP'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function resolveIntlLocale(locale?: string): string | undefined {
  if (locale === 'ar') return 'ar-EG-u-nu-latn'
  if (locale === 'en') return 'en-US-u-nu-latn'
  return undefined
}

export function formatDate(value?: string | null, locale?: string): string {
  if (!value) return '-'
  return new Date(value).toLocaleDateString(resolveIntlLocale(locale))
}

export function formatDateTime(value?: string | null, locale?: string): string {
  if (!value) return '-'
  return new Date(value).toLocaleString(resolveIntlLocale(locale))
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

