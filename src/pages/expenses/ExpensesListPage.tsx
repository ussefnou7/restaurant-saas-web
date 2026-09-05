import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Ban, FolderKanban, Plus } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ClearFiltersButton } from '../../components/ui/ClearFiltersButton'
import { DatePicker } from '../../components/ui/DatePicker'
import { ListPagination } from '../../components/ui/ListPagination'
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
  ListToolbarSearch,
} from '../../components/ui/ListPage'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectFilter } from '../../components/ui/SelectFilter'
import { useTranslation } from '../../i18n/useTranslation'
import * as branchService from '../../services/branchService'
import * as expenseService from '../../services/expenseService'
import type { BranchResponse } from '../../types/branch'
import type {
  ExpenseCategoryResponse,
  ExpenseListParams,
  ExpensePaymentSource,
  ExpenseResponse,
  ExpenseStatus,
} from '../../types/expense'
import { getLocalizedBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'
import { canCreateExpense, canViewExpenses, canVoidExpense } from '../../utils/expenseAccess'
import { getExpenseCategoryDisplayName } from '../../utils/expenseDisplay'
import { formatDate, formatMoney } from '../../utils/format'
import { ExpenseCreateModal } from './ExpenseCreateModal'
import { ExpenseVoidModal } from './ExpenseVoidModal'

const PAGE_SIZE = 20

export function ExpensesListPage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const canView = canViewExpenses()
  const canCreate = canCreateExpense()
  const canVoid = canVoidExpense()

  // URL-reflected filters
  const search = searchParams.get('search') ?? ''
  const dateFrom = searchParams.get('dateFrom') ?? ''
  const dateTo = searchParams.get('dateTo') ?? ''
  const branchFilter = searchParams.get('branch') ?? '' // '' (all), 'company' (unbranched), or numeric id
  const categoryId = searchParams.get('categoryId') ?? ''
  const paymentSource = (searchParams.get('paymentSource') ?? '') as ExpensePaymentSource | ''
  const status = (searchParams.get('status') ?? '') as ExpenseStatus | ''
  const page = Math.max(0, Number(searchParams.get('page') ?? '0') || 0)

  // Data states
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([])
  const [categories, setCategories] = useState<ExpenseCategoryResponse[]>([])
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [voidingExpense, setVoidingExpense] = useState<ExpenseResponse | null>(null)

  const hasFilters = Boolean(
    search || dateFrom || dateTo || branchFilter || categoryId || paymentSource || status,
  )

  const updateFilters = useCallback(
    (updates: Record<string, string>, resetPage = true) => {
      const next = new URLSearchParams(searchParams)
      Object.entries(updates).forEach(([key, value]) => {
        if (value) next.set(key, value)
        else next.delete(key)
      })
      if (resetPage) next.delete('page')
      setSearchParams(next)
    },
    [searchParams, setSearchParams],
  )

  // Load branches & categories for filter pickers
  useEffect(() => {
    if (!canView) return
    void Promise.all([
      branchService.getBranches().then(setBranches).catch(() => setBranches([])),
      expenseService.getExpenseCategories().then(setCategories).catch(() => setCategories([])),
    ])
  }, [canView])

  // Load expenses list
  const loadExpenses = useCallback(async () => {
    if (!canView) return
    setLoading(true)
    setError('')
    try {
      // Build request params adhering strictly to Trap 4 and Trap 3
      const params: ExpenseListParams = {
        page,
        size: PAGE_SIZE,
      }

      if (branchFilter === 'company') {
        params.unbranchedOnly = true
      } else if (branchFilter) {
        params.branchId = Number(branchFilter)
      }

      if (categoryId) {
        params.categoryId = Number(categoryId)
      }
      if (dateFrom) {
        params.dateFrom = dateFrom
      }
      if (dateTo) {
        params.dateTo = dateTo
      }
      if (paymentSource) {
        params.paymentSource = paymentSource
      }
      if (status) {
        params.status = status
      }
      if (search.trim()) {
        params.search = search.trim()
      }

      // Note: sort is intentionally omitted to preserve default stable pagination (Trap 3)
      const data = await expenseService.getExpenses(params)
      setExpenses(data.content)
      setTotalPages(data.totalPages)
      setTotalElements(data.totalElements)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setExpenses([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }, [
    canView,
    page,
    branchFilter,
    categoryId,
    dateFrom,
    dateTo,
    paymentSource,
    status,
    search,
    t,
  ])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadExpenses(), 150)
    return () => window.clearTimeout(timer)
  }, [loadExpenses])

  // Sorted categories for display in filter
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const nameA = getExpenseCategoryDisplayName(a, locale)
      const nameB = getExpenseCategoryDisplayName(b, locale)
      return nameA.localeCompare(nameB, locale)
    })
  }, [categories, locale])

  // Branch filter options (All, Company-level, and individual branches)
  const branchOptions = useMemo(() => {
    return [
      { value: '', label: t('expenses.filters.allBranches') },
      { value: 'company', label: t('expenses.filters.companyLevelOnly') },
      ...branches.map((b) => ({
        value: String(b.id),
        label: getLocalizedBranchName(b, locale),
      })),
    ]
  }, [branches, locale, t])

  const categoryOptions = useMemo(() => {
    return [
      { value: '', label: t('expenses.filters.allCategories') },
      ...sortedCategories.map((c) => ({
        value: String(c.id),
        label: getExpenseCategoryDisplayName(c, locale),
      })),
    ]
  }, [sortedCategories, locale, t])

  const paymentSourceOptions = useMemo(() => {
    return [
      { value: '', label: t('expenses.filters.allPaymentSources') },
      { value: 'CASH_DRAWER', label: t('expenses.paymentSource.CASH_DRAWER') },
      { value: 'CASH_ON_HAND', label: t('expenses.paymentSource.CASH_ON_HAND') },
      { value: 'BANK', label: t('expenses.paymentSource.BANK') },
    ]
  }, [t])

  const statusOptions = useMemo(() => {
    return [
      { value: '', label: t('expenses.filters.allStatuses') },
      { value: 'ACTIVE', label: t('expenses.status.ACTIVE') },
      { value: 'VOIDED', label: t('expenses.status.VOIDED') },
    ]
  }, [t])

  function handleCreateSuccess() {
    setIsCreateOpen(false)
    void loadExpenses()
  }

  function handleVoidSuccess() {
    setVoidingExpense(null)
    void loadExpenses()
  }

  if (!canView) {
    return (
      <div className="expenses-page">
        <PageHeader title={t('expenses.title')} />
        <div className="page-error-banner">{t('common.accessDenied')}</div>
      </div>
    )
  }

  return (
    <ListPage className="expenses-page">
      <PageHeader
        title={t('expenses.title')}
        subtitle={t('expenses.subtitle')}
        actions={
          <div className="page-header__actions">
            <Button
              variant="secondary"
              onClick={() => navigate('/expenses/categories')}
            >
              <FolderKanban size={16} aria-hidden />
              {t('expenses.categories.manage')}
            </Button>
            {canCreate ? (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus size={16} aria-hidden />
                {t('expenses.create.button')}
              </Button>
            ) : null}
          </div>
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('expenses.title')}
          toolbar={
            <div className="expenses-filter-grid">
              <ListToolbarSearch
                value={search}
                onChange={(val) => updateFilters({ search: val })}
                placeholder={t('expenses.filters.search')}
                ariaLabel={t('expenses.filters.search')}
              />
              <SelectFilter
                value={branchFilter}
                onChange={(val) => updateFilters({ branch: val })}
                options={branchOptions}
                ariaLabel={t('expenses.filters.branch')}
              />
              <SelectFilter
                value={categoryId}
                onChange={(val) => updateFilters({ categoryId: val })}
                options={categoryOptions}
                ariaLabel={t('expenses.filters.category')}
              />
              <SelectFilter
                value={paymentSource}
                onChange={(val) => updateFilters({ paymentSource: val })}
                options={paymentSourceOptions}
                ariaLabel={t('expenses.filters.paymentSource')}
              />
              <SelectFilter
                value={status}
                onChange={(val) => updateFilters({ status: val })}
                options={statusOptions}
                ariaLabel={t('expenses.filters.status')}
              />
              <DatePicker
                value={dateFrom}
                placeholder={t('expenses.filters.dateFrom')}
                ariaLabel={t('expenses.filters.dateFrom')}
                maxDate={dateTo || undefined}
                onChange={(val) => {
                  updateFilters({
                    dateFrom: val,
                    dateTo: dateTo && val > dateTo ? '' : dateTo,
                  })
                }}
              />
              <DatePicker
                value={dateTo}
                placeholder={t('expenses.filters.dateTo')}
                ariaLabel={t('expenses.filters.dateTo')}
                minDate={dateFrom || undefined}
                onChange={(val) => updateFilters({ dateTo: val })}
              />
              {hasFilters ? (
                <ClearFiltersButton onClick={() => setSearchParams({})} />
              ) : null}
            </div>
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('common.loading')}
          loadingColumns={9}
          showEmpty={!loading && totalElements === 0 && !hasFilters}
          emptyTitle={t('expenses.empty.title')}
          emptyDescription={t('expenses.empty.description')}
          emptyActionLabel={canCreate ? t('expenses.create.button') : undefined}
          onEmptyAction={canCreate ? () => setIsCreateOpen(true) : undefined}
          showFilterEmpty={!loading && totalElements === 0 && hasFilters}
          filterEmptyTitle={t('expenses.emptyFilter.title')}
          filterEmptyDescription={t('expenses.emptyFilter.description')}
          showTable={!loading && totalElements > 0}
          table={
            <div className="expenses-table-wrap">
              <table className="expenses-table">
                <colgroup>
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '180px' }} />
                  <col style={{ width: '160px' }} />
                  <col style={{ width: '230px' }} />
                  <col style={{ width: '160px' }} />
                  <col style={{ width: '130px' }} />
                  <col style={{ width: '130px' }} />
                  <col style={{ width: '100px' }} />
                  <col style={{ width: '110px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="expenses-table__th">{t('expenses.columns.date')}</th>
                    <th className="expenses-table__th">{t('expenses.columns.category')}</th>
                    <th className="expenses-table__th">{t('expenses.columns.branch')}</th>
                    <th className="expenses-table__th">{t('expenses.columns.description')}</th>
                    <th className="expenses-table__th">{t('expenses.columns.payee')}</th>
                    <th className="expenses-table__th expenses-table__th--numeric">
                      {t('expenses.columns.amount')}
                    </th>
                    <th className="expenses-table__th">{t('expenses.columns.paymentSource')}</th>
                    <th className="expenses-table__th">{t('expenses.columns.status')}</th>
                    <th className="expenses-table__th expenses-table__th--actions">
                      {t('expenses.columns.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => {
                    const isVoided = exp.status === 'VOIDED'
                    const branchDisplay =
                      exp.branchId == null ? (
                        <span className="expenses-table__cell--company">
                          {t('expenses.branch.companyLevel')}
                        </span>
                      ) : (
                        exp.branchName || '-'
                      )

                    return (
                      <tr
                        key={exp.id}
                        className={`expenses-table__row${
                          isVoided ? ' expenses-table__row--voided' : ''
                        }`}
                      >
                        <td className="expenses-table__cell">
                          {formatDate(exp.expenseDate, locale)}
                        </td>
                        <td className="expenses-table__cell">
                          {getExpenseCategoryDisplayName(exp, locale)}
                        </td>
                        <td className="expenses-table__cell">{branchDisplay}</td>
                        <td className="expenses-table__cell" title={exp.description || ''}>
                          <div>{exp.description || '-'}</div>
                          {isVoided && exp.voidReason ? (
                            <div className="expenses-reason-box">
                              {t('expenses.void.viewReason', { reason: exp.voidReason })}
                            </div>
                          ) : null}
                        </td>
                        <td className="expenses-table__cell">{exp.payeeName || '-'}</td>
                        <td className="expenses-table__cell expenses-table__cell--amount">
                          {formatMoney(exp.amount)}
                        </td>
                        <td className="expenses-table__cell">
                          {t(`expenses.paymentSource.${exp.paymentSource}`)}
                        </td>
                        <td className="expenses-table__cell">
                          <Badge variant={isVoided ? 'neutral' : 'success'}>
                            {t(`expenses.status.${exp.status}`)}
                          </Badge>
                        </td>
                        <td className="expenses-table__cell expenses-table__td--actions">
                          {!isVoided && canVoid ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setVoidingExpense(exp)}
                              aria-label={t('expenses.void.button')}
                              title={t('expenses.void.button')}
                            >
                              <Ban size={15} aria-hidden />
                              <span>{t('expenses.void.button')}</span>
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          }
        />

        <ListPagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={PAGE_SIZE}
          onPageChange={(p) => updateFilters({ page: String(p) }, false)}
          translationPrefix="expenses.pagination"
        />
      </ListCard>

      {isCreateOpen ? (
        <ExpenseCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      ) : null}

      {voidingExpense ? (
        <ExpenseVoidModal
          expense={voidingExpense}
          isOpen={Boolean(voidingExpense)}
          onClose={() => setVoidingExpense(null)}
          onSuccess={handleVoidSuccess}
        />
      ) : null}
    </ListPage>
  )
}
