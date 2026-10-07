import { useTranslation } from '../../i18n/useTranslation'
import { formatMoney, formatNumber } from '../../utils/format'
import type { DashboardBlock, SalesTrend, TrendBucket } from '../../types/dashboard'
import { HeroTile } from './HeroTile'
import { parseMoney, peakPoint, trendLabel } from './dashboardDisplay'

interface PeakTileProps {
  block: DashboardBlock<SalesTrend> | undefined
  /** Taken from the response's own `bucket`, so the label is right even when the trend is withheld. */
  bucket: TrendBucket
}

/**
 * The busiest hour, day or month of the selected range.
 *
 * The one genuinely new figure on this screen, and it is new only in the sense that nobody was
 * printing it — it is read straight off the trend points the response already carries, so it costs
 * no query and cannot disagree with the chart beside it.
 *
 * It is also not a comparison, which is what makes it admissible here. "Busiest hour: 20:00" is a
 * statement about this range alone; it does not say the hour was better or worse than any other
 * range, and no arrow turns green. For a restaurant it is the most actionable line on the page
 * after net sales, because staffing is the decision it feeds.
 *
 * The three non-OK states stay three different sentences, as everywhere else on this page. A
 * fourth is specific to this tile: a range with sales but no winner, which happens when every
 * bucket is zero. {@link peakPoint} returns null there rather than crowning the first hour of a
 * dead day, so the tile says there was no busiest bucket instead of inventing one.
 */
export function PeakTile({ block, bucket }: PeakTileProps) {
  const { t, locale } = useTranslation()

  const status = block?.status ?? 'INSUFFICIENT_DATA'
  const peak = status === 'OK' && block?.data ? peakPoint(block.data) : null

  const reason =
    status === 'HIDDEN_NO_PERMISSION'
      ? 'dashboard.block.hidden.title'
      : status === 'OK'
        ? 'dashboard.peak.none'
        : 'dashboard.block.insufficient.title'

  return (
    <HeroTile
      title={t(`dashboard.peak.${bucket}`)}
      value={peak ? trendLabel(peak.label, bucket, locale, t) : '—'}
      hint={
        peak
          ? t('dashboard.peak.meta', {
              value: formatMoney(parseMoney(peak.netSales) ?? 0),
              orders: formatNumber(peak.orderCount),
            })
          : t(reason)
      }
    />
  )
}
