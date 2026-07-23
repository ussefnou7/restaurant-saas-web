import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { RequestSourceBadge, RequestStatusBadge } from '../../components/orders/OrderRequestBadges'
import { DetailsCard } from '../../components/fields'
import { EntityDetailScreen } from '../../components/entity-detail/EntityDetailScreen'
import { useTranslation } from '../../i18n/useTranslation'
import * as branchService from '../../services/branchService'
import * as orderRequestService from '../../services/orderRequestService'
import type { BranchResponse } from '../../types/branch'
import type { IncomingOrderRequestView } from '../../types/orderRequest'
import { getLocalizedBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'
import { formatDateTime } from '../../utils/format'
import { getRequestUnlinkedMessage } from '../../utils/orderRequestDisplay'

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="orders-detail-info__item">
      <span className="orders-detail-info__label">{label}</span>
      <span className="orders-detail-info__value">{value}</span>
    </div>
  )
}

function formatRawPayload(payload: unknown): string {
  if (payload === null || payload === undefined) return ''
  if (typeof payload === 'string') {
    try {
      return JSON.stringify(JSON.parse(payload), null, 2)
    } catch {
      return payload
    }
  }
  return JSON.stringify(payload, null, 2)
}

export function OrderRequestDetailPage() {
  const { t, locale } = useTranslation()
  const { requestId } = useParams<{ requestId: string }>()

  const [request, setRequest] = useState<IncomingOrderRequestView | null>(null)
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadRequest = useCallback(async () => {
    if (!requestId) return

    setLoading(true)
    setError('')
    try {
      const [found, branchData] = await Promise.all([
        orderRequestService.getOrderRequest(requestId),
        branchService.getBranches(),
      ])
      setRequest(found)
      setBranches(branchData)
    } catch (err) {
      setRequest(null)
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [requestId, t])

  useEffect(() => {
    void loadRequest()
  }, [loadRequest])

  function resolveBranchName(current: IncomingOrderRequestView): string {
    if (!current.branchId) return t('common.empty.dash')
    if (current.branchName) return current.branchName
    const branch = branches.find((b) => b.id === current.branchId)
    if (branch) return getLocalizedBranchName(branch, locale)
    return t('common.empty.dash')
  }

  const overview = request ? (
    <div className="orders-detail">
      <header className="orders-detail__header">
        <div className="orders-detail__header-main">
          <h1 className="orders-detail__title">
            {t('orders.request.detail.title', { id: request.id })}
          </h1>
          <div className="orders-detail__badges">
            <RequestSourceBadge
              source={request.source}
              aggregatorName={request.aggregatorName}
            />
            <RequestStatusBadge status={request.status} />
          </div>
        </div>
      </header>

      <DetailsCard title={t('orders.request.detail.infoTitle')}>
        <div className="orders-detail-info">
          <InfoItem
            label={t('orders.request.col.createdAt')}
            value={formatDateTime(request.createdAt)}
          />
          <InfoItem
            label={t('orders.request.detail.aggregatorName')}
            value={request.aggregatorName ?? t('common.empty.dash')}
          />
          <InfoItem
            label={t('orders.request.col.externalReference')}
            value={request.externalReferenceId ?? t('common.empty.dash')}
          />
          <InfoItem label={t('orders.col.branch')} value={resolveBranchName(request)} />
          <InfoItem
            label={t('orders.request.detail.sentToPosAt')}
            value={
              request.sentToPosAt
                ? formatDateTime(request.sentToPosAt)
                : t('common.empty.dash')
            }
          />
        </div>
      </DetailsCard>

      <DetailsCard title={t('orders.request.detail.payloadTitle')}>
        {request.rawPayload !== undefined && request.rawPayload !== null ? (
          <details className="orders-payload">
            <summary className="orders-payload__summary">
              {t('orders.request.detail.payloadToggle')}
            </summary>
            <pre className="orders-payload__code" dir="ltr">
              {formatRawPayload(request.rawPayload)}
            </pre>
          </details>
        ) : (
          <p className="orders-payload__empty">{t('orders.request.detail.payloadEmpty')}</p>
        )}
      </DetailsCard>

      <div className="orders-request-link-panel">
        {request.status === 'LINKED' && request.completedOrderId ? (
          <Link
            to={`/orders/${request.completedOrderId}`}
            className="button-primary orders-request-link-panel__link"
          >
            {t('orders.request.detail.viewLinkedOrder')}
            <ChevronRight size={16} aria-hidden />
          </Link>
        ) : (
          <p className="orders-request-link-panel__message">
            {getRequestUnlinkedMessage(request.status, t)}
          </p>
        )}
      </div>
    </div>
  ) : null

  return (
    <EntityDetailScreen
      backTo="/orders/order-requests"
      backLabel={t('orders.request.detail.back')}
      loading={loading}
      loadingMessage={t('orders.request.detail.loading')}
      notFound={!loading && !request && !error}
      notFoundTitle={t('orders.request.detail.notFoundTitle')}
      notFoundMessage={t('orders.request.detail.notFoundMessage')}
      error={error}
      overview={overview}
    />
  )
}
