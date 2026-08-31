import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Database,
  HelpCircle,
  Lightbulb,
  Receipt,
  TrendingDown,
} from 'lucide-react'
import {
  REPORT_MODULE_GROUPS,
  REPORTS_CATALOG,
  type ReportCatalogEntry,
  type ReportModule,
} from '../../data/reportsCatalog'
import { useTranslation } from '../../i18n/useTranslation'

const moduleIcons: Record<ReportModule, typeof Boxes> = {
  inventory: Boxes,
  losses: TrendingDown,
  sales: Receipt,
  assets: Boxes,
}

export function ReportsCataloguePage() {
  const { t, locale } = useTranslation()
  const [selectedModule, setSelectedModule] = useState<ReportModule | 'all'>('all')

  const countsByModule = useMemo(() => {
    const counts: Record<string, number> = { all: REPORTS_CATALOG.length }
    for (const report of REPORTS_CATALOG) {
      counts[report.module] = (counts[report.module] || 0) + 1
    }
    return counts
  }, [])

  const filteredGroups = useMemo(() => {
    if (selectedModule === 'all') {
      return REPORT_MODULE_GROUPS
    }
    return REPORT_MODULE_GROUPS.filter((g) => g.id === selectedModule)
  }, [selectedModule])

  const scrollToModule = (moduleId: ReportModule | 'all') => {
    setSelectedModule(moduleId)
    if (moduleId !== 'all') {
      const el = document.getElementById(`module-${moduleId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  return (
    <div className="page reports-page report-catalog-page">
      <div className="report-catalog-shell">
        <header className="report-catalog-header">
          <div className="report-catalog-header__top">
            <div>
              <h1 className="report-catalog-header__title">{t('reports.catalog.title')}</h1>
              <p className="report-catalog-header__subtitle">{t('reports.catalog.subtitle')}</p>
            </div>
            <div className="report-catalog-header__badge">
              {t('reports.catalog.totalReports', {
                count: REPORTS_CATALOG.length,
                modules: REPORT_MODULE_GROUPS.length,
              })}
            </div>
          </div>

          <nav className="report-catalog-nav" aria-label={t('reports.catalog.title')}>
            <button
              type="button"
              className={`report-catalog-nav__item${selectedModule === 'all' ? ' report-catalog-nav__item--active' : ''}`}
              onClick={() => scrollToModule('all')}
            >
              <span>{t('reports.catalog.nav.all')}</span>
              <span className="report-catalog-nav__count">{countsByModule.all}</span>
            </button>

            {REPORT_MODULE_GROUPS.map((group) => {
              const Icon = moduleIcons[group.id]
              const count = countsByModule[group.id] || 0
              const isActive = selectedModule === group.id
              return (
                <button
                  key={group.id}
                  type="button"
                  className={`report-catalog-nav__item${isActive ? ' report-catalog-nav__item--active' : ''}`}
                  onClick={() => scrollToModule(group.id)}
                >
                  <Icon size={16} className="report-catalog-nav__icon" aria-hidden="true" />
                  <span>{t(group.labelKey)}</span>
                  <span className="report-catalog-nav__count">{count}</span>
                </button>
              )
            })}
          </nav>
        </header>

        <div className="report-catalog-body">
          {filteredGroups.map((group) => {
            const Icon = moduleIcons[group.id]
            const reports = REPORTS_CATALOG.filter((r) => r.module === group.id)

            return (
              <section
                key={group.id}
                id={`module-${group.id}`}
                className="report-catalog-section"
              >
                <div className="report-catalog-section__header">
                  <div className="report-catalog-section__title-group">
                    <div className="report-catalog-section__icon-box">
                      <Icon size={20} aria-hidden="true" />
                    </div>
                    <div>
                      <div className="report-catalog-section__title-row">
                        <h2 className="report-catalog-section__title">{t(group.labelKey)}</h2>
                        <span className="report-catalog-section__count-badge">
                          {reports.length}
                        </span>
                      </div>
                      <p className="report-catalog-section__description">
                        {t(group.descriptionKey)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="report-catalog-grid">
                  {reports.map((report) => (
                    <ReportCard key={report.id} report={report} locale={locale} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface ReportCardProps {
  report: ReportCatalogEntry
  locale: string
}

function ReportCard({ report }: ReportCardProps) {
  const { t } = useTranslation()

  return (
    <article className="report-catalog-card" id={`card-${report.id}`}>
      {/* 1. Title, Report Code, and Type Badge */}
      <header className="report-catalog-card__header">
        <div className="report-catalog-card__title-row">
          <h3 className="report-catalog-card__title">{t(report.titleKey)}</h3>
          <span className="report-catalog-card__code">{t(report.codeKey)}</span>
        </div>
        <div className="report-catalog-card__type-row">
          <span
            className={`report-catalog-card__type-badge report-catalog-card__type-badge--${report.type}`}
          >
            {report.type === 'current-state'
              ? t('reports.catalog.type.currentState')
              : t('reports.catalog.type.dateRanged')}
          </span>
        </div>
      </header>

      <div className="report-catalog-card__body">
        {/* 2. What it answers */}
        <div className="report-catalog-card__section">
          <div className="report-catalog-card__section-label">
            <HelpCircle size={14} className="report-catalog-card__section-icon" aria-hidden="true" />
            <span>{t('reports.catalog.section.answers')}</span>
          </div>
          <p className="report-catalog-card__section-text">{t(report.answersKey)}</p>
        </div>

        {/* 3. What it reads */}
        <div className="report-catalog-card__section">
          <div className="report-catalog-card__section-label">
            <Database size={14} className="report-catalog-card__section-icon" aria-hidden="true" />
            <span>{t('reports.catalog.section.reads')}</span>
          </div>
          <p className="report-catalog-card__section-text">{t(report.readsKey)}</p>
        </div>

        {/* 4. What decision it drives */}
        <div className="report-catalog-card__section">
          <div className="report-catalog-card__section-label">
            <Lightbulb size={14} className="report-catalog-card__section-icon" aria-hidden="true" />
            <span>{t('reports.catalog.section.decision')}</span>
          </div>
          <p className="report-catalog-card__section-text">{t(report.decisionKey)}</p>
        </div>

        {/* 5. ⚠ Limitations (if present) */}
        {report.limitationsKey ? (
          <div className="report-catalog-card__limitations">
            <div className="report-catalog-card__limitations-label">
              <AlertTriangle size={14} className="report-catalog-card__limitations-icon" aria-hidden="true" />
              <span>{t('reports.catalog.section.limitations')}</span>
            </div>
            <p className="report-catalog-card__limitations-text">{t(report.limitationsKey)}</p>
          </div>
        ) : null}
      </div>

      {/* 6. Open report button */}
      <footer className="report-catalog-card__footer">
        <Link to={report.route} className="report-catalog-card__open-btn">
          <span>{t('reports.catalog.actions.openReport')}</span>
          <ArrowRight size={16} className="report-catalog-card__open-icon" aria-hidden="true" />
        </Link>
      </footer>
    </article>
  )
}
