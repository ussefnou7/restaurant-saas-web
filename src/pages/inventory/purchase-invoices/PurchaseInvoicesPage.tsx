import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PurchaseDocumentCancelModal } from '../../../components/inventory/PurchaseDocumentCancelModal'
import { PurchaseInvoiceStatusBadges } from '../../../components/inventory/PurchaseInvoiceStatusBadges'
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
import {
  EditActionButton,
  PermissionsActionButton,
  RowActionGroup,
} from '../../../components/ui/RowActions'
import { useTranslation } from '../../../i18n/useTranslation'
import * as purchaseInvoiceService from '../../../services/purchaseInvoiceService'
import type {
  PurchaseInvoiceResponse,
  PurchaseInvoiceStatus,
  PurchasePaymentStatus,
} from '../../../types/purchaseInvoice'
import { translateApiError } from '../../../utils/errors'
import { formatDate, formatMoney } from '../../../utils/format'
import {
  canManagePurchaseInvoices,
  canViewPurchaseInvoices,
} from '../../../utils/inventoryPurchaseAccess'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { notifyStockBalancesRefresh } from '../../../utils/inventoryStockRefresh'
import {
  getPurchasePaymentStatusBadgeVariant,
  getPurchasePaymentStatusLabel,
} from '../../../utils/purchaseInvoiceDisplay'
import { PurchaseInvoiceAccessDenied } from './PurchaseInvoiceAccessDenied'
import { usePurchaseFilterLookups } from './usePurchaseFilterLookups'

const STATUS_FILTERS: Array<PurchaseInvoiceStatus | ''> = [
  '',
  'DRAFT',
  'COMPLETE',
  'POSTED',
  'CANCELLED',
]
const PAYMENT_STATUS_FILTERS: Array<PurchasePaymentStatus | ''> = ['', 'UNPAID', 'PARTIAL', 'PAID']

type ConfirmAction =
  | { type: 'complete' | 'post'; invoice: PurchaseInvoiceResponse }
  | { type: 'cancel'; invoice: PurchaseInvoiceResponse }
  | null

export function PurchaseInvoicesPage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const notify = useNotify()
  const canView = canViewPurchaseInvoices()
  const canManage = canManagePurchaseInvoices()
  const { warehouses, suppliers } = usePurchaseFilterLookups()

  const [invoices, setInvoices] = useState<PurchaseInvoiceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [rowActionId, setRowActionId] = useState<number | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await purchaseInvoiceService.getPurchaseInvoices({
        search: search.trim() || undefined,
        supplierId: supplierId || undefined,
        warehouseId: warehouseId || undefined,
        status: (statusFilter || undefined) as PurchaseInvoiceStatus | undefined,
        paymentStatus: (paymentStatusFilter || undefined) as PurchasePaymentStatus | undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      setInvoices(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }, [
    dateFrom,
    dateTo,
    paymentStatusFilter,
    search,
    statusFilter,
    supplierId,
    t,
    warehouseId,
  ])

  useEffect(() => {
    if (!canView) return
    const timer = window.setTimeout(() => void loadInvoices(), 300)
    return () => window.clearTimeout(timer)
  }, [canView, loadInvoices])

  async function runConfirmAction() {
    if (!confirmAction || confirmAction.type === 'cancel') return
    setConfirmLoading(true)
    setRowActionId(confirmAction.invoice.id)
    try {
      if (confirmAction.type === 'complete') {
        await purchaseInvoiceService.completePurchaseInvoice(confirmAction.invoice.id)
        notify.success(t('inventory.purchase.toast.completeSuccess'))
      } else {
        await purchaseInvoiceService.postPurchaseInvoice(confirmAction.invoice.id)
        notify.success(t('inventory.purchase.toast.postSuccess'))
        notifyStockBalancesRefresh()
      }
      await loadInvoices()
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
    setRowActionId(confirmAction.invoice.id)
    try {
      await purchaseInvoiceService.cancelPurchaseInvoice(confirmAction.invoice.id, reason)
      notify.success(t('inventory.purchase.toast.cancelSuccess'))
      await loadInvoices()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setConfirmLoading(false)
      setRowActionId(null)
      setConfirmAction(null)
    }
  }

  if (!canView) return <PurchaseInvoiceAccessDenied />

  const showEmpty = !loading && !error && invoices.length === 0
  const showTable = !loading && !error && invoices.length > 0

  const confirmIsComplete = confirmAction?.type === 'complete'
  const confirmIsPost = confirmAction?.type === 'post'
  const confirmIsCancel = confirmAction?.type === 'cancel'

  return (
    <ListPage className="purchase-invoices-page">
      <PageHeader
        title={t('inventory.purchase.title')}
        description={t('inventory.purchase.subtitle')}
        action={
          canManage ? (
            <ListPrimaryAction
              label={t('inventory.purchase.add')}
              onClick={() => navigate('/purchase/purchase-invoices/new')}
            />
          ) : undefined
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('inventory.purchase.listTitle')}
          toolbar={
            <div className="purchase-invoices-toolbar">
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
                value={warehouseId}
                onChange={setWarehouseId}
                options={[
                  { value: '', label: t('inventory.common.allWarehouses') },
                  ...warehouses.map((w) => ({
                    value: String(w.id),
                    label: getInventoryLocalizedName(w, locale),
                  })),
                ]}
                ariaLabel={t('inventory.purchase.col.warehouse')}
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
                ariaLabel={t('inventory.purchase.col.status')}
              />
              <SelectFilter
                value={paymentStatusFilter}
                onChange={setPaymentStatusFilter}
                options={PAYMENT_STATUS_FILTERS.map((status) => ({
                  value: status,
                  label: status
                    ? getPurchasePaymentStatusLabel(status, t)
                    : t('inventory.purchase.filter.allPaymentStatuses'),
                }))}
                ariaLabel={t('inventory.purchase.col.paymentStatus')}
              />
              <label className="purchase-invoices-toolbar__date">
                <span className="purchase-invoices-toolbar__date-label">
                  {t('inventory.purchase.filter.dateFrom')}
                </span>
                <FormInput type="date" ltr value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </label>
              <label className="purchase-invoices-toolbar__date">
                <span className="purchase-invoices-toolbar__date-label">
                  {t('inventory.purchase.filter.dateTo')}
                </span>
                <FormInput type="date" ltr value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </label>
            </div>
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('inventory.purchase.loading')}
          loadingColumns={8}
          showEmpty={showEmpty}
          emptyTitle={t('inventory.purchase.empty.title')}
          emptyDescription={t('inventory.purchase.empty.subtitle')}
          emptyActionLabel={canManage ? t('inventory.purchase.add') : undefined}
          onEmptyAction={
            canManage ? () => navigate('/purchase/purchase-invoices/new') : undefined
          }
          showFilterEmpty={false}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th className="table-cell--numeric">{t('inventory.purchase.col.invoiceNumber')}</Th>
                  <Th column="entity">{t('inventory.purchase.col.supplier')}</Th>
                  <Th>{t('inventory.purchase.col.warehouse')}</Th>
                  <Th className="table-cell--numeric">{t('inventory.purchase.col.invoiceDate')}</Th>
                  <Th className="table-cell--numeric">{t('inventory.purchase.col.total')}</Th>
                  <Th>{t('inventory.purchase.col.paymentStatus')}</Th>
                  <Th>{t('inventory.purchase.col.status')}</Th>
                  <Th>{t('inventory.col.actions')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => {
                  const busy = rowActionId === invoice.id
                  const supplierLabel = invoice.supplierId
                    ? getInventoryLocalizedName(
                        {
                          name: invoice.supplierName ?? '',
                          nameAr: invoice.supplierNameAr ?? undefined,
                          code: invoice.supplierCode ?? undefined,
                        },
                        locale,
                      )
                    : t('common.empty.dash')

                  return (
                    <TableRow key={invoice.id}>
                      <Td dir="ltr" className="table-cell--numeric">
                        {invoice.invoiceNumber?.trim() || t('common.empty.dash')}
                      </Td>
                      <Td column="entity">
                        <EntityCell name={supplierLabel} code={invoice.supplierCode ?? undefined} compact />
                      </Td>
                      <Td>
                        {getInventoryLocalizedName(
                          {
                            name: invoice.warehouseName ?? '',
                            nameAr: invoice.warehouseNameAr ?? undefined,
                            code: invoice.warehouseCode ?? undefined,
                          },
                          locale,
                        )}
                      </Td>
                      <Td dir="ltr" className="table-cell--numeric">{formatDate(invoice.invoiceDate)}</Td>
                      <Td dir="ltr" className="table-cell--numeric">{formatMoney(invoice.totalAmount)}</Td>
                      <Td>
                        <Badge variant={getPurchasePaymentStatusBadgeVariant(invoice.paymentStatus)}>
                          {getPurchasePaymentStatusLabel(invoice.paymentStatus, t)}
                        </Badge>
                      </Td>
                      <Td>
                        <PurchaseInvoiceStatusBadges status={invoice.status} />
                      </Td>
                      <StopPropagationCell>
                        <RowActionGroup>
                          <PermissionsActionButton
                            label={t('inventory.purchase.actions.view')}
                            onClick={() => navigate(`/purchase/purchase-invoices/${invoice.id}`)}
                            disabled={busy}
                          />
                          {canManage && invoice.status === 'DRAFT' ? (
                            <EditActionButton
                              label={t('inventory.purchase.actions.edit')}
                              onClick={() =>
                                navigate(`/purchase/purchase-invoices/${invoice.id}/edit`)
                              }
                              disabled={busy}
                            />
                          ) : null}
                          {canManage && invoice.status === 'DRAFT' ? (
                            <button
                              type="button"
                              className="action-btn action-btn--neutral"
                              onClick={() => setConfirmAction({ type: 'complete', invoice })}
                              disabled={busy}
                            >
                              {t('inventory.purchase.actions.complete')}
                            </button>
                          ) : null}
                          {canManage && invoice.status === 'COMPLETE' ? (
                            <button
                              type="button"
                              className="action-btn action-btn--neutral"
                              onClick={() => setConfirmAction({ type: 'post', invoice })}
                              disabled={busy}
                            >
                              {t('inventory.purchase.actions.post')}
                            </button>
                          ) : null}
                          {canManage &&
                          (invoice.status === 'DRAFT' || invoice.status === 'COMPLETE') ? (
                            <button
                              type="button"
                              className="action-btn action-btn--neutral"
                              onClick={() => setConfirmAction({ type: 'cancel', invoice })}
                              disabled={busy}
                            >
                              {t('inventory.purchase.actions.cancel')}
                            </button>
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
        open={confirmIsComplete || confirmIsPost}
        title={
          confirmIsComplete
            ? t('inventory.purchase.confirm.completeTitle')
            : t('inventory.purchase.confirm.postTitle')
        }
        message={
          confirmIsComplete
            ? t('inventory.purchase.confirm.completeMessage')
            : t('inventory.purchase.confirm.postMessage')
        }
        confirmLabel={
          confirmIsComplete
            ? t('inventory.purchase.confirm.completeConfirm')
            : t('inventory.purchase.confirm.postConfirm')
        }
        confirmVariant="primary"
        loading={confirmLoading}
        loadingLabel={t('common.loading')}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => void runConfirmAction()}
      />

      <PurchaseDocumentCancelModal
        open={confirmIsCancel}
        title={t('inventory.purchase.confirm.cancelTitle')}
        message={t('inventory.purchase.confirm.cancelMessage')}
        confirmLabel={t('inventory.purchase.confirm.cancelConfirm')}
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
