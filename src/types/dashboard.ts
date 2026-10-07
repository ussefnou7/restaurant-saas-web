/**
 * The owner dashboard's wire contract.
 *
 * Mirrors `GET /api/dashboard/summary` and `GET /api/dashboard/alerts`. Three properties of the
 * contract are easy to flatten away in a UI and must not be:
 *
 * 1. `null` is never zero. A null value means the condition carries no money; a null age means the
 *    source never recorded when the condition began. Rendering either as `0` turns "unknown" into
 *    a measurement, which is the failure this screen is built to avoid.
 * 2. A block's `status` decides whether it has an answer at all. `HIDDEN_NO_PERMISSION` must read
 *    as withheld, not as empty — an empty dashboard and a forbidden one look identical otherwise,
 *    and the reassuring reading is the one an owner takes.
 * 3. Money arrives as a scale-6 **string**, not a number, so it survives the trip without binary
 *    floating-point drift. Parse at the edge of rendering, never store it as a number.
 */

/** Whether a block has an answer, and if not, why not. */
export type BlockStatus = 'OK' | 'HIDDEN_NO_PERMISSION' | 'INSUFFICIENT_DATA'

/** The grain of the trend. Derived server-side from the range length; never requested. */
export type TrendBucket = 'HOUR' | 'DAY' | 'MONTH'

/** Ordering severity. Declaration order is display order. */
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO'

/** The screen an alert is cleared on, named semantically — the frontend owns the route. */
export type AlertLinkTarget =
  | 'ORDER_CONSUMPTION_LIST'
  | 'PURCHASE_INVOICE_LIST'
  | 'PHYSICAL_COUNT_LIST'
  | 'SHIFT_LIST'
  | 'ORDER_LIST'
  | 'STOCK_BALANCE_LIST'
  | 'LOW_STOCK_REPORT'
  | 'PURCHASE_PRICE_DRIFT_REPORT'

/** Every condition the backend can report. One translation key per code, in both locales. */
export type AlertCode =
  | 'UNPOSTED_CONSUMPTION'
  | 'UNPOSTED_PURCHASE_INVOICE'
  | 'FROZEN_PHYSICAL_COUNT'
  | 'SHIFT_OPEN_TOO_LONG'
  | 'CONSUMPTION_SCHEDULER_STALLED'
  | 'STOCK_OUT'
  | 'BELOW_MINIMUM'
  | 'RUNNING_OUT_SOON'
  | 'EXPIRED_STOCK_ON_SHELF'
  | 'EXPIRING_SOON'
  | 'MISSING_EXPIRY_DATE'
  | 'CASH_VARIANCE'
  | 'CASHIER_SHORTAGE_PATTERN'
  | 'CANCELLED_AFTER_COOKING'
  | 'LARGE_COUNT_VARIANCE'
  | 'SUPPLIER_PRICE_JUMP'
  | 'BRANCH_SILENT'

/** Values for an alert's i18n sentence. The backend ships no user text. */
export type AlertParams = Record<string, string | number | boolean>

export interface DashboardBlock<T> {
  status: BlockStatus
  /** Present only when `status === 'OK'`. */
  data: T | null
}

export interface DashboardAlertRow {
  /** Null for a scope with no branch — a central warehouse, or a tenant-wide condition. */
  branchId: number | null
  branchName: string | null
  branchNameAr: string | null
  /** Null unless the condition is per-warehouse. */
  warehouseId: number | null
  warehouseName: string | null
  warehouseNameAr: string | null
  count: number
  /** Scale-6 EGP, or null where the condition carries no money. Never "0" to mean absent. */
  value: string | null
  /** Null where the source records no moment at which the condition began. */
  oldestAt: string | null
  params: AlertParams
  link: AlertLinkTarget
  linkParams: Record<string, string | number>
}

export interface DashboardAlertGroup {
  code: AlertCode
  severity: AlertSeverity
  count: number
  value: string | null
  /** When true the value is derived from an assumption and must be labelled an estimate. */
  valueIsEstimate: boolean
  oldestAt: string | null
  link: AlertLinkTarget
  rows: DashboardAlertRow[]
}

export interface DashboardAlertsResponse {
  groups: DashboardAlertGroup[]
  /**
   * Codes not evaluated because the caller lacks the source module's permission.
   *
   * An empty `groups` means "nothing is wrong" ONLY when this is empty too. Rendering a clear
   * strip while codes are withheld is the single worst thing this screen can do.
   */
  withheld: AlertCode[]
  /** Tenant-local wall clock the conditions were evaluated against. Every age measures from it. */
  evaluatedAt: string
}

export interface DashboardKpis {
  orderCount: number | null
  /** Pre-tax. Tax is collected for the state and is not revenue. */
  netSales: string | null
  taxAmount: string | null
  totalAmount: string | null
  averageOrderValue: string | null
  /** Omitted entirely when the caller cannot see inventory — null reads as withheld, not zero. */
  wasteValue: string | null
  /** A snapshot, not a range figure: it does not change when the range does. Label it. */
  stockValue: string | null
  /** Percentage of the range's sales whose cost is posted. Null when there were no sales. */
  costCoverage: string | null
}

export interface TrendPoint {
  /** ISO date for DAY and MONTH; the hour as a plain integer for HOUR. */
  label: string
  orderCount: number
  netSales: string
  totalAmount: string
}

export interface SalesTrend {
  bucket: TrendBucket
  /** Empty buckets are omitted, not zero-filled. Fill gaps for a continuous axis if needed. */
  points: TrendPoint[]
}

export interface BranchKpiRow {
  branchId: number
  branchName: string | null
  branchNameAr: string | null
  orderCount: number
  netSales: string
  taxAmount: string
  totalAmount: string
  averageOrderValue: string | null
  netSalesSharePercent: string | null
}

export interface MixRow {
  /** Raw enum name — the frontend owns the translation key for each value. */
  dimension: string
  orderCount: number
  netSales: string
  totalAmount: string
  /** Null on cancellations, where a share of itself would mean nothing. */
  sharePercent: string | null
}

export interface CostCoverage {
  coveragePercent: string | null
  totalSales: string
  postedSales: string
  /** A document exists and is stuck — someone clears it. */
  unpostedSales: string
  /** No document was ever created, because the product has no recipe. Nothing to clear. */
  noConsumptionSales: string
}

export interface ConsumptionPipelineRow {
  status: string
  docCount: number
  oldestAt: string | null
}

export interface DashboardSummaryResponse {
  from: string
  to: string
  branchId: number | null
  bucket: TrendBucket
  generatedAt: string
  kpis: DashboardBlock<DashboardKpis>
  trend: DashboardBlock<SalesTrend>
  branches: DashboardBlock<BranchKpiRow[]>
  orderTypes: DashboardBlock<MixRow[]>
  paymentMethods: DashboardBlock<MixRow[]>
  cancellations: DashboardBlock<MixRow[]>
  costCoverage: DashboardBlock<CostCoverage>
  consumptionPipeline: DashboardBlock<ConsumptionPipelineRow[]>
}

/**
 * The three ranges the page offers.
 *
 * One data shape for all three — only the dates differ, and the server derives the trend grain
 * from them. There is deliberately no "custom range" here: the modes exist because an owner asks
 * two different questions (is anything wrong now / how am I doing), and a free date picker
 * answers neither better while making the page slower to open.
 */
export type DashboardMode = 'today' | 'month' | 'year'
