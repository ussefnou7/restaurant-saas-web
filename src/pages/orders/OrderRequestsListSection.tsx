import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RequestSourceBadge,
  RequestStatusBadge,
} from '../../components/orders/OrderRequestBadges'
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
import * as orderRequestService from '../../services/orderRequestService'
import type { BranchResponse } from '../../types/branch'
import type { IncomingOrderRequestView, RequestSource, RequestStatus } from '../../types/orderRequest'
import { getLocalizedBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'
import { formatDateTime } from '../../utils/format'

const REQUEST_SOURCES: Array<RequestSource | ''> = ['', 'ONLINE', 'AGGREGATOR']
const REQUEST_STATUSES: Array<RequestStatus | ''> = ['', 'RECEIVED', 'SENT_TO_POS', 'LINKED']
const PAGE_SIZE = 20

export function OrderRequestsListSection() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()

  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [requests, setRequests] = useState<IncomingOrderRequestView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
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

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await orderRequestService.getOrderRequests({
        source: (sourceFilter || undefined) as RequestSource | undefined,
        status: (statusFilter || undefined) as RequestStatus | undefined,
        branchId: branchId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        size: PAGE_SIZE,
      })
      setRequests(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(result.totalPages)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setRequests([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [branchId, dateFrom, dateTo, page, sourceFilter, statusFilter, t])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRequests(), 300)
    return () => window.clearTimeout(timer)
  }, [loadRequests])

  useEffect(() => {
    setPage(0)
  }, [sourceFilter, statusFilter, branchId, dateFrom, dateTo])

  function resolveBranchName(request: IncomingOrderRequestView): string {
    if (!request.branchId) return t('common.empty.dash')
    if (request.branchName) return request.branchName
    const branch = branches.find((b) => b.id === request.branchId)
    if (branch) return getLocalizedBranchName(branch, locale)
    return t('common.empty.dash')
  }

  const showEmpty = !loading && !error && requests.length === 0
  const showTable = !loading && !error && requests.length > 0

  return (
    <>
      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('orders.request.list.title')}
          toolbar={
            <div className="orders-toolbar">
              <SelectFilter
                value={sourceFilter}
                onChange={setSourceFilter}
                options={REQUEST_SOURCES.map((source) => ({
                  value: source,
                  label: source
                    ? t(`orders.request.source.${source}`)
                    : t('orders.filter.allSources'),
                }))}
                ariaLabel={t('orders.col.source')}
              />
              <SelectFilter
                value={statusFilter}
                onChange={setStatusFilter}
                options={REQUEST_STATUSES.map((status) => ({
                  value: status,
                  label: status
                    ? t(`orders.request.status.${status}`)
                    : t('common.allStatuses'),
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
          loadingMessage={t('orders.request.list.loading')}
          loadingColumns={5}
          showEmpty={showEmpty}
          emptyTitle={t('orders.request.list.empty.title')}
          emptyDescription={t('orders.request.list.empty.subtitle')}
          showFilterEmpty={false}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th className="table-cell--numeric">{t('orders.request.col.createdAt')}</Th>
                  <Th>{t('orders.col.source')}</Th>
                  <Th>{t('orders.request.col.externalReference')}</Th>
                  <Th>{t('orders.col.branch')}</Th>
                  <Th>{t('orders.col.status')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((request) => (
                  <ClickableTableRow
                    key={request.id}
                    onClick={() => navigate(`/orders/requests/${request.id}`)}
                  >
                    <Td className="table-cell--numeric" dir="ltr">
                      {formatDateTime(request.createdAt)}
                    </Td>
                    <Td>
                      <RequestSourceBadge
                        source={request.source}
                        aggregatorName={request.aggregatorName}
                      />
                    </Td>
                    <Td dir="ltr">
                      {request.externalReferenceId ?? t('common.empty.dash')}
                    </Td>
                    <Td>{resolveBranchName(request)}</Td>
                    <Td>
                      <RequestStatusBadge status={request.status} />
                    </Td>
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
