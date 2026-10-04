import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Pencil, Plus, Power, PowerOff } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ClearFiltersButton } from '../../components/ui/ClearFiltersButton'
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
  ListToolbarSearch,
} from '../../components/ui/ListPage'
import { useNotify } from '../../components/ui/NotificationContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectFilter } from '../../components/ui/SelectFilter'
import { useTranslation } from '../../i18n/useTranslation'
import * as expenseService from '../../services/expenseService'
import type { ExpenseCategoryResponse } from '../../types/expense'
import { translateApiError } from '../../utils/errors'
import { useCanManageExpenseCategories, useCanViewExpenses } from '../../utils/expenseAccess'
import { ExpenseCategoryFormModal } from './ExpenseCategoryFormModal'

type StatusFilter = 'all' | 'active' | 'inactive'

export function ExpenseCategoriesPage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const notify = useNotify()

  const canView = useCanViewExpenses()
  const canManage = useCanManageExpenseCategories()

  const [categories, setCategories] = useState<ExpenseCategoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingCategory, setEditingCategory] = useState<ExpenseCategoryResponse | null>(null)
  const [actionId, setActionId] = useState<number | null>(null)

  const loadCategories = useCallback(async () => {
    if (!canView) return
    setLoading(true)
    setError('')
    try {
      const data = await expenseService.getExpenseCategories()
      setCategories(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [canView, t])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => {
        if (search.trim()) {
          const q = search.trim().toLowerCase()
          const matchesName = cat.name.toLowerCase().includes(q)
          const matchesNameAr = cat.nameAr ? cat.nameAr.toLowerCase().includes(q) : false
          if (!matchesName && !matchesNameAr) return false
        }

        if (statusFilter === 'active' && !cat.active) return false
        if (statusFilter === 'inactive' && cat.active) return false

        return true
      })
      .sort((a, b) => {
        // Sort by current locale
        const nameA = locale === 'ar' && a.nameAr ? a.nameAr : a.name
        const nameB = locale === 'ar' && b.nameAr ? b.nameAr : b.name
        return nameA.localeCompare(nameB, locale)
      })
  }, [categories, search, statusFilter, locale])

  function handleOpenCreate() {
    setModalMode('create')
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  function handleOpenEdit(cat: ExpenseCategoryResponse) {
    setModalMode('edit')
    setEditingCategory(cat)
    setIsModalOpen(true)
  }

  async function handleToggleStatus(cat: ExpenseCategoryResponse) {
    if (!canManage) return
    setActionId(cat.id)
    try {
      if (cat.active) {
        await expenseService.deactivateExpenseCategory(cat.id)
        notify.success(t('expenses.categories.deactivateSuccess'))
      } else {
        await expenseService.activateExpenseCategory(cat.id)
        notify.success(t('expenses.categories.activateSuccess'))
      }
      void loadCategories()
    } catch (err) {
      notify.error(translateApiError(err, t).message)
    } finally {
      setActionId(null)
    }
  }

  function handleModalSuccess() {
    setIsModalOpen(false)
    void loadCategories()
  }

  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft

  if (!canView) {
    return (
      <div className="expenses-page">
        <PageHeader title={t('expenses.categories.title')} />
        <div className="page-error-banner">{t('common.accessDenied')}</div>
      </div>
    )
  }

  const hasFilters = Boolean(search || statusFilter !== 'all')

  return (
    <ListPage className="expenses-page">
      <PageHeader
        title={t('expenses.categories.title')}
        description={t('expenses.categories.subtitle')}
        actions={
          <div className="page-header__actions">
            <Button variant="secondary" onClick={() => navigate('/expenses')}>
              <BackIcon size={16} aria-hidden />
              {t('expenses.categories.backToExpenses')}
            </Button>
            {canManage ? (
              <Button onClick={handleOpenCreate}>
                <Plus size={16} aria-hidden />
                {t('expenses.categories.new')}
              </Button>
            ) : null}
          </div>
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('expenses.categories.title')}
          toolbar={
            <div className="expenses-toolbar">
              <ListToolbarSearch
                value={search}
                onChange={setSearch}
                placeholder={t('expenses.categories.filters.search')}
                ariaLabel={t('expenses.categories.filters.search')}
              />
              <SelectFilter
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as StatusFilter)}
                options={[
                  { value: 'all', label: t('expenses.filters.allStatuses') },
                  { value: 'active', label: t('expenses.categories.statusActive') },
                  { value: 'inactive', label: t('expenses.categories.statusInactive') },
                ]}
                ariaLabel={t('expenses.filters.status')}
              />
              {hasFilters ? (
                <ClearFiltersButton
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('all')
                  }}
                />
              ) : null}
            </div>
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('common.loading')}
          loadingColumns={4}
          showEmpty={!loading && categories.length === 0 && !hasFilters}
          emptyTitle={t('expenses.categories.empty.title')}
          emptyDescription={t('expenses.categories.empty.description')}
          emptyActionLabel={canManage ? t('expenses.categories.new') : undefined}
          onEmptyAction={canManage ? handleOpenCreate : undefined}
          showFilterEmpty={!loading && filteredCategories.length === 0 && hasFilters}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={!loading && filteredCategories.length > 0}
          table={
            <div className="expenses-table-wrap expenses-table-wrap--categories">
              <table className="expenses-table">
                <colgroup>
                  <col style={{ width: '260px' }} />
                  <col style={{ width: '260px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: 'var(--expenses-actions-width, 160px)' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="expenses-table__th">{t('expenses.categories.nameEn')}</th>
                    <th className="expenses-table__th">{t('expenses.categories.nameAr')}</th>
                    <th className="expenses-table__th">{t('expenses.columns.status')}</th>
                    <th className="expenses-table__th expenses-table__th--actions">
                      {t('expenses.columns.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((cat) => {
                    const isBusy = actionId === cat.id

                    return (
                      <tr key={cat.id} className="expenses-table__row">
                        <td className="expenses-table__cell" title={cat.name}>
                          <strong>{cat.name}</strong>
                        </td>
                        <td className="expenses-table__cell" dir="rtl" title={cat.nameAr || ''}>
                          {cat.nameAr || '-'}
                        </td>
                        <td className="expenses-table__cell">
                          <Badge variant={cat.active ? 'success' : 'inactive'}>
                            {cat.active
                              ? t('expenses.categories.statusActive')
                              : t('expenses.categories.statusInactive')}
                          </Badge>
                        </td>
                        <td className="expenses-table__cell expenses-table__td--actions">
                          {canManage ? (
                            <div className="expenses-table__actions">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEdit(cat)}
                                aria-label={t('expenses.categories.edit')}
                                title={t('expenses.categories.edit')}
                              >
                                <Pencil size={15} aria-hidden />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isBusy}
                                onClick={() => void handleToggleStatus(cat)}
                                aria-label={
                                  cat.active
                                    ? t('expenses.categories.deactivate')
                                    : t('expenses.categories.activate')
                                }
                                title={
                                  cat.active
                                    ? t('expenses.categories.deactivate')
                                    : t('expenses.categories.activate')
                                }
                              >
                                {cat.active ? (
                                  <PowerOff size={15} aria-hidden />
                                ) : (
                                  <Power size={15} aria-hidden />
                                )}
                              </Button>
                            </div>
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
      </ListCard>

      {isModalOpen ? (
        <ExpenseCategoryFormModal
          isOpen={isModalOpen}
          mode={modalMode}
          category={editingCategory}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      ) : null}
    </ListPage>
  )
}
