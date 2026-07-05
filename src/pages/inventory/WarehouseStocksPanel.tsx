import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, ChevronLeft, Pencil, Plus, Search, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { IconActionButton } from '../../components/ui/RowActions'
import {
  ClickableTableRow,
  DataTable,
  StopPropagationCell,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../components/ui/Table'
import { useTranslation } from '../../i18n/useTranslation'
import * as inventoryService from '../../services/inventoryService'
import * as inventoryStockService from '../../services/inventoryStockService'
import type { MaterialResponse } from '../../types/inventory'
import type { StockBatchResponse, WarehouseStockResponse } from '../../types/inventoryStock'
import { canManageInventoryStock } from '../../utils/inventoryAccess'
import { translateApiError } from '../../utils/errors'
import { formatDate, formatMoney, formatNumber } from '../../utils/format'
import { getDisplayUomLabel } from '../../utils/inventoryUom'
import {
  INVENTORY_STOCK_REFRESH_EVENT,
  notifyStockBalancesRefresh,
} from '../../utils/inventoryStockRefresh'
import { WarehouseStockBatchSubRow } from './WarehouseStockBatchSubRow'
import { WarehouseStockMaterialSearch } from './WarehouseStockMaterialSearch'

interface WarehouseStocksPanelProps {
  warehouseId: string
}

type StockSettingsForm = {
  minimumQuantity: string
}

const emptySettingsForm: StockSettingsForm = {
  minimumQuantity: '0',
}

function getMinimumQuantity(stock: WarehouseStockResponse): number {
  return stock.minimumQuantity ?? stock.minimumStockLevel ?? 0
}

function isBelowMinimum(stock: WarehouseStockResponse): boolean {
  if (stock.belowMinimum !== undefined) return stock.belowMinimum
  if (stock.lowStock !== undefined) return stock.lowStock
  const minimum = getMinimumQuantity(stock)
  return minimum > 0 && stock.quantity <= minimum
}

function displayMaterialName(stock: WarehouseStockResponse): string {
  return stock.materialNameAr?.trim() || stock.materialName
}

function displayUomName(stock: WarehouseStockResponse): string {
  const symbol = stock.uomSymbol?.trim()
  if (symbol) return symbol
  return stock.uomNameAr?.trim() || stock.uomName
}

function settingsFormFromStock(stock: WarehouseStockResponse): StockSettingsForm {
  return {
    minimumQuantity: String(getMinimumQuantity(stock)),
  }
}

function parseQuantity(value: string, fallback = 0): number {
  const trimmed = value.trim()
  if (!trimmed) return fallback
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : fallback
}

function mergeStockRow(
  existing: WarehouseStockResponse,
  updated: WarehouseStockResponse,
): WarehouseStockResponse {
  return { ...existing, ...updated }
}

export function WarehouseStocksPanel({ warehouseId }: WarehouseStocksPanelProps) {
  const { t, locale } = useTranslation()
  const canManage = canManageInventoryStock()

  const [stocks, setStocks] = useState<WarehouseStockResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [showAddRow, setShowAddRow] = useState(false)
  const [addMaterial, setAddMaterial] = useState<MaterialResponse | null>(null)
  const [addForm, setAddForm] = useState<StockSettingsForm>(emptySettingsForm)
  const [addOpeningQuantity, setAddOpeningQuantity] = useState('0')
  const [addAverageCost, setAddAverageCost] = useState('0')
  const [addError, setAddError] = useState('')
  const [addSaving, setAddSaving] = useState(false)

  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<StockSettingsForm>(emptySettingsForm)
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const [expandedBalanceIds, setExpandedBalanceIds] = useState<Set<number>>(() => new Set())
  const [batchCache, setBatchCache] = useState<Record<number, StockBatchResponse[]>>({})
  const [batchLoadingIds, setBatchLoadingIds] = useState<Set<number>>(() => new Set())
  const [batchErrors, setBatchErrors] = useState<Record<number, string>>({})
  const batchCacheRef = useRef(batchCache)
  const fetchingBalanceIdsRef = useRef<Set<number>>(new Set())
  batchCacheRef.current = batchCache

  const loadStocks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await inventoryService.getWarehouseStocks(warehouseId, {
        search: search.trim() || undefined,
      })
      setStocks(data)
      setBatchCache({})
      setBatchErrors({})
      fetchingBalanceIdsRef.current.clear()
    } catch (err) {
      setStocks([])
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [search, t, warehouseId])

  const fetchBalanceBatches = useCallback(
    async (balanceId: number) => {
      if (batchCacheRef.current[balanceId] !== undefined) return
      if (fetchingBalanceIdsRef.current.has(balanceId)) return

      fetchingBalanceIdsRef.current.add(balanceId)
      setBatchLoadingIds((current) => {
        const next = new Set(current)
        next.add(balanceId)
        return next
      })

      try {
        const batches = await inventoryStockService.getStockBalanceBatches(balanceId)
        setBatchCache((current) => ({ ...current, [balanceId]: batches }))
        setBatchErrors((current) => {
          if (!(balanceId in current)) return current
          const next = { ...current }
          delete next[balanceId]
          return next
        })
      } catch (err) {
        setBatchErrors((current) => ({
          ...current,
          [balanceId]: translateApiError(err, t).message,
        }))
      } finally {
        fetchingBalanceIdsRef.current.delete(balanceId)
        setBatchLoadingIds((current) => {
          if (!current.has(balanceId)) return current
          const next = new Set(current)
          next.delete(balanceId)
          return next
        })
      }
    },
    [t],
  )

  function toggleBalanceRow(balanceId: number) {
    const willExpand = !expandedBalanceIds.has(balanceId)

    setExpandedBalanceIds((current) => {
      const next = new Set(current)
      if (next.has(balanceId)) {
        next.delete(balanceId)
      } else {
        next.add(balanceId)
      }
      return next
    })

    if (willExpand) {
      setBatchErrors((errors) => {
        if (!(balanceId in errors)) return errors
        const cleared = { ...errors }
        delete cleared[balanceId]
        return cleared
      })
      void fetchBalanceBatches(balanceId)
    }
  }

  useEffect(() => {
    if (loading) return
    for (const balanceId of expandedBalanceIds) {
      if (batchCache[balanceId] !== undefined || batchErrors[balanceId]) continue
      void fetchBalanceBatches(balanceId)
    }
  }, [batchCache, batchErrors, expandedBalanceIds, fetchBalanceBatches, loading, stocks])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadStocks(), 300)
    return () => window.clearTimeout(timer)
  }, [loadStocks])

  useEffect(() => {
    function handleStockRefresh() {
      void loadStocks()
    }
    window.addEventListener(INVENTORY_STOCK_REFRESH_EVENT, handleStockRefresh)
    return () => window.removeEventListener(INVENTORY_STOCK_REFRESH_EVENT, handleStockRefresh)
  }, [loadStocks])

  function cancelAddRow() {
    setShowAddRow(false)
    setAddMaterial(null)
    setAddForm(emptySettingsForm)
    setAddOpeningQuantity('0')
    setAddAverageCost('0')
    setAddError('')
  }

  function startAddRow() {
    setEditingMaterialId(null)
    setEditError('')
    setShowAddRow(true)
    setAddMaterial(null)
    setAddForm(emptySettingsForm)
    setAddOpeningQuantity('0')
    setAddAverageCost('0')
    setAddError('')
  }

  function startEditRow(stock: WarehouseStockResponse) {
    setEditingMaterialId(stock.materialId)
    setEditForm(settingsFormFromStock(stock))
    setEditError('')
  }

  function cancelEditRow() {
    setEditingMaterialId(null)
    setEditForm(emptySettingsForm)
    setEditError('')
  }

  async function handleSaveAdd() {
    if (!addMaterial) {
      setAddError(t('inventory.warehouses.stocks.add.materialRequired'))
      return
    }

    if (stocks.some((stock) => stock.materialId === addMaterial.id)) {
      setAddError(t('inventory.warehouses.stocks.duplicateError'))
      return
    }

    setAddSaving(true)
    setAddError('')
    try {
      await inventoryService.addMaterialToWarehouse(warehouseId, {
        materialId: addMaterial.id,
        openingBalance: parseQuantity(addOpeningQuantity, 0),
        averageCost: parseQuantity(addAverageCost, 0),
        minimumQuantity: parseQuantity(addForm.minimumQuantity, 0),
      })
      cancelAddRow()
      notifyStockBalancesRefresh()
      await loadStocks()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setAddSaving(false)
    }
  }

  async function handleSaveEdit(stock: WarehouseStockResponse) {
    setEditSaving(true)
    setEditError('')
    try {
      const updated = await inventoryService.updateStockSettings(warehouseId, stock.materialId, {
        minimumQuantity: parseQuantity(editForm.minimumQuantity, 0),
      })
      setStocks((current) =>
        current.map((row) =>
          row.materialId === stock.materialId ? mergeStockRow(row, updated) : row,
        ),
      )
      cancelEditRow()
      notifyStockBalancesRefresh()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setEditSaving(false)
    }
  }

  const excludedMaterialIds = stocks.map((stock) => stock.materialId)
  const showEmpty = !loading && !error && stocks.length === 0 && !showAddRow
  const showTable = !loading && !error && (stocks.length > 0 || showAddRow)

  function renderNumberInput(
    value: string,
    onChange: (next: string) => void,
    disabled: boolean,
    ariaLabel: string,
  ) {
    return (
      <input
        type="number"
        min={0}
        step="any"
        className="stocks-number-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
      />
    )
  }

  function renderAverageCost(stock: WarehouseStockResponse | null) {
    if (stock?.averageCost == null) return t('common.empty.dash')
    return formatMoney(stock.averageCost)
  }

  function renderLastPurchasePrice(stock: WarehouseStockResponse | null) {
    if (stock?.lastPurchasePrice == null) return t('common.empty.dash')
    return formatMoney(stock.lastPurchasePrice)
  }

  function renderLastPurchaseDate(stock: WarehouseStockResponse | null) {
    if (!stock?.lastPurchaseDate) return t('common.empty.dash')
    return formatDate(stock.lastPurchaseDate)
  }

  function renderBelowMinimumFlag(stock: WarehouseStockResponse | null) {
    if (!stock) return t('common.empty.dash')
    const belowMin = isBelowMinimum(stock)
    return (
      <Badge variant={belowMin ? 'warning' : 'success'}>
        {belowMin
          ? t('inventory.stock.balances.status.low')
          : t('inventory.stock.balances.status.ok')}
      </Badge>
    )
  }

  const tableColumnCount = canManage ? 10 : 9

  return (
    <section className="warehouse-stocks-panel" aria-labelledby="warehouse-stocks-heading">
      <div className="warehouse-stocks-panel__header">
        <div className="warehouse-stocks-panel__header-start">
          <h2 id="warehouse-stocks-heading" className="warehouse-stocks-panel__title">
            {t('inventory.warehouses.stocks.title')}
          </h2>
          {canManage ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="warehouse-stocks-panel__add-btn"
              onClick={startAddRow}
              disabled={showAddRow || addSaving}
            >
              <Plus size={16} aria-hidden />
              {t('inventory.warehouses.stocks.addMaterial')}
            </Button>
          ) : null}
        </div>
        <div className="warehouse-stocks-panel__search">
          <Search className="warehouse-stocks-panel__search-icon" size={16} aria-hidden />
          <input
            type="search"
            className="warehouse-stocks-panel__search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('inventory.warehouses.stocks.searchPlaceholder')}
            aria-label={t('inventory.warehouses.stocks.searchPlaceholder')}
          />
        </div>
      </div>

      {error ? <div className="page-error-banner">{error}</div> : null}

      {loading ? <LoadingState message={t('inventory.warehouses.stocks.loading')} /> : null}

      {showEmpty ? (
        <p className="warehouse-stocks-panel__empty">{t('inventory.warehouses.stocks.noMaterials')}</p>
      ) : null}

      {showTable ? (
        <div className="warehouse-stocks-panel__table-wrap">
          <DataTable className="warehouse-stocks-panel__table">
            <TableHead>
              <TableRow>
                <Th>{t('inventory.warehouses.stocks.material')}</Th>
                <Th>{t('inventory.warehouses.stocks.uom')}</Th>
                <Th>{t('inventory.warehouses.stocks.openingQty')}</Th>
                <Th>{t('inventory.warehouses.stocks.currentQty')}</Th>
                <Th>{t('inventory.warehouses.stocks.minQty')}</Th>
                <Th>{t('inventory.stock.balances.col.avgCost')}</Th>
                <Th>{t('inventory.warehouses.stocks.lastPurchasePrice')}</Th>
                <Th>{t('inventory.warehouses.stocks.lastPurchaseDate')}</Th>
                <Th>{t('inventory.stock.balances.col.status')}</Th>
                {canManage ? <Th column="actions">{t('inventory.col.actions')}</Th> : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {showAddRow ? (
                <>
                  <TableRow className="stocks-add-row">
                    <Td>
                      <WarehouseStockMaterialSearch
                        value={addMaterial}
                        onChange={(material) => {
                          setAddMaterial(material)
                          setAddError('')
                        }}
                        excludedMaterialIds={excludedMaterialIds}
                        disabled={addSaving}
                        hasError={Boolean(addError && !addMaterial)}
                      />
                    </Td>
                    <Td>
                      {addMaterial
                        ? getDisplayUomLabel(addMaterial, locale)
                        : t('common.empty.dash')}
                    </Td>
                    <Td>
                      {renderNumberInput(
                        addOpeningQuantity,
                        setAddOpeningQuantity,
                        addSaving,
                        t('inventory.warehouses.stocks.openingQty'),
                      )}
                    </Td>
                    <Td>{t('common.empty.dash')}</Td>
                    <Td>
                      {renderNumberInput(
                        addForm.minimumQuantity,
                        (value) => setAddForm((prev) => ({ ...prev, minimumQuantity: value })),
                        addSaving,
                        t('inventory.warehouses.stocks.minQty'),
                      )}
                    </Td>
                    <Td dir="ltr">
                      {renderNumberInput(
                        addAverageCost,
                        setAddAverageCost,
                        addSaving,
                        t('inventory.stock.balances.col.avgCost'),
                      )}
                    </Td>
                    <Td dir="ltr">{t('common.empty.dash')}</Td>
                    <Td dir="ltr">{t('common.empty.dash')}</Td>
                    <Td>{t('common.empty.dash')}</Td>
                    <Td>
                      <div className="stocks-row-actions">
                        <IconActionButton
                          className="action-btn action-btn--icon action-btn--confirm"
                          label={t('inventory.warehouses.stocks.save')}
                          onClick={() => void handleSaveAdd()}
                          disabled={addSaving}
                        >
                          <Check size={16} aria-hidden />
                        </IconActionButton>
                        <IconActionButton
                          className="action-btn action-btn--icon action-btn--cancel"
                          label={t('inventory.warehouses.stocks.cancel')}
                          onClick={cancelAddRow}
                          disabled={addSaving}
                        >
                          <X size={16} aria-hidden />
                        </IconActionButton>
                      </div>
                    </Td>
                  </TableRow>
                  {addError ? (
                    <TableRow className="warehouse-stocks-panel__error-row">
                      <Td colSpan={tableColumnCount}>
                        <p className="stocks-inline-error">{addError}</p>
                      </Td>
                    </TableRow>
                  ) : null}
                </>
              ) : null}

              {stocks.map((stock) => {
                const belowMin = isBelowMinimum(stock)
                const isEditing = editingMaterialId === stock.materialId

                if (isEditing) {
                  return (
                    <Fragment key={stock.id}>
                      <TableRow className="stocks-add-row">
                        <Td>{displayMaterialName(stock)}</Td>
                        <Td>{displayUomName(stock)}</Td>
                        <Td>{formatNumber(stock.openingBalance ?? 0)}</Td>
                        <Td className={belowMin ? 'stock-qty--below-minimum' : undefined}>
                          {formatNumber(stock.quantity)}
                        </Td>
                        <Td>
                          {renderNumberInput(
                            editForm.minimumQuantity,
                            (value) => setEditForm((prev) => ({ ...prev, minimumQuantity: value })),
                            editSaving,
                            t('inventory.warehouses.stocks.minQty'),
                          )}
                        </Td>
                        <Td dir="ltr">{renderAverageCost(stock)}</Td>
                        <Td dir="ltr">{renderLastPurchasePrice(stock)}</Td>
                        <Td dir="ltr">{renderLastPurchaseDate(stock)}</Td>
                        <Td>{renderBelowMinimumFlag(stock)}</Td>
                        <Td>
                          <div className="stocks-row-actions">
                            <IconActionButton
                              className="action-btn action-btn--icon action-btn--confirm"
                              label={t('inventory.warehouses.stocks.save')}
                              onClick={() => void handleSaveEdit(stock)}
                              disabled={editSaving}
                            >
                              <Check size={16} aria-hidden />
                            </IconActionButton>
                            <IconActionButton
                              className="action-btn action-btn--icon action-btn--cancel"
                              label={t('inventory.warehouses.stocks.cancel')}
                              onClick={cancelEditRow}
                              disabled={editSaving}
                            >
                              <X size={16} aria-hidden />
                            </IconActionButton>
                          </div>
                        </Td>
                      </TableRow>
                      {editError ? (
                        <TableRow className="warehouse-stocks-panel__error-row">
                          <Td colSpan={tableColumnCount}>
                            <p className="stocks-inline-error">{editError}</p>
                          </Td>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  )
                }

                const isExpanded = expandedBalanceIds.has(stock.id)

                return (
                  <Fragment key={stock.id}>
                    <ClickableTableRow
                      onClick={() => toggleBalanceRow(stock.id)}
                      selected={isExpanded}
                    >
                      <Td>
                        <span className="warehouse-stocks-panel__material-cell">
                          <span
                            className={`warehouse-stocks-panel__row-chevron${
                              isExpanded ? '' : ' warehouse-stocks-panel__row-chevron--collapsed'
                            }`}
                            aria-hidden="true"
                          >
                            {isExpanded ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronLeft size={16} />
                            )}
                          </span>
                          {displayMaterialName(stock)}
                        </span>
                      </Td>
                      <Td>{displayUomName(stock)}</Td>
                      <Td>{formatNumber(stock.openingBalance ?? 0)}</Td>
                      <Td className={belowMin ? 'stock-qty--below-minimum' : undefined}>
                        {formatNumber(stock.quantity)}
                      </Td>
                      <Td>{formatNumber(getMinimumQuantity(stock))}</Td>
                      <Td dir="ltr">{renderAverageCost(stock)}</Td>
                      <Td dir="ltr">{renderLastPurchasePrice(stock)}</Td>
                      <Td dir="ltr">{renderLastPurchaseDate(stock)}</Td>
                      <Td>{renderBelowMinimumFlag(stock)}</Td>
                      {canManage ? (
                        <StopPropagationCell>
                          <IconActionButton
                            className="action-btn action-btn--icon warehouse-stocks-panel__edit-btn"
                            label={t('inventory.warehouses.stocks.actions.edit')}
                            onClick={() => startEditRow(stock)}
                            disabled={showAddRow || addSaving || editSaving}
                          >
                            <Pencil size={16} aria-hidden />
                          </IconActionButton>
                        </StopPropagationCell>
                      ) : null}
                    </ClickableTableRow>
                    {isExpanded ? (
                      <TableRow className="warehouse-stocks-panel__batches-row">
                        <Td colSpan={tableColumnCount} className="warehouse-stocks-panel__batches-cell">
                          <WarehouseStockBatchSubRow
                            loading={batchLoadingIds.has(stock.id)}
                            batches={batchCache[stock.id]}
                            error={batchErrors[stock.id]}
                            uomSymbol={displayUomName(stock)}
                          />
                        </Td>
                      </TableRow>
                    ) : null}
                  </Fragment>
                )
              })}
            </TableBody>
          </DataTable>
        </div>
      ) : null}
    </section>
  )
}
