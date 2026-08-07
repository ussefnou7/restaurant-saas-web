import { ArrowLeft, Download, FileText, Filter, RefreshCw } from 'lucide-react'
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
import type { MaterialCategoryResponse, SupplierResponse, WarehouseResponse } from '../../../types/inventory'
import type { PurchasePriceDriftRow, ReportFilters } from '../../../types/reports'
import { translateApiError } from '../../../utils/errors'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { exportCsv, exportPdf } from '../../../utils/reportExport'

function formatMoneyNumber(value: number): string {
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

function formatPercent(value: number): string {
  const absFormatted = Math.abs(value).toFixed(1)
  if (value > 0) return `+${absFormatted}%`
  if (value < 0) return `-${absFormatted}%`
  return `${absFormatted}%`
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

export function PurchasePriceDriftReport() {
  const { t, locale } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const urlDateFrom = searchParams.get('dateFrom') ?? ''
  const urlDateTo = searchParams.get('dateTo') ?? ''
  const urlWarehouseId = searchParams.get('warehouseId') ?? ''
  const urlCategoryId = searchParams.get('categoryId') ?? ''
  const urlSupplierId = searchParams.get('supplierId') ?? ''

  const hasFilterParams = Boolean(urlDateFrom && urlDateTo)

  const [formDateFrom, setFormDateFrom] = useState(urlDateFrom)
  const [formDateTo, setFormDateTo] = useState(urlDateTo)
  const [formWarehouseId, setFormWarehouseId] = useState(urlWarehouseId)
  const [formCategoryId, setFormCategoryId] = useState(urlCategoryId)
  const [formSupplierId, setFormSupplierId] = useState(urlSupplierId)
  const [dateError, setDateError] = useState('')

  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
  const [categories, setCategories] = useState<MaterialCategoryResponse[]>([])
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([])
  const [rows, setRows] = useState<PurchasePriceDriftRow[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingRows, setLoadingRows] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoadingOptions(true)
    void Promise.all([
      inventoryService.getWarehouses({ active: true }).catch(() => []),
      inventoryService.getMaterialCategories({ active: true }).catch(() => []),
      inventoryService.getSuppliers({ active: true }).catch(() => []),
    ])
      .then(([whData, catData, supData]) => {
        setWarehouses(whData)
        setCategories(catData)
        setSuppliers(supData)
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
        supplierId: urlSupplierId || undefined,
      }
      const data = await reportService.getReportRows<PurchasePriceDriftRow>(
        '/api/inventory/reports/purchase-price-drift',
        filters,
      )
      setRows(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setRows([])
    } finally {
      setLoadingRows(false)
    }
  }, [urlDateFrom, urlDateTo, urlWarehouseId, urlCategoryId, urlSupplierId, t])

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
    if (formSupplierId) params.supplierId = formSupplierId

    setSearchParams(params)
  }

  const handleEditFilters = () => {
    setFormDateFrom(urlDateFrom)
    setFormDateTo(urlDateTo)
    setFormWarehouseId(urlWarehouseId)
    setFormCategoryId(urlCategoryId)
    setFormSupplierId(urlSupplierId)
    setSearchParams({})
  }

  const priceIncreasesCount = useMemo(() => {
    return rows.filter((r) => (parseFloat(r.priceChange) || 0) > 0).length
  }, [rows])

  const priceDecreasesCount = useMemo(() => {
    return rows.filter((r) => (parseFloat(r.priceChange) || 0) < 0).length
  }, [rows])

  const filterSentence = useMemo(() => {
    const selectedWh = warehouses.find((w) => String(w.id) === urlWarehouseId)
    const selectedCat = categories.find((c) => String(c.id) === urlCategoryId)
    const selectedSup = suppliers.find((s) => String(s.id) === urlSupplierId)

    const whText = selectedWh ? (locale === 'ar' ? selectedWh.nameAr || selectedWh.name : selectedWh.name) : t('reports.filters.allWarehouses')
    const catText = selectedCat ? (locale === 'ar' ? selectedCat.nameAr || selectedCat.nameEn || selectedCat.name : selectedCat.nameEn || selectedCat.name) : t('reports.filters.allCategories')
    const supText = selectedSup ? (locale === 'ar' ? selectedSup.nameAr || selectedSup.name : selectedSup.name) : t('reports.filters.allSuppliers')

    return locale === 'ar'
      ? `مفلتر حسب المستودع ${whText}، المجموعة ${catText}، المورد ${supText}. مرتب حسب نسبة التغير مطلقاً تنازلياً.`
      : `Filtered by warehouse ${whText}, group ${catText}, supplier ${supText}. Sorted by absolute percentage change descending.`
  }, [warehouses, categories, suppliers, urlWarehouseId, urlCategoryId, urlSupplierId, locale, t])

  const exportColumns = useMemo(
    () => [
      { key: 'materialCode', labelKey: t('reports.columns.materialId') },
      { key: 'materialName', labelKey: t('reports.columns.materialName') },
      { key: 'changePercent', labelKey: t('reports.columns.changePercent') },
      { key: 'firstPrice', labelKey: t('reports.columns.firstPrice') },
      { key: 'lastPrice', labelKey: t('reports.columns.lastPrice') },
      { key: 'priceChange', labelKey: t('reports.columns.priceChange') },
      { key: 'purchaseCount', labelKey: t('reports.columns.purchaseCount') },
    ],
    [t],
  )

  if (!hasFilterParams) {
    return (
      <ListPage className="reports-page">
        <div className="report-filter-screen">
          <div className="report-header-block">
            <div className="report-header-block__top">
              <div className="report-header-block__title-group">
                <h1 className="report-header-block__title">{t('reports.purchasePriceDrift')}</h1>
                <span className="report-header-block__code-badge">{t('reports.code.purchasePriceDrift')}</span>
              </div>
            </div>
            <p className="report-header-block__method">{t('reports.purchasePriceDrift.subtitle')}</p>
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

              <div className="report-filter-field">
                <label>{t('reports.filters.supplier')}</label>
                <select
                  value={formSupplierId}
                  onChange={(e) => setFormSupplierId(e.target.value)}
                  disabled={loadingOptions}
                >
                  <option value="">{t('reports.filters.allSuppliers')}</option>
                  {suppliers
                    .filter((s) => s.active)
                    .map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {locale === 'ar' ? s.nameAr || s.name : s.name}
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
            <h1 className="report-header-block__title">{t('reports.purchasePriceDrift')}</h1>
            <span className="report-header-block__code-badge">{t('reports.code.purchasePriceDrift')}</span>
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
              onClick={() => exportCsv(exportColumns, rows, 'purchase-price-drift-report')}
              disabled={loadingRows || rows.length === 0}
            >
              <Download size={16} />
              {t('reports.actions.exportCsv')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => exportPdf(exportColumns, rows, 'purchase-price-drift-report', t('reports.purchasePriceDrift'))}
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
          <span className="report-summary-item__label">{t('reports.summary.priceDriftCount')}</span>
          <span className="report-summary-item__val">{rows.length}</span>
        </div>
        <div className="report-summary-item">
          <span className="report-summary-item__label">{t('reports.summary.priceIncreases')}</span>
          <span className="report-summary-item__val" style={{ color: 'var(--color-danger, #dc2626)' }}>
            {priceIncreasesCount}
          </span>
        </div>
        <div className="report-summary-item">
          <span className="report-summary-item__label">{t('reports.summary.priceDecreases')}</span>
          <span className="report-summary-item__val" style={{ color: 'var(--color-success, #059669)' }}>
            {priceDecreasesCount}
          </span>
        </div>
      </div>

      <ListCard>
        {loadingRows ? (
          <div className="list-card-content">
            <p className="list-loading-message" role="status">
              {t('reports.loading')}
            </p>
            <LoadingRows columns={7} />
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
                  <th className="report-cell--numeric">{t('reports.columns.changePercent')}</th>
                  <th className="report-cell--numeric">{t('reports.columns.firstPrice')}</th>
                  <th className="report-cell--numeric">{t('reports.columns.lastPrice')}</th>
                  <th className="report-cell--numeric">{t('reports.columns.priceChange')}</th>
                  <th className="report-cell--numeric">{t('reports.columns.purchaseCount')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const firstPrice = parseFloat(row.firstPrice) || 0
                  const lastPrice = parseFloat(row.lastPrice) || 0
                  const priceChange = parseFloat(row.priceChange) || 0
                  const hasPercent = row.changePercent != null && row.changePercent !== ''
                  const pctValue = hasPercent ? parseFloat(row.changePercent as string) : 0
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
                      <td className="report-cell--text">
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                          <strong>{materialName}</strong>
                          {isInactive && (
                            <span className="report-marker--inactive">{t('reports.markers.inactive')}</span>
                          )}
                        </div>
                      </td>
                      <td className="report-cell--numeric">
                        {hasPercent ? (
                          <span
                            dir="ltr"
                            style={{
                              unicodeBidi: 'isolate',
                              fontWeight: 700,
                              fontSize: '1rem',
                              color: pctValue > 0 ? 'var(--color-danger, #dc2626)' : pctValue < 0 ? 'var(--color-success, #059669)' : 'var(--color-text)',
                            }}
                          >
                            {formatPercent(pctValue)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-secondary)' }}>
                            {t('reports.markers.notAvailable')}
                          </span>
                        )}
                      </td>
                      <td className="report-cell--numeric">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                            {formatMoneyNumber(firstPrice)} / {row.uomSymbol}
                          </span>
                          <span className="report-uom-muted" dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                            {row.firstPurchaseDate}
                          </span>
                        </div>
                      </td>
                      <td className="report-cell--numeric">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                            {formatMoneyNumber(lastPrice)} / {row.uomSymbol}
                          </span>
                          <span className="report-uom-muted" dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                            {row.lastPurchaseDate}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`report-cell--numeric report-cell--value ${
                          priceChange > 0
                            ? 'report-cell--negative'
                            : priceChange < 0
                              ? 'report-cell--positive'
                              : ''
                        }`}
                      >
                        <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                          {formatSignedMoney(priceChange)}
                        </span>
                      </td>
                      <td className="report-cell--numeric">
                        <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                          {row.purchaseCount}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="report-totals-row">
                  <td colSpan={6}>
                    {t('reports.totals.lines', { count: rows.length })}
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
