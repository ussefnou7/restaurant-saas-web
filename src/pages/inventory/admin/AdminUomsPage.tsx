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
import type { UomResponse } from '../../../types/inventory'
import { translateApiError } from '../../../utils/errors'
import { isSysAdmin } from '../../../utils/inventoryAccess'
import {
  displayArabicName,
  getInventoryLocalizedName,
  matchesInventorySearch,
} from '../../../utils/inventoryDisplay'
import { AdminInventoryAccessDenied } from './AdminInventoryAccessDenied'
import { AdminUomFormModal } from './AdminUomFormModal'

type StatusFilter = 'all' | 'active' | 'inactive'

export function AdminUomsPage() {
  const { t, locale } = useTranslation()
  const notify = useNotify()
  const canAccess = isSysAdmin()

  const [uoms, setUoms] = useState<UomResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<UomResponse | null>(null)
  const [rowActionId, setRowActionId] = useState<number | null>(null)

  const loadUoms = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminInventoryService.getAdminUoms({
        active: statusFilter === 'all' ? undefined : statusFilter === 'active',
      })
      const query = search.trim()
      setUoms(
        query
          ? data.filter((uom) =>
              matchesInventorySearch(uom, query, [
                uom.symbol ?? '',
                uom.type ?? '',
                uom.baseCode ?? '',
              ]),
            )
          : data,
      )
    } catch (err) {
      setError(translateApiError(err, t).message)
      setUoms([])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, t])

  useEffect(() => {
    if (!canAccess) return
    const timer = window.setTimeout(() => void loadUoms(), 300)
    return () => window.clearTimeout(timer)
  }, [canAccess, loadUoms])

  function openCreate() {
    setModalMode('create')
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(uom: UomResponse) {
    setModalMode('edit')
    setEditing(uom)
    setModalOpen(true)
  }

  async function handleToggleStatus(uom: UomResponse) {
    setRowActionId(uom.id)
    try {
      if (uom.active) {
        await adminInventoryService.deactivateAdminUom(uom.id)
        notify.success(t('inventory.toast.deactivateSuccess'))
      } else {
        await adminInventoryService.activateAdminUom(uom.id)
        notify.success(t('inventory.toast.activateSuccess'))
      }
      await loadUoms()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setRowActionId(null)
    }
  }

  if (!canAccess) return <AdminInventoryAccessDenied />

  const showEmpty = !loading && !error && uoms.length === 0
  const showTable = !loading && !error && uoms.length > 0

  return (
    <ListPage className="admin-uoms-page">
      <PageHeader
        title={t('inventory.admin.uoms.title')}
        description={t('inventory.admin.uoms.subtitle')}
        action={<ListPrimaryAction label={t('inventory.admin.uoms.add')} onClick={openCreate} />}
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('inventory.admin.uoms.listTitle')}
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
          loadingMessage={t('inventory.admin.uoms.loading')}
          loadingColumns={4}
          showEmpty={showEmpty}
          emptyTitle={t('inventory.admin.uoms.empty.title')}
          emptyDescription={t('inventory.admin.uoms.empty.subtitle')}
          emptyActionLabel={t('inventory.admin.uoms.add')}
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
                  <Th column="status">{t('common.status')}</Th>
                  <Th>{t('inventory.col.actions')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {uoms.map((uom) => {
                  const busy = rowActionId === uom.id
                  return (
                    <TableRow key={uom.id}>
                      <Td column="entity">
                        <EntityCell
                          name={getInventoryLocalizedName(uom, locale)}
                          code={uom.code}
                          compact
                        />
                      </Td>
                      <Td dir="rtl">
                        {displayArabicName(uom.nameAr, t('common.empty.dash'))}
                      </Td>
                      <StopPropagationCell column="status">
                        <StatusToggle
                          active={uom.active}
                          disabled={busy}
                          entityName={uom.name}
                          onToggle={() => void handleToggleStatus(uom)}
                        />
                      </StopPropagationCell>
                      <StopPropagationCell>
                        <TableRowActions
                          onEdit={() => openEdit(uom)}
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

      <AdminUomFormModal
        open={modalOpen}
        mode={modalMode}
        uom={editing}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          notify.success(
            modalMode === 'create'
              ? t('inventory.toast.createSuccess')
              : t('inventory.toast.updateSuccess'),
          )
          void loadUoms()
        }}
      />
    </ListPage>
  )
}
