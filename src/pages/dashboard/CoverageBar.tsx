import { useTranslation } from '../../i18n/useTranslation'
import type { CostCoverage } from '../../types/dashboard'
import { moneyText, parseMoney } from './dashboardDisplay'

interface CoverageBarProps {
  data: CostCoverage
}

/**
 * Cost posting coverage as one bar in three parts.
 *
 * This block used to be a four-item description list at the bottom of a shut drawer, which is the
 * wrong place for it: it is the figure that says whether every other number on the page can be
 * trusted. Below 100%, some sales have no cost against them, so any margin an owner works out
 * from this screen is overstated — and the drawer meant he could work one out without ever having
 * been told.
 *
 * The two gaps stay visually separate because they send him to different screens and because one
 * is somebody's job and the other is not. A stuck document is amber: a document exists, it is
 * waiting, and clearing it is work on a list. A missing recipe is grey: nothing is stuck, there is
 * nothing to clear, and the fix is in the menu rather than in the inventory queue. Colouring them
 * alike would put a to-do next to an item nobody can action.
 *
 * `totalSales` is the denominator rather than the sum of the three parts, so a backend that stops
 * accounting for every pound shows as a bar that does not fill rather than as three segments
 * silently renormalised to look complete.
 */
export function CoverageBar({ data }: CoverageBarProps) {
  const { t } = useTranslation()

  const total = parseMoney(data.totalSales)
  const coverage = parseMoney(data.coveragePercent)

  const segments = [
    { key: 'posted', value: parseMoney(data.postedSales), amount: data.postedSales },
    { key: 'unposted', value: parseMoney(data.unpostedSales), amount: data.unpostedSales },
    {
      key: 'noConsumption',
      value: parseMoney(data.noConsumptionSales),
      amount: data.noConsumptionSales,
    },
  ]

  // No sales is a real and unremarkable state — a branch closed for the day. It is not a coverage
  // failure, and a bar sitting at 0% would read as one.
  const hasBar = total !== null && total > 0

  return (
    <div className="coverage">
      <p className="coverage__headline">
        {coverage === null
          ? t('dashboard.costCoverage.headline.unknown')
          : t('dashboard.costCoverage.headline', { percent: coverage.toFixed(1) })}
      </p>

      {hasBar ? (
        <span className="coverage__track" aria-hidden="true">
          {segments.map((segment) => (
            <span
              key={segment.key}
              className={`coverage__segment coverage__segment--${segment.key}`}
              style={{ inlineSize: `${((segment.value ?? 0) / total) * 100}%` }}
            />
          ))}
        </span>
      ) : (
        <p className="coverage__none">{t('dashboard.costCoverage.noSales')}</p>
      )}

      <dl className="coverage__key">
        {segments.map((segment) => (
          <div className="coverage__key-item" key={segment.key}>
            <dt>
              <span
                className={`coverage__swatch coverage__swatch--${segment.key}`}
                aria-hidden="true"
              />
              {t(`dashboard.costCoverage.${segment.key}`)}
            </dt>
            <dd className="coverage__amount">{moneyText(segment.amount)}</dd>
            <dd className="coverage__hint">{t(`dashboard.costCoverage.${segment.key}.hint`)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
