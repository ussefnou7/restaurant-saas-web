import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  EntityDetailScreen,
  EntityOverviewActions,
} from '../../components/entity-detail'
import { StatusBadge } from '../../components/ui/StatusBadge'
import type { TranslationKey } from '../../i18n/types'
import { useTranslation } from '../../i18n/useTranslation'
import * as branchService from '../../services/branchService'
import * as inventoryService from '../../services/inventoryService'
import type { BranchResponse } from '../../types/branch'
import type { WarehouseResponse } from '../../types/inventory'
import { getLocalizedBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'
import { canManageInventorySetup, canViewInventorySetup } from '../../utils/inventoryAccess'
import { getInventoryLocalizedName } from '../../utils/inventoryDisplay'
import { InventoryAccessDenied } from './InventoryAccessDenied'
import { WarehouseOverviewPanel } from './WarehouseOverviewPanel'
import { WarehouseStocksPanel } from './WarehouseStocksPanel'

export function WarehouseDetailsPage() {
  const { t, locale } = useTranslation()
  const { warehouseId } = useParams<{ warehouseId: string }>()
  const canView = canViewInventorySetup()
  const canManage = canManageInventorySetup()

  const [warehouse, setWarehouse] = useState<WarehouseResponse | null>(null)
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusBusy, setStatusBusy] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const loadWarehouse = useCallback(async () => {
    if (!warehouseId) return

    setLoading(true)
    setError('')

    try {
      const [found, branchData] = await Promise.all([
        inventoryService.getWarehouse(warehouseId),
        branchService.getBranches(),
      ])
      setWarehouse(found)
      setBranches(branchData)
    } catch (err) {
      setWarehouse(null)
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [t, warehouseId])

  useEffect(() => {
    if (!canView) return
    void loadWarehouse()
  }, [canView, loadWarehouse])

  function handleStartEdit() {
    setIsEditing(true)
    setError('')
  }

  function handleCancelEdit() {
    setIsEditing(false)
  }

  function handleSaved(updated: WarehouseResponse) {
    setWarehouse(updated)
    setIsEditing(false)
    setError('')
  }

  async function handleToggleStatus() {
    if (!warehouse || isEditing || !canManage) return

    setStatusBusy(true)
    try {
      const updated = warehouse.active
        ? await inventoryService.deactivateWarehouse(warehouse.id)
        : await inventoryService.activateWarehouse(warehouse.id)
      setWarehouse(updated)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setStatusBusy(false)
    }
  }

  if (!canView) return <InventoryAccessDenied />

  const warehouseName = warehouse ? getInventoryLocalizedName(warehouse, locale) : ''
  const typeLabel = warehouse ? t(`inventory.warehouses.types.${warehouse.type}` as TranslationKey) : ''
  const branchName = warehouse
    ? warehouse.branchName || (warehouse.branchId ? getLocalizedBranchName(branches.find((b) => b.id === warehouse.branchId), locale) : '')
    : ''
  const subtitle = warehouse
    ? [warehouse.code, typeLabel, branchName].filter(Boolean).join(' · ')
    : ''
  const overviewActions =
    warehouse && canManage && !isEditing ? (
      <EntityOverviewActions
        editLabel={t('inventory.warehouses.details.actions.edit')}
        statusLabel={
          warehouse.active
            ? t('inventory.warehouses.details.actions.deactivate')
            : t('inventory.warehouses.details.actions.activate')
        }
        active={warehouse.active}
        statusBusy={statusBusy}
        showDelete={false}
        onEdit={handleStartEdit}
        onToggleStatus={() => void handleToggleStatus()}
      />
    ) : null

  return (
    <EntityDetailScreen
      title={warehouse ? warehouseName : undefined}
      subtitle={warehouse ? subtitle : undefined}
      badge={warehouse ? <StatusBadge active={warehouse.active} /> : undefined}
      actions={overviewActions}
      backTo="/inventory/warehouses"
      backLabel={t('inventory.warehouses.details.back')}
      loading={loading}
      loadingMessage={t('inventory.warehouses.loading')}
      notFound={!loading && !warehouse}
      notFoundTitle={t('inventory.warehouses.details.notFoundTitle')}
      notFoundMessage={error || t('inventory.warehouses.details.notFound')}
      error={warehouse ? error : undefined}
      overview={
        warehouse ? (
          <WarehouseOverviewPanel
            warehouse={warehouse}
            branches={branches}
            editing={isEditing}
            onCancel={handleCancelEdit}
            onSaved={handleSaved}
          />
        ) : null
      }
    >
      {warehouse ? <WarehouseStocksPanel warehouseId={String(warehouse.id)} /> : null}
    </EntityDetailScreen>
  )
}
