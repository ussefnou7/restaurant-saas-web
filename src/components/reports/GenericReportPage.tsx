import { Download, FileText, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import {
  ListCard,
  ListCardBody,
  ListCardHeader,
  ListPage,
} from '../ui/ListPage'
import { LoadingRows } from '../ui/LoadingRows'
import { PageHeader } from '../ui/PageHeader'
import { ReportFilterBar } from './ReportFilterBar'
import { ReportTable } from './ReportTable'
import { useTranslation } from '../../i18n/useTranslation'
import { authService } from '../../services/authService'
import * as branchService from '../../services/branchService'
import * as inventoryService from '../../services/inventoryService'
import * as reportService from '../../services/reportService'
import type { BranchResponse } from '../../types/branch'
import type { MaterialCategoryResponse, WarehouseResponse } from '../../types/inventory'
import type { ReportConfig, ReportFilters, ReportRow } from '../../types/reports'
import { exportCsv, exportPdf } from '../../utils/reportExport'
import { translateApiError } from '../../utils/errors'

type GenericReportPageProps = {
  config: ReportConfig
}

const initialFilters: ReportFilters = {
  branchId: '',
  warehouseId: '',
  categoryId: '',
  dateFrom: '',
  dateTo: '',
}

function hasPermission(permission: string): boolean {
  const user = authService.getAuthUser()
  if (!user) return false
  if (user.roleCode === 'SYS_ADMIN' || user.roleCode === 'OWNER') return true
  return user.permissions.includes(permission)
}

function localizeColumns(config: ReportConfig, t: (key: string) => string) {
  return config.columns.map((column) => ({
    ...column,
    label: t(column.label),
  }))
}

export function GenericReportPage({ config }: GenericReportPageProps) {
  const { t } = useTranslation()
  const canView = hasPermission(config.permission)
  const [filters, setFilters] = useState<ReportFilters>(initialFilters)
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
  const [categories, setCategories] = useState<MaterialCategoryResponse[]>([])
  const [rows, setRows] = useState<ReportRow[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingRows, setLoadingRows] = useState(true)
  const [error, setError] = useState('')

  const loadRows = useCallback(async () => {
    if (!canView) return
    setLoadingRows(true)
    setError('')
    try {
      const data = await reportService.getReportRows<ReportRow>(config.endpoint, filters)
      setRows(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setRows([])
    } finally {
      setLoadingRows(false)
    }
  }, [canView, config.endpoint, filters, t])

  useEffect(() => {
    if (!canView) return
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
  }, [canView])

  useEffect(() => {
    if (!canView) return
    if (!filters.branchId) {
      setWarehouses([])
      return
    }
    void inventoryService
      .getWarehouses({ branchId: filters.branchId, active: true })
      .then((data) => {
        setWarehouses(data)
        setFilters((current) =>
          current.warehouseId && !data.some((warehouse) => String(warehouse.id) === current.warehouseId)
            ? { ...current, warehouseId: '' }
            : current,
        )
      })
      .catch(() => setWarehouses([]))
  }, [canView, filters.branchId])

  useEffect(() => {
    void loadRows()
  }, [loadRows])

  const exportColumns = useMemo(() => localizeColumns(config, t), [config, t])

  if (!canView) {
    return (
      <ListPage className="reports-page">
        <PageHeader title={t(config.titleKey)} description={t('reports.accessDenied')} />
      </ListPage>
    )
  }

  return (
    <ListPage className="reports-page">
      <PageHeader
        title={t(config.titleKey)}
        description={t('reports.stockValuation.subtitle')}
        action={
          <div className="reports-page__actions">
            <Button variant="secondary" onClick={loadRows} disabled={loadingRows}>
              <RefreshCw size={16} />
              {t('reports.actions.refresh')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => exportCsv(exportColumns, rows, config.id)}
              disabled={loadingRows || rows.length === 0}
            >
              <Download size={16} />
              {t('reports.actions.exportCsv')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => exportPdf(exportColumns, rows, config.id, t(config.titleKey))}
              disabled={loadingRows || rows.length === 0}
            >
              <FileText size={16} />
              {t('reports.actions.exportPdf')}
            </Button>
          </div>
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('reports.filters.title')}
          toolbar={
            <ReportFilterBar
              filters={config.filters}
              values={filters}
              branches={branches}
              warehouses={warehouses}
              categories={categories}
              loadingOptions={loadingOptions}
              onChange={setFilters}
            />
          }
        />
        {loadingRows ? (
          <div className="list-card-content">
            <p className="list-loading-message" role="status">
              {t('reports.loading')}
            </p>
            <LoadingRows columns={config.columns.length} />
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
            <ReportTable columns={config.columns} rows={rows} paginated={config.paginated} />
          </div>
        )}
      </ListCard>
    </ListPage>
  )
}
