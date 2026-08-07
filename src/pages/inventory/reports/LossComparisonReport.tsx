import { AlertCircle, ArrowLeft, Download, FileText, Filter, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
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
import type { LossComparisonRow, ReportFilters } from '../../../types/reports'
import { translateApiError } from '../../../utils/errors'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { exportCsv, exportPdf } from '../../../utils/reportExport'

function formatMagnitudeMoney(value: number): string {
  return Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatSignedMoney(value: number): string {
  const absFormatted = Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  if (value > 0) return `+${absFormatted}`
  if (value < 0) return `-${absFormatted}`
  return absFormatted
}

function formatMagnitudeQuantity(value: string | number): string {
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  if (Number.isNaN(num)) return String(value)
  return Math.abs(num).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
}

function formatSignedQuantity(value: string | number): string {
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  if (Number.isNaN(num)) return String(value)
  const absFormatted = Math.abs(num).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
  if (num > 0) return `+${absFormatted}`
  if (num < 0) return `-${absFormatted}`
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

  const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  return {
    dateFrom: `${past30.getFullYear()}-${pad(past30.getMonth() + 1)}-${pad(past30.getDate())}`,
    dateTo: `${year}-${pad(month + 1)}-${pad(now.getDate())}`,
  }
}

export function LossComparisonReport() {
  const { t, locale } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const urlDateFrom = searchParams.get('dateFrom') ?? ''
  const urlDateTo = searchParams.get('dateTo') ?? ''
  const urlWarehouseId = searchParams.get('warehouseId') ?? ''
  const urlCategoryId = searchParams.get('categoryId') ?? ''

  const hasFilterParams = Boolean(urlDateFrom && urlDateTo)

  const [formDateFrom, setFormDateFrom] = useState(urlDateFrom)
  const [formDateTo, setFormDateTo] = useState(urlDateTo)
  const [formWarehouseId, setFormWarehouseId] = useState(urlWarehouseId)
  const [formCategoryId, setFormCategoryId] = useState(urlCategoryId)
  const [dateError, setDateError] = useState('')

  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
  const [categories, setCategories] = useState<MaterialCategoryResponse[]>([])
  const [rows, setRows] = useState<LossComparisonRow[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingRows, setLoadingRows] = useState(false)
  const [error, setError] = useState('')
  const [showCleanRows, setShowCleanRows] = useState(false)

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
      }
      const data = await reportService.getReportRows<LossComparisonRow>(
        '/api/inventory/reports/loss-comparison',
        filters,
      )
      setRows(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setRows([])
    } finally {
      setLoadingRows(false)
    }
  }, [urlDateFrom, urlDateTo, urlWarehouseId, urlCategoryId, t])

  useEffect(() => {
    if (hasFilterParams) {
      void loadRows()
    }
  }, [hasFilterParams, loadRows])

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

    setSearchParams(params)
  }

  const handleEditFilters = () => {
    setFormDateFrom(urlDateFrom)
    setFormDateTo(urlDateTo)
    setFormWarehouseId(urlWarehouseId)
    setFormCategoryId(urlCategoryId)
    setSearchParams({})
  }

  const activeRows = useMemo(() => {
    return rows.filter((r) => {
      const wVal = parseFloat(r.wasteValue) || 0
      const sVal = parseFloat(r.shrinkageValue) || 0
      const tVal = parseFloat(r.totalValue) || 0
      const wQty = r.wasteQuantity ? parseFloat(r.wasteQuantity) || 0 : 0
      const sQty = r.shrinkageQuantity ? parseFloat(r.shrinkageQuantity) || 0 : 0
      return wVal !== 0 || sVal !== 0 || tVal !== 0 || wQty !== 0 || sQty !== 0
    })
  }, [rows])

  const cleanRows = useMemo(() => {
    return rows.filter((r) => {
      const wVal = parseFloat(r.wasteValue) || 0
      const sVal = parseFloat(r.shrinkageValue) || 0
      const tVal = parseFloat(r.totalValue) || 0
      const wQty = r.wasteQuantity ? parseFloat(r.wasteQuantity) || 0 : 0
      const sQty = r.shrinkageQuantity ? parseFloat(r.shrinkageQuantity) || 0 : 0
      return wVal === 0 && sVal === 0 && tVal === 0 && wQty === 0 && sQty === 0
    })
  }, [rows])

  const totalLossValue = useMemo(() => {
    return rows.reduce((sum, r) => sum + (parseFloat(r.totalValue) || 0), 0)
  }, [rows])

  const totalLinesCount = rows.length
  const valuedLinesCount = useMemo(() => {
    return rows.filter((r) => r.wasteQuantity != null && r.wasteQuantity !== '' && r.shrinkageQuantity != null && r.shrinkageQuantity !== '').length
  }, [rows])

  const filterSentence = useMemo(() => {
    const selectedWh = warehouses.find((w) => String(w.id) === urlWarehouseId)
    const selectedCat = categories.find((c) => String(c.id) === urlCategoryId)

    const whText = selectedWh ? (locale === 'ar' ? selectedWh.nameAr || selectedWh.name : selectedWh.name) : t('reports.filters.allWarehouses')
    const catText = selectedCat ? (locale === 'ar' ? selectedCat.nameAr || selectedCat.nameEn || selectedCat.name : selectedCat.nameEn || selectedCat.name) : t('reports.filters.allCategories')

    return locale === 'ar'
      ? `مفلتر حسب المستودع ${whText}، المجموعة ${catText}. مرتب حسب إجمالي الخسائر تنازلياً.`
      : `Filtered by warehouse ${whText}, group ${catText}. Sorted by total loss descending.`
  }, [warehouses, categories, urlWarehouseId, urlCategoryId, locale, t])

  const exportColumns = useMemo(
    () => [
      { key: 'materialCode', labelKey: t('reports.columns.materialId') },
      { key: 'materialName', labelKey: t('reports.columns.materialName') },
      { key: 'wasteQuantity', labelKey: t('reports.columns.wasteQty') },
      { key: 'wasteValue', labelKey: t('reports.columns.wasteValue') },
      { key: 'shrinkageQuantity', labelKey: t('reports.columns.shrinkageQty') },
      { key: 'shrinkageValue', labelKey: t('reports.columns.shrinkageValue') },
      { key: 'totalValue', labelKey: t('reports.columns.totalLoss') },
    ],
    [t],
  )

  const renderRow = (row: LossComparisonRow, idx: number, isClean: boolean) => {
    const wVal = parseFloat(row.wasteValue) || 0
    const sVal = parseFloat(row.shrinkageValue) || 0
    const totVal = parseFloat(row.totalValue) || 0
    const isUnconvertible = row.uomId == null || row.wasteQuantity == null || row.shrinkageQuantity == null
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
      <tr key={`${row.materialId}-${isClean ? 'clean' : 'act'}-${idx}`}>
        <td className="report-cell--text">
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
            <strong>{materialName}</strong>
            {isInactive && (
              <span className="report-marker--inactive">{t('reports.markers.inactive')}</span>
            )}
          </div>
        </td>
        <td className="report-cell--numeric">
          {isUnconvertible ? (
            <span className="report-marker--unconvertible" title={t('reports.markers.unconvertibleUomTooltip')}>
              <AlertCircle size={14} />
              {t('reports.markers.unconvertibleUom')}
            </span>
          ) : (
            <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
              {formatMagnitudeQuantity(row.wasteQuantity ?? '0')} {row.uomSymbol ?? ''}
            </span>
          )}
        </td>
        <td className="report-cell--numeric report-cell--value">
          <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
            {formatMagnitudeMoney(wVal)}
          </span>
        </td>
        <td className="report-cell--numeric">
          {isUnconvertible ? (
            <span className="report-marker--unconvertible" title={t('reports.markers.unconvertibleUomTooltip')}>
              <AlertCircle size={14} />
              {t('reports.markers.unconvertibleUom')}
            </span>
          ) : (
            <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
              {formatSignedQuantity(row.shrinkageQuantity ?? '0')} {row.uomSymbol ?? ''}
            </span>
          )}
        </td>
        <td className={`report-cell--numeric report-cell--value ${sVal > 0 ? 'report-cell--positive' : sVal < 0 ? 'report-cell--negative' : ''}`}>
          <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
            {formatSignedMoney(sVal)}
          </span>
        </td>
        <td className={`report-cell--numeric report-cell--value ${totVal < 0 ? 'report-cell--positive' : totVal > 0 ? 'report-cell--negative' : ''}`}>
          <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
            {totVal < 0 ? `+${formatMagnitudeMoney(Math.abs(totVal))}` : formatMagnitudeMoney(totVal)}
          </span>
        </td>
      </tr>
    )
  }

  if (!hasFilterParams) {
    return (
      <ListPage className="reports-page">
        <div className="report-filter-screen">
          <div className="report-header-block">
            <div className="report-header-block__top">
              <div className="report-header-block__title-group">
                <h1 className="report-header-block__title">{t('reports.lossComparison')}</h1>
                <span className="report-header-block__code-badge">{t('reports.code.lossComparison')}</span>
              </div>
            </div>
            <p className="report-header-block__method">{t('reports.lossComparison.subtitle')}</p>
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

            <Button variant="primary" type="submit" style={{ alignSelf: 'flex-start' }}>
              <Filter size={16} />
              {t('reports.actions.viewReport')}
            </Button>
          </form>
        </div>
      </ListPage>
    )
  }

  return (
    <ListPage className="reports-page">
      <div className="report-header-block">
        <div className="report-header-block__top">
          <div className="report-header-block__title-group">
            <h1 className="report-header-block__title">{t('reports.lossComparison')}</h1>
            <span className="report-header-block__code-badge">{t('reports.code.lossComparison')}</span>
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
              onClick={() => exportCsv(exportColumns, rows, 'loss-comparison-report')}
              disabled={loadingRows || rows.length === 0}
            >
              <Download size={16} />
              {t('reports.actions.exportCsv')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => exportPdf(exportColumns, rows, 'loss-comparison-report', t('reports.lossComparison'))}
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
          <span className="report-summary-item__label">
            {totalLossValue < 0 ? t('reports.summary.totalNetGain') : t('reports.summary.totalLossValue')}
          </span>
          <span className="report-summary-item__val">
            <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
              {totalLossValue < 0 ? `+${formatMagnitudeMoney(Math.abs(totalLossValue))}` : formatMagnitudeMoney(totalLossValue)}
            </span>
            <span className="report-summary-item__val-unit">{locale === 'ar' ? 'ج.م' : 'EGP'}</span>
          </span>
        </div>
        <div className="report-summary-item">
          <span className="report-summary-item__label">{t('reports.summary.materialsWithLosses')}</span>
          <span className="report-summary-item__val">{activeRows.length}</span>
        </div>
        <div className="report-summary-item">
          <span className="report-summary-item__label">{t('reports.summary.cleanMaterials')}</span>
          <span className="report-summary-item__val">{cleanRows.length}</span>
        </div>
        <div className="report-summary-item">
          <span className="report-summary-item__label">{t('reports.summary.linesValued')}</span>
          <span className="report-summary-item__val">
            <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>{valuedLinesCount}</span>{' '}
            <span className="report-summary-item__sub">
              {t('reports.summary.of')} <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>{totalLinesCount}</span>
            </span>
          </span>
        </div>
      </div>

      <ListCard>
        {loadingRows ? (
          <div className="list-card-content">
            <p className="list-loading-message" role="status">
              {t('reports.loading')}
            </p>
            <LoadingRows columns={6} />
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
                  <th className="report-cell--text">{t('reports.columns.materialName')}</th>
                  <th className="report-cell--numeric">{t('reports.columns.wasteQty')}</th>
                  <th className="report-cell--numeric">{t('reports.columns.wasteValue')}</th>
                  <th className="report-cell--numeric">{t('reports.columns.shrinkageQty')}</th>
                  <th className="report-cell--numeric">{t('reports.columns.shrinkageValue')}</th>
                  <th className="report-cell--numeric">{t('reports.columns.totalLoss')}</th>
                </tr>
              </thead>
              <tbody>
                {activeRows.map((row, idx) => renderRow(row, idx, false))}

                {cleanRows.length > 0 && (
                  <>
                    <tr style={{ background: 'var(--color-surface-hover, #f8fafc)' }}>
                      <td colSpan={6} style={{ padding: '8px 16px', textAlign: 'center' }}>
                        <Button
                          variant="secondary"
                          onClick={() => setShowCleanRows(!showCleanRows)}
                          style={{ fontSize: 'var(--font-size-xs)', height: '32px', margin: '0 auto' }}
                        >
                          {showCleanRows ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {t(showCleanRows ? 'reports.cleanRows.toggleHide' : 'reports.cleanRows.toggleShow', {
                            count: cleanRows.length,
                          })}
                        </Button>
                      </td>
                    </tr>
                    {showCleanRows && cleanRows.map((row, idx) => renderRow(row, idx, true))}
                  </>
                )}
              </tbody>
              <tfoot>
                <tr className="report-totals-row">
                  <td colSpan={5}>
                    {t('reports.totals.lines', { count: totalLinesCount })}
                  </td>
                  <td className="report-cell--numeric report-cell--value">
                    <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                      {totalLossValue < 0 ? `+${formatMagnitudeMoney(Math.abs(totalLossValue))}` : formatMagnitudeMoney(totalLossValue)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </ListCard>
    </ListPage>
  )
}
