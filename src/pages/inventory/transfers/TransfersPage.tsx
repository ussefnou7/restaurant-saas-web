import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge'
import { ConfirmModal } from '../../../components/ui/ConfirmModal'
import { EntityCell } from '../../../components/ui/EntityCell'
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
  ListPrimaryAction,
  ListToolbarSearch,
} from '../../../components/ui/ListPage'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SelectFilter } from '../../../components/ui/SelectFilter'
import { useNotify } from '../../../components/ui/NotificationContext'
import {
  DataTable,
  StopPropagationCell,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../../components/ui/Table'
import { FormInput } from '../../../components/fields'
import { ActionMenu, type ActionMenuItem } from '../../../components/ui/ActionMenu'
import { RowActionGroup, PermissionsActionButton } from '../../../components/ui/RowActions'
import { useTranslation } from '../../../i18n/useTranslation'
import * as transferService from '../../../services/inventoryTransferService'
import type { InventoryTransferResponse, TransferStatus } from '../../../types/inventoryOperations'
import { translateApiError } from '../../../utils/errors'
import { formatDate } from '../../../utils/format'
import { canManageInventoryStock, canViewInventoryStock } from '../../../utils/inventoryAccess'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { notifyStockBalancesRefresh } from '../../../utils/inventoryStockRefresh'
import { StockAccessDenied } from '../StockAccessDenied'

const STATUS_OPTIONS: Array<TransferStatus | ''> = ['', 'DRAFT', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']

type ConfirmAction = { type: 'dispatch' | 'receive' | 'cancel'; transfer: InventoryTransferResponse } | null

function getTransferStatusVariant(status: TransferStatus): 'muted' | 'warning' | 'success' | 'danger' {
  switch (status) {
    case 'DRAFT': return 'muted'
    case 'IN_TRANSIT': return 'warning'
    case 'COMPLETED': return 'success'
    case 'CANCELLED': return 'danger'
    default: return 'muted'
  }
}

export function TransfersPage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const notify = useNotify()
  const canView = canViewInventoryStock()
  const canManage = canManageInventoryStock()

  const [transfers, setTransfers] = useState<InventoryTransferResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TransferStatus | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [rowActionId, setRowActionId] = useState<number | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const loadTransfers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await transferService.getTransfers({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      setTransfers(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setTransfers([])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, dateFrom, dateTo, t])

  useEffect(() => {
    if (!canView) return
    const timer = window.setTimeout(() => void loadTransfers(), 300)
    return () => window.clearTimeout(timer)
  }, [canView, loadTransfers])

  async function runConfirmAction() {
    if (!confirmAction) return
    setConfirmLoading(true)
    setRowActionId(confirmAction.transfer.id)
    try {
      if (confirmAction.type === 'dispatch') {
        await transferService.dispatchTransfer(confirmAction.transfer.id)
        notify.success(t('inventory.transfers.toast.dispatchSuccess'))
        notifyStockBalancesRefresh()
      } else if (confirmAction.type === 'receive') {
        await transferService.receiveTransfer(confirmAction.transfer.id)
        notify.success(t('inventory.transfers.toast.receiveSuccess'))
        notifyStockBalancesRefresh()
      } else {
        await transferService.cancelTransfer(confirmAction.transfer.id)
        notify.success(t('inventory.transfers.toast.cancelSuccess'))
      }
      await loadTransfers()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setConfirmLoading(false)
      setRowActionId(null)
      setConfirmAction(null)
    }
  }

  function buildMenuItems(transfer: InventoryTransferResponse): ActionMenuItem[] {
    if (!canManage) return []
    const items: ActionMenuItem[] = []
    if (transfer.status === 'DRAFT') {
      items.push({
        id: 'dispatch',
        label: t('inventory.transfers.actions.dispatch'),
        tone: 'mint',
        onClick: () => setConfirmAction({ type: 'dispatch', transfer }),
      })
      items.push({
        id: 'cancel',
        label: t('inventory.transfers.actions.cancel'),
        tone: 'danger',
        onClick: () => setConfirmAction({ type: 'cancel', transfer }),
      })
    }
    if (transfer.status === 'IN_TRANSIT') {
      items.push({
        id: 'receive',
        label: t('inventory.transfers.actions.receive'),
        tone: 'mint',
        onClick: () => setConfirmAction({ type: 'receive', transfer }),
      })
      items.push({
        id: 'cancel',
        label: t('inventory.transfers.actions.cancel'),
        tone: 'danger',
        onClick: () => setConfirmAction({ type: 'cancel', transfer }),
      })
    }
    return items
  }

  if (!canView) return <StockAccessDenied />

  const showEmpty = !loading && !error && transfers.length === 0
  const showTable = !loading && !error && transfers.length > 0

  const confirmIsDispatch = confirmAction?.type === 'dispatch'
  const confirmIsReceive = confirmAction?.type === 'receive'

  return (
    <ListPage className="transfers-page">
      <PageHeader
        title={t('inventory.transfers.title')}
        description={t('inventory.transfers.subtitle')}
        action={
          canManage ? (
            <ListPrimaryAction
              label={t('inventory.transfers.add')}
              onClick={() => navigate('/inventory/transfers/new')}
            />
          ) : undefined
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('inventory.transfers.listTitle')}
          toolbar={
            <div className="transfers-toolbar">
              <ListToolbarSearch
                value={search}
                onChange={setSearch}
                placeholder={t('common.search')}
                ariaLabel={t('common.search')}
              />
              <SelectFilter
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as TransferStatus | '')}
                options={STATUS_OPTIONS.map((s) => ({
                  value: s,
                  label: s ? t(`inventory.transfers.status.${s}`) : t('common.allStatuses'),
                }))}
                ariaLabel={t('inventory.transfers.col.status')}
              />
              <label className="toolbar-date-label">
                <span className="toolbar-date-text">{t('inventory.transfers.filter.dateFrom')}</span>
                <FormInput type="date" ltr value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </label>
              <label className="toolbar-date-label">
                <span className="toolbar-date-text">{t('inventory.transfers.filter.dateTo')}</span>
                <FormInput type="date" ltr value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </label>
            </div>
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('inventory.transfers.loading')}
          loadingColumns={7}
          showEmpty={showEmpty}
          emptyTitle={t('inventory.transfers.empty.title')}
          emptyDescription={t('inventory.transfers.empty.subtitle')}
          emptyActionLabel={canManage ? t('inventory.transfers.add') : undefined}
          onEmptyAction={canManage ? () => navigate('/inventory/transfers/new') : undefined}
          showFilterEmpty={false}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th className="table-cell--numeric">{t('inventory.transfers.col.code')}</Th>
                  <Th column="entity">{t('inventory.transfers.col.from')}</Th>
                  <Th column="entity">{t('inventory.transfers.col.to')}</Th>
                  <Th className="table-cell--numeric">{t('inventory.transfers.col.requestedDate')}</Th>
                  <Th className="table-cell--numeric">{t('inventory.transfers.col.dispatchedAt')}</Th>
                  <Th column="status">{t('inventory.transfers.col.status')}</Th>
                  <Th>{t('inventory.col.actions')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {transfers.map((transfer) => {
                  const busy = rowActionId === transfer.id
                  const menuItems = buildMenuItems(transfer)
                  return (
                    <TableRow key={transfer.id}>
                      <Td dir="ltr" className="table-cell--numeric">
                        <span className="transfer-code">{transfer.code}</span>
                      </Td>
                      <Td column="entity">
                        <EntityCell
                          name={getInventoryLocalizedName(
                            { name: transfer.sourceWarehouseName, nameAr: transfer.sourceWarehouseNameAr ?? undefined, code: transfer.sourceWarehouseCode },
                            locale,
                          )}
                          code={transfer.sourceWarehouseCode}
                          compact
                        />
                      </Td>
                      <Td column="entity">
                        <EntityCell
                          name={getInventoryLocalizedName(
                            { name: transfer.destinationWarehouseName, nameAr: transfer.destinationWarehouseNameAr ?? undefined, code: transfer.destinationWarehouseCode },
                            locale,
                          )}
                          code={transfer.destinationWarehouseCode}
                          compact
                        />
                      </Td>
                      <Td dir="ltr" className="table-cell--numeric">{formatDate(transfer.requestedDate)}</Td>
                      <Td dir="ltr" className="table-cell--numeric">
                        {transfer.dispatchedAt ? formatDate(transfer.dispatchedAt) : <span className="text-muted">—</span>}
                      </Td>
                      <Td column="status">
                        <Badge variant={getTransferStatusVariant(transfer.status)}>
                          {t(`inventory.transfers.status.${transfer.status}`)}
                        </Badge>
                      </Td>
                      <StopPropagationCell>
                        <RowActionGroup>
                          <PermissionsActionButton
                            label={t('inventory.transfers.actions.view')}
                            onClick={() => navigate(`/inventory/transfers/${transfer.id}`)}
                            disabled={busy}
                          />
                          {menuItems.length > 0 ? (
                            <ActionMenu
                              items={menuItems}
                              disabled={busy}
                              ariaLabel={t('common.actions')}
                            />
                          ) : null}
                        </RowActionGroup>
                      </StopPropagationCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>

      <ConfirmModal
        open={confirmAction != null}
        title={
          confirmIsDispatch
            ? t('inventory.transfers.confirm.dispatchTitle')
            : confirmIsReceive
              ? t('inventory.transfers.confirm.receiveTitle')
              : t('inventory.transfers.confirm.cancelTitle')
        }
        message={
          confirmIsDispatch
            ? t('inventory.transfers.confirm.dispatchMessage')
            : confirmIsReceive
              ? t('inventory.transfers.confirm.receiveMessage')
              : t('inventory.transfers.confirm.cancelMessage')
        }
        confirmLabel={
          confirmIsDispatch
            ? t('inventory.transfers.confirm.dispatchConfirm')
            : confirmIsReceive
              ? t('inventory.transfers.confirm.receiveConfirm')
              : t('inventory.transfers.confirm.cancelConfirm')
        }
        confirmVariant={confirmAction?.type === 'cancel' ? 'dangerConfirm' : 'primary'}
        loading={confirmLoading}
        loadingLabel={t('common.loading')}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => void runConfirmAction()}
      />
    </ListPage>
  )
}
