import { useCallback, useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
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
import { useTranslation } from '../../i18n/useTranslation'
import * as inventoryStockService from '../../services/inventoryStockService'
import type { ManualTransactionPrefill } from '../../types/inventoryStock'
import type { StockBalanceResponse } from '../../types/inventoryStock'
import { canManageInventoryStock, canViewInventoryStock } from '../../utils/inventoryAccess'
import { getInventoryLocalizedName } from '../../utils/inventoryDisplay'
import { formatMoney } from '../../utils/format'
import { translateApiError } from '../../utils/errors'
import { getBalanceDisplayView, resolveDisplayUomId } from '../../utils/inventoryUom'
import { useInventoryLookups } from './useInventoryLookups'
import { ManualTransactionModal } from './ManualTransactionModal'
import { StockAccessDenied } from './StockAccessDenied'
import { useStockFilterLookups } from './useStockFilterLookups'
import { INVENTORY_STOCK_REFRESH_EVENT } from '../../utils/inventoryStockRefresh'

export function StockBalancesPage() {
  const { t, locale } = useTranslation()
  const notify = useNotify()
  const canView = canViewInventoryStock()
  const canManage = canManageInventoryStock()
  const { warehouses, materials, categories } = useStockFilterLookups()
  const { uoms } = useInventoryLookups()

  const [balances, setBalances] = useState<StockBalanceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [prefill, setPrefill] = useState<ManualTransactionPrefill | null>(null)

  const loadBalances = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await inventoryStockService.getStockBalances({
        search: search.trim() || undefined,
        warehouseId: warehouseId || undefined,
        materialId: materialId || undefined,
        categoryId: categoryId || undefined,
      })
      setBalances(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setBalances([])
    } finally {
      setLoading(false)
    }
  }, [categoryId, materialId, search, t, warehouseId])

  useEffect(() => {
    if (!canView) return
    const timer = window.setTimeout(() => void loadBalances(), 300)
    return () => window.clearTimeout(timer)
  }, [canView, loadBalances])

  useEffect(() => {
    if (!canView) return
    function handleStockRefresh() {
      void loadBalances()
    }
    window.addEventListener(INVENTORY_STOCK_REFRESH_EVENT, handleStockRefresh)
    return () => window.removeEventListener(INVENTORY_STOCK_REFRESH_EVENT, handleStockRefresh)
  }, [canView, loadBalances])

  function openTransactionModal(nextPrefill?: ManualTransactionPrefill) {
    setPrefill(nextPrefill ?? null)
    setModalOpen(true)
  }

  function handleTransactionSuccess() {
    notify.success(t('inventory.stock.manual.toast.success'))
    void loadBalances()
  }

  if (!canView) return <StockAccessDenied />

  const showEmpty = !loading && !error && balances.length === 0
  const showTable = !loading && !error && balances.length > 0

  return (
    <ListPage className="stock-balances-page">
      <PageHeader
        title={t('inventory.stock.balances.title')}
        description={t('inventory.stock.balances.subtitle')}
        action={
          canManage ? (
            <ListPrimaryAction
              label={t('inventory.stock.balances.addTransaction')}
              onClick={() => openTransactionModal()}
            />
          ) : undefined
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('inventory.stock.balances.listTitle')}
          toolbar={
            <>
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
                ariaLabel={t('inventory.stock.balances.col.warehouse')}
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
                ariaLabel={t('inventory.stock.balances.col.material')}
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
            </>
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('inventory.stock.balances.loading')}
          loadingColumns={canManage ? 8 : 7}
          showEmpty={showEmpty}
          emptyTitle={t('inventory.stock.balances.empty.title')}
          emptyDescription={t('inventory.stock.balances.empty.subtitle')}
          emptyActionLabel={canManage ? t('inventory.stock.balances.addTransaction') : undefined}
          onEmptyAction={canManage ? () => openTransactionModal() : undefined}
          showFilterEmpty={false}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="entity">{t('inventory.stock.balances.col.material')}</Th>
                  <Th>{t('inventory.stock.balances.col.warehouse')}</Th>
                  <Th>{t('inventory.stock.balances.col.quantity')}</Th>
                  <Th>{t('inventory.stock.balances.col.uom')}</Th>
                  <Th>{t('inventory.stock.balances.col.avgCost')}</Th>
                  <Th>{t('inventory.stock.balances.col.stockValue')}</Th>
                  <Th column="status">{t('inventory.stock.balances.col.status')}</Th>
                  {canManage ? <Th>{t('inventory.col.actions')}</Th> : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {balances.map((row) => {
                  const quantityView = getBalanceDisplayView(
                    row,
                    uoms,
                    t('inventory.stock.balances.storedAs'),
                  )
                  const material = materials.find((m) => m.id === row.materialId)
                  const displayUomId =
                    row.displayUomId ??
                    (material ? resolveDisplayUomId(material) : row.uomId)

                  return (
                    <TableRow key={row.id}>
                      <Td column="entity">
                        <EntityCell
                          name={getInventoryLocalizedName(
                            {
                              name: row.materialName,
                              nameAr: row.materialNameAr,
                              code: row.materialCode,
                            },
                            locale,
                          )}
                          code={row.materialCode}
                          compact
                        />
                      </Td>
                      <Td>
                        {getInventoryLocalizedName(
                          {
                            name: row.warehouseName,
                            nameAr: row.warehouseNameAr,
                            code: row.warehouseCode,
                          },
                          locale,
                        )}
                      </Td>
                      <Td dir="ltr">
                        <span>{quantityView.primary}</span>
                        {quantityView.stockSecondary ? (
                          <span className="inventory-uom-secondary" title={quantityView.stockSecondary}>
                            {quantityView.stockSecondary}
                          </span>
                        ) : null}
                      </Td>
                      <Td>
                        {row.displayUomSymbol ??
                          uoms.find((u) => u.id === displayUomId)?.symbol ??
                          row.uomSymbol ??
                          t('common.empty.dash')}
                      </Td>
                      <Td dir="ltr">{formatMoney(row.averageCost)}</Td>
                      <Td dir="ltr">{formatMoney(row.stockValue)}</Td>
                      <Td column="status">
                        <Badge variant={row.lowStock ? 'warning' : 'success'}>
                          {row.lowStock
                            ? t('inventory.stock.balances.status.low')
                            : t('inventory.stock.balances.status.ok')}
                        </Badge>
                      </Td>
                      {canManage ? (
                        <Td>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              openTransactionModal({
                                warehouseId: row.warehouseId,
                                materialId: row.materialId,
                                uomId: displayUomId,
                              })
                            }
                          >
                            {t('inventory.stock.balances.addTransaction')}
                          </Button>
                        </Td>
                      ) : null}
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
        prefill={prefill}
        onClose={() => setModalOpen(false)}
        onSuccess={handleTransactionSuccess}
      />
    </ListPage>
  )
}
