import { useCallback, useEffect, useState } from 'react'
import { EntityCell } from '../../../components/ui/EntityCell'
import { StatusToggle } from '../../../components/ui/StatusToggle'
import { useNotify } from '../../../components/ui/NotificationContext'
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
  ListPrimaryAction,
  ListToolbarSearch,
  StatusFilterSelect,
} from '../../../components/ui/ListPage'
import { PageHeader } from '../../../components/ui/PageHeader'
import { TableRowActions } from '../../../components/ui/TableRowActions'
import {
  DataTable,
  StopPropagationCell,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../../components/ui/Table'
import { useTranslation } from '../../../i18n/useTranslation'
import * as adminInventoryService from '../../../services/adminInventoryService'
import type { AdminMaterialCategoryResponse } from '../../../types/inventory'
import { translateApiError } from '../../../utils/errors'
import { isSysAdmin } from '../../../utils/inventoryAccess'
import { displayArabicName, getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { AdminInventoryAccessDenied } from './AdminInventoryAccessDenied'
import { AdminMaterialCategoryFormModal } from './AdminMaterialCategoryFormModal'

type StatusFilter = 'all' | 'active' | 'inactive'

export function AdminMaterialCategoriesPage() {
  const { t, locale } = useTranslation()
  const notify = useNotify()
  const canAccess = isSysAdmin()

  const [categories, setCategories] = useState<AdminMaterialCategoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<AdminMaterialCategoryResponse | null>(null)
  const [rowActionId, setRowActionId] = useState<number | null>(null)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminInventoryService.getAdminMaterialCategories({
        search: search.trim() || undefined,
        active: statusFilter === 'all' ? undefined : statusFilter === 'active',
      })
      setCategories(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, t])

  useEffect(() => {
    if (!canAccess) return
    const timer = window.setTimeout(() => void loadCategories(), 300)
    return () => window.clearTimeout(timer)
  }, [canAccess, loadCategories])

  function openCreate() {
    setModalMode('create')
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(category: AdminMaterialCategoryResponse) {
    setModalMode('edit')
    setEditing(category)
    setModalOpen(true)
  }

  async function handleToggleStatus(category: AdminMaterialCategoryResponse) {
    setRowActionId(category.id)
    try {
      if (category.active) {
        await adminInventoryService.deactivateAdminMaterialCategory(category.id)
        notify.success(t('inventory.toast.deactivateSuccess'))
      } else {
        await adminInventoryService.activateAdminMaterialCategory(category.id)
        notify.success(t('inventory.toast.activateSuccess'))
      }
      await loadCategories()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setRowActionId(null)
    }
  }

  if (!canAccess) return <AdminInventoryAccessDenied />

  const showEmpty = !loading && !error && categories.length === 0
  const showTable = !loading && !error && categories.length > 0

  return (
    <ListPage className="admin-material-categories-page">
      <PageHeader
        title={t('inventory.admin.categories.title')}
        description={t('inventory.admin.categories.subtitle')}
        action={
          <ListPrimaryAction label={t('inventory.admin.categories.add')} onClick={openCreate} />
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('inventory.admin.categories.listTitle')}
          toolbar={
            <>
              <ListToolbarSearch
                value={search}
                onChange={setSearch}
                placeholder={t('common.search')}
                ariaLabel={t('common.search')}
              />
              <StatusFilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                ariaLabel={t('common.status')}
              />
            </>
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('inventory.admin.categories.loading')}
          loadingColumns={5}
          showEmpty={showEmpty}
          emptyTitle={t('inventory.admin.categories.empty.title')}
          emptyDescription={t('inventory.admin.categories.empty.subtitle')}
          emptyActionLabel={t('inventory.admin.categories.add')}
          onEmptyAction={openCreate}
          showFilterEmpty={false}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="entity">{t('inventory.col.name')}</Th>
                  <Th>{t('inventory.col.nameAr')}</Th>
                  <Th>{t('inventory.categories.fields.sortOrder')}</Th>
                  <Th column="status">{t('common.status')}</Th>
                  <Th>{t('inventory.col.actions')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => {
                  const busy = rowActionId === category.id
                  return (
                    <TableRow key={category.id}>
                      <Td column="entity">
                        <EntityCell
                          name={getInventoryLocalizedName(category, locale)}
                          code={category.code}
                          compact
                        />
                      </Td>
                      <Td dir="rtl">
                        {displayArabicName(category.nameAr, t('common.empty.dash'))}
                      </Td>
                      <Td>{category.sortOrder ?? t('common.empty.dash')}</Td>
                      <StopPropagationCell column="status">
                        <StatusToggle
                          active={category.active}
                          disabled={busy}
                          entityName={category.name}
                          onToggle={() => void handleToggleStatus(category)}
                        />
                      </StopPropagationCell>
                      <StopPropagationCell>
                        <TableRowActions
                          onEdit={() => openEdit(category)}
                          disabled={busy}
                          menuItems={[]}
                        />
                      </StopPropagationCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>

      <AdminMaterialCategoryFormModal
        open={modalOpen}
        mode={modalMode}
        category={editing}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          notify.success(
            modalMode === 'create'
              ? t('inventory.toast.createSuccess')
              : t('inventory.toast.updateSuccess'),
          )
          void loadCategories()
        }}
      />
    </ListPage>
  )
}
