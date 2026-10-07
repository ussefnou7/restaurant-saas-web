import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'
import { LoadingState } from '../../components/ui/LoadingState'
import { formatDateTime, formatMoney, formatNumber } from '../../utils/format'
import { getDashboardAlerts, getDashboardSummary } from '../../services/dashboardService'
import type {
  BranchKpiRow,
  DashboardAlertsResponse,
  DashboardBlock,
  DashboardMode,
  DashboardSummaryResponse,
  MixRow,
  SalesTrend,
} from '../../types/dashboard'
import { AttentionStrip } from './AttentionStrip'
import { DashboardDrawer } from './DashboardDrawer'
import { DashboardSection } from './DashboardSection'
import { HeroTile } from './HeroTile'
import { SalesTrendChart } from './SalesTrendChart'
import { parseMoney } from './dashboardDisplay'

const MODES: DashboardMode[] = ['today', 'month', 'year']

/**
 * The owner dashboard.
 *
 * The page is ordered by what an owner does about it, not by what the API returns. Alerts first,
 * because they are the only part that asks for an action. Then the three sales figures the whole
 * screen is about, with the trend inside the one they describe. Everything that reports on the
 * *bookkeeping* rather than the business — cost coverage, the posting pipeline, cancellations —
 * sits in a shut drawer at the bottom with its headline figure on the lid. That work is real and
 * someone has to do it; it is just not what the owner opened this screen to find out, and giving
 * it the top of the page made the top of the page worth skipping.
 */
export function DashboardPage() {
  const { t, locale } = useTranslation()

  const [mode, setMode] = useState<DashboardMode>('today')
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null)
  const [alerts, setAlerts] = useState<DashboardAlertsResponse | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(true)

  const [summaryError, setSummaryError] = useState(false)
  const [alertsError, setAlertsError] = useState(false)
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true)
  const [refreshVersion, setRefreshVersion] = useState(0)

  useEffect(() => {
    let active = true
    setSummary(null)
    setSummaryError(false)
    setIsLoadingSummary(true)
    void getDashboardSummary(mode)
      .then((result) => { if (active) setSummary(result) })
      .catch(() => { if (active) setSummaryError(true) })
      .finally(() => { if (active) setIsLoadingSummary(false) })
    return () => { active = false }
  }, [mode, refreshVersion])

  // Alerts describe now; changing the sales range must not reload them.
  useEffect(() => {
    let active = true
    setAlerts(null)
    setAlertsError(false)
    setIsLoadingAlerts(true)
    void getDashboardAlerts()
      .then((result) => { if (active) setAlerts(result) })
      .catch(() => { if (active) setAlertsError(true) })
      .finally(() => { if (active) setIsLoadingAlerts(false) })
    return () => { active = false }
  }, [refreshVersion])

  const changeMode = (next: DashboardMode) => {
    if (next === mode) return
    setSummary(null)
    setSummaryError(false)
    setIsLoadingSummary(true)
    setMode(next)
  }

  const refresh = () => {
    setSummary(null)
    setAlerts(null)
    setSummaryError(false)
    setAlertsError(false)
    setIsLoadingSummary(true)
    setIsLoadingAlerts(true)
    setRefreshVersion((version) => version + 1)
  }

  const kpis = summary?.kpis.status === 'OK' ? summary.kpis.data : null
  // Optional all the way down: the drawer's lid is read before any block is known to exist, so
  // a response missing the block entirely must leave the lid unlabelled rather than throw.
  const coveragePercent = parseMoney(
    summary?.costCoverage?.status === 'OK' ? summary.costCoverage.data?.coveragePercent : null,
  )

  return (
    <div className="page dashboard-page">
      <header className="page-header dashboard-page__header">
        <div>
          <h1>{t('dashboard.title')}</h1>
          <p className="page-description">{t('dashboard.subtitle')}</p>
        </div>

        <div className="dashboard-page__controls">
          {/* Tabs rather than a date picker: the modes exist because they answer different
              questions, and a free range answers neither better while slowing the page down. */}
          <div className="dashboard-modes" role="tablist" aria-label={t('dashboard.title')}>
            {MODES.map((candidate) => (
              <button
                key={candidate}
                type="button"
                role="tab"
                aria-selected={mode === candidate}
                className={`dashboard-modes__tab${
                  mode === candidate ? ' dashboard-modes__tab--active' : ''
                }`}
                onClick={() => changeMode(candidate)}
              >
                {t(`dashboard.modes.${candidate}`)}
              </button>
            ))}
          </div>

          <button type="button" className="dashboard-page__refresh" onClick={refresh}>
            <RefreshCw size={16} aria-hidden="true" />
            {t('dashboard.actions.refresh')}
          </button>
        </div>
      </header>

      {isLoadingAlerts ? <LoadingState message={t('dashboard.alerts.loading')} /> : null}
      {alertsError ? <p role="alert">{t('dashboard.alerts.loadError')}</p> : null}
      <AttentionStrip alerts={alerts} />

      {summaryError ? (
        <p role="alert">{t('dashboard.summary.loadError')}</p>
      ) : isLoadingSummary ? (
        <LoadingState message={t('dashboard.loading')} />
      ) : (
        <>
          {/* Three figures, not six. The trend lives inside net sales because it is a picture of
              net sales — as its own section it was a chart of nothing in particular. */}
          <div className="dashboard-hero">
            <HeroTile
              size="lead"
              title={t('dashboard.kpis.netSales')}
              value={money(kpis?.netSales)}
              hint={t('dashboard.kpis.netSales.hint')}
            >
              <TrendSlot block={summary?.trend} />
            </HeroTile>

            <div className="dashboard-hero__support">
              <HeroTile
                title={t('dashboard.kpis.orders')}
                value={kpis?.orderCount !== null && kpis?.orderCount !== undefined
                  ? formatNumber(kpis.orderCount)
                  : t('dashboard.unknown')}
              />
              <HeroTile
                title={t('dashboard.kpis.averageCheck')}
                value={money(kpis?.averageOrderValue)}
                hint={t('dashboard.kpis.averageCheck.hint')}
              />
            </div>
          </div>

          {/* Inventory money, kept but demoted: both are real figures and neither is a sales
              figure, so they read at a smaller size with their period spelled out. */}
          <div className="dashboard-secondary">
            <SecondaryFigure
              label={t('dashboard.kpis.wasteValue')}
              value={money(kpis?.wasteValue)}
              hint={t('dashboard.kpis.wasteValue.hint')}
            />
            <SecondaryFigure
              label={t('dashboard.kpis.stockValue')}
              value={money(kpis?.stockValue)}
              hint={t('dashboard.kpis.stockValue.hint')}
            />
          </div>

          {summary?.generatedAt ? (
            <p className="dashboard-page__timestamp">
              {t('dashboard.generatedAt', { time: formatDateTime(summary.generatedAt, locale) })}
            </p>
          ) : null}

          <DashboardSection titleKey="dashboard.branches.title" block={summary?.branches}>
            {(branches) => <BranchCards branches={branches} />}
          </DashboardSection>

          <DashboardDrawer
            titleKey="dashboard.breakdown.title"
            summaryKey="dashboard.breakdown.summary"
          >
            <div className="dashboard-page__pair">
              <DashboardSection
                variant="flush"
                titleKey="dashboard.orderTypes.title"
                block={summary?.orderTypes}
              >
                {(rows) => <MixTable rows={rows} labelPrefix="dashboard.orderType" />}
              </DashboardSection>

              <DashboardSection
                variant="flush"
                titleKey="dashboard.paymentMethods.title"
                block={summary?.paymentMethods}
              >
                {(rows) => <MixTable rows={rows} labelPrefix="dashboard.paymentMethod" />}
              </DashboardSection>
            </div>
          </DashboardDrawer>

          <DashboardDrawer
            titleKey="dashboard.health.title"
            // The coverage figure is lifted onto the lid: a shut drawer labelled only "data
            // health" gives no reason to open it and no reason to leave it shut.
            summaryKey={
              coveragePercent === null
                ? 'dashboard.health.summary.unknown'
                : 'dashboard.health.summary'
            }
            summaryValues={
              coveragePercent === null ? undefined : { percent: coveragePercent.toFixed(1) }
            }
          >
            <DashboardSection
              variant="flush"
              titleKey="dashboard.costCoverage.title"
              subtitleKey="dashboard.costCoverage.subtitle"
              block={summary?.costCoverage}
              isEmpty={() => false}
            >
              {(data) => (
                <dl className="cost-coverage__breakdown">
                  <div>
                    <dt>{t('dashboard.costCoverage.totalSales')}</dt>
                    <dd>{money(data.totalSales)}</dd>
                  </div>
                  <div>
                    <dt>{t('dashboard.costCoverage.posted')}</dt>
                    <dd>{money(data.postedSales)}</dd>
                  </div>
                  {/* The two gaps are shown apart because they send the owner to different
                      screens: one is a stuck document, the other a missing recipe. */}
                  <div>
                    <dt>{t('dashboard.costCoverage.unposted')}</dt>
                    <dd>{money(data.unpostedSales)}</dd>
                    <dd className="cost-coverage__hint">
                      {t('dashboard.costCoverage.unposted.hint')}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('dashboard.costCoverage.noConsumption')}</dt>
                    <dd>{money(data.noConsumptionSales)}</dd>
                    <dd className="cost-coverage__hint">
                      {t('dashboard.costCoverage.noConsumption.hint')}
                    </dd>
                  </div>
                </dl>
              )}
            </DashboardSection>

            <DashboardSection
              variant="flush"
              titleKey="dashboard.pipeline.title"
              subtitleKey="dashboard.pipeline.subtitle"
              block={summary?.consumptionPipeline}
            >
              {(rows) => (
                <div className="table-wrap">
                  <table className="data-table dashboard-table">
                    <thead>
                      <tr>
                        <th>{t('dashboard.pipeline.column.status')}</th>
                        <th>{t('dashboard.pipeline.column.count')}</th>
                        <th>{t('dashboard.pipeline.column.oldest')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.status}>
                          <td>{t(`dashboard.pipeline.status.${row.status}`)}</td>
                          <td>{formatNumber(row.docCount)}</td>
                          <td>{row.oldestAt ? formatDateTime(row.oldestAt, locale) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DashboardSection>

            <DashboardSection
              variant="flush"
              titleKey="dashboard.cancellations.title"
              subtitleKey="dashboard.cancellations.subtitle"
              block={summary?.cancellations}
            >
              {(rows) => <MixTable rows={rows} labelPrefix="dashboard.cancellationStage" />}
            </DashboardSection>
          </DashboardDrawer>
        </>
      )}
    </div>
  )
}

/**
 * The trend chart, or the reason there isn't one.
 *
 * Inlining the chart into the net sales tile takes it out of `DashboardSection`, which is the one
 * component on this page that keeps "withheld", "nothing to calculate from" and "no sales" as
 * three different sentences. The distinction is reproduced here rather than dropped: a blank
 * space under the figure would read as a quiet period whichever of the three it actually was.
 */
function TrendSlot({ block }: { block: DashboardBlock<SalesTrend> | undefined }) {
  const { t } = useTranslation()
  const status = block?.status ?? 'INSUFFICIENT_DATA'

  if (status === 'OK' && block?.data && block.data.points.length > 0) {
    return <SalesTrendChart trend={block.data} />
  }

  const key =
    status === 'HIDDEN_NO_PERMISSION'
      ? 'dashboard.block.hidden.title'
      : status === 'OK'
        ? 'dashboard.block.empty'
        : 'dashboard.block.insufficient.title'

  return <p className="hero-tile__notice">{t(key)}</p>
}

interface SecondaryFigureProps {
  label: string
  value: string
  hint: string
}

function SecondaryFigure({ label, value, hint }: SecondaryFigureProps) {
  return (
    <div className="dashboard-secondary__item">
      <span className="dashboard-secondary__label">{label}</span>
      <span className="dashboard-secondary__value">{value}</span>
      <span className="dashboard-secondary__hint">{hint}</span>
    </div>
  )
}

/**
 * The per-branch breakdown as cards with a share bar.
 *
 * The same five figures the table carried, arranged so the comparison is the thing you see. Note
 * what is still absent: no rank, no colour and no score. A branch that never counts its stock
 * reports no shrinkage, so any composite score here would reward the branch doing least work.
 */
function BranchCards({ branches }: { branches: BranchKpiRow[] }) {
  const { t, locale } = useTranslation()

  return (
    <div className="branch-cards">
      {branches.map((branch) => {
        const share = parseMoney(branch.netSalesSharePercent)
        const name =
          (locale === 'ar' ? branch.branchNameAr : branch.branchName) ??
          branch.branchName ??
          t('dashboard.unknown')

        return (
          <article className="branch-card" key={branch.branchId}>
            <p className="branch-card__name">{name}</p>
            <p className="branch-card__sales">{money(branch.netSales)}</p>

            {/* No bar at all when the share is unknown. A bar scaled to the leading branch
                instead would look like a share and mean something else. */}
            {share !== null ? (
              <span className="branch-card__bar" aria-hidden="true">
                <span className="branch-card__fill" style={{ inlineSize: `${share}%` }} />
              </span>
            ) : null}

            <p className="branch-card__meta">
              {share !== null
                ? t('dashboard.branches.meta', {
                    share: share.toFixed(1),
                    orders: formatNumber(branch.orderCount),
                  })
                : t('dashboard.branches.meta.noShare', {
                    orders: formatNumber(branch.orderCount),
                  })}
            </p>
            <p className="branch-card__average">
              {t('dashboard.branches.meta.average', { value: money(branch.averageOrderValue) })}
            </p>
          </article>
        )
      })}
    </div>
  )
}

interface MixTableProps {
  rows: MixRow[]
  /** Translation-key prefix for the dimension values — the backend ships raw enum names. */
  labelPrefix: string
}

function MixTable({ rows, labelPrefix }: MixTableProps) {
  const { t } = useTranslation()

  return (
    <div className="table-wrap">
      <table className="data-table dashboard-table">
        <thead>
          <tr>
            <th>{t('dashboard.mix.column.dimension')}</th>
            <th>{t('dashboard.mix.column.orders')}</th>
            <th>{t('dashboard.mix.column.total')}</th>
            <th>{t('dashboard.mix.column.share')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.dimension}>
              <td>{t(`${labelPrefix}.${row.dimension}`)}</td>
              <td>{formatNumber(row.orderCount)}</td>
              <td>{money(row.totalAmount)}</td>
              {/* Null share renders as a dash, not 0% — cancellations have no meaningful share. */}
              <td>{percent(row.sharePercent, '—')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** A dash for an absent figure. Absent and zero are different facts on this screen. */
function money(value: string | null | undefined): string {
  const parsed = parseMoney(value)
  return parsed === null ? '—' : formatMoney(parsed)
}

function percent(value: string | null | undefined, fallback: string): string {
  const parsed = parseMoney(value)
  return parsed === null ? fallback : `${parsed.toFixed(1)}%`
}
