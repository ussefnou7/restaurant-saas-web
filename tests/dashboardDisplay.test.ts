import test from 'node:test'
import assert from 'node:assert/strict'
import { en } from '../src/i18n/locales/en/index.ts'
import { ar } from '../src/i18n/locales/ar/index.ts'
import {
  ageKeyAndValue,
  alertHref,
  parseMoney,
  rangeForMode,
  scopeLabelKey,
  translatableParams,
} from '../src/pages/dashboard/dashboardDisplay.ts'
import type { AlertCode, DashboardAlertRow } from '../src/types/dashboard.ts'

function row(overrides: Partial<DashboardAlertRow> = {}): DashboardAlertRow {
  return {
    branchId: 1,
    branchName: 'Nasr City',
    branchNameAr: 'مدينة نصر',
    warehouseId: null,
    warehouseName: null,
    warehouseNameAr: null,
    count: 3,
    value: null,
    oldestAt: null,
    params: {},
    link: 'SHIFT_LIST',
    linkParams: {},
    ...overrides,
  }
}

test('an absent money value stays absent — it is never coerced to zero', () => {
  // The rule this guards: a null value means the condition carries no money, and rendering it
  // as 0 turns "unknown" into a measurement. parseMoney is the one place coercing would be
  // both easiest and worst.
  assert.equal(parseMoney(null), null)
  assert.equal(parseMoney(undefined), null)
  assert.equal(parseMoney('0.000000'), 0)
  assert.equal(parseMoney('12400.500000'), 12400.5)

  // A malformed figure is unknown, not zero — the same reasoning.
  assert.equal(parseMoney('not-a-number'), null)
})

test('an age is measured from the server clock, not the browser clock', () => {
  // evaluatedAt is the tenant-local wall clock the conditions were evaluated against. Using
  // Date.now() would be a different clock in a different zone, and the off-by-one would only
  // show for an owner who is travelling — reported as "ages are sometimes wrong", never repro'd.
  const evaluatedAt = '2026-03-31T18:00:00'

  assert.deepEqual(ageKeyAndValue('2026-03-31T17:30:00', evaluatedAt), {
    key: 'dashboard.alerts.age.minutes',
    count: 30,
  })
  assert.deepEqual(ageKeyAndValue('2026-03-31T09:00:00', evaluatedAt), {
    key: 'dashboard.alerts.age.hours',
    count: 9,
  })
  assert.deepEqual(ageKeyAndValue('2026-03-25T18:00:00', evaluatedAt), {
    key: 'dashboard.alerts.age.days',
    count: 6,
  })
})

test('no age recorded yields null, so the UI can say unknown instead of 0', () => {
  // Several conditions genuinely have no start date: a stock balance never records when its
  // quantity crossed the minimum. "0 min" would be a fabricated measurement.
  assert.equal(ageKeyAndValue(null, '2026-03-31T18:00:00'), null)
  assert.equal(ageKeyAndValue('nonsense', '2026-03-31T18:00:00'), null)
})

test('an alert links to the screen that clears it, with its filters pre-applied', () => {
  assert.equal(
    alertHref(row({ link: 'ORDER_CONSUMPTION_LIST', linkParams: { warehouseId: 11 } })),
    '/inventory/order-consumption?warehouseId=11',
  )
  assert.equal(alertHref(row({ link: 'SHIFT_LIST', linkParams: {} })), '/shifts')
  assert.equal(
    alertHref(row({ link: 'LOW_STOCK_REPORT', linkParams: { warehouseId: 12 } })),
    '/inventory/reports/low-stock?warehouseId=12',
  )
})

test('every alert link target maps to a route', () => {
  // The backend names a screen rather than a URL, so an unmapped target would render href
  // "undefined" and fail silently at click time rather than at build time.
  const targets = [
    'ORDER_CONSUMPTION_LIST',
    'PURCHASE_INVOICE_LIST',
    'PHYSICAL_COUNT_LIST',
    'SHIFT_LIST',
    'ORDER_LIST',
    'STOCK_BALANCE_LIST',
    'LOW_STOCK_REPORT',
    'PURCHASE_PRICE_DRIFT_REPORT',
  ] as const

  for (const link of targets) {
    const href = alertHref(row({ link, linkParams: {} }))
    assert.ok(href.startsWith('/'), `${link} did not map to a route (got "${href}")`)
    assert.ok(!href.includes('undefined'), `${link} mapped to "${href}"`)
  }
})

test('a scope with no branch gets its own wording, not a blank', () => {
  // A tenant-wide condition such as a supplier price rise belongs to no branch. That is not a
  // missing value, so it must not render as an empty cell.
  assert.equal(scopeLabelKey(row({ warehouseId: 11 })), 'dashboard.alerts.scope.warehouse')
  assert.equal(scopeLabelKey(row()), 'dashboard.alerts.scope.branch')
  assert.equal(
    scopeLabelKey(row({ branchId: null, branchName: null })),
    'dashboard.alerts.scope.tenant',
  )
})

test('boolean alert params survive into the translator', () => {
  const narrowed = translatableParams({ stockNotDeducted: true, count: 4, name: 'Chicken' })
  assert.equal(narrowed.stockNotDeducted, 'true')
  assert.equal(narrowed.count, 4)
  assert.equal(narrowed.name, 'Chicken')
})

test('each mode means a calendar period, never a rolling window', () => {
  // An owner comparing against his own books is comparing against calendar periods: the month
  // starts on the 1st, not 30 days ago.
  const today = new Date(2026, 2, 17) // 17 March 2026, local

  assert.deepEqual(rangeForMode('today', today), { from: '2026-03-17', to: '2026-03-17' })
  assert.deepEqual(rangeForMode('month', today), { from: '2026-03-01', to: '2026-03-17' })
  assert.deepEqual(rangeForMode('year', today), { from: '2026-01-01', to: '2026-03-17' })
})

test('every dashboard translation key exists in both locales', () => {
  const alertCodes: AlertCode[] = [
    'UNPOSTED_CONSUMPTION',
    'UNPOSTED_PURCHASE_INVOICE',
    'FROZEN_PHYSICAL_COUNT',
    'SHIFT_OPEN_TOO_LONG',
    'CONSUMPTION_SCHEDULER_STALLED',
    'STOCK_OUT',
    'BELOW_MINIMUM',
    'RUNNING_OUT_SOON',
    'EXPIRED_STOCK_ON_SHELF',
    'EXPIRING_SOON',
    'MISSING_EXPIRY_DATE',
    'CASH_VARIANCE',
    'CASHIER_SHORTAGE_PATTERN',
    'CANCELLED_AFTER_COOKING',
    'LARGE_COUNT_VARIANCE',
    'SUPPLIER_PRICE_JUMP',
    'BRANCH_SILENT',
  ]

  // useTranslation does not implement defaultValue, so a key missing from a locale renders the
  // raw key on screen. Every alert needs a title and a body in both languages or the strip
  // shows "dashboard.alerts.STOCK_OUT.body" to an Arabic-speaking owner.
  const required = [
    ...alertCodes.flatMap((code) => [
      `dashboard.alerts.${code}.title`,
      `dashboard.alerts.${code}.body`,
    ]),
    'dashboard.alerts.title',
    'dashboard.alerts.clear.title',
    'dashboard.alerts.clear.body',
    'dashboard.alerts.withheld',
    'dashboard.alerts.estimate',
    'dashboard.alerts.noAge',
    'dashboard.alerts.age.minutes',
    'dashboard.alerts.age.hours',
    'dashboard.alerts.age.days',
    'dashboard.alerts.severity.CRITICAL',
    'dashboard.alerts.severity.WARNING',
    'dashboard.alerts.severity.INFO',
    'dashboard.block.hidden.title',
    'dashboard.block.hidden.body',
    'dashboard.block.insufficient.title',
    'dashboard.block.insufficient.body',
    'dashboard.modes.today',
    'dashboard.modes.month',
    'dashboard.modes.year',
    'dashboard.kpis.netSales',
    'dashboard.kpis.averageCheck',
    'dashboard.kpis.stockValue.hint',
    'dashboard.kpis.wasteValue.hint',
    'dashboard.branches.meta',
    'dashboard.branches.meta.noShare',
    'dashboard.branches.meta.average',
    'dashboard.breakdown.title',
    'dashboard.breakdown.summary',
    'dashboard.health.title',
    'dashboard.health.summary',
    'dashboard.health.summary.unknown',
    'dashboard.trend.peak',
    'dashboard.trend.point.partial',
    'dashboard.trend.bucket.HOUR',
    'dashboard.trend.bucket.DAY',
    'dashboard.trend.bucket.MONTH',
    'dashboard.pipeline.status.PARTIAL',
    'dashboard.pipeline.status.CONFLICT',
    'dashboard.orderType.DELIVERY',
    'dashboard.paymentMethod.CASH',
    'dashboard.cancellationStage.IN_KITCHEN_COOKED',
  ]

  for (const key of required) {
    const enValue = (en as Record<string, string>)[key]
    const arValue = (ar as Record<string, string>)[key]
    assert.ok(
      typeof enValue === 'string' && enValue.trim().length > 0,
      `English translation missing for "${key}"`,
    )
    assert.ok(
      typeof arValue === 'string' && arValue.trim().length > 0,
      `Arabic translation missing for "${key}"`,
    )
  }
})
