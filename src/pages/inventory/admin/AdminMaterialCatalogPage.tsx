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
import { SelectFilter } from '../../../components/ui/SelectFilter'
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
import type { MaterialCatalogResponse } from '../../../types/inventory'
import { translateApiError } from '../../../utils/errors'
import { isSysAdmin } from '../../../utils/inventoryAccess'
import { displayArabicName, getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { getDisplayUomLabel, getStockUomLabel } from '../../../utils/inventoryUom'
import { AdminInventoryAccessDenied } from './AdminInventoryAccessDenied'
import { AdminMaterialCatalogFormModal } from './AdminMaterialCatalogFormModal'
import { useAdminInventoryLookups } from './useAdminInventoryLookups'

type StatusFilter = 'all' | 'active' | 'inactive'

export function AdminMaterialCatalogPage() {
  const { t, locale } = useTranslation()
  const notify = useNotify()
  const canAccess = isSysAdmin()
  const { categories, uoms } = useAdminInventoryLookups()

  const [items, setItems] = useState<MaterialCatalogResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [uomId, setUomId] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<MaterialCatalogResponse | null>(null)
  const [rowActionId, setRowActionId] = useState<number | null>(null)

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminInventoryService.getAdminMaterialCatalog({
        search: search.trim() || undefined,
        categoryId: categoryId || undefined,
        uomId: uomId || undefined,
        active: statusFilter === 'all' ? undefined : statusFilter === 'active',
      })
      setItems(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [categoryId, search, statusFilter, t, uomId])

  useEffect(() => {
    if (!canAccess) return
    const timer = window.setTimeout(() => void loadCatalog(), 300)
    return () => window.clearTimeout(timer)
  }, [canAccess, loadCatalog])

  const categoryFilterOptions = [
    { value: '', label: t('inventory.common.allCategories') },
    ...categories.map((c) => ({
      value: String(c.id),
      label: getInventoryLocalizedName(c, locale),
    })),
  ]

  const uomFilterOptions = [
    { value: '', label: t('inventory.common.allUoms') },
    ...uoms.map((u) => ({
      value: String(u.id),
      label: getInventoryLocalizedName(u, locale),
    })),
  ]

  function openCreate() {
    setModalMode('create')
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(item: MaterialCatalogResponse) {
    setModalMode('edit')
    setEditing(item)
    setModalOpen(true)
  }

  async function handleToggleStatus(item: MaterialCatalogResponse) {
    setRowActionId(item.id)
    try {
      if (item.active) {
        await adminInventoryService.deactivateAdminMaterialCatalog(item.id)
        notify.success(t('inventory.toast.deactivateSuccess'))
      } else {
        await adminInventoryService.activateAdminMaterialCatalog(item.id)
        notify.success(t('inventory.toast.activateSuccess'))
      }
      await loadCatalog()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setRowActionId(null)
    }
  }

  if (!canAccess) return <AdminInventoryAccessDenied />

  const showEmpty = !loading && !error && items.length === 0
  const showTable = !loading && !error && items.length > 0

  return (
    <ListPage className="admin-material-catalog-page">
      <PageHeader
        title={t('inventory.admin.catalog.title')}
        description={t('inventory.admin.catalog.subtitle')}
        action={<ListPrimaryAction label={t('inventory.admin.catalog.add')} onClick={openCreate} />}
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('inventory.admin.catalog.listTitle')}
          toolbar={
            <>
              <ListToolbarSearch
                value={search}
                onChange={setSearch}
                placeholder={t('common.search')}
                ariaLabel={t('common.search')}
              />
              <SelectFilter
                value={categoryId}
                onChange={setCategoryId}
                options={categoryFilterOptions}
                ariaLabel={t('inventory.col.category')}
              />
              <SelectFilter
                value={uomId}
                onChange={setUomId}
                options={uomFilterOptions}
                ariaLabel={t('inventory.col.defaultUom')}
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
          loadingMessage={t('inventory.admin.catalog.loading')}
          loadingColumns={7}
          showEmpty={showEmpty}
          emptyTitle={t('inventory.admin.catalog.empty.title')}
          emptyDescription={t('inventory.admin.catalog.empty.subtitle')}
          emptyActionLabel={t('inventory.admin.catalog.add')}
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
                  <Th>{t('inventory.col.category')}</Th>
                  <Th>{t('inventory.col.displayUom')}</Th>
                  <Th>{t('inventory.col.stockUom')}</Th>
                  <Th column="status">{t('common.status')}</Th>
                  <Th>{t('inventory.col.actions')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => {
                  const busy = rowActionId === item.id
                  return (
                    <TableRow key={item.id}>
                      <Td column="entity">
                        <EntityCell
                          name={getInventoryLocalizedName(item, locale)}
                          code={item.code}
                          compact
                        />
                      </Td>
                      <Td dir="rtl">
                        {displayArabicName(item.nameAr, t('common.empty.dash'))}
                      </Td>
                      <Td>{item.categoryName ?? t('common.empty.dash')}</Td>
                      <Td>{getDisplayUomLabel(item, locale, uoms)}</Td>
                      <Td className="text-muted text-sm">
                        {getStockUomLabel(item, locale, uoms)}
                      </Td>
                      <StopPropagationCell column="status">
                        <StatusToggle
                          active={item.active}
                          disabled={busy}
                          entityName={item.name}
                          onToggle={() => void handleToggleStatus(item)}
                        />
                      </StopPropagationCell>
                      <StopPropagationCell>
                        <TableRowActions
                          onEdit={() => openEdit(item)}
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

      <AdminMaterialCatalogFormModal
        open={modalOpen}
        mode={modalMode}
        item={editing}
        categories={categories}
        uoms={uoms}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          notify.success(
            modalMode === 'create'
              ? t('inventory.toast.createSuccess')
              : t('inventory.toast.updateSuccess'),
          )
          void loadCatalog()
        }}
      />
    </ListPage>
  )
}
