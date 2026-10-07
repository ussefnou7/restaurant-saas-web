import { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { formatMoney } from '../../utils/format'
import type { SalesTrend } from '../../types/dashboard'
import {
  compactMoney,
  niceAxisMax,
  parseMoney,
  peakPoint,
  trendLabel,
} from './dashboardDisplay'

interface SalesTrendChartProps {
  trend: SalesTrend
}

/** How many axis labels the chart prints, however many points it is drawing. */
const MAX_LABELS = 7

/**
 * The sales series as an area chart with a real value axis.
 *
 * Still no charting library: one series does not justify 40kB and a second theming system on a
 * page an owner opens from a phone every morning. What it does have that the previous bar version
 * did not is a *scale*. Bars sized as a percentage of their own maximum make a dead morning and a
 * rush draw the identical picture, which is why that version had to print the peak as text to say
 * which one you were looking at. Gridlines carry that job now, and the peak line is free to say
 * something else.
 *
 * ## Why the drawing is split between SVG and HTML
 *
 * The SVG holds only the gridlines, the filled area, the line and the unfinished-bucket band —
 * nothing with an intrinsic aspect ratio and no text. It is a 100×100 viewBox stretched with
 * `preserveAspectRatio="none"`, so the path maths is plain percentages and the chart fills any
 * width without a media query. Strokes carry `vector-effect="non-scaling-stroke"` because that
 * stretch is wildly non-uniform and would otherwise render a 2px line as a 9px smear.
 *
 * Every label, tick and marker is HTML on top. Text inside a stretched viewBox would be squashed
 * and would scale with the container instead of with the reader's font size, and a circle would
 * come out an ellipse. As HTML they also mirror under `dir="rtl"` from logical properties alone —
 * the one thing that cannot is the SVG, which is flipped by a single rule in the stylesheet.
 */
export function SalesTrendChart({ trend }: SalesTrendChartProps) {
  const { t, locale } = useTranslation()
  const [hovered, setHovered] = useState<number | null>(null)

  const points = trend.points
  const values = points.map((point) => parseMoney(point.netSales) ?? 0)
  const top = niceAxisMax(Math.max(...values, 0))
  const lastIndex = points.length - 1
  // Labels thin out rather than the points: 31 days still draws 31 days, it just prints 7 dates.
  const labelStride = Math.max(1, Math.ceil(points.length / MAX_LABELS))

  const label = (index: number) => trendLabel(points[index].label, trend.bucket, locale, t)

  /*
   * Which ticks get printed.
   *
   * The last one always does — the series ends today and the reader needs to know which day that
   * is. The strided ones skip anything inside one stride of it, because otherwise the second-last
   * printed tick and the forced last tick land in adjacent columns and overlap: at 375px with
   * fourteen hourly points, "21:00" ran straight into "22:00".
   */
  const isLabelled = (index: number) =>
    index === lastIndex ||
    (index % labelStride === 0 && lastIndex - index >= labelStride)

  // A single point has no span to spread across, so it sits in the middle rather than at the
  // inline start, where it would read as the beginning of a line that was never drawn.
  const x = (index: number) => (points.length === 1 ? 50 : (index / lastIndex) * 100)
  // Guard the division: every point being zero is a real state, and it must draw a flat line
  // along the baseline rather than a NaN path that silently renders nothing at all.
  const y = (value: number) => (top > 0 ? 100 - (value / top) * 100 : 100)

  const line = points
    .map((_, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(2)} ${y(values[index]).toFixed(2)}`)
    .join(' ')
  const area = `${line} L${x(lastIndex).toFixed(2)} 100 L${x(0).toFixed(2)} 100 Z`

  const peak = peakPoint(trend)
  const peakIndex = peak ? points.indexOf(peak) : -1

  // The band covers the final bucket's half-column out to the far edge. Every range this page
  // offers ends today, so that bucket is always still filling; unmarked, a short last stretch
  // reads as a collapse in sales rather than as an hour half over.
  const bandStart = points.length > 1 ? (x(lastIndex) + x(lastIndex - 1)) / 2 : 0

  const pointSentence = (index: number) =>
    t(index === lastIndex && points.length > 1 ? 'dashboard.trend.point.partial' : 'dashboard.trend.point', {
      label: label(index),
      sales: formatMoney(values[index]),
      orders: points[index].orderCount,
    })

  return (
    <figure className="trend-chart">
      <figcaption className="trend-chart__caption">
        <span className="trend-chart__grain">{t(`dashboard.trend.bucket.${trend.bucket}`)}</span>
        <span className="trend-chart__readout">
          {hovered !== null
            ? pointSentence(hovered)
            : peak
              ? t('dashboard.trend.peak', {
                  value: `${label(peakIndex)} · ${formatMoney(values[peakIndex])}`,
                })
              : ''}
        </span>
      </figcaption>

      <div className="trend-chart__plot">
        {/* Three ticks, not five: the chart is read for its shape, and the axis only has to say
            how tall the box is. Printed even when the series is flat and empty, because "all of
            these hours earned nothing" is a finding and a blank box is not. */}
        <ul className="trend-chart__scale" aria-hidden="true">
          <li>{compactMoney(top, locale)}</li>
          <li>{compactMoney(top / 2, locale)}</li>
          <li>{compactMoney(0, locale)}</li>
        </ul>

        <div className="trend-chart__canvas" onMouseLeave={() => setHovered(null)}>
          <svg
            className="trend-chart__svg"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* The band goes down first so the gridlines read across it rather than stopping at
                its edge, which would look like the axis itself ended there. */}
            {points.length > 1 ? (
              <rect
                className="trend-chart__band"
                x={bandStart}
                y="0"
                width={100 - bandStart}
                height="100"
              />
            ) : null}

            {[0, 50, 100].map((depth) => (
              <line
                key={depth}
                className="trend-chart__grid"
                x1="0"
                y1={depth}
                x2="100"
                y2={depth}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            <path className="trend-chart__area" d={area} />
            <path className="trend-chart__line" d={line} vectorEffect="non-scaling-stroke" />
          </svg>

          {/* Markers are HTML so they stay round under the viewBox stretch, and are placed with
              logical offsets so they land on the same column as their tick when mirrored. */}
          {peakIndex >= 0 ? (
            <span
              className="trend-chart__marker trend-chart__marker--peak"
              style={{
                insetInlineStart: `${x(peakIndex)}%`,
                insetBlockStart: `${y(values[peakIndex])}%`,
              }}
              aria-hidden="true"
            />
          ) : null}
          <span
            className="trend-chart__marker"
            style={{
              insetInlineStart: `${x(lastIndex)}%`,
              insetBlockStart: `${y(values[lastIndex])}%`,
            }}
            aria-hidden="true"
          />

          {/* Feedback for the pointer is a marker on the point, not a highlighted column. A tinted
              column would have to paint over the area fill to be visible, hiding the line in the
              one place the reader is looking. */}
          {hovered !== null ? (
            <span
              className="trend-chart__marker trend-chart__marker--hovered"
              style={{
                insetInlineStart: `${x(hovered)}%`,
                insetBlockStart: `${y(values[hovered])}%`,
              }}
              aria-hidden="true"
            />
          ) : null}

          {/* Hover targets, one per point, as a flex row that mirrors for free. Not focusable:
              a 31-day series would put 31 stops in the tab order to repeat what the data list
              below already says in one. */}
          <ul className="trend-chart__hits" aria-hidden="true">
            {points.map((point, index) => (
              <li
                key={point.label}
                className="trend-chart__hit"
                onMouseEnter={() => setHovered(index)}
              />
            ))}
          </ul>
        </div>
      </div>

      {/* The axis is its own row rather than a label inside each column, so the baseline rule can
          sit between the two. Hidden from assistive tech: the data list below carries every date
          already, and reading the ticks as well would announce each one twice. */}
      <ul className="trend-chart__axis" aria-hidden="true">
        {points.map((point, index) => (
          <li className="trend-chart__tick" key={point.label}>
            {isLabelled(index) ? label(index) : ''}
          </li>
        ))}
      </ul>

      {points.length > 1 ? (
        <p className="trend-chart__partial">{t(`dashboard.trend.partial.${trend.bucket}`)}</p>
      ) : null}

      {/*
        The series in words, for a reader who gets nothing from the picture. This is the only
        accessible path through the chart — the SVG is marked hidden rather than labelled, because
        an aria-label on a path is a sentence a screen reader reads once and cannot explore.
      */}
      <ul className="trend-chart__data">
        {points.map((point, index) => (
          <li key={point.label}>{pointSentence(index)}</li>
        ))}
      </ul>
    </figure>
  )
}
