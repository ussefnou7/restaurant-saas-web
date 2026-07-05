import { useCallback, useEffect, useState } from 'react'
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
import { Badge } from '../../components/ui/Badge'
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
import type { SupplierResponse } from '../../types/inventory'
import { translateApiError } from '../../utils/errors'
import { canManageInventorySetup, canViewInventorySetup } from '../../utils/inventoryAccess'
import { displayArabicName, getInventoryLocalizedName } from '../../utils/inventoryDisplay'
import { InventoryAccessDenied } from './InventoryAccessDenied'
import { SupplierFormModal } from './SupplierFormModal'

type StatusFilter = 'all' | 'active' | 'inactive'

export function SuppliersPage() {
  const { t, locale } = useTranslation()
  const notify = useNotify()
  const canView = canViewInventorySetup()
  const canManage = canManageInventorySetup()

  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<SupplierResponse | null>(null)
  const [rowActionId, setRowActionId] = useState<number | null>(null)

  const loadSuppliers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await inventoryService.getSuppliers({
        search: search.trim() || undefined,
        active: statusFilter === 'all' ? undefined : statusFilter === 'active',
      })
      setSuppliers(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, t])

  useEffect(() => {
    if (!canView) return
    const timer = window.setTimeout(() => void loadSuppliers(), 300)
    return () => window.clearTimeout(timer)
  }, [canView, loadSuppliers])

  function openCreate() {
    setModalMode('create')
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(supplier: SupplierResponse) {
    setModalMode('edit')
    setEditing(supplier)
    setModalOpen(true)
  }

  async function handleToggleStatus(supplier: SupplierResponse) {
    if (!canManage) return
    setRowActionId(supplier.id)
    try {
      if (supplier.active) {
        await inventoryService.deactivateSupplier(supplier.id)
        notify.success(t('inventory.toast.deactivateSuccess'))
      } else {
        await inventoryService.activateSupplier(supplier.id)
        notify.success(t('inventory.toast.activateSuccess'))
      }
      await loadSuppliers()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setRowActionId(null)
    }
  }

  if (!canView) return <InventoryAccessDenied />

  const showEmpty = !loading && !error && suppliers.length === 0
  const showTable = !loading && !error && suppliers.length > 0

  return (
    <ListPage className="suppliers-page">
      <PageHeader
        title={t('inventory.suppliers.title')}
        description={t('inventory.suppliers.subtitle')}
        action={
          canManage ? (
            <ListPrimaryAction label={t('inventory.suppliers.add')} onClick={openCreate} />
          ) : undefined
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('inventory.suppliers.listTitle')}
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
          loadingMessage={t('inventory.suppliers.loading')}
          loadingColumns={7}
          showEmpty={showEmpty}
          emptyTitle={t('inventory.suppliers.empty.title')}
          emptyDescription={t('inventory.suppliers.empty.subtitle')}
          emptyActionLabel={canManage ? t('inventory.suppliers.add') : undefined}
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
                  <Th>{t('inventory.col.phone')}</Th>
                  <Th>{t('inventory.col.email')}</Th>
                  <Th>{t('inventory.col.taxNumber')}</Th>
                  <Th column="status">{t('common.status')}</Th>
                  {canManage ? <Th>{t('inventory.col.actions')}</Th> : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliers.map((supplier) => {
                  const busy = rowActionId === supplier.id
                  return (
                    <TableRow key={supplier.id}>
                      <Td column="entity">
                        <EntityCell
                          name={getInventoryLocalizedName(supplier, locale)}
                          code={supplier.code}
                          compact
                        />
                      </Td>
                      <Td dir="rtl">
                        {displayArabicName(supplier.nameAr, t('common.empty.dash'))}
                      </Td>
                      <Td dir="ltr">{supplier.phone?.trim() || t('common.empty.dash')}</Td>
                      <Td dir="ltr">{supplier.email?.trim() || t('common.empty.dash')}</Td>
                      <Td dir="ltr">{supplier.taxNumber?.trim() || t('common.empty.dash')}</Td>
                      <StopPropagationCell column="status">
                        {canManage ? (
                          <StatusToggle
                            active={supplier.active}
                            disabled={busy}
                            entityName={supplier.name}
                            onToggle={() => void handleToggleStatus(supplier)}
                          />
                        ) : (
                          <Badge variant={supplier.active ? 'success' : 'inactive'}>
                            {supplier.active
                              ? t('common.status.active')
                              : t('common.status.inactive')}
                          </Badge>
                        )}
                      </StopPropagationCell>
                      {canManage ? (
                        <StopPropagationCell>
                          <TableRowActions
                            onEdit={() => openEdit(supplier)}
                            disabled={busy}
                            menuItems={[]}
                          />
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

      <SupplierFormModal
        open={modalOpen}
        mode={modalMode}
        supplier={editing}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          notify.success(
            modalMode === 'create'
              ? t('inventory.toast.createSuccess')
              : t('inventory.toast.updateSuccess'),
          )
          void loadSuppliers()
        }}
      />
    </ListPage>
  )
}
