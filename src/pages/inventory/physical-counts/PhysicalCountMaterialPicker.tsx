import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { LoadingRows } from '../../../components/ui/LoadingRows'
import { Modal } from '../../../components/ui/Modal'
import { SearchInput } from '../../../components/ui/SearchInput'
import { SelectFilter } from '../../../components/ui/SelectFilter'
import {
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../../components/ui/Table'
import { useTranslation } from '../../../i18n/useTranslation'
import * as inventoryService from '../../../services/inventoryService'
import type { MaterialResponse } from '../../../types/inventory'
import { translateApiError } from '../../../utils/errors'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { useInventoryLookups } from '../useInventoryLookups'

interface PhysicalCountMaterialPickerProps {
  open: boolean
  onClose: () => void
  onConfirm: (materialIds: number[]) => void
  excludeMaterialIds?: number[]
  confirmLabel?: string
  loading?: boolean
}

export function PhysicalCountMaterialPicker({
  open,
  onClose,
  onConfirm,
  excludeMaterialIds = [],
  confirmLabel,
  loading = false,
}: PhysicalCountMaterialPickerProps) {
  const { t, locale } = useTranslation()
  const { categories } = useInventoryLookups()

  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const [lookupLoading, setLookupLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const excludedSet = useMemo(() => new Set(excludeMaterialIds), [excludeMaterialIds])

  const loadMaterials = useCallback(async () => {
    setLookupLoading(true)
    setError('')
    try {
      const data = await inventoryService.getMaterials({
        search: search.trim() || undefined,
        categoryId: categoryId || undefined,
        active: true,
      })
      setMaterials(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setMaterials([])
    } finally {
      setLookupLoading(false)
    }
  }, [categoryId, search, t])

  useEffect(() => {
    if (!open) {
      setSearch('')
      setCategoryId('')
      setSelectedIds(new Set())
      setMaterials([])
      setError('')
      return
    }

    const timer = window.setTimeout(() => void loadMaterials(), 300)
    return () => window.clearTimeout(timer)
  }, [open, loadMaterials])

  const visibleMaterials = useMemo(
    () => materials.filter((material) => !excludedSet.has(material.id)),
    [excludedSet, materials],
  )

  const allVisibleSelected =
    visibleMaterials.length > 0 && visibleMaterials.every((material) => selectedIds.has(material.id))

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
    setSelectedIds(new Set(visibleMaterials.map((material) => material.id)))
  }

  function handleConfirm() {
    if (selectedIds.size === 0) return
    onConfirm(Array.from(selectedIds))
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

  const primaryLabel =
    selectedIds.size > 0
      ? t('inventory.physicalCounts.materialPicker.confirmCount', { count: selectedIds.size })
      : (confirmLabel ?? t('inventory.physicalCounts.materialPicker.confirm'))

  const showEmpty = !lookupLoading && !error && visibleMaterials.length === 0
  const showTable = !lookupLoading && !error && visibleMaterials.length > 0

  return (
    <Modal
      open={open}
      title={t('inventory.physicalCounts.materialPicker.title')}
      subtitle={t('inventory.physicalCounts.materialPicker.subtitle')}
      onClose={onClose}
      size="large"
      className="physical-count-material-picker"
      footer={
        <div className="physical-count-material-picker__footer">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={loading || selectedIds.size === 0}
          >
            {loading ? t('common.loading') : primaryLabel}
          </Button>
        </div>
      }
    >
      <div className="physical-count-material-picker__toolbar">
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('common.search')}
          aria-label={t('common.search')}
        />
        <SelectFilter
          value={categoryId}
          onChange={setCategoryId}
          options={categoryOptions}
          ariaLabel={t('inventory.common.allCategories')}
        />
      </div>

      {error ? <div className="form-error-banner">{error}</div> : null}

      {lookupLoading ? (
        <LoadingRows columns={3} rows={6} />
      ) : showEmpty ? (
        <EmptyState
          title={t('inventory.physicalCounts.materialPicker.emptyTitle')}
          description={t('inventory.physicalCounts.materialPicker.emptySubtitle')}
        />
      ) : showTable ? (
        <DataTable>
          <TableHead>
            <TableRow>
              <Th>
                <label className="physical-count-material-picker__select-all">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    aria-label={t('inventory.physicalCounts.materialPicker.selectAll')}
                  />
                </label>
              </Th>
              <Th column="entity">{t('inventory.physicalCounts.lines.material')}</Th>
              <Th>{t('inventory.physicalCounts.lines.uom')}</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleMaterials.map((material) => (
              <TableRow key={material.id}>
                <Td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(material.id)}
                    onChange={() => toggleSelect(material.id)}
                    aria-label={getInventoryLocalizedName(material, locale)}
                  />
                </Td>
                <Td column="entity">
                  <span>{getInventoryLocalizedName(material, locale)}</span>
                  <span className="entity-cell__code">{material.code}</span>
                </Td>
                <Td>{material.stockUomSymbol ?? material.stockUomCode}</Td>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      ) : null}
    </Modal>
  )
}
