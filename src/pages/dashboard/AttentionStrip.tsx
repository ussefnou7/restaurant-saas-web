import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ExternalLink,
  Info,
  Lock,
  OctagonAlert,
} from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'
import { formatMoney } from '../../utils/format'
import type {
  AlertSeverity,
  DashboardAlertGroup,
  DashboardAlertsResponse,
} from '../../types/dashboard'
import {
  ageKeyAndValue,
  alertHref,
  parseMoney,
  scopeLabelKey,
  scopeLabelValues,
  translatableParams,
} from './dashboardDisplay'

const SEVERITY_ICON: Record<AlertSeverity, typeof OctagonAlert> = {
  CRITICAL: OctagonAlert,
  WARNING: AlertTriangle,
  INFO: Info,
}

/** Declaration order is display order, per the wire contract. Worst first, so it reads first. */
const SEVERITY_ORDER: AlertSeverity[] = ['CRITICAL', 'WARNING', 'INFO']

interface AttentionStripProps {
  alerts: DashboardAlertsResponse | null
}

/** Current alerts grouped by condition and branch/warehouse. */
export function AttentionStrip({ alerts }: AttentionStripProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  if (!alerts) return null

  const toggle = (code: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const hasGroups = alerts.groups.length > 0
  const hasWithheld = alerts.withheld.length > 0

  return (
    <section className="attention-strip">
      <header className="attention-strip__header">
        <h2 className="attention-strip__title">{t('dashboard.alerts.title')}</h2>

        {/*
          The tally, in place of the single count badge that used to sit here. A bare "5" answers
          the wrong question: whether to read the list at all depends on what is in it, and two
          critical conditions and five notes were the same badge. Split by severity the strip
          answers "is anything actually wrong" before a word of it has been read.

          Counted in groups rather than rows, which is what the list below shows — a group that
          holds eleven out-of-stock items is one thing to go and deal with, not eleven.
        */}
        {hasGroups ? (
          <ul className="attention-strip__tally">
            {SEVERITY_ORDER.map((severity) => {
              const count = alerts.groups.filter((group) => group.severity === severity).length
              if (count === 0) return null
              const Icon = SEVERITY_ICON[severity]

              return (
                <li
                  className={`attention-tally attention-tally--${severity.toLowerCase()}`}
                  key={severity}
                >
                  <Icon size={14} aria-hidden="true" />
                  <span className="attention-tally__count">{count}</span>
                  <span className="attention-tally__label">
                    {t(`dashboard.alerts.severity.${severity}`)}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : null}
      </header>

      {!hasGroups && !hasWithheld ? (
        <div className="attention-strip__clear">
          <CheckCircle2 size={20} aria-hidden="true" />
          <div>
            <p className="attention-strip__clear-title">{t('dashboard.alerts.clear.title')}</p>
            <p className="attention-strip__clear-body">{t('dashboard.alerts.clear.body')}</p>
          </div>
        </div>
      ) : null}

      {hasGroups ? (
        <ul className="attention-strip__list">
          {alerts.groups.map((group) => (
            <AlertGroupRow
              key={group.code}
              group={group}
              evaluatedAt={alerts.evaluatedAt}
              isExpanded={expanded.has(group.code)}
              onToggle={() => toggle(group.code)}
            />
          ))}
        </ul>
      ) : null}

      {hasWithheld ? (
        <p className="attention-strip__withheld">
          <Lock size={14} aria-hidden="true" />
          {t('dashboard.alerts.withheld', { count: alerts.withheld.length })}
        </p>
      ) : null}
    </section>
  )
}

/**
 * The values an alert's sentence interpolates.
 *
 * Taken from the first row because the group-level parameters — thresholds, window lengths, the
 * worst offender's name — are identical across a group's rows by construction: they come from the
 * rule's own configuration rather than from the scope. `count` is overridden with the group total,
 * which is the number the header is about.
 */
function groupParams(group: DashboardAlertGroup): Record<string, string | number> {
  return {
    ...translatableParams(group.rows[0]?.params ?? {}),
    count: group.count,
  }
}

interface AlertGroupRowProps {
  group: DashboardAlertGroup
  evaluatedAt: string
  isExpanded: boolean
  onToggle: () => void
}

function AlertGroupRow({ group, evaluatedAt, isExpanded, onToggle }: AlertGroupRowProps) {
  const { t, locale } = useTranslation()
  const Icon = SEVERITY_ICON[group.severity]
  const age = ageKeyAndValue(group.oldestAt, evaluatedAt)
  const value = parseMoney(group.value)
  const panelId = `alert-rows-${group.code}`

  return (
    <li className={`alert-group alert-group--${group.severity.toLowerCase()}`}>
      <div className="alert-group__main">
        <span className="alert-group__icon" aria-hidden="true">
          <Icon size={18} />
        </span>

        <div className="alert-group__text">
          <p className="alert-group__title">
            {t(`dashboard.alerts.${group.code}.title`, groupParams(group))}
            <span className="alert-group__severity">
              {t(`dashboard.alerts.severity.${group.severity}`)}
            </span>
          </p>
          <p className="alert-group__body">
            {t(`dashboard.alerts.${group.code}.body`, groupParams(group))}
          </p>
          {group.code === 'CANCELLED_AFTER_COOKING' ? (
            <p className="alert-group__caveat">
              {t('dashboard.alerts.CANCELLED_AFTER_COOKING.caveat')}
            </p>
          ) : null}
        </div>

        <div className="alert-group__figures">
          {value !== null ? (
            <span className="alert-group__value">
              {formatMoney(value)}
              {/* The estimate marker is driven by the flag, never by the alert's identity, so
                  a backend change to how a value is derived carries the label with it. */}
              {group.valueIsEstimate ? (
                <span className="alert-group__estimate">{t('dashboard.alerts.estimate')}</span>
              ) : null}
            </span>
          ) : null}
          <span className="alert-group__age">
            {age ? t(age.key, { count: age.count }) : t('dashboard.alerts.noAge')}
          </span>
        </div>

        <button
          type="button"
          className="alert-group__toggle"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={panelId}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span className="alert-group__toggle-label">
            {t(isExpanded ? 'dashboard.alerts.collapse' : 'dashboard.alerts.expand')}
          </span>
        </button>
      </div>

      {isExpanded ? (
        <ul className="alert-group__rows" id={panelId}>
          {group.rows.map((row, index) => {
            const rowAge = ageKeyAndValue(row.oldestAt, evaluatedAt)
            const rowValue = parseMoney(row.value)
            return (
              <li className="alert-row" key={`${row.branchId}-${row.warehouseId}-${index}`}>
                <span className="alert-row__scope">
                  {t(scopeLabelKey(row), scopeLabelValues(row, locale))}
                </span>
                <span className="alert-row__count">{row.count}</span>
                <span className="alert-row__value">
                  {rowValue !== null ? formatMoney(rowValue) : '—'}
                </span>
                <span className="alert-row__age">
                  {rowAge ? t(rowAge.key, { count: rowAge.count }) : '—'}
                </span>
                {/* Rule 4: every alert links to the screen where it is cleared. */}
                <Link className="alert-row__link" to={alertHref(row)}>
                  {t('dashboard.alerts.open')}
                  <ExternalLink size={14} aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ul>
      ) : null}
    </li>
  )
}
