import { Download, FileText, RefreshCw } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import {
  ListCard,
  ListCardBody,
  ListCardHeader,
  ListPage,
} from '../../../components/ui/ListPage'
import { LoadingRows } from '../../../components/ui/LoadingRows'
import { SelectFilter } from '../../../components/ui/SelectFilter'
import { useTranslation } from '../../../i18n/useTranslation'
import * as inventoryService from '../../../services/inventoryService'
import * as reportService from '../../../services/reportService'
import type { MaterialCategoryResponse, WarehouseResponse } from '../../../types/inventory'
import type { ReportFilters, StockValuationRow } from '../../../types/reports'
import { translateApiError } from '../../../utils/errors'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { exportCsv, exportPdf } from '../../../utils/reportExport'

function formatMoneyNumber(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDecimalQuantity(value: string | number): string {
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  if (Number.isNaN(num)) return String(value)
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
}

type WarehouseGroup = {
  warehouseId: number
  warehouseName: string
  rows: StockValuationRow[]
  subtotalValue: number
}

export function StockValuationReport() {
  const { t, locale } = useTranslation()

  const [filters, setFilters] = useState<ReportFilters>({
    warehouseId: '',
    categoryId: '',
  })

  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
  const [categories, setCategories] = useState<MaterialCategoryResponse[]>([])
  const [rows, setRows] = useState<StockValuationRow[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingRows, setLoadingRows] = useState(true)
  const [error, setError] = useState('')
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null)

  const loadRows = useCallback(async () => {
    setLoadingRows(true)
    setError('')
    try {
      const data = await reportService.getReportRows<StockValuationRow>(
        '/api/inventory/reports/stock-valuation',
        filters,
      )
      const sorted = [...data].sort((a, b) => (parseFloat(b.totalValue) || 0) - (parseFloat(a.totalValue) || 0))
      setRows(sorted)
      setFetchedAt(new Date())
    } catch (err) {
      setError(translateApiError(err, t).message)
      setRows([])
    } finally {
      setLoadingRows(false)
    }
  }, [filters, t])

  useEffect(() => {
    setLoadingOptions(true)
    void Promise.all([
      inventoryService.getWarehouses({ active: true }).catch(() => []),
      inventoryService.getMaterialCategories({ active: true }).catch(() => []),
    ])
      .then(([warehouseData, categoryData]) => {
        setWarehouses(warehouseData)
        setCategories(categoryData)
      })
      .finally(() => setLoadingOptions(false))
  }, [])

  useEffect(() => {
    void loadRows()
  }, [loadRows])

  // Grouping rows by warehouse for per-warehouse subtotals
  const warehouseGroups = useMemo(() => {
    const map = new Map<number, StockValuationRow[]>()
    rows.forEach((row) => {
      const whId = row.warehouseId
      const existing = map.get(whId) || []
      existing.push(row)
      map.set(whId, existing)
    })

    const groups: WarehouseGroup[] = []
    map.forEach((whRows, whId) => {
      const name = locale === 'ar' ? whRows[0]?.warehouseNameAr || whRows[0]?.warehouseName : whRows[0]?.warehouseName
      const subtotalValue = whRows.reduce((sum, r) => sum + (parseFloat(r.totalValue) || 0), 0)
      groups.push({
        warehouseId: whId,
        warehouseName: name || '-',
        rows: whRows,
        subtotalValue,
      })
    })
    return groups
  }, [rows, locale])

  const totalStockValue = useMemo(() => {
    return rows.reduce((sum, r) => sum + (parseFloat(r.totalValue) || 0), 0)
  }, [rows])

  const totalLinesCount = rows.length
  const valuedLinesCount = useMemo(() => {
    return rows.filter((r) => (parseFloat(r.totalValue) || 0) > 0).length
  }, [rows])

  const categoryGroups = useMemo(() => {
    const map = new Map<string, number>()
    rows.forEach((r) => {
      const name = locale === 'ar' ? r.categoryNameAr || r.categoryName : r.categoryName
      const groupName = name || t('reports.unclassified')
      const val = parseFloat(r.totalValue) || 0
      map.set(groupName, (map.get(groupName) || 0) + val)
    })
    return map
  }, [rows, locale, t])

  const largestGroup = useMemo(() => {
    let maxName = ''
    let maxValue = 0
    categoryGroups.forEach((val, name) => {
      if (val > maxValue) {
        maxValue = val
        maxName = name
      }
    })
    const percentage = totalStockValue > 0 ? ((maxValue / totalStockValue) * 100).toFixed(1) : '0.0'
    return { name: maxName || t('reports.unclassified'), value: maxValue, percentage }
  }, [categoryGroups, totalStockValue, t])

  const filterSentence = useMemo(() => {
    const selectedWh = warehouses.find((w) => String(w.id) === filters.warehouseId)
    const selectedCat = categories.find((c) => String(c.id) === filters.categoryId)

    const whText = selectedWh ? (locale === 'ar' ? selectedWh.nameAr || selectedWh.name : selectedWh.name) : t('reports.filters.allWarehouses')
    const catText = selectedCat ? (locale === 'ar' ? selectedCat.nameAr || selectedCat.nameEn || selectedCat.name : selectedCat.nameEn || selectedCat.name) : t('reports.filters.allCategories')

    return locale === 'ar'
      ? `مفلتر حسب المستودع ${whText}، المجموعة ${catText}. مرتب حسب القيمة، تنازلياً.`
      : `Filtered by warehouse ${whText}, group ${catText}. Sorted by value, descending.`
  }, [warehouses, categories, filters, locale, t])

  const methodLine = useMemo(() => {
    const timestamp = fetchedAt
      ? fetchedAt.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-'
    const whCount = filters.warehouseId ? 1 : warehouses.length || 1
    return locale === 'ar'
      ? `مقيم بمتوسط التكلفة المتحرك بتاريخ ${timestamp} · ${whCount} مستودع`
      : `Valued at moving average cost as of ${timestamp} · ${whCount} warehouse(s)`
  }, [fetchedAt, filters.warehouseId, warehouses.length, locale])

  const exportColumns = useMemo(
    () => [
      { key: 'warehouseId', labelKey: t('reports.columns.warehouseId') },
      { key: 'warehouseName', labelKey: t('reports.columns.warehouseName') },
      { key: 'materialId', labelKey: t('reports.columns.materialId') },
      { key: 'materialName', labelKey: t('reports.columns.materialName') },
      { key: 'categoryId', labelKey: t('reports.columns.categoryId') },
      { key: 'categoryName', labelKey: t('reports.columns.categoryName') },
      { key: 'quantity', labelKey: t('reports.columns.quantity') },
      { key: 'averageCost', labelKey: t('reports.columns.averageCost') },
      { key: 'totalValue', labelKey: t('reports.columns.totalValue') },
    ],
    [t],
  )

  const showSubtotals = warehouseGroups.length > 1

  return (
    <ListPage className="reports-page">
      <div className="report-header-block">
        <div className="report-header-block__top">
          <div className="report-header-block__title-group">
            <h1 className="report-header-block__title">{t('reports.stockValuation')}</h1>
          </div>
          <div className="reports-page__actions">
            <Button variant="secondary" onClick={loadRows} disabled={loadingRows}>
              <RefreshCw size={16} />
              {t('reports.actions.refresh')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => exportCsv(exportColumns, rows, 'stock-valuation')}
              disabled={loadingRows || rows.length === 0}
            >
              <Download size={16} />
              {t('reports.actions.exportCsv')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => exportPdf(exportColumns, rows, 'stock-valuation', t('reports.stockValuation'))}
              disabled={loadingRows || rows.length === 0}
            >
              <FileText size={16} />
              {t('reports.actions.exportPdf')}
            </Button>
          </div>
        </div>

        <p className="report-header-block__method">{methodLine}</p>
        <p className="report-header-block__filter-sentence">{filterSentence}</p>
      </div>

      {error ? <div className="page-error-banner">{error}</div> : null}

      <div className="report-summary-strip">
        <div className="report-summary-item">
          <span className="report-summary-item__label">{t('reports.summary.totalStockValue')}</span>
          <span className="report-summary-item__val">
            <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
              {formatMoneyNumber(totalStockValue)}
            </span>
            <span className="report-summary-item__val-unit">{locale === 'ar' ? 'ج.م' : 'EGP'}</span>
          </span>
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
        <div className="report-summary-item">
          <span className="report-summary-item__label">{t('reports.summary.materialGroups')}</span>
          <span className="report-summary-item__val">{categoryGroups.size}</span>
        </div>
        <div className="report-summary-item">
          <span className="report-summary-item__label">
            {t('reports.summary.concentration', { group: largestGroup.name })}
          </span>
          <span className="report-summary-item__val">
            <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>{largestGroup.percentage}%</span>{' '}
            <span className="report-summary-item__sub" dir="ltr" style={{ unicodeBidi: 'isolate' }}>
              {formatMoneyNumber(largestGroup.value)}
            </span>
          </span>
        </div>
      </div>

      <ListCard>
        <ListCardHeader
          title={t('reports.filters.title')}
          toolbar={
            <div className="report-filter-bar">
              <SelectFilter
                value={filters.warehouseId || ''}
                onChange={(warehouseId) => setFilters((prev) => ({ ...prev, warehouseId }))}
                options={[
                  { value: '', label: t('reports.filters.allWarehouses') },
                  ...warehouses.map((wh) => ({
                    value: String(wh.id),
                    label: locale === 'ar' ? wh.nameAr || wh.name : wh.name,
                  })),
                ]}
                ariaLabel={t('reports.filters.warehouse')}
                disabled={loadingOptions}
              />
              <SelectFilter
                value={filters.categoryId || ''}
                onChange={(categoryId) => setFilters((prev) => ({ ...prev, categoryId }))}
                options={[
                  { value: '', label: t('reports.filters.allCategories') },
                  ...categories.filter((c) => c.active).map((c) => ({
                    value: String(c.id),
                    label: locale === 'ar' ? c.nameAr || c.nameEn || c.name : c.nameEn || c.name,
                  })),
                ]}
                ariaLabel={t('reports.filters.category')}
                disabled={loadingOptions}
              />
            </div>
          }
        />

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
              title={t('reports.empty.title')}
              description={t('reports.empty.subtitle')}
              variant="filter"
            />
          </ListCardBody>
        ) : (
          <div className="list-card-content table-wrap">
            <table className="report-ledger-table">
              <thead>
                <tr>
                  <th>{t('reports.columns.materialName')}</th>
                  <th>{t('reports.columns.categoryName')}</th>
                  <th>{t('reports.columns.warehouseName')}</th>
                  <th style={{ textAlign: 'end' }}>{t('reports.columns.quantity')}</th>
                  <th style={{ textAlign: 'end' }}>{t('reports.columns.averageCost')}</th>
                  <th style={{ textAlign: 'end' }}>{t('reports.columns.totalValue')}</th>
                </tr>
              </thead>
              <tbody>
                {showSubtotals
                  ? warehouseGroups.map((group) => (
                      <React.Fragment key={group.warehouseId}>
                        {group.rows.map((row, idx) => {
                          const matName = getInventoryLocalizedName(
                            {
                              name: row.materialName,
                              nameAr: row.materialNameAr ?? undefined,
                            },
                            locale,
                          )
                          const catName =
                            (locale === 'ar' ? row.categoryNameAr || row.categoryName : row.categoryName) ||
                            t('reports.unclassified')
                          const whName =
                            (locale === 'ar' ? row.warehouseNameAr || row.warehouseName : row.warehouseName) ||
                            '-'

                          const qty = formatDecimalQuantity(row.quantity)
                          const avgCost = formatMoneyNumber(parseFloat(row.averageCost) || 0)
                          const totVal = formatMoneyNumber(parseFloat(row.totalValue) || 0)

                          return (
                            <tr key={`${row.materialId}-${row.warehouseId}-${idx}`}>
                              <td>
                                <strong>{matName}</strong>
                              </td>
                              <td>{catName}</td>
                              <td>{whName}</td>
                              <td className="report-cell--numeric">{qty}</td>
                              <td className="report-cell--numeric">{avgCost}</td>
                              <td className="report-cell--numeric report-cell--value">{totVal}</td>
                            </tr>
                          )
                        })}
                        <tr style={{ background: 'var(--color-surface-hover, #f8fafc)', fontWeight: 600 }}>
                          <td colSpan={5} style={{ fontStyle: 'italic' }}>
                            {locale === 'ar' ? `المجموع الفرعي — ${group.warehouseName}` : `Subtotal — ${group.warehouseName}`}
                          </td>
                          <td className="report-cell--numeric report-cell--value">
                            {formatMoneyNumber(group.subtotalValue)}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))
                  : rows.map((row, idx) => {
                      const matName = getInventoryLocalizedName(
                        {
                          name: row.materialName,
                          nameAr: row.materialNameAr ?? undefined,
                        },
                        locale,
                      )
                      const catName =
                        (locale === 'ar' ? row.categoryNameAr || row.categoryName : row.categoryName) ||
                        t('reports.unclassified')
                      const whName =
                        (locale === 'ar' ? row.warehouseNameAr || row.warehouseName : row.warehouseName) ||
                        '-'

                      const qty = formatDecimalQuantity(row.quantity)
                      const avgCost = formatMoneyNumber(parseFloat(row.averageCost) || 0)
                      const totVal = formatMoneyNumber(parseFloat(row.totalValue) || 0)

                      return (
                        <tr key={`${row.materialId}-${row.warehouseId}-${idx}`}>
                          <td>
                            <strong>{matName}</strong>
                          </td>
                          <td>{catName}</td>
                          <td>{whName}</td>
                          <td className="report-cell--numeric">{qty}</td>
                          <td className="report-cell--numeric">{avgCost}</td>
                          <td className="report-cell--numeric report-cell--value">{totVal}</td>
                        </tr>
                      )
                    })}
              </tbody>
              <tfoot>
                <tr className="report-totals-row">
                  <td colSpan={5}>
                    {t('reports.totals.lines', { count: totalLinesCount })}
                  </td>
                  <td className="report-cell--numeric report-cell--value">
                    {formatMoneyNumber(totalStockValue)}
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
