import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'
import { LoadingState } from '../../components/ui/LoadingState'
import { formatDateTime, formatNumber } from '../../utils/format'
import { getDashboardAlerts, getDashboardSummary } from '../../services/dashboardService'
import type {
  DashboardAlertsResponse,
  DashboardBlock,
  DashboardMode,
  DashboardSummaryResponse,
  MixRow,
  SalesTrend,
} from '../../types/dashboard'
import { AttentionStrip } from './AttentionStrip'
import { BranchBars } from './BranchBars'
import { CoverageBar } from './CoverageBar'
import { DashboardDrawer } from './DashboardDrawer'
import { DashboardSection } from './DashboardSection'
import { HeroTile } from './HeroTile'
import { PeakTile } from './PeakTile'
import { SalesTrendChart } from './SalesTrendChart'
import { ShareBars } from './ShareBars'
import { moneyText, percentText } from './dashboardDisplay'

const MODES: DashboardMode[] = ['today', 'month', 'year']

/**
 * The owner dashboard.
 *
 * The page is ordered by what an owner does about it, not by what the API returns. Alerts first,
 * because they are the only part that asks for an action. Then the sales figures the whole screen
 * is about, with the trend inside the one they describe.
 *
 * ## What moved out of the drawers, and why
 *
 * The first version put everything that reports on the *bookkeeping* rather than the business into
 * a shut drawer at the bottom. That was right about cancellations and the posting pipeline, which
 * are somebody's queue of work, and wrong about two things:
 *
 * - **Cost coverage** is the figure that says whether every other number on this page can be
 *   trusted. Below 100%, some sales carry no cost, so any margin an owner works out from this
 *   screen is overstated — and behind a lid he could work one out without ever being told. It is
 *   now a bar immediately under the headline figures.
 * - **Order channels and payment methods** are the two breakdowns an owner reads daily. As
 *   four-column tables inside a drawer they were three clicks and a scan away from a comparison
 *   that a bar makes instantly, which is why they are now bars on the page.
 *
 * What stayed in the drawer is the pipeline and cancellations, with the count of documents still
 * waiting to post lifted onto the lid — a shut drawer labelled only "data health" gives no reason
 * to open it and no reason to leave it shut.
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

  /*
   * The figure on the drawer's lid: how many posting documents have not finished.
   *
   * Optional all the way down, because the lid is read before any block is known to exist and a
   * response missing the block entirely must leave the lid unlabelled rather than throw. Zero is
   * a good lid — "nothing is waiting" is worth saying — so only an absent block falls back to the
   * unknown wording.
   */
  const pipeline =
    summary?.consumptionPipeline?.status === 'OK' ? summary.consumptionPipeline.data : null
  const waitingDocs = pipeline
    ? pipeline
        .filter((row) => row.status !== 'POSTED')
        .reduce((count, row) => count + row.docCount, 0)
    : null

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
          {/* Net sales takes the full width because it carries the chart, which is a picture of
              net sales and of nothing else — as its own section it was a chart of no figure in
              particular. */}
          <div className="dashboard-lead">
            <HeroTile
              size="lead"
              title={t('dashboard.kpis.netSales')}
              value={moneyText(kpis?.netSales)}
              hint={t('dashboard.kpis.netSales.hint')}
            >
              <TrendSlot block={summary?.trend} />
            </HeroTile>
          </div>

          {/* Three supporting figures, all three derived from the same sales the chart draws, so
              none of them can disagree with it. */}
          <div className="dashboard-metrics">
            <HeroTile
              title={t('dashboard.kpis.orders')}
              value={kpis?.orderCount !== null && kpis?.orderCount !== undefined
                ? formatNumber(kpis.orderCount)
                : t('dashboard.unknown')}
            />
            <HeroTile
              title={t('dashboard.kpis.averageCheck')}
              value={moneyText(kpis?.averageOrderValue)}
              hint={t('dashboard.kpis.averageCheck.hint')}
            />
            <PeakTile block={summary?.trend} bucket={summary?.bucket ?? 'DAY'} />
          </div>

          <DashboardSection
            titleKey="dashboard.costCoverage.title"
            subtitleKey="dashboard.costCoverage.subtitle"
            block={summary?.costCoverage}
            isEmpty={() => false}
          >
            {(data) => <CoverageBar data={data} />}
          </DashboardSection>

          <div className="dashboard-page__pair">
            <DashboardSection titleKey="dashboard.orderTypes.title" block={summary?.orderTypes}>
              {(rows) => <ShareBars rows={rows} labelPrefix="dashboard.orderType" />}
            </DashboardSection>

            <DashboardSection
              titleKey="dashboard.paymentMethods.title"
              block={summary?.paymentMethods}
            >
              {(rows) => <ShareBars rows={rows} labelPrefix="dashboard.paymentMethod" />}
            </DashboardSection>
          </div>

          <DashboardSection titleKey="dashboard.branches.title" block={summary?.branches}>
            {(branches) => <BranchBars branches={branches} />}
          </DashboardSection>

          {/* Inventory money, kept but demoted: both are real figures and neither is a sales
              figure, so they read at a smaller size with their period spelled out. */}
          <div className="dashboard-secondary">
            <SecondaryFigure
              label={t('dashboard.kpis.wasteValue')}
              value={moneyText(kpis?.wasteValue)}
              hint={t('dashboard.kpis.wasteValue.hint')}
            />
            <SecondaryFigure
              label={t('dashboard.kpis.stockValue')}
              value={moneyText(kpis?.stockValue)}
              hint={t('dashboard.kpis.stockValue.hint')}
            />
          </div>

          <DashboardDrawer
            titleKey="dashboard.health.title"
            summaryKey={
              waitingDocs === null ? 'dashboard.health.summary.unknown' : 'dashboard.health.summary'
            }
            summaryValues={waitingDocs === null ? undefined : { count: waitingDocs }}
          >
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

          {summary?.generatedAt ? (
            <p className="dashboard-page__timestamp">
              {t('dashboard.generatedAt', { time: formatDateTime(summary.generatedAt, locale) })}
            </p>
          ) : null}
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

interface MixTableProps {
  rows: MixRow[]
  /** Translation-key prefix for the dimension values — the backend ships raw enum names. */
  labelPrefix: string
}

/**
 * A mix as a table, which cancellations are the remaining case for.
 *
 * The channel and payment mixes became {@link ShareBars} because a share is compared by eye.
 * Cancellations have no share — a share of itself would mean nothing — so there is no bar to draw
 * and the four columns are the clearest thing left.
 */
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
              <td>{moneyText(row.totalAmount)}</td>
              {/* Null share renders as a dash, not 0% — cancellations have no meaningful share. */}
              <td>{percentText(row.sharePercent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
