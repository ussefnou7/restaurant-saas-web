import { AlertCircle, Download, FileText, RefreshCw } from 'lucide-react'
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
import { PageHeader } from '../../../components/ui/PageHeader'
import { SelectFilter } from '../../../components/ui/SelectFilter'
import {
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../../components/ui/Table'
import { useTranslation } from '../../../i18n/useTranslation'
import * as inventoryService from '../../../services/inventoryService'
import * as reportService from '../../../services/reportService'
import type { MaterialCategoryResponse, WarehouseResponse } from '../../../types/inventory'
import type { ReportFilters, ShrinkageRow } from '../../../types/reports'
import { translateApiError } from '../../../utils/errors'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { exportCsv, exportPdf } from '../../../utils/reportExport'

function getDefaultDateRange(): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return {
    dateFrom: `${year}-${month}-01`,
    dateTo: `${year}-${month}-${day}`,
  }
}

function formatDecimalString(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-'
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  if (Number.isNaN(num)) return String(value)
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
}

function formatCurrencyValue(value: number, locale: string): string {
  const absolute = Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const signedText = value < 0 ? `-${absolute}` : value > 0 ? `+${absolute}` : absolute
  return locale === 'ar' ? `${signedText} ج.م` : `EGP ${signedText}`
}

export function ShrinkageReport() {
  const { t, locale } = useTranslation()
  const defaultDates = useMemo(() => getDefaultDateRange(), [])

  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: defaultDates.dateFrom,
    dateTo: defaultDates.dateTo,
    warehouseId: '',
    categoryId: '',
    negativesOnly: false,
  })

  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
  const [categories, setCategories] = useState<MaterialCategoryResponse[]>([])
  const [rows, setRows] = useState<ShrinkageRow[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingRows, setLoadingRows] = useState(true)
  const [error, setError] = useState('')

  const loadRows = useCallback(async () => {
    if (!filters.dateFrom || !filters.dateTo) {
      setRows([])
      setLoadingRows(false)
      return
    }
    setLoadingRows(true)
    setError('')
    try {
      const data = await reportService.getReportRows<ShrinkageRow>(
        '/api/inventory/reports/shrinkage',
        filters,
      )
      setRows(data)
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

  const totalNetValue = useMemo(() => {
    return rows.reduce((sum, row) => sum + (parseFloat(row.netValue) || 0), 0)
  }, [rows])

  const affectedMaterialsCount = rows.length

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

  const isDateRangeMissing = !filters.dateFrom || !filters.dateTo

  return (
    <ListPage className="reports-page">
      <PageHeader
        title={t('reports.shrinkage')}
        description={t('reports.shrinkage.subtitle')}
        action={
          <div className="reports-page__actions">
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
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <div className="report-summary-bar">
        <div className="report-summary-card">
          <span className="report-summary-card__title">{t('reports.summary.totalNetValue')}</span>
          <span className="report-summary-card__value" dir="ltr">
            {formatCurrencyValue(totalNetValue, locale)}
          </span>
        </div>
        <div className="report-summary-card">
          <span className="report-summary-card__title">{t('reports.summary.affectedMaterials')}</span>
          <span className="report-summary-card__value">{affectedMaterialsCount}</span>
        </div>
      </div>

      <ListCard>
        <ListCardHeader
          title={t('reports.filters.title')}
          toolbar={
            <div className="report-filter-bar">
              <div className="report-filter-bar__date-range">
                <label className="report-filter-bar__date-field">
                  <span>{t('reports.filters.dateFrom')}</span>
                  <input
                    type="date"
                    dir="ltr"
                    value={filters.dateFrom || ''}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </label>
                <label className="report-filter-bar__date-field">
                  <span>{t('reports.filters.dateTo')}</span>
                  <input
                    type="date"
                    dir="ltr"
                    value={filters.dateTo || ''}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                  />
                </label>
              </div>

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
                  ...categories.filter((cat) => cat.active).map((cat) => ({
                    value: String(cat.id),
                    label: locale === 'ar' ? cat.nameAr || cat.nameEn || cat.name : cat.nameEn || cat.name,
                  })),
                ]}
                ariaLabel={t('reports.filters.category')}
                disabled={loadingOptions}
              />

              <label className="report-filter-bar__checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(filters.negativesOnly)}
                  onChange={(e) => setFilters((prev) => ({ ...prev, negativesOnly: e.target.checked }))}
                />
                <span>{t('reports.filters.negativesOnly')}</span>
              </label>
            </div>
          }
        />

        {loadingRows ? (
          <div className="list-card-content">
            <p className="list-loading-message" role="status">
              {t('reports.loading')}
            </p>
            <LoadingRows columns={4} />
          </div>
        ) : isDateRangeMissing ? (
          <ListCardBody>
            <EmptyState
              title={t('reports.empty.missingDateRangeTitle')}
              description={t('reports.empty.missingDateRangeSubtitle')}
              variant="filter"
            />
          </ListCardBody>
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
            <DataTable className="report-table">
              <TableHead>
                <TableRow>
                  <Th>{t('reports.columns.materialName')}</Th>
                  <Th>{t('reports.columns.netQuantity')}</Th>
                  <Th>{t('reports.columns.netValue')}</Th>
                  <Th>{t('reports.columns.movementCount')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
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
                    <TableRow key={row.materialId}>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                          <span>{materialName}</span>
                          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                            ({row.materialCode})
                          </span>
                          {isInactive && (
                            <span className="report-marker--inactive">{t('reports.markers.inactive')}</span>
                          )}
                        </div>
                      </Td>
                      <Td dir="ltr" cellAlign="end">
                        {isUnconvertible ? (
                          <span className="report-marker--unconvertible" title={t('reports.markers.unconvertibleUomTooltip')}>
                            <AlertCircle size={14} />
                            {t('reports.markers.unconvertibleUom')}
                          </span>
                        ) : (
                          `${formatDecimalString(row.netQuantity)} ${row.uomSymbol ?? ''}`.trim()
                        )}
                      </Td>
                      <Td
                        dir="ltr"
                        cellAlign="end"
                        className={`report-table__cell--value ${
                          numValue > 0
                            ? 'report-table__cell--positive'
                            : 'report-table__cell--negative'
                        }`}
                      >
                        {formatCurrencyValue(numValue, locale)}
                      </Td>
                      <Td dir="ltr" cellAlign="end">
                        {row.movementCount}
                      </Td>
                    </TableRow>
                  )
                })}
              </TableBody>
            </DataTable>
          </div>
        )}
      </ListCard>
    </ListPage>
  )
}
