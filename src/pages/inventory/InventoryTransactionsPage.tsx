import { useCallback, useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { EntityCell } from '../../components/ui/EntityCell'
import { useNotify } from '../../components/ui/NotificationContext'
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
  ListPrimaryAction,
  ListToolbarSearch,
} from '../../components/ui/ListPage'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectFilter } from '../../components/ui/SelectFilter'
import {
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../components/ui/Table'
import { FormInput } from '../../components/fields'
import { useTranslation } from '../../i18n/useTranslation'
import * as inventoryStockService from '../../services/inventoryStockService'
import type { InventoryTransactionResponse, InventoryTransactionType } from '../../types/inventoryStock'
import { translateApiError } from '../../utils/errors'
import { formatDateTime } from '../../utils/format'
import { canManageInventoryStock, canViewInventoryStock } from '../../utils/inventoryAccess'
import { getInventoryLocalizedName } from '../../utils/inventoryDisplay'
import {
  getTransactionDirectionLabel,
  getTransactionTypeLabel,
} from '../../utils/inventoryStockDisplay'
import { getTransactionQuantityView } from '../../utils/inventoryUom'
import { ManualTransactionModal } from './ManualTransactionModal'
import { StockAccessDenied } from './StockAccessDenied'
import { useStockFilterLookups } from './useStockFilterLookups'

const TRANSACTION_TYPE_FILTERS: Array<InventoryTransactionType | ''> = [
  '',
  'OPENING_BALANCE',
  'MANUAL_IN',
  'MANUAL_OUT',
  'PURCHASE_IN',
  'WASTE',
  'TRANSFER_IN',
  'TRANSFER_OUT',
]

const DIRECTION_FILTERS = ['', 'IN', 'OUT'] as const

export function InventoryTransactionsPage() {
  const { t, locale } = useTranslation()
  const notify = useNotify()
  const canView = canViewInventoryStock()
  const canManage = canManageInventoryStock()
  const { warehouses, materials, categories } = useStockFilterLookups()

  const [transactions, setTransactions] = useState<InventoryTransactionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [transactionType, setTransactionType] = useState('')
  const [direction, setDirection] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await inventoryStockService.getInventoryTransactions({
        search: search.trim() || undefined,
        warehouseId: warehouseId || undefined,
        materialId: materialId || undefined,
        categoryId: categoryId || undefined,
        transactionType: transactionType || undefined,
        direction: direction || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      setTransactions(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [
    categoryId,
    dateFrom,
    dateTo,
    direction,
    materialId,
    search,
    t,
    transactionType,
    warehouseId,
  ])

  useEffect(() => {
    if (!canView) return
    const timer = window.setTimeout(() => void loadTransactions(), 300)
    return () => window.clearTimeout(timer)
  }, [canView, loadTransactions])

  function handleTransactionSuccess() {
    notify.success(t('inventory.stock.manual.toast.success'))
    void loadTransactions()
  }

  if (!canView) return <StockAccessDenied />

  const showEmpty = !loading && !error && transactions.length === 0
  const showTable = !loading && !error && transactions.length > 0

  return (
    <ListPage className="inventory-transactions-page">
      <PageHeader
        title={t('inventory.stock.transactions.title')}
        description={t('inventory.stock.transactions.subtitle')}
        action={
          canManage ? (
            <ListPrimaryAction
              label={t('inventory.stock.transactions.addTransaction')}
              onClick={() => setModalOpen(true)}
            />
          ) : undefined
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('inventory.stock.transactions.listTitle')}
          toolbar={
            <div className="stock-transactions-toolbar">
              <ListToolbarSearch
                value={search}
                onChange={setSearch}
                placeholder={t('common.search')}
                ariaLabel={t('common.search')}
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
                ariaLabel={t('inventory.stock.transactions.col.warehouse')}
              />
              <SelectFilter
                value={materialId}
                onChange={setMaterialId}
                options={[
                  { value: '', label: t('inventory.common.allMaterials') },
                  ...materials.map((m) => ({
                    value: String(m.id),
                    label: getInventoryLocalizedName(m, locale),
                  })),
                ]}
                ariaLabel={t('inventory.stock.transactions.col.material')}
              />
              <SelectFilter
                value={categoryId}
                onChange={setCategoryId}
                options={[
                  { value: '', label: t('inventory.common.allCategories') },
                  ...categories.map((c) => ({
                    value: String(c.id),
                    label: getInventoryLocalizedName(c, locale),
                  })),
                ]}
                ariaLabel={t('inventory.col.category')}
              />
              <SelectFilter
                value={transactionType}
                onChange={setTransactionType}
                options={TRANSACTION_TYPE_FILTERS.map((type) => ({
                  value: type,
                  label: type
                    ? getTransactionTypeLabel(type, t)
                    : t('inventory.stock.transactions.filter.allTypes'),
                }))}
                ariaLabel={t('inventory.stock.transactions.col.type')}
              />
              <SelectFilter
                value={direction}
                onChange={setDirection}
                options={DIRECTION_FILTERS.map((dir) => ({
                  value: dir,
                  label: dir
                    ? getTransactionDirectionLabel(dir, t)
                    : t('inventory.stock.transactions.filter.allDirections'),
                }))}
                ariaLabel={t('inventory.stock.transactions.col.direction')}
              />
              <label className="stock-transactions-toolbar__date">
                <span className="stock-transactions-toolbar__date-label">
                  {t('inventory.stock.transactions.filter.dateFrom')}
                </span>
                <FormInput type="date" ltr value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </label>
              <label className="stock-transactions-toolbar__date">
                <span className="stock-transactions-toolbar__date-label">
                  {t('inventory.stock.transactions.filter.dateTo')}
                </span>
                <FormInput type="date" ltr value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </label>
            </div>
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('inventory.stock.transactions.loading')}
          loadingColumns={7}
          showEmpty={showEmpty}
          emptyTitle={t('inventory.stock.transactions.empty.title')}
          emptyDescription={t('inventory.stock.transactions.empty.subtitle')}
          emptyActionLabel={canManage ? t('inventory.stock.transactions.addTransaction') : undefined}
          onEmptyAction={canManage ? () => setModalOpen(true) : undefined}
          showFilterEmpty={false}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="date">{t('inventory.stock.transactions.col.date')}</Th>
                  <Th>{t('inventory.stock.transactions.col.type')}</Th>
                  <Th>{t('inventory.stock.transactions.col.direction')}</Th>
                  <Th column="entity">{t('inventory.stock.transactions.col.material')}</Th>
                  <Th>{t('inventory.stock.transactions.col.warehouse')}</Th>
                  <Th className="table-cell--numeric">{t('inventory.stock.transactions.col.quantity')}</Th>
                  <Th>{t('inventory.stock.transactions.col.uom')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((txn) => {
                  const quantityView = getTransactionQuantityView(
                    txn.enteredQuantity,
                    txn.enteredUomSymbol,
                    txn.enteredUomCode,
                    txn.stockQuantity,
                    txn.stockUomSymbol,
                    txn.stockUomCode,
                    t('inventory.stock.transactions.storedAs'),
                  )

                  return (
                    <TableRow key={txn.id}>
                      <Td column="date">{formatDateTime(txn.transactionDate)}</Td>
                      <Td>{getTransactionTypeLabel(txn.transactionType, t)}</Td>
                      <Td>
                        <Badge variant={txn.direction === 'IN' ? 'success' : 'inactive'}>
                          {getTransactionDirectionLabel(txn.direction, t)}
                        </Badge>
                      </Td>
                      <Td column="entity">
                        <EntityCell
                          name={getInventoryLocalizedName(
                            {
                              name: txn.materialName,
                              nameAr: txn.materialNameAr,
                              code: txn.materialCode,
                            },
                            locale,
                          )}
                          code={txn.materialCode}
                          compact
                        />
                      </Td>
                      <Td>
                        {getInventoryLocalizedName(
                          {
                            name: txn.warehouseName,
                            nameAr: txn.warehouseNameAr,
                            code: txn.warehouseCode,
                          },
                          locale,
                        )}
                      </Td>
                      <Td dir="ltr" className="table-cell--numeric">
                        <span>{quantityView.primary}</span>
                        {quantityView.stockSecondary ? (
                          <span className="inventory-uom-secondary">{quantityView.stockSecondary}</span>
                        ) : null}
                      </Td>
                      <Td>
                        {txn.enteredUomSymbol ??
                          txn.enteredUomName ??
                          txn.enteredUomCode ??
                          t('common.empty.dash')}
                      </Td>
                    </TableRow>
                  )
                })}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>

      <ManualTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleTransactionSuccess}
      />
    </ListPage>
  )
}
