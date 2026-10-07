import { useTranslation } from '../../i18n/useTranslation'
import { formatNumber } from '../../utils/format'
import type { MixRow } from '../../types/dashboard'
import { moneyText, parseMoney, percentText } from './dashboardDisplay'

interface ShareBarsProps {
  rows: MixRow[]
  /** Translation-key prefix for the dimension values — the backend ships raw enum names. */
  labelPrefix: string
}

/**
 * A sales mix as share bars.
 *
 * Replaces the four-column table these two blocks used to be. The table carried the same figures
 * and buried the one that was being read: a reader comparing dine-in to delivery is comparing two
 * percentages, and a percentage in the fourth column of a table is compared by arithmetic rather
 * than by eye. As bars the comparison is the thing you see, and the money and the order count
 * still print underneath, so nothing the table said has been dropped.
 *
 * Sorted by share, descending. That is ordering, not ranking — there is no score, no colour per
 * position and no badge, and the underlying figure is the one plain number the backend sends. The
 * no-rank rule that governs the branch breakdown is about composite scores that can be gamed by
 * doing less work; a channel cannot do less work.
 *
 * Rows with no share keep their figures and get no bar. A bar scaled to the leading row instead
 * would look exactly like a share and mean something else entirely.
 */
export function ShareBars({ rows, labelPrefix }: ShareBarsProps) {
  const { t } = useTranslation()

  const ordered = [...rows].sort((left, right) => {
    const a = parseMoney(left.sharePercent)
    const b = parseMoney(right.sharePercent)
    if (a === null) return b === null ? 0 : 1
    if (b === null) return -1
    return b - a
  })

  return (
    <ul className="share-bars">
      {ordered.map((row) => {
        const share = parseMoney(row.sharePercent)

        return (
          <li className="share-bars__row" key={row.dimension}>
            <span className="share-bars__head">
              <span className="share-bars__label">{t(`${labelPrefix}.${row.dimension}`)}</span>
              <span className="share-bars__share">{percentText(row.sharePercent)}</span>
            </span>

            {share !== null ? (
              <span className="share-bars__track" aria-hidden="true">
                <span className="share-bars__fill" style={{ inlineSize: `${share}%` }} />
              </span>
            ) : null}

            <span className="share-bars__meta">
              {t('dashboard.mix.meta', {
                total: moneyText(row.totalAmount),
                orders: formatNumber(row.orderCount),
              })}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
