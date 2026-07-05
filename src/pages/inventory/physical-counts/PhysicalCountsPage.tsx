import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge'
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
  ListPrimaryAction,
} from '../../../components/ui/ListPage'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SelectFilter } from '../../../components/ui/SelectFilter'
import {
  ClickableTableRow,
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../../components/ui/Table'
import { useTranslation } from '../../../i18n/useTranslation'
import * as physicalCountService from '../../../services/physicalCountService'
import type { PhysicalCountStatus, PhysicalCountSummaryResponse } from '../../../types/inventoryOperations'
import { translateApiError } from '../../../utils/errors'
import { formatDate } from '../../../utils/format'
import { canManageInventoryStock, canViewInventoryStock } from '../../../utils/inventoryAccess'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { StockAccessDenied } from '../StockAccessDenied'
import { useStockFilterLookups } from '../useStockFilterLookups'

function getStatusVariant(status: PhysicalCountStatus): 'muted' | 'warning' | 'success' {
  switch (status) {
    case 'DRAFT':
    case 'CANCELLED':
      return 'muted'
    case 'IN_PROGRESS':
      return 'warning'
    case 'RECONCILED':
      return 'success'
    default:
      return 'muted'
  }
}

export function PhysicalCountsPage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const canView = canViewInventoryStock()
  const canManage = canManageInventoryStock()
  const { warehouses } = useStockFilterLookups()

  const [counts, setCounts] = useState<PhysicalCountSummaryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')

  const loadCounts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await physicalCountService.getPhysicalCounts({
        warehouseId: warehouseFilter || undefined,
      })
      setCounts(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setCounts([])
    } finally {
      setLoading(false)
    }
  }, [t, warehouseFilter])

  useEffect(() => {
    if (!canView) return
    const timer = window.setTimeout(() => void loadCounts(), 300)
    return () => window.clearTimeout(timer)
  }, [canView, loadCounts])

  if (!canView) return <StockAccessDenied />

  const showEmpty = !loading && !error && counts.length === 0
  const showTable = !loading && !error && counts.length > 0

  const warehouseOptions = [
    { value: '', label: t('inventory.common.allWarehouses') },
    ...warehouses.map((warehouse) => ({
      value: String(warehouse.id),
      label: getInventoryLocalizedName(warehouse, locale),
    })),
  ]

  return (
    <ListPage className="physical-counts-page">
      <PageHeader
        title={t('inventory.physicalCounts.title')}
        description={t('inventory.physicalCounts.subtitle')}
        action={
          canManage ? (
            <ListPrimaryAction
              label={t('inventory.physicalCounts.add')}
              onClick={() => navigate('/inventory/physical-counts/new')}
            />
          ) : undefined
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('inventory.physicalCounts.listTitle')}
          toolbar={
            <div className="physical-counts-toolbar">
              <SelectFilter
                value={warehouseFilter}
                onChange={setWarehouseFilter}
                options={warehouseOptions}
                ariaLabel={t('inventory.physicalCounts.filter.warehouse')}
              />
            </div>
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('inventory.physicalCounts.loading')}
          loadingColumns={7}
          showEmpty={showEmpty}
          emptyTitle={t('inventory.physicalCounts.empty.title')}
          emptyDescription={t('inventory.physicalCounts.empty.subtitle')}
          emptyActionLabel={canManage ? t('inventory.physicalCounts.add') : undefined}
          onEmptyAction={canManage ? () => navigate('/inventory/physical-counts/new') : undefined}
          showFilterEmpty={false}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th>{t('inventory.physicalCounts.col.code')}</Th>
                  <Th column="entity">{t('inventory.physicalCounts.col.warehouse')}</Th>
                  <Th>{t('inventory.physicalCounts.col.scheduledDate')}</Th>
                  <Th column="status">{t('inventory.physicalCounts.col.status')}</Th>
                  <Th>{t('inventory.physicalCounts.col.lineCount')}</Th>
                  <Th>{t('inventory.physicalCounts.col.varianceCount')}</Th>
                  <Th>{t('inventory.physicalCounts.col.createdAt')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {counts.map((count) => (
                  <ClickableTableRow
                    key={count.id}
                    onClick={() => navigate(`/inventory/physical-counts/${count.id}`)}
                  >
                    <Td dir="ltr">
                      <span className="physical-count-code">{count.code}</span>
                    </Td>
                    <Td column="entity">{count.warehouseName}</Td>
                    <Td dir="ltr">{formatDate(count.scheduledDate)}</Td>
                    <Td column="status">
                      <Badge variant={getStatusVariant(count.status)}>
                        {t(`inventory.physicalCounts.status.${count.status}`)}
                      </Badge>
                    </Td>
                    <Td dir="ltr">{count.lineCount}</Td>
                    <Td dir="ltr">{count.varianceCount}</Td>
                    <Td dir="ltr">{formatDate(count.createdAt)}</Td>
                  </ClickableTableRow>
                ))}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>
    </ListPage>
  )
}
