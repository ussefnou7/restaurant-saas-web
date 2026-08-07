import { AlertCircle, ArrowLeft, Download, FileText, Filter, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import {
  ListCard,
  ListCardBody,
  ListPage,
} from '../../../components/ui/ListPage'
import { LoadingRows } from '../../../components/ui/LoadingRows'
import { useTranslation } from '../../../i18n/useTranslation'
import * as inventoryService from '../../../services/inventoryService'
import * as reportService from '../../../services/reportService'
import type { MaterialCategoryResponse, WarehouseResponse } from '../../../types/inventory'
import type { ReportFilters, ShrinkageRow } from '../../../types/reports'
import { translateApiError } from '../../../utils/errors'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { exportCsv, exportPdf } from '../../../utils/reportExport'

function formatMoneyNumber(value: number, includePlus = true): string {
  const absolute = Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  if (value < 0) return `-${absolute}`
  if (value > 0 && includePlus) return `+${absolute}`
  return absolute
}

function formatDecimalQuantity(value: string | number): string {
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  if (Number.isNaN(num)) return String(value)
  const absFormatted = Math.abs(num).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
  if (num < 0) return `-${absFormatted}`
  if (num > 0) return `+${absFormatted}`
  return absFormatted
}

function getQuickRangeDates(preset: 'thisMonth' | 'lastMonth' | 'last30Days'): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const pad = (n: number) => String(n).padStart(2, '0')

  if (preset === 'thisMonth') {
    const firstDay = `${year}-${pad(month + 1)}-01`
    const today = `${year}-${pad(month + 1)}-${pad(now.getDate())}`
    return { dateFrom: firstDay, dateTo: today }
  }

  if (preset === 'lastMonth') {
    const lastMonthDate = new Date(year, month - 1, 1)
    const lastMonthYear = lastMonthDate.getFullYear()
    const lastMonthNum = lastMonthDate.getMonth() + 1
    const lastDayOfMonth = new Date(year, month, 0).getDate()
    return {
      dateFrom: `${lastMonthYear}-${pad(lastMonthNum)}-01`,
      dateTo: `${lastMonthYear}-${pad(lastMonthNum)}-${pad(lastDayOfMonth)}`,
    }
  }

  // last30Days
  const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  return {
    dateFrom: `${past30.getFullYear()}-${pad(past30.getMonth() + 1)}-${pad(past30.getDate())}`,
    dateTo: `${year}-${pad(month + 1)}-${pad(now.getDate())}`,
  }
}

export function ShrinkageReport() {
  const { t, locale } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const urlDateFrom = searchParams.get('dateFrom') ?? ''
  const urlDateTo = searchParams.get('dateTo') ?? ''
  const urlWarehouseId = searchParams.get('warehouseId') ?? ''
  const urlCategoryId = searchParams.get('categoryId') ?? ''
  const urlNegativesOnly = searchParams.get('negativesOnly') === 'true'

  const hasFilterParams = Boolean(urlDateFrom && urlDateTo)

  // Form state for Filter Screen
  const [formDateFrom, setFormDateFrom] = useState(urlDateFrom)
  const [formDateTo, setFormDateTo] = useState(urlDateTo)
  const [formWarehouseId, setFormWarehouseId] = useState(urlWarehouseId)
  const [formCategoryId, setFormCategoryId] = useState(urlCategoryId)
  const [formNegativesOnly, setFormNegativesOnly] = useState(urlNegativesOnly)
  const [dateError, setDateError] = useState('')

  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
  const [categories, setCategories] = useState<MaterialCategoryResponse[]>([])
  const [rows, setRows] = useState<ShrinkageRow[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingRows, setLoadingRows] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoadingOptions(true)
    void Promise.all([
      inventoryService.getWarehouses({ active: true }).catch(() => []),
      inventoryService.getMaterialCategories({ active: true }).catch(() => []),
    ])
      .then(([whData, catData]) => {
        setWarehouses(whData)
        setCategories(catData)
      })
      .finally(() => setLoadingOptions(false))
  }, [])

  const loadRows = useCallback(async () => {
    if (!urlDateFrom || !urlDateTo) return

    setLoadingRows(true)
    setError('')
    try {
      const filters: ReportFilters = {
        dateFrom: urlDateFrom,
        dateTo: urlDateTo,
        warehouseId: urlWarehouseId || undefined,
        categoryId: urlCategoryId || undefined,
        negativesOnly: urlNegativesOnly,
      }
      const data = await reportService.getReportRows<ShrinkageRow>(
        '/api/inventory/reports/shrinkage',
        filters,
      )
      // Sort by absolute value descending by default
      const sorted = [...data].sort(
        (a, b) => Math.abs(parseFloat(b.netValue) || 0) - Math.abs(parseFloat(a.netValue) || 0),
      )
      setRows(sorted)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setRows([])
    } finally {
      setLoadingRows(false)
    }
  }, [urlDateFrom, urlDateTo, urlWarehouseId, urlCategoryId, urlNegativesOnly, t])

  useEffect(() => {
    if (hasFilterParams) {
      void loadRows()
    }
  }, [hasFilterParams, loadRows])

  // Preset handler
  const handleQuickPreset = (preset: 'thisMonth' | 'lastMonth' | 'last30Days') => {
    const range = getQuickRangeDates(preset)
    setFormDateFrom(range.dateFrom)
    setFormDateTo(range.dateTo)
    setDateError('')
  }

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formDateFrom || !formDateTo) {
      setDateError(t('reports.empty.missingDateRangeSubtitle'))
      return
    }
    if (formDateFrom > formDateTo) {
      setDateError(
        locale === 'ar'
          ? 'تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية'
          : 'From date cannot be after To date',
      )
      return
    }
    setDateError('')

    const params: Record<string, string> = {
      dateFrom: formDateFrom,
      dateTo: formDateTo,
    }
    if (formWarehouseId) params.warehouseId = formWarehouseId
    if (formCategoryId) params.categoryId = formCategoryId
    if (formNegativesOnly) params.negativesOnly = 'true'

    setSearchParams(params)
  }

  const handleEditFilters = () => {
    setFormDateFrom(urlDateFrom)
    setFormDateTo(urlDateTo)
    setFormWarehouseId(urlWarehouseId)
    setFormCategoryId(urlCategoryId)
    setFormNegativesOnly(urlNegativesOnly)
    setSearchParams({})
  }

  // Client-side computations for summary strip
  const totalNetValue = useMemo(() => {
    return rows.reduce((sum, r) => sum + (parseFloat(r.netValue) || 0), 0)
  }, [rows])

  const totalLinesCount = rows.length
  const valuedLinesCount = useMemo(() => {
    return rows.filter((r) => r.netQuantity != null && r.netQuantity !== '').length
  }, [rows])

  const categoryGroups = useMemo(() => {
    const map = new Map<string, number>()
    rows.forEach((r) => {
      const name = locale === 'ar' ? r.materialNameAr || r.materialName : r.materialName
      const val = Math.abs(parseFloat(r.netValue) || 0)
      map.set(name, (map.get(name) || 0) + val)
    })
    return map
  }, [rows, locale])

  const largestGroup = useMemo(() => {
    let maxName = ''
    let maxValue = 0
    const totalAbsVal = rows.reduce((sum, r) => sum + Math.abs(parseFloat(r.netValue) || 0), 0)

    categoryGroups.forEach((val, name) => {
      if (val > maxValue) {
        maxValue = val
        maxName = name
      }
    })
    const percentage = totalAbsVal > 0 ? ((maxValue / totalAbsVal) * 100).toFixed(1) : '0.0'
    return { name: maxName || t('reports.unclassified'), value: maxValue, percentage }
  }, [categoryGroups, rows, t])

  const filterSentence = useMemo(() => {
    const selectedWh = warehouses.find((w) => String(w.id) === urlWarehouseId)
    const selectedCat = categories.find((c) => String(c.id) === urlCategoryId)

    const whText = selectedWh ? (locale === 'ar' ? selectedWh.nameAr || selectedWh.name : selectedWh.name) : t('reports.filters.allWarehouses')
    const catText = selectedCat ? (locale === 'ar' ? selectedCat.nameAr || selectedCat.nameEn || selectedCat.name : selectedCat.nameEn || selectedCat.name) : t('reports.filters.allCategories')

    return locale === 'ar'
      ? `مفلتر حسب المستودع ${whText}، المجموعة ${catText}. مرتب حسب القيمة مطلقاً، تنازلياً.`
      : `Filtered by warehouse ${whText}, group ${catText}. Sorted by absolute value, descending.`
  }, [warehouses, categories, urlWarehouseId, urlCategoryId, locale, t])

  const exportColumns = useMemo(
    () => [
      { key: 'materialCode', labelKey: t('reports.columns.materialId') },
      { key: 'materialName', labelKey: t('reports.columns.materialName') },
      { key: 'netQuantity', labelKey: t('reports.columns.netQuantity') },
      { key: 'uomSymbol', labelKey: t('reports.columns.quantity') },
      { key: 'netValue', labelKey: t('reports.columns.netValue') },
      { key: 'movementCount', labelKey: t('reports.columns.movementCount') },
    ],
    [t],
  )

  // 1. FILTER SCREEN (No URL params)
  if (!hasFilterParams) {
    return (
      <ListPage className="reports-page">
        <div className="report-filter-screen">
          <div className="report-header-block">
            <div className="report-header-block__title-group">
              <h1 className="report-header-block__title">{t('reports.shrinkage')}</h1>
            </div>
            <p className="report-header-block__method">{t('reports.shrinkage.subtitle')}</p>
          </div>

          <form className="report-filter-form" onSubmit={handleApplyFilters}>
            <div className="report-filter-field">
              <label>{t('reports.filters.dateFrom')} * & {t('reports.filters.dateTo')} *</label>
              <div className="report-filter-bar__date-range">
                <input
                  type="date"
                  dir="ltr"
                  value={formDateFrom}
                  onChange={(e) => {
                    setFormDateFrom(e.target.value)
                    setDateError('')
                  }}
                  required
                />
                <span>{locale === 'ar' ? 'إلى' : 'to'}</span>
                <input
                  type="date"
                  dir="ltr"
                  value={formDateTo}
                  onChange={(e) => {
                    setFormDateTo(e.target.value)
                    setDateError('')
                  }}
                  required
                />
              </div>

              <div className="report-quick-presets">
                <button
                  type="button"
                  className="report-preset-btn"
                  onClick={() => handleQuickPreset('thisMonth')}
                >
                  {t('reports.quickRange.thisMonth')}
                </button>
                <button
                  type="button"
                  className="report-preset-btn"
                  onClick={() => handleQuickPreset('lastMonth')}
                >
                  {t('reports.quickRange.lastMonth')}
                </button>
                <button
                  type="button"
                  className="report-preset-btn"
                  onClick={() => handleQuickPreset('last30Days')}
                >
                  {t('reports.quickRange.last30Days')}
                </button>
              </div>

              {dateError ? <span className="report-filter-error">{dateError}</span> : null}
            </div>

            <div className="report-filter-grid">
              <div className="report-filter-field">
                <label>{t('reports.filters.warehouse')}</label>
                <select
                  value={formWarehouseId}
                  onChange={(e) => setFormWarehouseId(e.target.value)}
                  disabled={loadingOptions}
                >
                  <option value="">{t('reports.filters.allWarehouses')}</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={String(wh.id)}>
                      {locale === 'ar' ? wh.nameAr || wh.name : wh.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="report-filter-field">
                <label>{t('reports.filters.category')}</label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  disabled={loadingOptions}
                >
                  <option value="">{t('reports.filters.allCategories')}</option>
                  {categories
                    .filter((c) => c.active)
                    .map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {locale === 'ar' ? c.nameAr || c.nameEn || c.name : c.nameEn || c.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <label className="report-filter-bar__checkbox">
              <input
                type="checkbox"
                checked={formNegativesOnly}
                onChange={(e) => setFormNegativesOnly(e.target.checked)}
              />
              <span>{t('reports.filters.negativesOnly')}</span>
            </label>

            <Button variant="primary" type="submit" style={{ alignSelf: 'flex-start' }}>
              <Filter size={16} />
              {t('reports.actions.viewReport')}
            </Button>
          </form>
        </div>
      </ListPage>
    )
  }

  // 2. REPORT VIEW (URL params present)
  return (
    <ListPage className="reports-page">
      <div className="report-header-block">
        <div className="report-header-block__top">
          <div className="report-header-block__title-group">
            <h1 className="report-header-block__title">{t('reports.shrinkage')}</h1>
          </div>
          <div className="reports-page__actions">
            <Button variant="secondary" onClick={handleEditFilters}>
              <ArrowLeft size={16} />
              {t('reports.actions.editFilters')}
            </Button>
            <Button variant="secondary" onClick={loadRows} disabled={loadingRows}>
              <RefreshCw size={16} />
              {t('reports.actions.refresh')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => exportCsv(exportColumns, rows, 'shrinkage-report')}
              disabled={loadingRows || rows.length === 0}
            >
              <Download size={16} />
              {t('reports.actions.exportCsv')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => exportPdf(exportColumns, rows, 'shrinkage-report', t('reports.shrinkage'))}
              disabled={loadingRows || rows.length === 0}
            >
              <FileText size={16} />
              {t('reports.actions.exportPdf')}
            </Button>
          </div>
        </div>

        <p className="report-header-block__method">
          {t('reports.method.period', { dateFrom: urlDateFrom, dateTo: urlDateTo })}
        </p>
        <p className="report-header-block__filter-sentence">{filterSentence}</p>
      </div>

      {error ? <div className="page-error-banner">{error}</div> : null}

      <div className="report-summary-strip">
        <div className="report-summary-item">
          <span className="report-summary-item__label">{t('reports.summary.totalNetValue')}</span>
          <span className="report-summary-item__val">
            <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
              {formatMoneyNumber(totalNetValue, false)}
            </span>
            <span className="report-summary-item__val-unit">{locale === 'ar' ? 'ج.م' : 'EGP'}</span>
          </span>
        </div>
        <div className="report-summary-item">
          <span className="report-summary-item__label">{t('reports.summary.linesValued')}</span>
          <span className="report-summary-item__val" dir="ltr">
            {valuedLinesCount}{' '}
            <span className="report-summary-item__sub">
              {t('reports.summary.of')} {totalLinesCount}
            </span>
          </span>
        </div>
        <div className="report-summary-item">
          <span className="report-summary-item__label">{t('reports.summary.materialGroups')}</span>
          <span className="report-summary-item__val">{categoryGroups.size}</span>
        </div>
        <div className="report-summary-item">
          <span className="report-summary-item__label">
            {t('reports.summary.concentration', { group: largestGroup.name })}
          </span>
          <span className="report-summary-item__val" dir="ltr">
            {largestGroup.percentage}%{' '}
            <span className="report-summary-item__sub">{formatMoneyNumber(largestGroup.value, false)}</span>
          </span>
        </div>
      </div>

      <ListCard>
        {loadingRows ? (
          <div className="list-card-content">
            <p className="list-loading-message" role="status">
              {t('reports.loading')}
            </p>
            <LoadingRows columns={4} />
          </div>
        ) : rows.length === 0 ? (
          <ListCardBody>
            <EmptyState
              title={t('reports.empty.noDataTitle')}
              description={t('reports.empty.noDataSubtitle')}
              variant="filter"
            />
          </ListCardBody>
        ) : (
          <div className="list-card-content table-wrap">
            <table className="report-ledger-table">
              <thead>
                <tr>
                  <th>{t('reports.columns.materialName')}</th>
                  <th style={{ textAlign: 'end' }}>{t('reports.columns.netQuantity')}</th>
                  <th style={{ textAlign: 'end' }}>{t('reports.columns.netValue')}</th>
                  <th style={{ textAlign: 'end' }}>{t('reports.columns.movementCount')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const numValue = parseFloat(row.netValue) || 0
                  const isUnconvertible = row.netQuantity == null || row.netQuantity === ''
                  const isInactive = row.materialActive === false

                  const materialName = getInventoryLocalizedName(
                    {
                      name: row.materialName,
                      nameAr: row.materialNameAr ?? undefined,
                      code: row.materialCode,
                    },
                    locale,
                  )

                  return (
                    <tr key={`${row.materialId}-${idx}`}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                          <strong>{materialName}</strong>
                          {isInactive && (
                            <span className="report-marker--inactive">{t('reports.markers.inactive')}</span>
                          )}
                        </div>
                      </td>
                      <td className="report-cell--numeric">
                        {isUnconvertible ? (
                          <span
                            className="report-marker--unconvertible"
                            title={t('reports.markers.unconvertibleUomTooltip')}
                          >
                            <AlertCircle size={14} />
                            {t('reports.markers.unconvertibleUom')}
                          </span>
                        ) : (
                          <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                            {formatDecimalQuantity(row.netQuantity ?? '')} {row.uomSymbol ?? ''}
                          </span>
                        )}
                      </td>
                      <td
                        className={`report-cell--numeric report-cell--value ${
                          numValue > 0
                            ? 'report-cell--positive'
                            : 'report-cell--negative'
                        }`}
                      >
                        <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                          {formatMoneyNumber(numValue, false)}
                        </span>
                      </td>
                      <td className="report-cell--numeric">{row.movementCount}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="report-totals-row">
                  <td colSpan={2}>
                    {t('reports.totals.lines', { count: totalLinesCount })}
                  </td>
                  <td className="report-cell--numeric report-cell--value">
                    <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                      {formatMoneyNumber(totalNetValue, false)}
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </ListCard>
    </ListPage>
  )
}
