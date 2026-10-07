import { useTranslation } from '../../i18n/useTranslation'
import { formatNumber } from '../../utils/format'
import type { BranchKpiRow } from '../../types/dashboard'
import { moneyText, parseMoney } from './dashboardDisplay'

interface BranchBarsProps {
  branches: BranchKpiRow[]
}

/**
 * The per-branch breakdown on one shared axis.
 *
 * The card grid this replaces gave each branch its own column and its own bar, which meant the
 * comparison it was built for had to be made by scanning sideways across four cards. Stacked rows
 * on a single scale put the branches in one eyeline, which is the only reason this block exists.
 *
 * Note what is still absent, because every one of these is a standing temptation: no rank number,
 * no colour per position, no score, and the order is the backend's. A branch that never counts its
 * stock reports no shrinkage, so any composite here would hand the top spot to whichever branch
 * does the least work — and once a number is on the page it gets managed towards. Sorting is left
 * alone for the same reason: with a share printed on every row the reader can see the order, and
 * the page has not asserted one.
 */
export function BranchBars({ branches }: BranchBarsProps) {
  const { t, locale } = useTranslation()

  return (
    <ul className="branch-bars">
      {branches.map((branch) => {
        const share = parseMoney(branch.netSalesSharePercent)
        const name =
          (locale === 'ar' ? branch.branchNameAr : branch.branchName) ??
          branch.branchName ??
          t('dashboard.unknown')

        return (
          <li className="branch-bars__row" key={branch.branchId}>
            <span className="branch-bars__head">
              <span className="branch-bars__name">{name}</span>
              <span className="branch-bars__sales">{moneyText(branch.netSales)}</span>
            </span>

            {/* No bar at all when the share is unknown. A bar scaled to the leading branch
                instead would look like a share and mean something else. */}
            {share !== null ? (
              <span className="branch-bars__track" aria-hidden="true">
                <span className="branch-bars__fill" style={{ inlineSize: `${share}%` }} />
              </span>
            ) : null}

            <span className="branch-bars__meta">
              {share !== null
                ? t('dashboard.branches.meta', {
                    share: share.toFixed(1),
                    orders: formatNumber(branch.orderCount),
                  })
                : t('dashboard.branches.meta.noShare', {
                    orders: formatNumber(branch.orderCount),
                  })}
              {' · '}
              {t('dashboard.branches.meta.average', {
                value: moneyText(branch.averageOrderValue),
              })}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
