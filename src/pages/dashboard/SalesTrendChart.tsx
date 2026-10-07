import { useTranslation } from '../../i18n/useTranslation'
import { formatMoney } from '../../utils/format'
import type { SalesTrend, TrendBucket } from '../../types/dashboard'
import { parseMoney } from './dashboardDisplay'

interface SalesTrendChartProps {
  trend: SalesTrend
}

/** How many axis labels the chart prints, however many bars it is drawing. */
const MAX_LABELS = 7

/**
 * The sales series as a bar chart, built from divs rather than a charting library.
 *
 * Deliberate: the project has no chart dependency, and one bar series does not justify adding
 * 40kB and a second theming system to a page an owner opens from a phone every morning. If the
 * dashboard later needs axes, tooltips and multiple series, that is the point to reconsider.
 *
 * Bars are sized as a percentage of the largest point, so the shape over time is what reads —
 * which is the finding in a time series. Each bar carries its own accessible label, because a
 * purely visual chart tells a screen reader nothing.
 *
 * Two additions stop that shape from being read wrongly. The peak is printed, because a series
 * scaled to its own maximum has no scale otherwise and a dead morning draws the same picture as
 * a rush. And the final bar is dimmed, because every range this page offers ends today: the last
 * bucket is always still filling, and at full strength a half-finished hour reads as a collapse.
 */
export function SalesTrendChart({ trend }: SalesTrendChartProps) {
  const { t, locale } = useTranslation()

  const values = trend.points.map((point) => parseMoney(point.netSales) ?? 0)
  const peak = Math.max(...values, 0)
  const lastIndex = trend.points.length - 1
  // Labels thin out rather than the bars: 31 days still draws 31 bars, it just prints 7 dates.
  const labelStride = Math.max(1, Math.ceil(trend.points.length / MAX_LABELS))

  const label = (raw: string) =>
    trend.bucket === 'HOUR'
      ? t('dashboard.trend.axis.hour', { hour: raw })
      : axisLabel(raw, trend.bucket, locale)

  return (
    <figure className="trend-chart">
      <figcaption className="trend-chart__caption">
        <span className="trend-chart__grain">{t(`dashboard.trend.bucket.${trend.bucket}`)}</span>
        {peak > 0 ? (
          <span className="trend-chart__peak">
            {t('dashboard.trend.peak', { value: formatMoney(peak) })}
          </span>
        ) : null}
      </figcaption>

      <ul className="trend-chart__bars">
        {trend.points.map((point, index) => {
          const value = values[index]
          // Guard the division: every point being zero is a real state, and it must render as
          // a flat row of empty bars rather than NaN-height ones.
          const height = peak > 0 ? Math.max(2, Math.round((value / peak) * 100)) : 2
          const isPartial = index === lastIndex
          const caption = t(
            isPartial ? 'dashboard.trend.point.partial' : 'dashboard.trend.point',
            {
              label: label(point.label),
              sales: formatMoney(value),
              orders: point.orderCount,
            },
          )

          return (
            <li className="trend-chart__item" key={point.label}>
              <span
                className={`trend-chart__bar${isPartial ? ' trend-chart__bar--partial' : ''}`}
                style={{ height: `${height}%` }}
                title={caption}
                aria-label={caption}
              />
            </li>
          )
        })}
      </ul>

      {/* The axis is its own row rather than a label inside each bar's column, so the baseline
          rule can sit between the two. Hidden from assistive tech: every bar already carries its
          date in its own label, and reading the ticks as well would announce each one twice. */}
      <ul className="trend-chart__axis" aria-hidden="true">
        {trend.points.map((point, index) => (
          <li className="trend-chart__tick" key={point.label}>
            {index % labelStride === 0 || index === lastIndex ? label(point.label) : ''}
          </li>
        ))}
      </ul>
    </figure>
  )
}

/**
 * Shortens a bucket's ISO date to what fits under a bar.
 *
 * The ISO parts are read by hand rather than through `new Date(iso)`, which parses a bare date as
 * UTC midnight and therefore prints the previous day in any zone behind UTC. A bucket label is a
 * calendar date, not an instant, so it is built in local time from its own components.
 */
function axisLabel(raw: string, bucket: TrendBucket, locale: string): string {
  const [year, month, day] = raw.split('-').map(Number)
  if (!year || !month || !day) return raw

  const date = new Date(year, month - 1, day)
  const options: Intl.DateTimeFormatOptions =
    bucket === 'MONTH' ? { month: 'short' } : { day: 'numeric' }
  return new Intl.DateTimeFormat(locale, options).format(date)
}
