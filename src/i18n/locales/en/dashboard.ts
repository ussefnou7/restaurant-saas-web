import type { TranslationDictionary } from '../../types'

/**
 * Owner dashboard.
 *
 * Alert sentences are written to be acted on, not just read: each names what is wrong, where, and
 * what it costs, because an alert the owner can only look at is noise. Where a figure is derived
 * from an assumption the sentence says so — `dashboard.alerts.estimate` is appended rather than
 * baked into each string, so the marker cannot be forgotten on one alert out of seventeen.
 */
export const dashboardEn: TranslationDictionary = {
  'dashboard.title': 'Dashboard',
  'dashboard.subtitle': 'What needs attention, and how the period is going',

  'dashboard.modes.today': 'Today',
  'dashboard.modes.month': 'This month',
  'dashboard.modes.year': 'This year',

  'dashboard.actions.refresh': 'Refresh',
  'dashboard.loading': 'Loading dashboard...',
  'dashboard.alerts.loading': 'Checking alerts...',
  'dashboard.alerts.loadError': 'Alerts could not be checked. Refresh to try again.',
  'dashboard.summary.loadError': 'This period could not be loaded. Refresh to try again.',
  'dashboard.generatedAt': 'As of {{time}}',

  // --- block statuses -------------------------------------------------------------------
  // "Withheld" and "no data" are deliberately different sentences. An empty block and a
  // forbidden one must never read the same, because the reassuring reading is the one taken.
  'dashboard.block.hidden.title': 'Not available to you',
  'dashboard.block.hidden.body':
    'This section comes from a module you do not have permission to view. It is hidden, not empty.',
  'dashboard.block.insufficient.title': 'Not enough data',
  'dashboard.block.insufficient.body': 'There is nothing in this period to calculate this from.',
  'dashboard.block.empty': 'No records in this period.',
  'dashboard.unknown': 'Unknown',

  // --- the three sales figures ------------------------------------------------------------
  'dashboard.kpis.netSales': 'Net sales',
  'dashboard.kpis.netSales.hint': 'Excluding tax',
  'dashboard.kpis.orders': 'Orders',
  'dashboard.kpis.averageCheck': 'Average check',
  'dashboard.kpis.averageCheck.hint': 'Net sales per order',
  'dashboard.kpis.wasteValue': 'Waste',
  'dashboard.kpis.wasteValue.hint': 'In this period',
  'dashboard.kpis.stockValue': 'Stock value',
  // Said explicitly because it is the one figure that does not follow the selected range.
  'dashboard.kpis.stockValue.hint': 'Right now, not for the period',

  // --- drawers ----------------------------------------------------------------------------
  // Both lids carry their own one-line summary. A drawer labelled only "data health" gives an
  // owner no reason to open it and no reason to leave it shut.
  'dashboard.breakdown.title': 'Sales breakdown',
  'dashboard.breakdown.summary': 'Order channels and payment methods',
  'dashboard.health.title': 'Data health',
  'dashboard.health.summary':
    '{{percent}}% of sales have their cost posted — plus the posting pipeline and cancellations',
  'dashboard.health.summary.unknown':
    'Cost posting, the posting pipeline and cancellations for this period',

  // --- cost coverage --------------------------------------------------------------------
  'dashboard.costCoverage.title': 'Cost coverage',
  'dashboard.costCoverage.subtitle':
    'Below 100% means some sales have no cost recorded, so any margin for this period is overstated.',
  'dashboard.costCoverage.totalSales': 'Sales in period',
  'dashboard.costCoverage.posted': 'Cost posted',
  'dashboard.costCoverage.unposted': 'Waiting on a stuck document',
  'dashboard.costCoverage.unposted.hint': 'Someone needs to clear it',
  'dashboard.costCoverage.noConsumption': 'No recipe, so no cost was ever scheduled',
  'dashboard.costCoverage.noConsumption.hint': 'Nothing to clear — a recipe is missing',

  // --- trend ----------------------------------------------------------------------------
  'dashboard.trend.bucket.HOUR': 'By hour',
  'dashboard.trend.bucket.DAY': 'By day',
  'dashboard.trend.bucket.MONTH': 'By month',
  'dashboard.trend.axis.hour': '{{hour}}:00',
  // The bars are scaled to their own maximum, so without this the chart has no scale at all.
  'dashboard.trend.peak': 'Peak {{value}}',
  'dashboard.trend.point': '{{label}}: {{sales}} across {{orders}} orders',
  // Every range this page offers ends today, so the last bar is always still filling. Without
  // saying so, a short final bar reads as a collapse rather than as an hour half over.
  'dashboard.trend.point.partial':
    '{{label}}: {{sales}} across {{orders}} orders — still in progress',

  // --- branches -------------------------------------------------------------------------
  'dashboard.branches.title': 'By branch',
  'dashboard.branches.meta': '{{share}}% of sales · {{orders}} orders',
  'dashboard.branches.meta.noShare': '{{orders}} orders',
  'dashboard.branches.meta.average': 'Average check {{value}}',

  // --- mixes ----------------------------------------------------------------------------
  'dashboard.orderTypes.title': 'Order channels',
  'dashboard.paymentMethods.title': 'Payment methods',
  'dashboard.cancellations.title': 'Cancellations',
  'dashboard.cancellations.subtitle':
    'By stage, not by hour — the cancellation time is not recorded reliably.',
  'dashboard.mix.column.dimension': 'Type',
  'dashboard.mix.column.orders': 'Orders',
  'dashboard.mix.column.total': 'Total',
  'dashboard.mix.column.share': 'Share',

  'dashboard.orderType.DINE_IN': 'Dine in',
  'dashboard.orderType.TAKEAWAY': 'Takeaway',
  'dashboard.orderType.DELIVERY': 'Delivery',

  'dashboard.paymentMethod.CASH': 'Cash',
  'dashboard.paymentMethod.CARD': 'Card',
  'dashboard.paymentMethod.WALLET': 'Wallet',
  'dashboard.paymentMethod.AGGREGATOR': 'Aggregator',
  'dashboard.paymentMethod.UNSPECIFIED': 'Unspecified',

  'dashboard.cancellationStage.BEFORE_KITCHEN': 'Before the kitchen',
  'dashboard.cancellationStage.IN_KITCHEN_NOT_COOKED': 'In the kitchen, not cooked',
  'dashboard.cancellationStage.IN_KITCHEN_COOKED': 'Cooked',
  'dashboard.cancellationStage.AFTER_DONE': 'After it was ready',

  // --- consumption pipeline -------------------------------------------------------------
  'dashboard.pipeline.title': 'Cost posting pipeline',
  'dashboard.pipeline.subtitle':
    'How many documents are at each stage, and how old the oldest one is.',
  'dashboard.pipeline.column.status': 'Stage',
  'dashboard.pipeline.column.count': 'Documents',
  'dashboard.pipeline.column.oldest': 'Oldest',
  'dashboard.pipeline.status.PENDING': 'Collecting',
  'dashboard.pipeline.status.IN_PROGRESS': 'Posting',
  'dashboard.pipeline.status.PARTIAL': 'Stopped part-way',
  'dashboard.pipeline.status.CONFLICT': 'Failed',
  'dashboard.pipeline.status.POSTED': 'Posted',

  // --- attention strip ------------------------------------------------------------------
  'dashboard.alerts.title': 'Needs attention',
  'dashboard.alerts.clear.title': 'Nothing needs attention',
  'dashboard.alerts.clear.body': 'No open issues across your branches right now.',
  // The qualifier that keeps a clear strip honest when some codes were not evaluated.
  'dashboard.alerts.withheld':
    '{{count}} kinds of alert were not checked because you do not have permission to see them.',
  'dashboard.alerts.severity.CRITICAL': 'Critical',
  'dashboard.alerts.severity.WARNING': 'Warning',
  'dashboard.alerts.severity.INFO': 'Note',
  'dashboard.alerts.estimate': 'estimate',
  'dashboard.alerts.expand': 'Show branches',
  'dashboard.alerts.collapse': 'Hide branches',
  'dashboard.alerts.open': 'Open',
  'dashboard.alerts.noAge': 'No start date recorded',
  'dashboard.alerts.age.minutes': 'for {{count}} min',
  'dashboard.alerts.age.hours': 'for {{count}}h',
  'dashboard.alerts.age.days': 'for {{count}} days',
  'dashboard.alerts.scope.warehouse': '{{warehouse}} — {{branch}}',
  'dashboard.alerts.scope.branch': '{{branch}}',
  'dashboard.alerts.scope.tenant': 'All branches',
  'dashboard.alerts.row.count': '{{count}}',

  // One title + one sentence per code. The sentence carries the number and the consequence,
  // because a count without a consequence is what turns a dashboard into wallpaper.
  'dashboard.alerts.UNPOSTED_CONSUMPTION.title': 'Sales cost not posted',
  'dashboard.alerts.UNPOSTED_CONSUMPTION.body':
    '{{count}} documents stopped before posting. Until they clear, profit is overstated by roughly this amount and every margin here is wrong by it.',
  'dashboard.alerts.UNPOSTED_PURCHASE_INVOICE.title': 'Deliveries not posted',
  'dashboard.alerts.UNPOSTED_PURCHASE_INVOICE.body':
    '{{count}} invoices received more than {{thresholdDays}} days ago are still not posted, so that stock is on the shelf and missing from the books.',
  'dashboard.alerts.FROZEN_PHYSICAL_COUNT.title': 'Stock count left frozen',
  'dashboard.alerts.FROZEN_PHYSICAL_COUNT.body':
    '{{count}} counts have been frozen more than {{thresholdDays}} days. Their materials cannot be counted again until they finish.',
  'dashboard.alerts.SHIFT_OPEN_TOO_LONG.title': 'Shift still open',
  'dashboard.alerts.SHIFT_OPEN_TOO_LONG.body':
    '{{count}} shifts have been open more than {{thresholdHours}} hours. Nobody has counted the drawer, so there is no cash figure for them.',
  'dashboard.alerts.CONSUMPTION_SCHEDULER_STALLED.title': 'Cost posting has stalled',
  'dashboard.alerts.CONSUMPTION_SCHEDULER_STALLED.body':
    '{{count}} documents are more than {{overdueHours}} hours past their posting trigger. This is a system fault, not something a branch can fix.',
  'dashboard.alerts.STOCK_OUT.title': 'Out of stock',
  'dashboard.alerts.STOCK_OUT.body':
    '{{count}} items have run out. Anything made with them is off the menu until they are bought.',
  'dashboard.alerts.BELOW_MINIMUM.title': 'Below minimum',
  'dashboard.alerts.BELOW_MINIMUM.body': '{{count}} items are under their reorder minimum.',
  'dashboard.alerts.RUNNING_OUT_SOON.title': 'Running out soon',
  'dashboard.alerts.RUNNING_OUT_SOON.body':
    '{{count}} items will run out within about two days. Soonest: {{soonestMaterialName}}, about {{soonestDaysOfCover}} days left at the last {{rateWindowDays}} days’ rate.',
  'dashboard.alerts.EXPIRED_STOCK_ON_SHELF.title': 'Expired stock on the shelf',
  'dashboard.alerts.EXPIRED_STOCK_ON_SHELF.body':
    '{{count}} batches are past their expiry date and still hold stock. This is a food safety issue regardless of the value.',
  'dashboard.alerts.EXPIRING_SOON.title': 'Expiring within {{withinDays}} days',
  'dashboard.alerts.EXPIRING_SOON.body':
    'Stock worth this much expires within {{withinDays}} days. Use it or promote it.',
  'dashboard.alerts.MISSING_EXPIRY_DATE.title': 'Missing expiry dates',
  'dashboard.alerts.MISSING_EXPIRY_DATE.body':
    '{{count}} batches of expiry-tracked items have no expiry date, so the expiry alerts cannot see them.',
  'dashboard.alerts.CASH_VARIANCE.title': 'Cash did not balance',
  'dashboard.alerts.CASH_VARIANCE.body':
    '{{count}} shifts in the last {{lookbackDays}} days closed outside tolerance. This is the total missed, counted either way.',
  'dashboard.alerts.CASHIER_SHORTAGE_PATTERN.title': 'A cashier is repeatedly short',
  'dashboard.alerts.CASHIER_SHORTAGE_PATTERN.body':
    '{{cashierName}} came up short on {{shiftCount}} shifts in {{windowDays}} days. One shortage is noise; a pattern is worth a conversation.',
  'dashboard.alerts.CANCELLED_AFTER_COOKING.title': 'Cancelled after cooking',
  'dashboard.alerts.CANCELLED_AFTER_COOKING.body':
    '{{count}} orders were cancelled after the food was cooked. The food was made and nobody paid.',
  // Carried separately so the caveat cannot be dropped by editing the sentence above.
  'dashboard.alerts.CANCELLED_AFTER_COOKING.caveat':
    'The real loss is higher: cancelled food is not yet deducted from stock.',
  'dashboard.alerts.LARGE_COUNT_VARIANCE.title': 'Large stock count variance',
  'dashboard.alerts.LARGE_COUNT_VARIANCE.body':
    '{{count}} counts reconciled in the last {{lookbackDays}} days moved this much stock without an explanation.',
  'dashboard.alerts.SUPPLIER_PRICE_JUMP.title': 'Purchase prices went up',
  'dashboard.alerts.SUPPLIER_PRICE_JUMP.body':
    '{{materialCount}} items rose at least {{thresholdPercent}}% over the last {{windowDays}} days. Worst: {{worstMaterialName}}, up {{worstChangePercent}}%.',
  'dashboard.alerts.BRANCH_SILENT.title': 'A branch has gone quiet',
  'dashboard.alerts.BRANCH_SILENT.body':
    'A shift is open but no order has come through for {{silentMinutes}} minutes. Usually a dead till or a broken connection.',
}
