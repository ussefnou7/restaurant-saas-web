import { useCallback, useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FormInput } from '../../../components/fields'
import { OrderConsumptionStatusBadge } from '../../../components/inventory/OrderConsumptionStatusBadge'
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
} from '../../../components/ui/ListPage'
import { ListPagination } from '../../../components/ui/ListPagination'
import { useNotify } from '../../../components/ui/NotificationContext'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SelectFilter } from '../../../components/ui/SelectFilter'
import {
  ClickableTableRow,
  DataTable,
  StopPropagationCell,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
  ThActions,
} from '../../../components/ui/Table'
import { useTranslation } from '../../../i18n/useTranslation'
import * as orderConsumptionService from '../../../services/orderConsumptionService'
import type {
  OrderConsumptionDocListResponse,
  OrderConsumptionStatus,
} from '../../../types/orderConsumption'
import { canManageInventoryStock } from '../../../utils/inventoryAccess'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { translateApiError } from '../../../utils/errors'
import { formatDate, formatDateTime } from '../../../utils/format'
import { StockAccessDenied } from '../StockAccessDenied'
import { useStockFilterLookups } from '../useStockFilterLookups'
import '../../../styles/order-consumption.css'

const PAGE_SIZE = 20
const STATUS_FILTERS: Array<OrderConsumptionStatus | ''> = [
  '',
  'PENDING',
  'IN_PROGRESS',
  'POSTED',
  'CONFLICT',
]

export function OrderConsumptionListPage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const notify = useNotify()
  const canManage = canManageInventoryStock()
  const { warehouses } = useStockFilterLookups()

  const [docs, setDocs] = useState<OrderConsumptionDocListResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [warehouseId, setWarehouseId] = useState('')
  const [status, setStatus] = useState<OrderConsumptionStatus | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recalculatingId, setRecalculatingId] = useState<number | null>(null)

  const loadDocs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await orderConsumptionService.getOrderConsumptionDocs({
        warehouseId: warehouseId || undefined,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        size: PAGE_SIZE,
      })
      setDocs(result.content)
      setTotalPages(result.totalPages)
      setTotalElements(result.totalElements)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setDocs([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, page, status, t, warehouseId])

  useEffect(() => {
    if (!canManage) return
    const timer = window.setTimeout(() => void loadDocs(), 300)
    return () => window.clearTimeout(timer)
  }, [canManage, loadDocs])

  async function handleRecalculate(docId: number) {
    setRecalculatingId(docId)
    try {
      await orderConsumptionService.recalculateOrderConsumptionDoc(docId)
      notify.success(t('orderConsumption.recalculateSuccess'))
      await loadDocs()
    } catch {
      // Mutation errors are translated by the global API interceptor.
    } finally {
      setRecalculatingId(null)
    }
  }

  if (!canManage) return <StockAccessDenied />

  const hasFilters = Boolean(warehouseId || status || dateFrom || dateTo)
  const showEmpty = !loading && !error && docs.length === 0 && !hasFilters
  const showFilterEmpty = !loading && !error && docs.length === 0 && hasFilters
  const showTable = !loading && !error && docs.length > 0
  const getReference = (doc: OrderConsumptionDocListResponse) =>
    `${doc.warehouseName} - ${formatDate(doc.createdAt)}`

  return (
    <ListPage className="order-consumption-page">
      <PageHeader
        title={t('orderConsumption.list.title')}
        description={t('orderConsumption.list.subtitle')}
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('orderConsumption.list.cardTitle')}
          toolbar={
            <div className="order-consumption-toolbar">
              <SelectFilter
                value={warehouseId}
                onChange={(value) => {
                  setWarehouseId(value)
                  setPage(0)
                }}
                options={[
                  { value: '', label: t('orderConsumption.filter.allWarehouses') },
                  ...warehouses.map((warehouse) => ({
                    value: String(warehouse.id),
                    label: getInventoryLocalizedName(warehouse, locale),
                  })),
                ]}
                ariaLabel={t('orderConsumption.filter.warehouse')}
              />
              <SelectFilter
                value={status}
                onChange={(value) => {
                  setStatus(value as OrderConsumptionStatus | '')
                  setPage(0)
                }}
                options={STATUS_FILTERS.map((value) => ({
                  value,
                  label: value
                    ? t(`orderConsumption.status.${value}`)
                    : t('orderConsumption.filter.allStatuses'),
                }))}
                ariaLabel={t('orderConsumption.filter.status')}
              />
              <label className="order-consumption-toolbar__date">
                <span className="order-consumption-toolbar__date-label">
                  {t('orderConsumption.filter.dateFrom')}
                </span>
                <FormInput
                  type="date"
                  ltr
                  value={dateFrom}
                  onChange={(event) => {
                    setDateFrom(event.target.value)
                    setPage(0)
                  }}
                />
              </label>
              <label className="order-consumption-toolbar__date">
                <span className="order-consumption-toolbar__date-label">
                  {t('orderConsumption.filter.dateTo')}
                </span>
                <FormInput
                  type="date"
                  ltr
                  value={dateTo}
                  onChange={(event) => {
                    setDateTo(event.target.value)
                    setPage(0)
                  }}
                />
              </label>
            </div>
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('orderConsumption.loading')}
          loadingColumns={6}
          showEmpty={showEmpty}
          emptyTitle={t('orderConsumption.empty.title')}
          emptyDescription={t('orderConsumption.empty.description')}
          showFilterEmpty={showFilterEmpty}
          filterEmptyTitle={t('orderConsumption.empty.filteredTitle')}
          filterEmptyDescription={t('orderConsumption.empty.filteredDescription')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="entity">{t('orderConsumption.col.reference')}</Th>
                  <Th column="status">{t('orderConsumption.col.status')}</Th>
                  <Th column="date">{t('orderConsumption.col.createdAt')}</Th>
                  <Th column="date">{t('orderConsumption.col.processedAt')}</Th>
                  <Th>{t('orderConsumption.col.lines')}</Th>
                  <ThActions>{t('orderConsumption.col.actions')}</ThActions>
                </TableRow>
              </TableHead>
              <TableBody>
                {docs.map((doc) => (
                  <ClickableTableRow
                    key={doc.id}
                    onClick={() => navigate(`/inventory/order-consumption/${doc.id}`)}
                  >
                    <Td column="entity">{getReference(doc)}</Td>
                    <Td column="status"><OrderConsumptionStatusBadge status={doc.status} /></Td>
                    <Td column="date" dir="ltr">{formatDateTime(doc.createdAt)}</Td>
                    <Td column="date" dir="ltr">{formatDateTime(doc.processedAt)}</Td>
                    <Td dir="ltr">{doc.lineCount}</Td>
                    <StopPropagationCell className="order-consumption-page__actions" cellAlign="end">
                      {/* TODO: restrict to CONFLICT-only once out of testing phase */}
                      <button
                        type="button"
                        className="order-consumption-recalculate-action"
                        disabled={recalculatingId === doc.id}
                        onClick={() => void handleRecalculate(doc.id)}
                        aria-label={t('orderConsumption.action.recalculate')}
                        title={t('orderConsumption.action.recalculate')}
                      >
                        <RotateCcw size={16} aria-hidden />
                      </button>
                    </StopPropagationCell>
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
            translationPrefix="orderConsumption.pagination"
          />
        ) : null}
      </ListCard>
    </ListPage>
  )
}
