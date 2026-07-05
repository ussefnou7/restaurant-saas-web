import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingRows } from '../../components/ui/LoadingRows'
import { Modal } from '../../components/ui/Modal'
import { SearchInput } from '../../components/ui/SearchInput'
import { SelectFilter } from '../../components/ui/SelectFilter'
import { useNotify } from '../../components/ui/NotificationContext'
import {
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../components/ui/Table'
import { useTranslation } from '../../i18n/useTranslation'
import * as inventoryService from '../../services/inventoryService'
import type { ImportMaterialsResponse, MaterialCatalogResponse } from '../../types/inventory'
import { translateApiError } from '../../utils/errors'
import { canManageInventorySetup } from '../../utils/inventoryAccess'
import { getInventoryLocalizedName } from '../../utils/inventoryDisplay'
import { getDisplayUomLabel, getStockUomLabel } from '../../utils/inventoryUom'
import { getImportSkippedReasonLabel } from '../../utils/inventoryImport'
import { ReadyMaterialCell } from './ReadyMaterialCell'
import { useInventoryLookups } from './useInventoryLookups'

const SHOW_ALREADY_IMPORTED = false

function isAlreadyImported(item: MaterialCatalogResponse): boolean {
  return Boolean(item.alreadyImported || item.importedMaterialId)
}

interface MaterialCatalogImportModalProps {
  open: boolean
  onClose: () => void
  onImported?: () => void
}

export function MaterialCatalogImportModal({
  open,
  onClose,
  onImported,
}: MaterialCatalogImportModalProps) {
  const { t, locale } = useTranslation()
  const notify = useNotify()
  const canManage = canManageInventorySetup()
  const { categories, uoms } = useInventoryLookups({ forCatalog: true })

  const [items, setItems] = useState<MaterialCatalogResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [uomId, setUomId] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [importResult, setImportResult] = useState<ImportMaterialsResponse | null>(null)

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await inventoryService.getMaterialCatalog({
        search: search.trim() || undefined,
        categoryId: categoryId || undefined,
        uomId: uomId || undefined,
        active: true,
      })
      setItems(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [categoryId, search, t, uomId])

  useEffect(() => {
    if (!open) {
      setImportResult(null)
      setError('')
      setSearch('')
      setCategoryId('')
      setUomId('')
      setSelectedIds(new Set())
      setItems([])
      return
    }

    const timer = window.setTimeout(() => void loadCatalog(), 300)
    return () => window.clearTimeout(timer)
  }, [open, loadCatalog])

  const visibleItems = useMemo(() => {
    if (SHOW_ALREADY_IMPORTED) return items
    return items.filter((item) => !isAlreadyImported(item))
  }, [items])

  const allVisibleSelected =
    visibleItems.length > 0 && visibleItems.every((item) => selectedIds.has(item.id))

  useEffect(() => {
    const visibleIds = new Set(visibleItems.map((item) => item.id))
    setSelectedIds((current) => {
      const next = new Set<number>()
      for (const id of current) {
        if (visibleIds.has(id)) next.add(id)
      }
      return next.size === current.size ? current : next
    })
  }, [visibleItems])

  function toggleSelect(id: number) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(visibleItems.map((item) => item.id)))
  }

  async function handleImport() {
    if (selectedIds.size === 0) {
      notify.error(t('inventory.catalog.selectAtLeastOne'))
      return
    }

    setImporting(true)
    setError('')
    setImportResult(null)
    try {
      const result = await inventoryService.importMaterials({
        catalogIds: Array.from(selectedIds),
      })
      setImportResult(result)
      setSelectedIds(new Set())

      if (result.skippedCount > 0 && result.createdCount > 0) {
        notify.success(
          t('inventory.catalog.result.partial', {
            created: result.createdCount,
            skipped: result.skippedCount,
          }),
        )
      } else if (result.createdCount > 0) {
        notify.success(
          t('inventory.catalog.result.added', { count: result.createdCount }),
        )
      } else {
        notify.error(t('inventory.catalog.importError'))
      }

      onImported?.()
      await loadCatalog()
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setImporting(false)
    }
  }

  const categoryOptions = useMemo(
    () => [
      { value: '', label: t('inventory.common.allCategories') },
      ...categories.map((cat) => ({
        value: String(cat.id),
        label: getInventoryLocalizedName(cat, locale),
      })),
    ],
    [categories, locale, t],
  )

  const uomOptions = useMemo(
    () => [
      { value: '', label: t('inventory.common.allUoms') },
      ...uoms.map((uom) => ({
        value: String(uom.id),
        label: getInventoryLocalizedName(uom, locale),
      })),
    ],
    [locale, t, uoms],
  )

  const primaryLabel =
    selectedIds.size > 0
      ? t('inventory.catalog.addSelectedCount', { count: selectedIds.size })
      : t('inventory.catalog.addSelected')

  const showEmpty = !loading && !error && visibleItems.length === 0
  const showTable = !loading && !error && visibleItems.length > 0

  return (
    <Modal
      open={open}
      title={t('inventory.catalog.title')}
      subtitle={t('inventory.catalog.subtitle')}
      onClose={onClose}
      size="large"
      className="ready-materials-modal"
      footer={
        canManage ? (
          <div className="ready-materials-modal__footer">
            <p className="ready-materials-modal__footer-summary">
              {t('inventory.catalog.footerSelected', { count: selectedIds.size })}
            </p>
            <div className="ready-materials-modal__footer-actions">
              <Button variant="secondary" onClick={onClose} disabled={importing}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={() => void handleImport()}
                disabled={importing || selectedIds.size === 0}
              >
                {importing ? t('inventory.catalog.importing') : primaryLabel}
              </Button>
            </div>
          </div>
        ) : null
      }
    >
      <div className="ready-materials-modal__body">
        {error ? <div className="ready-materials-modal__alert ready-materials-modal__alert--error">{error}</div> : null}

        {importResult ? (
          <div
            className={`ready-materials-modal__alert ready-materials-modal__alert--${
              importResult.createdCount > 0 ? 'success' : 'warning'
            }`}
            role="status"
          >
            <p className="ready-materials-modal__alert-text">
              {importResult.skippedCount > 0 && importResult.createdCount > 0
                ? t('inventory.catalog.result.partial', {
                    created: importResult.createdCount,
                    skipped: importResult.skippedCount,
                  })
                : importResult.createdCount > 0
                  ? t('inventory.catalog.result.added', { count: importResult.createdCount })
                  : t('inventory.catalog.importError')}
            </p>
            {importResult.skippedMaterials.length > 0 ? (
              <ul className="ready-materials-modal__alert-list">
                {importResult.skippedMaterials.map((item) => (
                  <li key={item.catalogId}>
                    {item.code ? `${item.code} — ` : ''}
                    {item.name ? `${item.name}: ` : ''}
                    {getImportSkippedReasonLabel(item.reason, t)}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="ready-materials-modal__toolbar">
          <SearchInput
            className="ready-materials-modal__search"
            placeholder={t('inventory.catalog.searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label={t('common.search')}
          />
          <SelectFilter
            className="ready-materials-modal__filter ready-materials-modal__filter--category"
            value={categoryId}
            onChange={setCategoryId}
            options={categoryOptions}
            ariaLabel={t('inventory.catalog.filter.category')}
          />
          <SelectFilter
            className="ready-materials-modal__filter ready-materials-modal__filter--uom"
            value={uomId}
            onChange={setUomId}
            options={uomOptions}
            ariaLabel={t('inventory.catalog.filter.uom')}
          />
        </div>

        <p className="ready-materials-modal__meta">
          {t('inventory.catalog.filterSummary', {
            shown: visibleItems.length,
            selected: selectedIds.size,
          })}
        </p>

        <div className="ready-materials-modal__content">
          {loading ? (
            <div className="ready-materials-modal__loading" aria-busy="true">
              <p className="ready-materials-modal__loading-text">{t('inventory.catalog.loading')}</p>
              <LoadingRows rows={6} columns={5} />
            </div>
          ) : null}

          {showEmpty ? (
            <EmptyState
              title={t('inventory.catalog.empty.title')}
              description={t('inventory.catalog.empty.subtitle')}
              variant={search || categoryId || uomId ? 'filter' : 'empty'}
            />
          ) : null}

          {showTable ? (
            <DataTable className="ready-materials-table">
              <TableHead>
                <TableRow>
                  {canManage ? (
                    <Th className="ready-materials-table__col-check">
                      <input
                        type="checkbox"
                        className="ready-materials-table__checkbox"
                        checked={allVisibleSelected}
                        disabled={visibleItems.length === 0}
                        onChange={toggleSelectAll}
                        aria-label={t('inventory.catalog.selectAll')}
                      />
                    </Th>
                  ) : null}
                  <Th column="entity">{t('inventory.catalog.col.material')}</Th>
                  <Th>{t('inventory.col.category')}</Th>
                  <Th>{t('inventory.col.displayUom')}</Th>
                  <Th>{t('inventory.catalog.col.status')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleItems.map((item) => {
                  const imported = isAlreadyImported(item)
                  const selected = selectedIds.has(item.id)
                  const displayUomLabel = getDisplayUomLabel(item, locale, uoms)
                  const stockUomLabel = getStockUomLabel(item, locale, uoms)
                  const categoryLabel = item.categoryName ?? t('common.empty.dash')

                  return (
                    <TableRow
                      key={item.id}
                      className={[
                        selected ? 'ready-materials-table__row--selected' : '',
                        imported ? 'ready-materials-table__row--imported' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {canManage ? (
                        <Td className="ready-materials-table__col-check">
                          <input
                            type="checkbox"
                            className="ready-materials-table__checkbox"
                            checked={selected}
                            disabled={imported}
                            onChange={() => toggleSelect(item.id)}
                            aria-label={item.name}
                          />
                        </Td>
                      ) : null}
                      <Td column="entity">
                        <ReadyMaterialCell material={item} locale={locale} />
                      </Td>
                      <Td className="ready-materials-table__col-muted">{categoryLabel}</Td>
                      <Td
                        className="ready-materials-table__col-muted"
                        title={
                          stockUomLabel !== displayUomLabel
                            ? t('inventory.catalog.uomStockDetail', { uom: stockUomLabel })
                            : undefined
                        }
                      >
                        {displayUomLabel}
                      </Td>
                      <Td>
                        {imported ? (
                          <Badge variant="muted">{t('inventory.catalog.alreadyImported')}</Badge>
                        ) : (
                          <Badge variant="success">{t('inventory.catalog.available')}</Badge>
                        )}
                      </Td>
                    </TableRow>
                  )
                })}
              </TableBody>
            </DataTable>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}
