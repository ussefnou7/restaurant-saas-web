import { useCallback, useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { EntityCell } from '../../components/ui/EntityCell'
import { StatusToggle } from '../../components/ui/StatusToggle'
import { useNotify } from '../../components/ui/NotificationContext'
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
  ListPrimaryAction,
  ListToolbarSearch,
  StatusFilterSelect,
} from '../../components/ui/ListPage'
import { PageHeader } from '../../components/ui/PageHeader'
import { TableRowActions } from '../../components/ui/TableRowActions'
import {
  DataTable,
  StopPropagationCell,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../components/ui/Table'
import { useTranslation } from '../../i18n/useTranslation'
import * as inventoryService from '../../services/inventoryService'
import type { MaterialCategoryResponse } from '../../types/inventory'
import { translateApiError } from '../../utils/errors'
import { canManageInventorySetup, canViewInventorySetup } from '../../utils/inventoryAccess'
import { displayArabicName, getInventoryLocalizedName } from '../../utils/inventoryDisplay'
import { InventoryAccessDenied } from './InventoryAccessDenied'
import { MaterialCategoryFormModal } from './MaterialCategoryFormModal'

type StatusFilter = 'all' | 'active' | 'inactive'

export function MaterialCategoriesPage() {
  const { t, locale } = useTranslation()
  const notify = useNotify()
  const canView = canViewInventorySetup()
  const canManage = canManageInventorySetup()

  const [categories, setCategories] = useState<MaterialCategoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<MaterialCategoryResponse | null>(null)
  const [rowActionId, setRowActionId] = useState<number | null>(null)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await inventoryService.getMaterialCategories({
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
    if (!canView) return
    const timer = window.setTimeout(() => void loadCategories(), 300)
    return () => window.clearTimeout(timer)
  }, [canView, loadCategories])

  function openCreate() {
    setModalMode('create')
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(category: MaterialCategoryResponse) {
    if (category.global) return
    setModalMode('edit')
    setEditing(category)
    setModalOpen(true)
  }

  async function handleToggleStatus(category: MaterialCategoryResponse) {
    if (!canManage || category.global) return
    setRowActionId(category.id)
    try {
      if (category.active) {
        await inventoryService.deactivateMaterialCategory(category.id)
        notify.success(t('inventory.toast.deactivateSuccess'))
      } else {
        await inventoryService.activateMaterialCategory(category.id)
        notify.success(t('inventory.toast.activateSuccess'))
      }
      await loadCategories()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setRowActionId(null)
    }
  }

  if (!canView) return <InventoryAccessDenied />

  const showEmpty = !loading && !error && categories.length === 0
  const showTable = !loading && !error && categories.length > 0

  return (
    <ListPage className="material-categories-page">
      <PageHeader
        title={t('inventory.categories.title')}
        description={t('inventory.categories.subtitle')}
        action={
          canManage ? (
            <ListPrimaryAction label={t('inventory.categories.add')} onClick={openCreate} />
          ) : undefined
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('inventory.categories.listTitle')}
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
          loadingMessage={t('inventory.categories.loading')}
          loadingColumns={5}
          showEmpty={showEmpty}
          emptyTitle={t('inventory.categories.empty.title')}
          emptyDescription={t('inventory.categories.empty.subtitle')}
          emptyActionLabel={canManage ? t('inventory.categories.add') : undefined}
          onEmptyAction={canManage ? openCreate : undefined}
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
                  <Th>{t('inventory.col.type')}</Th>
                  <Th column="status">{t('common.status')}</Th>
                  <Th>{t('inventory.categories.fields.sortOrder')}</Th>
                  {canManage ? <Th>{t('inventory.col.actions')}</Th> : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => {
                  const busy = rowActionId === category.id
                  const isGlobal = category.global
                  const canEditRow = canManage && !isGlobal

                  return (
                    <TableRow
                      key={category.id}
                      className={isGlobal ? 'table-row--global' : undefined}
                    >
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
                      <Td>
                        <Badge variant={isGlobal ? 'muted' : 'success'}>
                          {isGlobal
                            ? t('inventory.common.global')
                            : t('inventory.common.custom')}
                        </Badge>
                      </Td>
                      <StopPropagationCell column="status">
                        {canEditRow ? (
                          <StatusToggle
                            active={category.active}
                            disabled={busy}
                            entityName={category.name}
                            onToggle={() => void handleToggleStatus(category)}
                          />
                        ) : (
                          <Badge variant={category.active ? 'success' : 'inactive'}>
                            {category.active
                              ? t('common.status.active')
                              : t('common.status.inactive')}
                          </Badge>
                        )}
                      </StopPropagationCell>
                      <Td>{category.sortOrder ?? t('common.empty.dash')}</Td>
                      {canManage ? (
                        <StopPropagationCell>
                          {canEditRow ? (
                            <TableRowActions
                              onEdit={() => openEdit(category)}
                              disabled={busy}
                              menuItems={[]}
                            />
                          ) : (
                            <span className="text-muted text-sm">
                              {t('inventory.categories.globalReadOnly')}
                            </span>
                          )}
                        </StopPropagationCell>
                      ) : null}
                    </TableRow>
                  )
                })}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>

      <MaterialCategoryFormModal
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
