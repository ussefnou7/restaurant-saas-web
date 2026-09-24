import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PurchaseDocumentCancelModal } from '../../../components/inventory/PurchaseDocumentCancelModal'
import { PurchaseInvoiceStatusBadges } from '../../../components/inventory/PurchaseInvoiceStatusBadges'
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
  ClickableTableRow,
  DataTable,
  StopPropagationCell,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../../components/ui/Table'
import { DatePicker } from '../../../components/ui/DatePicker'
import { ClearFiltersButton } from '../../../components/ui/ClearFiltersButton'
import { RowActionGroup } from '../../../components/ui/RowActions'
import { useTranslation } from '../../../i18n/useTranslation'
import * as inventoryService from '../../../services/inventoryService'
import * as purchaseReturnService from '../../../services/purchaseReturnService'
import type { SupplierResponse } from '../../../types/inventory'
import type { PurchaseReturnResponse, PurchaseReturnStatus } from '../../../types/purchaseReturn'
import { translateApiError } from '../../../utils/errors'
import { formatDate, formatMoney } from '../../../utils/format'
import {
  useCanManagePurchaseInvoices,
  useCanViewPurchaseInvoices,
} from '../../../utils/inventoryPurchaseAccess'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { notifyStockBalancesRefresh } from '../../../utils/inventoryStockRefresh'
import { getPurchaseReturnReasonLabel } from '../../../utils/purchaseInvoiceDisplay'
import { PurchaseInvoiceAccessDenied } from '../purchase-invoices/PurchaseInvoiceAccessDenied'

const STATUS_FILTERS: Array<PurchaseReturnStatus | ''> = [
  '',
  'DRAFT',
  'COMPLETE',
  'POSTED',
  'CANCELLED',
]

type ConfirmAction =
  | { type: 'complete' | 'post'; purchaseReturn: PurchaseReturnResponse }
  | { type: 'cancel'; purchaseReturn: PurchaseReturnResponse }
  | null

export function PurchaseReturnsPage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const notify = useNotify()
  const canView = useCanViewPurchaseInvoices()
  const canManage = useCanManagePurchaseInvoices()

  const [returns, setReturns] = useState<PurchaseReturnResponse[]>([])
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [rowActionId, setRowActionId] = useState<number | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const loadSuppliers = useCallback(async () => {
    try {
      const data = await inventoryService.getSuppliers()
      setSuppliers(data)
    } catch {
      setSuppliers([])
    }
  }, [])

  const loadReturns = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await purchaseReturnService.getPurchaseReturns({
        search: search.trim() || undefined,
        supplierId: supplierId ? Number(supplierId) : undefined,
        status: (statusFilter || undefined) as PurchaseReturnStatus | undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      setReturns(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setReturns([])
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, search, statusFilter, supplierId, t])

  useEffect(() => {
    if (!canView) return
    void loadSuppliers()
  }, [canView, loadSuppliers])

  useEffect(() => {
    if (!canView) return
    const timer = window.setTimeout(() => void loadReturns(), 300)
    return () => window.clearTimeout(timer)
  }, [canView, loadReturns])

  async function runConfirmAction() {
    if (!confirmAction || confirmAction.type === 'cancel') return
    setConfirmLoading(true)
    setRowActionId(confirmAction.purchaseReturn.id)
    try {
      if (confirmAction.type === 'complete') {
        await purchaseReturnService.completePurchaseReturn(confirmAction.purchaseReturn.id)
        notify.success(t('inventory.purchaseReturn.toast.completeSuccess'))
      } else {
        await purchaseReturnService.postPurchaseReturn(confirmAction.purchaseReturn.id)
        notify.success(t('inventory.purchaseReturn.toast.postSuccess'))
        notifyStockBalancesRefresh()
      }
      await loadReturns()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setConfirmLoading(false)
      setRowActionId(null)
      setConfirmAction(null)
    }
  }

  async function runCancelAction(reason: string) {
    if (!confirmAction || confirmAction.type !== 'cancel') return
    setConfirmLoading(true)
    setRowActionId(confirmAction.purchaseReturn.id)
    try {
      await purchaseReturnService.cancelPurchaseReturn(confirmAction.purchaseReturn.id, reason)
      notify.success(t('inventory.purchaseReturn.toast.cancelSuccess'))
      await loadReturns()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setConfirmLoading(false)
      setRowActionId(null)
      setConfirmAction(null)
    }
  }

  if (!canView) return <PurchaseInvoiceAccessDenied />

  const showEmpty = !loading && !error && returns.length === 0
  const showTable = !loading && !error && returns.length > 0
  const confirmIsComplete = confirmAction?.type === 'complete'
  const confirmIsPost = confirmAction?.type === 'post'
  const confirmIsCancel = confirmAction?.type === 'cancel'

  return (
    <ListPage className="purchase-returns-page">
      <PageHeader
        title={t('inventory.purchaseReturn.title')}
        description={t('inventory.purchaseReturn.subtitle')}
        action={
          canManage ? (
            <ListPrimaryAction
              label={t('inventory.purchaseReturn.add')}
              onClick={() => navigate('/purchase/purchase-returns/new')}
            />
          ) : undefined
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('inventory.purchaseReturn.listTitle')}
          toolbar={
            <div className="purchase-returns-toolbar">
              <ListToolbarSearch
                value={search}
                onChange={setSearch}
                placeholder={t('common.search')}
                ariaLabel={t('common.search')}
              />
              <SelectFilter
                value={supplierId}
                onChange={setSupplierId}
                options={[
                  { value: '', label: t('inventory.purchase.filter.allSuppliers') },
                  ...suppliers.map((s) => ({
                    value: String(s.id),
                    label: getInventoryLocalizedName(s, locale),
                  })),
                ]}
                ariaLabel={t('inventory.purchase.col.supplier')}
              />
              <SelectFilter
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_FILTERS.map((status) => ({
                  value: status,
                  label: status
                    ? t(`inventory.purchase.status.${status}`)
                    : t('common.allStatuses'),
                }))}
                ariaLabel={t('inventory.purchaseReturn.col.status')}
              />
              <DatePicker
                value={dateFrom}
                placeholder={t('inventory.purchase.filter.dateFrom')}
                ariaLabel={t('inventory.purchase.filter.dateFrom')}
                maxDate={dateTo || undefined}
                onChange={setDateFrom}
              />
              <DatePicker
                value={dateTo}
                placeholder={t('inventory.purchase.filter.dateTo')}
                ariaLabel={t('inventory.purchase.filter.dateTo')}
                minDate={dateFrom || undefined}
                onChange={setDateTo}
              />
              <ClearFiltersButton
                onClick={() => {
                  setSearch('')
                  setSupplierId('')
                  setStatusFilter('')
                  setDateFrom('')
                  setDateTo('')
                }}
                disabled={!search && !supplierId && !statusFilter && !dateFrom && !dateTo}
              />
            </div>
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('inventory.purchaseReturn.loading')}
          loadingColumns={8}
          showEmpty={showEmpty}
          emptyTitle={t('inventory.purchaseReturn.empty.title')}
          emptyDescription={t('inventory.purchaseReturn.empty.subtitle')}
          emptyActionLabel={canManage ? t('inventory.purchaseReturn.add') : undefined}
          onEmptyAction={canManage ? () => navigate('/purchase/purchase-returns/new') : undefined}
          showFilterEmpty={false}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th className="table-cell--numeric">{t('inventory.purchaseReturn.col.returnNumber')}</Th>
                  <Th className="table-cell--numeric">{t('inventory.purchaseReturn.col.originalInvoice')}</Th>
                  <Th column="entity">{t('inventory.purchaseReturn.col.supplier')}</Th>
                  <Th className="table-cell--numeric">{t('inventory.purchaseReturn.col.returnDate')}</Th>
                  <Th className="table-cell--numeric">{t('inventory.purchaseReturn.col.total')}</Th>
                  <Th>{t('inventory.purchaseReturn.col.reason')}</Th>
                  <Th>{t('inventory.purchaseReturn.col.status')}</Th>
                  <Th>{t('inventory.col.actions')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {returns.map((purchaseReturn) => {
                  const busy = rowActionId === purchaseReturn.id
                  const supplierLabel = purchaseReturn.supplierId
                    ? getInventoryLocalizedName(
                        {
                          name: purchaseReturn.supplierName ?? '',
                          nameAr: purchaseReturn.supplierNameAr ?? undefined,
                          code: purchaseReturn.supplierCode ?? undefined,
                        },
                        locale,
                      )
                    : t('common.empty.dash')

                  const hasRowActions = canManage && (purchaseReturn.status === 'DRAFT' || purchaseReturn.status === 'COMPLETE')

                  return (
                    <ClickableTableRow
                      key={purchaseReturn.id}
                      onClick={() => navigate(`/purchase/purchase-returns/${purchaseReturn.id}`)}
                    >
                      <Td dir="ltr" className="table-cell--numeric">
                        {purchaseReturn.returnNumber?.trim() || t('common.empty.dash')}
                      </Td>
                      <Td dir="ltr" className="table-cell--numeric">
                        {purchaseReturn.originalInvoiceNumber?.trim() || t('common.empty.dash')}
                      </Td>
                      <Td column="entity">
                        <EntityCell
                          name={supplierLabel}
                          code={purchaseReturn.supplierCode ?? undefined}
                          compact
                        />
                      </Td>
                      <Td dir="ltr" className="table-cell--numeric">{formatDate(purchaseReturn.returnDate)}</Td>
                      <Td dir="ltr" className="table-cell--numeric">{formatMoney(purchaseReturn.totalAmount)}</Td>
                      <Td>{getPurchaseReturnReasonLabel(purchaseReturn.reason, t)}</Td>
                      <Td>
                        <PurchaseInvoiceStatusBadges status={purchaseReturn.status} />
                      </Td>
                      <StopPropagationCell>
                        {hasRowActions ? (
                          <RowActionGroup>
                            {canManage && purchaseReturn.status === 'DRAFT' ? (
                              <button
                                type="button"
                                className="action-btn action-btn--neutral"
                                onClick={() =>
                                  setConfirmAction({ type: 'complete', purchaseReturn })
                                }
                                disabled={busy}
                              >
                                {t('inventory.purchase.actions.complete')}
                              </button>
                            ) : null}
                            {canManage && purchaseReturn.status === 'COMPLETE' ? (
                              <button
                                type="button"
                                className="action-btn action-btn--post"
                                onClick={() => setConfirmAction({ type: 'post', purchaseReturn })}
                                disabled={busy}
                              >
                                {t('inventory.purchase.actions.post')}
                              </button>
                            ) : null}
                            {canManage &&
                            (purchaseReturn.status === 'DRAFT' ||
                              purchaseReturn.status === 'COMPLETE') ? (
                              <button
                                type="button"
                                className="action-btn action-btn--neutral"
                                onClick={() =>
                                  setConfirmAction({ type: 'cancel', purchaseReturn })
                                }
                                disabled={busy}
                              >
                                {t('inventory.purchase.actions.cancel')}
                              </button>
                            ) : null}
                          </RowActionGroup>
                        ) : (
                          <span className="text-muted">-</span>
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

      <ConfirmModal
        open={confirmIsComplete || confirmIsPost}
        title={
          confirmIsComplete
            ? t('inventory.purchaseReturn.confirm.completeTitle')
            : t('inventory.purchaseReturn.confirm.postTitle')
        }
        message={
          confirmIsComplete
            ? t('inventory.purchaseReturn.confirm.completeMessage')
            : t('inventory.purchaseReturn.confirm.postMessage')
        }
        confirmLabel={
          confirmIsComplete
            ? t('inventory.purchaseReturn.confirm.completeConfirm')
            : t('inventory.purchaseReturn.confirm.postConfirm')
        }
        confirmVariant="primary"
        loading={confirmLoading}
        loadingLabel={t('common.loading')}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => void runConfirmAction()}
      />

      <PurchaseDocumentCancelModal
        open={confirmIsCancel}
        title={t('inventory.purchaseReturn.confirm.cancelTitle')}
        message={t('inventory.purchaseReturn.confirm.cancelMessage')}
        confirmLabel={t('inventory.purchaseReturn.confirm.cancelConfirm')}
        cancelLabel={t('common.cancel')}
        reasonLabel={t('inventory.purchase.confirm.cancelReasonLabel')}
        reasonRequiredMessage={t('inventory.purchase.confirm.cancelReasonRequired')}
        loading={confirmLoading}
        loadingLabel={t('common.loading')}
        onClose={() => setConfirmAction(null)}
        onConfirm={(reason) => void runCancelAction(reason)}
      />
    </ListPage>
  )
}
