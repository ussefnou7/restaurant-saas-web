import { ArrowLeft, Filter, RefreshCw } from 'lucide-react'
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
import * as branchService from '../../../services/branchService'
import * as salesReportService from '../../../services/salesReportService'
import * as userService from '../../../services/userService'
import type { BranchResponse } from '../../../types/branch'
import type { OrderTypeFilter, SalesByProductRow, SalesFilterParams } from '../../../types/reports'
import type { UserResponse } from '../../../types/user'
import { translateApiError } from '../../../utils/errors'

function formatMoneyNumber(value: number): string {
  return Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDecimalQuantity(value: string | number): string {
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  if (Number.isNaN(num)) return String(value)
  return Math.abs(num).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
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

export function SalesByProductReport() {
  const { t, locale } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const urlDateFrom = searchParams.get('dateFrom') ?? ''
  const urlDateTo = searchParams.get('dateTo') ?? ''
  const urlBranchId = searchParams.get('branchId') ?? ''
  const urlCashierUserId = searchParams.get('cashierUserId') ?? ''
  const urlOrderType = (searchParams.get('orderType') as OrderTypeFilter) ?? ''

  const hasFilterParams = Boolean(urlDateFrom && urlDateTo)

  const [formDateFrom, setFormDateFrom] = useState(urlDateFrom)
  const [formDateTo, setFormDateTo] = useState(urlDateTo)
  const [formBranchId, setFormBranchId] = useState(urlBranchId)
  const [formCashierUserId, setFormCashierUserId] = useState(urlCashierUserId)
  const [formOrderType, setFormOrderType] = useState<OrderTypeFilter | ''>(urlOrderType)
  const [dateError, setDateError] = useState('')

  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [rows, setRows] = useState<SalesByProductRow[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingRows, setLoadingRows] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoadingOptions(true)
    void Promise.all([
      branchService.getBranches().catch(() => []),
      userService.getUsers().catch(() => []),
    ])
      .then(([branchData, userData]) => {
        setBranches(branchData)
        setUsers(userData)
      })
      .finally(() => setLoadingOptions(false))
  }, [])

  const loadRows = useCallback(async () => {
    if (!urlDateFrom || !urlDateTo) return

    setLoadingRows(true)
    setError('')
    try {
      const filters: SalesFilterParams = {
        dateFrom: urlDateFrom,
        dateTo: urlDateTo,
        branchId: urlBranchId || undefined,
        cashierUserId: urlCashierUserId || undefined,
        orderType: urlOrderType || undefined,
      }
      const data = await salesReportService.getSalesByProduct(filters)
      setRows(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setRows([])
    } finally {
      setLoadingRows(false)
    }
  }, [urlDateFrom, urlDateTo, urlBranchId, urlCashierUserId, urlOrderType, t])

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
    if (formBranchId) params.branchId = formBranchId
    if (formCashierUserId) params.cashierUserId = formCashierUserId
    if (formOrderType) params.orderType = formOrderType

    setSearchParams(params)
  }

  const handleEditFilters = () => {
    setFormDateFrom(urlDateFrom)
    setFormDateTo(urlDateTo)
    setFormBranchId(urlBranchId)
    setFormCashierUserId(urlCashierUserId)
    setFormOrderType(urlOrderType)
    setSearchParams({})
  }

  const totalQuantity = useMemo(() => {
    return rows.reduce((sum, r) => sum + (parseFloat(r.quantitySold) || 0), 0)
  }, [rows])

  const totalRevenue = useMemo(() => {
    return rows.reduce((sum, r) => sum + (parseFloat(r.revenue) || 0), 0)
  }, [rows])

  const topProduct = useMemo(() => {
    if (rows.length === 0) return { name: '-', share: '0.0' }
    const top = rows[0]
    const sharePct = parseFloat(top.revenueSharePercent) || 0
    return { name: top.productName, share: sharePct.toFixed(1) }
  }, [rows])

  const filterSentence = useMemo(() => {
    const selectedBranch = branches.find((b) => String(b.id) === urlBranchId)
    const selectedUser = users.find((u) => String(u.id) === urlCashierUserId)

    const branchText = selectedBranch ? (locale === 'ar' ? selectedBranch.nameAr || selectedBranch.name : selectedBranch.name) : t('reports.filters.allBranches')
    const userText = selectedUser ? selectedUser.fullName : t('reports.filters.allCashiers')
    const orderTypeText = urlOrderType ? t(`orders.type.${urlOrderType}`) : t('reports.filters.allOrderTypes')

    return locale === 'ar'
      ? `مفلتر حسب الفرع ${branchText}، المستخدم ${userText}، نوع الطلب ${orderTypeText}. مرتب حسب الإيراد (قبل الضريبة) تنازلياً.`
      : `Filtered by branch ${branchText}, user ${userText}, order type ${orderTypeText}. Sorted by pre-tax revenue descending.`
  }, [branches, users, urlBranchId, urlCashierUserId, urlOrderType, locale, t])

  if (!hasFilterParams) {
    return (
      <ListPage className="reports-page">
        <div className="report-filter-screen">
          <div className="report-header-block">
            <div className="report-header-block__top">
              <div className="report-header-block__title-group">
                <h1 className="report-header-block__title">{t('reports.salesByProduct')}</h1>
                <span className="report-header-block__code-badge">{t('reports.code.salesByProduct')}</span>
              </div>
            </div>
            <p className="report-header-block__method">{t('reports.salesByProduct.subtitle')}</p>
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
                <label>{t('reports.filters.branch')}</label>
                <select
                  value={formBranchId}
                  onChange={(e) => setFormBranchId(e.target.value)}
                  disabled={loadingOptions}
                >
                  <option value="">{t('reports.filters.allBranches')}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {locale === 'ar' ? b.nameAr || b.name : b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="report-filter-field">
                <label>{t('reports.filters.cashier')}</label>
                <select
                  value={formCashierUserId}
                  onChange={(e) => setFormCashierUserId(e.target.value)}
                  disabled={loadingOptions}
                >
                  <option value="">{t('reports.filters.allCashiers')}</option>
                  {users.map((u) => (
                    <option key={u.id} value={String(u.id)}>
                      {u.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="report-filter-field">
                <label>{t('reports.filters.orderType')}</label>
                <select
                  value={formOrderType}
                  onChange={(e) => setFormOrderType(e.target.value as OrderTypeFilter | '')}
                  disabled={loadingOptions}
                >
                  <option value="">{t('reports.filters.allOrderTypes')}</option>
                  <option value="DINE_IN">{t('orders.type.DINE_IN')}</option>
                  <option value="TAKEAWAY">{t('orders.type.TAKEAWAY')}</option>
                  <option value="DELIVERY">{t('orders.type.DELIVERY')}</option>
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
            <h1 className="report-header-block__title">{t('reports.salesByProduct')}</h1>
            <span className="report-header-block__code-badge">{t('reports.code.salesByProduct')}</span>
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
          <span className="report-summary-item__label">{t('reports.summary.totalRevenue')}</span>
          <span className="report-summary-item__val">
            <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
              {formatMoneyNumber(totalRevenue)}
            </span>
            <span className="report-summary-item__val-unit">{locale === 'ar' ? 'ج.م' : 'EGP'}</span>
          </span>
        </div>
        <div className="report-summary-item">
          <span className="report-summary-item__label">{t('reports.summary.totalProductsSold')}</span>
          <span className="report-summary-item__val">{formatDecimalQuantity(totalQuantity)}</span>
        </div>
        <div className="report-summary-item">
          <span className="report-summary-item__label">
            {t('reports.summary.topProduct', { name: topProduct.name })}
          </span>
          <span className="report-summary-item__val">
            <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>{topProduct.share}%</span>
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
                  <th className="report-cell--text">{t('reports.columns.productName')}</th>
                  <th className="report-cell--numeric">{t('reports.columns.quantitySold')}</th>
                  <th className="report-cell--numeric">{t('reports.columns.revenuePreTax')}</th>
                  <th className="report-cell--numeric">{t('reports.columns.revenueShare')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const rev = parseFloat(row.revenue) || 0
                  const sharePct = Math.min(100, Math.max(0, parseFloat(row.revenueSharePercent) || 0))

                  return (
                    <tr key={`${row.productId}-${idx}`}>
                      <td className="report-cell--text" dir="ltr" style={{ unicodeBidi: 'isolate', textAlign: 'start' }}>
                        <strong>{row.productName}</strong>
                      </td>
                      <td className="report-cell--numeric">
                        <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                          {formatDecimalQuantity(row.quantitySold)}
                        </span>
                      </td>
                      <td className="report-cell--numeric report-cell--value">
                        <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                          {formatMoneyNumber(rev)}
                        </span>
                      </td>
                      <td className="report-cell--numeric">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <div
                            style={{
                              width: '60px',
                              height: '6px',
                              borderRadius: '3px',
                              background: 'var(--color-surface-hover, #e2e8f0)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${sharePct}%`,
                                height: '100%',
                                background: 'var(--color-primary)',
                              }}
                            />
                          </div>
                          <span dir="ltr" style={{ unicodeBidi: 'isolate', fontWeight: 600 }}>
                            {formatPercent(sharePct)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="report-totals-row">
                  <td>{t('reports.totals.lines', { count: rows.length })}</td>
                  <td className="report-cell--numeric">{formatDecimalQuantity(totalQuantity)}</td>
                  <td className="report-cell--numeric report-cell--value">
                    <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                      {formatMoneyNumber(totalRevenue)}
                    </span>
                  </td>
                  <td className="report-cell--numeric">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </ListCard>
    </ListPage>
  )
}
