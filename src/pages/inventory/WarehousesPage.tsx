import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { SelectFilter } from '../../components/ui/SelectFilter'
import {
  ClickableTableRow,
  DataTable,
  StopPropagationCell,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../components/ui/Table'
import type { TranslationKey } from '../../i18n/types'
import { useTranslation } from '../../i18n/useTranslation'
import * as branchService from '../../services/branchService'
import * as inventoryService from '../../services/inventoryService'
import type { BranchResponse } from '../../types/branch'
import type { WarehouseResponse, WarehouseType } from '../../types/inventory'
import { getLocalizedBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'
import { canManageInventorySetup, canViewInventorySetup } from '../../utils/inventoryAccess'
import { displayArabicName, getInventoryLocalizedName } from '../../utils/inventoryDisplay'
import { InventoryAccessDenied } from './InventoryAccessDenied'
import { WarehouseFormModal } from './WarehouseFormModal'

type StatusFilter = 'all' | 'active' | 'inactive'

const WAREHOUSE_TYPES: WarehouseType[] = [
  'CENTRAL',
  'BRANCH',
  'KITCHEN',
  'FREEZER',
  'BAR',
  'OTHER',
]

export function WarehousesPage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const notify = useNotify()
  const canView = canViewInventorySetup()
  const canManage = canManageInventorySetup()
  const [branches, setBranches] = useState<BranchResponse[]>([])

  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [branchId, setBranchId] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [rowActionId, setRowActionId] = useState<number | null>(null)

  const loadWarehouses = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await inventoryService.getWarehouses({
        search: search.trim() || undefined,
        branchId: branchId || undefined,
        type: (typeFilter as WarehouseType) || undefined,
        active: statusFilter === 'all' ? undefined : statusFilter === 'active',
      })
      setWarehouses(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setWarehouses([])
    } finally {
      setLoading(false)
    }
  }, [branchId, search, statusFilter, t, typeFilter])

  useEffect(() => {
    if (!canView) return
    void branchService.getBranches().then(setBranches).catch(() => setBranches([]))
  }, [canView])

  useEffect(() => {
    if (!canView) return
    const timer = window.setTimeout(() => void loadWarehouses(), 300)
    return () => window.clearTimeout(timer)
  }, [canView, loadWarehouses])

  function openCreate() {
    setModalOpen(true)
  }

  async function handleToggleStatus(warehouse: WarehouseResponse) {
    if (!canManage) return
    setRowActionId(warehouse.id)
    try {
      if (warehouse.active) {
        await inventoryService.deactivateWarehouse(warehouse.id)
        notify.success(t('inventory.toast.deactivateSuccess'))
      } else {
        await inventoryService.activateWarehouse(warehouse.id)
        notify.success(t('inventory.toast.activateSuccess'))
      }
      await loadWarehouses()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setRowActionId(null)
    }
  }

  if (!canView) return <InventoryAccessDenied />

  const showEmpty = !loading && !error && warehouses.length === 0
  const showTable = !loading && !error && warehouses.length > 0

  const branchLabel = (warehouse: WarehouseResponse) => {
    if (warehouse.branchName) return warehouse.branchName
    if (warehouse.branchId) {
      const branch = branches.find((b) => b.id === warehouse.branchId)
      if (branch) return getLocalizedBranchName(branch, locale)
    }
    return t('common.empty.dash')
  }

  return (
    <ListPage className="warehouses-page">
      <PageHeader
        title={t('inventory.warehouses.title')}
        description={t('inventory.warehouses.subtitle')}
        action={
          canManage ? (
            <ListPrimaryAction label={t('inventory.warehouses.add')} onClick={openCreate} />
          ) : undefined
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('inventory.warehouses.listTitle')}
          toolbar={
            <>
              <ListToolbarSearch
                value={search}
                onChange={setSearch}
                placeholder={t('common.search')}
                ariaLabel={t('common.search')}
              />
              <SelectFilter
                value={branchId}
                onChange={setBranchId}
                options={[
                  { value: '', label: t('inventory.common.allBranches') },
                  ...branches.map((b) => ({
                    value: String(b.id),
                    label: getLocalizedBranchName(b, locale),
                  })),
                ]}
                ariaLabel={t('inventory.col.branch')}
              />
              <SelectFilter
                value={typeFilter}
                onChange={setTypeFilter}
                options={[
                  { value: '', label: t('inventory.common.allTypes') },
                  ...WAREHOUSE_TYPES.map((type) => ({
                    value: type,
                    label: t(`inventory.warehouses.types.${type}` as TranslationKey),
                  })),
                ]}
                ariaLabel={t('inventory.col.type')}
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
          loadingMessage={t('inventory.warehouses.loading')}
          loadingColumns={5}
          showEmpty={showEmpty}
          emptyTitle={t('inventory.warehouses.empty.title')}
          emptyDescription={t('inventory.warehouses.empty.subtitle')}
          emptyActionLabel={canManage ? t('inventory.warehouses.add') : undefined}
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
                  <Th>{t('inventory.col.branch')}</Th>
                  <Th column="status">{t('common.status')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {warehouses.map((warehouse) => {
                  const busy = rowActionId === warehouse.id
                  return (
                    <ClickableTableRow
                      key={warehouse.id}
                      onClick={() => navigate(`/inventory/warehouses/${warehouse.id}`)}
                    >
                      <Td column="entity">
                        <EntityCell
                          name={getInventoryLocalizedName(warehouse, locale)}
                          code={warehouse.code}
                          compact
                        />
                      </Td>
                      <Td dir="rtl">
                        {displayArabicName(warehouse.nameAr, t('common.empty.dash'))}
                      </Td>
                      <Td>
                        {t(`inventory.warehouses.types.${warehouse.type}` as TranslationKey)}
                      </Td>
                      <Td>{branchLabel(warehouse)}</Td>
                      <StopPropagationCell column="status">
                        {canManage ? (
                          <StatusToggle
                            active={warehouse.active}
                            disabled={busy}
                            entityName={warehouse.name}
                            onToggle={() => void handleToggleStatus(warehouse)}
                          />
                        ) : (
                          <Badge variant={warehouse.active ? 'success' : 'inactive'}>
                            {warehouse.active
                              ? t('common.status.active')
                              : t('common.status.inactive')}
                          </Badge>
                        )}
                      </StopPropagationCell>
                    </ClickableTableRow>
                  )
                })}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>

      <WarehouseFormModal
        open={modalOpen}
        mode="create"
        warehouse={null}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          notify.success(t('inventory.toast.createSuccess'))
          void loadWarehouses()
        }}
      />
    </ListPage>
  )
}
