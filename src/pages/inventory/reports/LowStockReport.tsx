import { Download, FileText, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import * as branchService from '../../../services/branchService'
import * as inventoryService from '../../../services/inventoryService'
import * as reportService from '../../../services/reportService'
import type { BranchResponse } from '../../../types/branch'
import type { MaterialCategoryResponse, WarehouseResponse } from '../../../types/inventory'
import type { LowStockRow, ReportFilters } from '../../../types/reports'
import { getLocalizedBranchName } from '../../../utils/branchDisplay'
import { translateApiError } from '../../../utils/errors'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { exportCsv, exportPdf } from '../../../utils/reportExport'

function formatDecimalQuantity(value: string | number): string {
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  if (Number.isNaN(num)) return String(value)
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
}

export function LowStockReport() {
  const { t, locale } = useTranslation()

  const [filters, setFilters] = useState<ReportFilters>({
    branchId: '',
    warehouseId: '',
    categoryId: '',
  })

  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
  const [categories, setCategories] = useState<MaterialCategoryResponse[]>([])
  const [rows, setRows] = useState<LowStockRow[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingRows, setLoadingRows] = useState(true)
  const [error, setError] = useState('')
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null)

  const loadRows = useCallback(async () => {
    setLoadingRows(true)
    setError('')
    try {
      const data = await reportService.getReportRows<LowStockRow>(
        '/api/inventory/reports/low-stock',
        filters,
      )
      // Sort by shortfall descending by default
      const sorted = [...data].sort((a, b) => (parseFloat(b.shortfall) || 0) - (parseFloat(a.shortfall) || 0))
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
      branchService.getBranches().catch(() => []),
      inventoryService.getMaterialCategories({ active: true }).catch(() => []),
    ])
      .then(([branchData, categoryData]) => {
        setBranches(branchData)
        setCategories(categoryData)
      })
      .finally(() => setLoadingOptions(false))
  }, [])

  useEffect(() => {
    if (!filters.branchId) {
      setWarehouses([])
      return
    }
    void inventoryService
      .getWarehouses({ branchId: filters.branchId, active: true })
      .then((data) => {
        setWarehouses(data)
        setFilters((current) =>
          current.warehouseId && !data.some((wh) => String(wh.id) === current.warehouseId)
            ? { ...current, warehouseId: '' }
            : current,
        )
      })
      .catch(() => setWarehouses([]))
  }, [filters.branchId])

  useEffect(() => {
    void loadRows()
  }, [loadRows])

  // Summary Metrics
  const materialsBelowMinCount = rows.length
  const outOfStockCount = useMemo(() => {
    return rows.filter((r) => (parseFloat(r.quantity) || 0) <= 0).length
  }, [rows])

  const categoryGroupsCount = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => set.add(r.categoryName || ''))
    return set.size
  }, [rows])

  const affectedWarehousesCount = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => set.add(r.warehouseName || ''))
    return set.size
  }, [rows])

  const filterSentence = useMemo(() => {
    const selectedBranch = branches.find((b) => String(b.id) === filters.branchId)
    const selectedWh = warehouses.find((w) => String(w.id) === filters.warehouseId)
    const selectedCat = categories.find((c) => String(c.id) === filters.categoryId)

    const branchText = selectedBranch ? getLocalizedBranchName(selectedBranch, locale) : t('reports.filters.allBranches')
    const whText = selectedWh ? (locale === 'ar' ? selectedWh.nameAr || selectedWh.name : selectedWh.name) : t('reports.filters.allWarehouses')
    const catText = selectedCat ? (locale === 'ar' ? selectedCat.nameAr || selectedCat.nameEn || selectedCat.name : selectedCat.nameEn || selectedCat.name) : t('reports.filters.allCategories')

    return locale === 'ar'
      ? `مفلتر حسب الفرع ${branchText}، المستودع ${whText}، المجموعة ${catText}. مرتب حسب النقص، تنازلياً.`
      : `Filtered by branch ${branchText}, warehouse ${whText}, group ${catText}. Sorted by shortfall, descending.`
  }, [branches, warehouses, categories, filters, locale, t])

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
      ? `مقيم مقارنة بالحد الأدنى بتاريخ ${timestamp} · ${whCount} مستودع`
      : `Evaluated against minimum thresholds as of ${timestamp} · ${whCount} warehouse(s)`
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
      { key: 'minQuantity', labelKey: t('reports.columns.minQuantity') },
      { key: 'shortfall', labelKey: t('reports.columns.shortfall') },
    ],
    [t],
  )

  return (
    <ListPage className="reports-page">
      <div className="report-header-block">
        <div className="report-header-block__top">
          <div className="report-header-block__title-group">
            <h1 className="report-header-block__title">{t('reports.lowStock')}</h1>
            <span className="report-header-block__code-badge">{t('reports.code.lowStock')}</span>
          </div>
          <div className="reports-page__actions">
            <Button variant="secondary" onClick={loadRows} disabled={loadingRows}>
              <RefreshCw size={16} />
              {t('reports.actions.refresh')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => exportCsv(exportColumns, rows, 'low-stock')}
              disabled={loadingRows || rows.length === 0}
            >
              <Download size={16} />
              {t('reports.actions.exportCsv')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => exportPdf(exportColumns, rows, 'low-stock', t('reports.lowStock'))}
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
          <span className="report-summary-item__label">{t('reports.summary.materialsBelowMin')}</span>
          <span className="report-summary-item__val">{materialsBelowMinCount}</span>
        </div>
        <div className="report-summary-item">
          <span className="report-summary-item__label">{t('reports.summary.outOfStock')}</span>
          <span className="report-summary-item__val">{outOfStockCount}</span>
        </div>
        <div className="report-summary-item">
          <span className="report-summary-item__label">{t('reports.summary.materialGroups')}</span>
          <span className="report-summary-item__val">{categoryGroupsCount}</span>
        </div>
        <div className="report-summary-item">
          <span className="report-summary-item__label">{t('reports.filters.allWarehouses')}</span>
          <span className="report-summary-item__val">{affectedWarehousesCount}</span>
        </div>
      </div>

      <ListCard>
        <ListCardHeader
          title={t('reports.filters.title')}
          toolbar={
            <div className="report-filter-bar">
              <SelectFilter
                value={filters.branchId || ''}
                onChange={(branchId) => setFilters((prev) => ({ ...prev, branchId, warehouseId: '' }))}
                options={[
                  { value: '', label: t('reports.filters.allBranches') },
                  ...branches.filter((b) => b.active).map((b) => ({
                    value: String(b.id),
                    label: getLocalizedBranchName(b, locale),
                  })),
                ]}
                ariaLabel={t('reports.filters.branch')}
                disabled={loadingOptions}
              />
              <SelectFilter
                value={filters.warehouseId || ''}
                onChange={(warehouseId) => setFilters((prev) => ({ ...prev, warehouseId }))}
                options={
                  filters.branchId
                    ? [
                        { value: '', label: t('reports.filters.allWarehouses') },
                        ...warehouses.map((wh) => ({
                          value: String(wh.id),
                          label: locale === 'ar' ? wh.nameAr || wh.name : wh.name,
                        })),
                      ]
                    : [{ value: '', label: t('reports.filters.selectBranchFirst') }]
                }
                ariaLabel={t('reports.filters.warehouse')}
                disabled={!filters.branchId || loadingOptions}
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
                  <th style={{ textAlign: 'end' }}>{t('reports.columns.minQuantity')}</th>
                  <th style={{ textAlign: 'end' }}>{t('reports.columns.shortfall')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
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
                  const minQty = formatDecimalQuantity(row.minQuantity)
                  const shortfall = formatDecimalQuantity(row.shortfall)

                  return (
                    <tr key={`${row.materialId}-${row.warehouseId}-${idx}`}>
                      <td>
                        <strong>{matName}</strong>
                      </td>
                      <td>{catName}</td>
                      <td>{whName}</td>
                      <td className="report-cell--numeric">{qty}</td>
                      <td className="report-cell--numeric">{minQty}</td>
                      <td className="report-cell--numeric report-cell--value">{shortfall}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="report-totals-row">
                  <td colSpan={6}>
                    {t('reports.totals.lines', { count: materialsBelowMinCount })}
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
