import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  OrderSourceBadge,
  OrderStatusBadge,
  OrderTypeBadge,
} from '../../components/orders/OrderBadges'
import { FormInput } from '../../components/fields'
import {
  ListCard,
  ListCardHeader,
  ListPageStates,
} from '../../components/ui/ListPage'
import { ListPagination } from '../../components/ui/ListPagination'
import { SelectFilter } from '../../components/ui/SelectFilter'
import {
  ClickableTableRow,
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../components/ui/Table'
import { useTranslation } from '../../i18n/useTranslation'
import * as branchService from '../../services/branchService'
import * as orderService from '../../services/orderService'
import type { BranchResponse } from '../../types/branch'
import type { OrderSource, OrderStatus, OrderType, OrderView } from '../../types/order'
import { getLocalizedBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'
import { formatDateTime, formatMoney } from '../../utils/format'
import { getPaymentMethodLabel } from '../../utils/orderDisplay'

const ORDER_TYPES: Array<OrderType | ''> = ['', 'DINE_IN', 'TAKEAWAY', 'DELIVERY']
const ORDER_SOURCES: Array<OrderSource | ''> = ['', 'POS', 'ONLINE', 'AGGREGATOR']
const ORDER_STATUSES: Array<OrderStatus | ''> = ['', 'COMPLETE', 'CANCELLED']
const PAGE_SIZE = 20

export function OrdersListSection() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()

  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [orders, setOrders] = useState<OrderView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orderType, setOrderType] = useState('')
  const [orderSource, setOrderSource] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [branchId, setBranchId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    void branchService.getBranches().then(setBranches).catch(() => setBranches([]))
  }, [])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await orderService.getOrders({
        orderType: (orderType || undefined) as OrderType | undefined,
        orderSource: (orderSource || undefined) as OrderSource | undefined,
        status: (statusFilter || undefined) as OrderStatus | undefined,
        branchId: branchId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        size: PAGE_SIZE,
      })
      setOrders(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(result.totalPages)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setOrders([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [branchId, dateFrom, dateTo, orderSource, orderType, page, statusFilter, t])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadOrders(), 300)
    return () => window.clearTimeout(timer)
  }, [loadOrders])

  useEffect(() => {
    setPage(0)
  }, [orderType, orderSource, statusFilter, branchId, dateFrom, dateTo])

  const showEmpty = !loading && !error && orders.length === 0
  const showTable = !loading && !error && orders.length > 0

  return (
    <>
      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('orders.list.title')}
          toolbar={
            <div className="orders-toolbar">
              <SelectFilter
                value={orderType}
                onChange={setOrderType}
                options={ORDER_TYPES.map((type) => ({
                  value: type,
                  label: type ? t(`orders.orderType.${type}`) : t('orders.filter.allTypes'),
                }))}
                ariaLabel={t('orders.col.orderType')}
              />
              <SelectFilter
                value={orderSource}
                onChange={setOrderSource}
                options={ORDER_SOURCES.map((source) => ({
                  value: source,
                  label: source
                    ? t(`orders.orderSource.${source}`)
                    : t('orders.filter.allSources'),
                }))}
                ariaLabel={t('orders.col.source')}
              />
              <SelectFilter
                value={statusFilter}
                onChange={setStatusFilter}
                options={ORDER_STATUSES.map((status) => ({
                  value: status,
                  label: status ? t(`orders.status.${status}`) : t('common.allStatuses'),
                }))}
                ariaLabel={t('orders.col.status')}
              />
              <SelectFilter
                value={branchId}
                onChange={setBranchId}
                options={[
                  { value: '', label: t('common.allBranches') },
                  ...branches.map((b) => ({
                    value: String(b.id),
                    label: getLocalizedBranchName(b, locale),
                  })),
                ]}
                ariaLabel={t('orders.col.branch')}
              />
              <label className="orders-toolbar__date">
                <span className="orders-toolbar__date-label">{t('orders.filter.dateFrom')}</span>
                <FormInput
                  type="date"
                  ltr
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </label>
              <label className="orders-toolbar__date">
                <span className="orders-toolbar__date-label">{t('orders.filter.dateTo')}</span>
                <FormInput
                  type="date"
                  ltr
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </label>
            </div>
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('orders.list.loading')}
          loadingColumns={7}
          showEmpty={showEmpty}
          emptyTitle={t('orders.list.empty.title')}
          emptyDescription={t('orders.list.empty.subtitle')}
          showFilterEmpty={false}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th className="table-cell--numeric">{t('orders.col.orderDate')}</Th>
                  <Th>{t('orders.col.orderType')}</Th>
                  <Th>{t('orders.col.source')}</Th>
                  <Th>{t('orders.col.status')}</Th>
                  <Th className="table-cell--numeric">{t('orders.col.tableNo')}</Th>
                  <Th className="table-cell--numeric">{t('orders.col.total')}</Th>
                  <Th>{t('orders.col.paymentMethod')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <ClickableTableRow
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <Td className="table-cell--numeric" dir="ltr">
                      {formatDateTime(order.orderDate)}
                    </Td>
                    <Td>
                      <OrderTypeBadge orderType={order.orderType} />
                    </Td>
                    <Td>
                      <OrderSourceBadge
                        source={order.orderSource}
                        aggregatorName={order.aggregatorName}
                      />
                    </Td>
                    <Td>
                      <OrderStatusBadge status={order.status} />
                    </Td>
                    <Td className="table-cell--numeric">
                      {order.orderType === 'DINE_IN' && order.tableNo
                        ? order.tableNo
                        : t('common.empty.dash')}
                    </Td>
                    <Td className="table-cell--numeric" dir="ltr">
                      {formatMoney(order.totalAmount)}
                    </Td>
                    <Td>{getPaymentMethodLabel(order.paymentMethod, t)}</Td>
                  </ClickableTableRow>
                ))}
              </TableBody>
            </DataTable>
          }
        />

        {showTable ? (
          <ListPagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            disabled={loading}
          />
        ) : null}
      </ListCard>
    </>
  )
}
