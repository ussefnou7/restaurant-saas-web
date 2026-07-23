import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  OrderSourceBadge,
  OrderStatusBadge,
  OrderTypeBadge,
} from '../../components/orders/OrderBadges'
import { DetailsCard } from '../../components/fields'
import { EntityDetailScreen } from '../../components/entity-detail/EntityDetailScreen'
import { Badge } from '../../components/ui/Badge'
import {
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
import type { OrderView } from '../../types/order'
import { getLocalizedBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'
import { formatDateTime } from '../../utils/format'
import {
  formatDisplayAmount,
  getCancellationStageLabel,
  getPaymentMethodLabel,
} from '../../utils/orderDisplay'

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="orders-detail-info__item">
      <span className="orders-detail-info__label">{label}</span>
      <span className="orders-detail-info__value">{value}</span>
    </div>
  )
}

export function OrderDetailPage() {
  const { t, locale } = useTranslation()
  const { orderId } = useParams<{ orderId: string }>()

  const [order, setOrder] = useState<OrderView | null>(null)
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOrder = useCallback(async () => {
    if (!orderId) return

    setLoading(true)
    setError('')
    try {
      const [found, branchData] = await Promise.all([
        orderService.getOrder(orderId),
        branchService.getBranches(),
      ])
      setOrder(found)
      setBranches(branchData)
    } catch (err) {
      setOrder(null)
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [orderId, t])

  useEffect(() => {
    void loadOrder()
  }, [loadOrder])

  function resolveBranchName(current: OrderView): string {
    if (current.branchName) return current.branchName
    const branch = branches.find((b) => b.id === current.branchId)
    if (branch) return getLocalizedBranchName(branch, locale)
    return t('common.empty.dash')
  }

  const overview = order ? (
    <div className="orders-detail">
      <header className="orders-detail__header">
        <div className="orders-detail__header-main">
          <h1 className="orders-detail__title">{t('orders.detail.title', { id: order.id })}</h1>
          <p className="orders-detail__meta" dir="ltr">
            {formatDateTime(order.orderDate)}
          </p>
          <div className="orders-detail__badges">
            <OrderTypeBadge orderType={order.orderType} />
            <OrderSourceBadge
              source={order.orderSource}
              aggregatorName={order.aggregatorName}
            />
            <OrderStatusBadge status={order.status} />
            {order.status === 'CANCELLED' && order.cancellationStage ? (
              <Badge variant="warning">
                {getCancellationStageLabel(order.cancellationStage, t)}
              </Badge>
            ) : null}
          </div>
        </div>
      </header>

      <DetailsCard title={t('orders.detail.infoTitle')}>
        <div className="orders-detail-info">
          <InfoItem
            label={t('orders.col.paymentMethod')}
            value={getPaymentMethodLabel(order.paymentMethod, t)}
          />
          {order.orderType === 'DINE_IN' ? (
            <InfoItem
              label={t('orders.col.tableNo')}
              value={order.tableNo ?? t('common.empty.dash')}
            />
          ) : null}
          <InfoItem label={t('orders.col.branch')} value={resolveBranchName(order)} />
          <InfoItem
            label={t('orders.detail.warehouse')}
            value={order.warehouseName ?? t('common.empty.dash')}
          />
          <InfoItem
            label={t('orders.detail.externalReference')}
            value={order.externalOrderReference ?? t('common.empty.dash')}
          />
          <InfoItem
            label={t('orders.detail.createdAt')}
            value={order.createdAt ? formatDateTime(order.createdAt) : t('common.empty.dash')}
          />
          {order.updatedAt ? (
            <InfoItem
              label={t('orders.detail.updatedAt')}
              value={formatDateTime(order.updatedAt)}
            />
          ) : null}
        </div>
      </DetailsCard>

      <DetailsCard title={t('orders.detail.linesTitle')}>
        <div className="list-card-content table-wrap">
          <DataTable>
            <TableHead>
              <TableRow>
                <Th column="entity">{t('orders.detail.col.product')}</Th>
                <Th className="table-cell--numeric">{t('orders.detail.col.quantity')}</Th>
                <Th className="table-cell--numeric">{t('orders.detail.col.unitPrice')}</Th>
                <Th className="table-cell--numeric">{t('orders.detail.col.lineTotal')}</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.lines.map((line) => (
                <TableRow key={line.id}>
                  <Td>{line.productName}</Td>
                  <Td className="table-cell--numeric" dir="ltr">
                    {line.quantity}
                  </Td>
                  <Td className="table-cell--numeric" dir="ltr">
                    {formatDisplayAmount(line.unitPrice)}
                  </Td>
                  <Td className="table-cell--numeric" dir="ltr">
                    {formatDisplayAmount(line.lineTotal)}
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </div>
        <div className="orders-detail__total">
          <span className="orders-detail__total-label">{t('orders.detail.total')}</span>
          <span className="orders-detail__total-value" dir="ltr">
            {formatDisplayAmount(order.totalAmount)}
          </span>
        </div>
      </DetailsCard>
    </div>
  ) : null

  return (
    <EntityDetailScreen
      backTo="/orders/list"
      backLabel={t('orders.detail.back')}
      loading={loading}
      loadingMessage={t('orders.detail.loading')}
      notFound={!loading && !order && !error}
      notFoundTitle={t('orders.detail.notFoundTitle')}
      notFoundMessage={t('orders.detail.notFoundMessage')}
      error={error}
      overview={overview}
    />
  )
}
