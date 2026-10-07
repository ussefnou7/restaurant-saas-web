import { formatMoney } from '../../utils/format'
import type {
  AlertLinkTarget,
  AlertParams,
  DashboardAlertRow,
  DashboardMode,
  SalesTrend,
  TrendBucket,
  TrendPoint,
} from '../../types/dashboard'

/** `t` from `useTranslation`, taken as a parameter so label rules live here and not in a view. */
type Translate = (key: string, values?: Record<string, string | number>) => string

/**
 * Presentation and range helpers for the dashboard.
 *
 * Pure functions with no axios import, deliberately: {@link rangeForMode} belongs conceptually
 * next to the service that calls it, but living there would drag `import.meta.env` into every
 * consumer and make the rule it encodes — calendar periods, never rolling windows — untestable
 * outside a browser.
 */

/**
 * The date range each mode means.
 *
 * Computed from the browser's clock, which is a deliberate and documented approximation: what is
 * sent is a pair of calendar dates, and the server resolves where those days start and end in the
 * tenant's zone. An owner travelling could therefore pick "today" shortly before the tenant's day
 * rolls over — the figures stay correct for the dates requested, which the response echoes back.
 *
 * Month is the 1st to today and year is January 1st to today, never a rolling 30 or 365 days. An
 * owner checking against his own books is checking against calendar periods.
 */
export function rangeForMode(
  mode: DashboardMode,
  today = new Date(),
): { from: string; to: string } {
  const pad = (n: number) => String(n).padStart(2, '0')
  const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  const to = iso(today)
  switch (mode) {
    case 'today':
      return { from: to, to }
    case 'month':
      return { from: iso(new Date(today.getFullYear(), today.getMonth(), 1)), to }
    case 'year':
      return { from: iso(new Date(today.getFullYear(), 0, 1)), to }
  }
}

/**
 * Parses a scale-6 money string for display.
 *
 * Money crosses the wire as a string so it survives without binary floating-point drift, and it is
 * parsed here — at the edge of rendering — rather than stored as a number anywhere. `null` stays
 * `null`: an absent value is not a zero one, and this is the function where coercing it would be
 * easiest and worst.
 */
export function parseMoney(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * A money figure for display, or a dash where there is no figure.
 *
 * The dash is the whole point and it is centralised here because it is one character and therefore
 * the easiest thing on the page to replace with a `0` by accident. Absent and zero are different
 * facts on this screen: `0` says the condition was measured and found empty, `—` says nobody
 * measured. Four views render money and all four go through this.
 */
export function moneyText(value: string | null | undefined): string {
  const parsed = parseMoney(value)
  return parsed === null ? '—' : formatMoney(parsed)
}

/** The same rule for a percentage. `fallback` exists because a null share is not always a gap. */
export function percentText(value: string | null | undefined, fallback = '—'): string {
  const parsed = parseMoney(value)
  return parsed === null ? fallback : `${parsed.toFixed(1)}%`
}

/**
 * The label a trend bucket prints, in the reader's language.
 *
 * The ISO parts are read by hand rather than through `new Date(iso)`, which parses a bare date as
 * UTC midnight and therefore prints the previous day in any zone behind UTC. A bucket label is a
 * calendar date, not an instant, so it is built in local time from its own components.
 *
 * Lives here rather than in the chart because two views now print the same label — the chart's
 * axis and the busiest-bucket tile — and a bucket named one way under a bar and another way in a
 * tile is a bug that only shows up when both are on screen, which is always.
 */
export function trendLabel(
  raw: string,
  bucket: TrendBucket,
  locale: string,
  t: Translate,
): string {
  if (bucket === 'HOUR') return t('dashboard.trend.axis.hour', { hour: raw })

  const [year, month, day] = raw.split('-').map(Number)
  if (!year || !month || !day) return raw

  const date = new Date(year, month - 1, day)
  const options: Intl.DateTimeFormatOptions =
    bucket === 'MONTH' ? { month: 'short' } : { day: 'numeric' }
  return new Intl.DateTimeFormat(locale, options).format(date)
}

/**
 * The busiest bucket in a series, or null when there is no such thing.
 *
 * The final bucket is excluded from the contest. Every range this page offers ends today, so the
 * last bucket is always still filling — crowning a half-finished hour "busiest" would be wrong,
 * and crowning it *because* it is incomplete would be wrong in the opposite direction once it
 * fills. With a single point there is nothing to exclude and nothing to compare, so it stands.
 *
 * Null when every candidate is zero: the busiest hour of a day with no sales is not an hour, and
 * printing the first one would invent a finding out of a flat line.
 */
export function peakPoint(trend: SalesTrend): TrendPoint | null {
  const candidates = trend.points.length > 1 ? trend.points.slice(0, -1) : trend.points

  let best: TrendPoint | null = null
  let bestValue = 0
  for (const point of candidates) {
    const value = parseMoney(point.netSales) ?? 0
    if (value > bestValue) {
      bestValue = value
      best = point
    }
  }
  return best
}

/**
 * The y-axis ceiling for a series whose largest point is `peak`.
 *
 * Rounds up to a 1/2/2.5/5 × 10^n step so the printed gridline values are numbers an owner reads
 * rather than the series maximum to six figures. Zero in, zero out — a flat empty series has no
 * axis to draw and the caller must not divide by this.
 */
export function niceAxisMax(peak: number): number {
  if (!(peak > 0)) return 0

  const magnitude = 10 ** Math.floor(Math.log10(peak))
  const scaled = peak / magnitude
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10
  return step * magnitude
}

/**
 * Money shortened to fit an axis tick.
 *
 * `formatMoney` prints two decimals, which is right in a figure and four wasted characters under
 * a gridline. Compact notation is localised by `Intl`, so an Arabic axis reads ٨٠٠ ألف rather
 * than a transliterated "800k".
 */
export function compactMoney(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

/**
 * How long a condition has stood, measured from the server's clock rather than the browser's.
 *
 * `evaluatedAt` is the tenant-local wall clock the conditions were evaluated against. Using
 * `Date.now()` instead would be a different clock in a different zone, and the resulting
 * off-by-one would appear only for an owner who is travelling — which is to say, it would be
 * reported as "the ages are sometimes wrong" and never reproduced.
 *
 * Returns null when there is no age, which is a real and common state: a stock balance never
 * recorded when its quantity crossed the minimum. The caller renders that as "unknown", not "0m".
 */
export function ageKeyAndValue(
  oldestAt: string | null,
  evaluatedAt: string,
): { key: string; count: number } | null {
  if (!oldestAt) return null

  const from = new Date(oldestAt).getTime()
  const to = new Date(evaluatedAt).getTime()
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null

  const minutes = Math.max(0, Math.floor((to - from) / 60_000))
  if (minutes < 60) return { key: 'dashboard.alerts.age.minutes', count: minutes }

  const hours = Math.floor(minutes / 60)
  if (hours < 48) return { key: 'dashboard.alerts.age.hours', count: hours }

  return { key: 'dashboard.alerts.age.days', count: Math.floor(hours / 24) }
}

/**
 * The route each semantic link target maps to.
 *
 * The backend names a screen, never a URL, so this table is the only place a dashboard link knows
 * about the router. A route rename is a change here rather than a backend deployment.
 */
const ALERT_ROUTES: Record<AlertLinkTarget, string> = {
  ORDER_CONSUMPTION_LIST: '/inventory/order-consumption',
  PURCHASE_INVOICE_LIST: '/inventory/purchase-invoices',
  PHYSICAL_COUNT_LIST: '/inventory/physical-counts',
  SHIFT_LIST: '/shifts',
  ORDER_LIST: '/orders/list',
  STOCK_BALANCE_LIST: '/inventory/stock-balances',
  LOW_STOCK_REPORT: '/inventory/reports/low-stock',
  PURCHASE_PRICE_DRIFT_REPORT: '/inventory/reports/purchase-price-drift',
}

/** The href for an alert row, with the target screen's filters pre-applied (D99). */
export function alertHref(row: DashboardAlertRow): string {
  const path = ALERT_ROUTES[row.link]
  const params = new URLSearchParams()
  Object.entries(row.linkParams).forEach(([key, value]) => params.set(key, String(value)))
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

/**
 * Names the place a condition holds, in the reader's language.
 *
 * Three shapes, because the scopes genuinely differ: a warehouse inside a branch, a branch on its
 * own, and no scope at all. The third is not a missing value — a tenant-wide condition such as a
 * supplier price rise belongs to no branch — so it gets its own wording rather than a blank.
 */
export function scopeLabelKey(row: DashboardAlertRow): string {
  if (row.warehouseId !== null) return 'dashboard.alerts.scope.warehouse'
  if (row.branchId !== null) return 'dashboard.alerts.scope.branch'
  return 'dashboard.alerts.scope.tenant'
}

export function scopeLabelValues(
  row: DashboardAlertRow,
  locale: string,
): Record<string, string> {
  const arabic = locale === 'ar'
  const branch = (arabic ? row.branchNameAr : row.branchName) ?? row.branchName ?? ''
  const warehouse = (arabic ? row.warehouseNameAr : row.warehouseName) ?? row.warehouseName ?? ''
  return { branch, warehouse }
}

/**
 * Narrows an alert's params to what the translator accepts.
 *
 * The backend legitimately sends booleans — `stockNotDeducted: true` flags that the
 * cancelled-after-cooking figure understates the loss — but `useTranslation` interpolates only
 * strings and numbers. Rather than weaken the wire type to match the renderer, booleans are
 * stringified here. The flags happen to drive dedicated keys rather than interpolation today, so
 * this is a guard against the next param rather than a workaround for a current one.
 */
export function translatableParams(params: AlertParams): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      typeof value === 'boolean' ? String(value) : value,
    ]),
  )
}
