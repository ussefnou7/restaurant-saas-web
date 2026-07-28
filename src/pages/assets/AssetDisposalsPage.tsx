import { Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FormInput } from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { Dropdown } from '../../components/ui/Dropdown'
import { EntityCell } from '../../components/ui/EntityCell'
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
} from '../../components/ui/ListPage'
import { ListPagination } from '../../components/ui/ListPagination'
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
import * as assetService from '../../services/assetService'
import * as branchService from '../../services/branchService'
import type {
  AssetCategory,
  AssetDisposalListItemResponse,
  AssetResponse,
} from '../../types/assets'
import type { BranchResponse } from '../../types/branch'
import {
  formatAssetLineLabel,
  formatDecimalString,
  getAssetCategoryLabel,
  getAssetDisposalReasonLabel,
} from '../../utils/assetDisplay'
import { getLocalizedBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'
import { formatDate } from '../../utils/format'
import { getInventoryLocalizedName } from '../../utils/inventoryDisplay'
import { AssetDisposalForm } from './AssetOperationForms'

const PAGE_SIZE = 20
const ASSET_CATEGORIES: Array<AssetCategory | ''> = [
  '',
  'FURNITURE',
  'KITCHEN_EQUIPMENT',
  'FINISHING',
  'ELECTRONICS',
  'OTHER',
]

function getRowAssetName(row: AssetDisposalListItemResponse, locale: 'en' | 'ar') {
  if (locale === 'ar' && row.assetNameAr?.trim()) return row.assetNameAr
  return row.assetName
}

export function AssetDisposalsPage() {
  const { t, locale } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const assetId = searchParams.get('assetId') ?? ''
  const category = (searchParams.get('category') ?? '') as AssetCategory | ''
  const branchId = searchParams.get('branchId') ?? ''
  const dateFrom = searchParams.get('dateFrom') ?? ''
  const dateTo = searchParams.get('dateTo') ?? ''
  const page = Math.max(0, Number(searchParams.get('page') ?? '0') || 0)

  const [assets, setAssets] = useState<AssetResponse[]>([])
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [rows, setRows] = useState<AssetDisposalListItemResponse[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const updateFilters = useCallback(
    (updates: Record<string, string>, resetPage = true) => {
      const next = new URLSearchParams(searchParams)
      Object.entries(updates).forEach(([key, value]) => {
        if (value) next.set(key, value)
        else next.delete(key)
      })
      if (resetPage) next.delete('page')
      setSearchParams(next)
    },
    [searchParams, setSearchParams],
  )

  useEffect(() => {
    void Promise.all([
      assetService.getAssets().then(setAssets).catch(() => setAssets([])),
      branchService.getBranches().then(setBranches).catch(() => setBranches([])),
    ])
  }, [])

  const loadRows = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await assetService.getAllAssetDisposals({
        assetId: assetId || undefined,
        category: category || undefined,
        branchId: branchId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        size: PAGE_SIZE,
      })
      setRows(result.content)
      setTotalPages(result.totalPages)
      setTotalElements(result.totalElements)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setRows([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }, [assetId, branchId, category, dateFrom, dateTo, page, t])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRows(), 300)
    return () => window.clearTimeout(timer)
  }, [loadRows])

  const hasFilters = Boolean(assetId || category || branchId || dateFrom || dateTo)
  const showEmpty = !loading && !error && rows.length === 0 && !hasFilters
  const showFilterEmpty = !loading && !error && rows.length === 0 && hasFilters
  const showTable = !loading && !error && rows.length > 0

  return (
    <ListPage className="assets-page asset-operations-page asset-disposals-page">
      <PageHeader
        title={t('assets.disposals.title')}
        description={t('assets.disposals.subtitle')}
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} aria-hidden />
            {t('assets.disposal.record')}
          </Button>
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('assets.disposals.tableTitle')}
          toolbar={
            <div className="asset-operations-toolbar">
              <Dropdown
                value={assetId}
                onChange={(value) => updateFilters({ assetId: value })}
                options={[
                  { value: '', label: t('assets.filters.allAssets') },
                  ...assets.map((asset) => ({
                    value: String(asset.id),
                    label: getInventoryLocalizedName(asset, locale),
                  })),
                ]}
                ariaLabel={t('assets.filters.asset')}
                size="toolbar"
                searchable
                searchPlaceholder={t('common.search')}
              />
              <SelectFilter
                value={category}
                onChange={(value) => updateFilters({ category: value })}
                options={ASSET_CATEGORIES.map((value) => ({
                  value,
                  label: value ? getAssetCategoryLabel(value, t) : t('assets.filters.allCategories'),
                }))}
                ariaLabel={t('assets.filters.category')}
              />
              <SelectFilter
                value={branchId}
                onChange={(value) => updateFilters({ branchId: value })}
                options={[
                  { value: '', label: t('assets.filters.allBranches') },
                  ...branches.map((branch) => ({
                    value: String(branch.id),
                    label: getLocalizedBranchName(branch, locale),
                  })),
                ]}
                ariaLabel={t('assets.filters.branch')}
              />
              <label className="asset-operations-toolbar__date">
                <span>{t('assets.filters.dateFrom')}</span>
                <FormInput
                  type="date"
                  ltr
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(event) => {
                    const value = event.target.value
                    updateFilters({ dateFrom: value, dateTo: dateTo && value > dateTo ? '' : dateTo })
                  }}
                />
              </label>
              <label className="asset-operations-toolbar__date">
                <span>{t('assets.filters.dateTo')}</span>
                <FormInput
                  type="date"
                  ltr
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(event) => updateFilters({ dateTo: event.target.value })}
                />
              </label>
              <Button
                variant="secondary"
                onClick={() => setSearchParams({})}
                disabled={!hasFilters}
              >
                {t('assets.filters.clear')}
              </Button>
            </div>
          }
        />
        <ListPageStates
          loading={loading}
          loadingMessage={t('assets.disposals.loading')}
          loadingColumns={9}
          showEmpty={showEmpty}
          emptyTitle={t('assets.disposals.empty.title')}
          emptyDescription={t('assets.disposals.empty.description')}
          showFilterEmpty={showFilterEmpty}
          filterEmptyTitle={t('assets.disposals.empty.filteredTitle')}
          filterEmptyDescription={t('assets.disposals.empty.filteredDescription')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="entity">{t('assets.columns.name')}</Th>
                  <Th>{t('assets.lines.label')}</Th>
                  <Th>{t('assets.columns.category')}</Th>
                  <Th className="table-cell--numeric">{t('assets.disposal.quantityDisposed')}</Th>
                  <Th className="table-cell--numeric">{t('assets.lines.unitCost')}</Th>
                  <Th className="table-cell--numeric">{t('assets.disposals.disposalValue')}</Th>
                  <Th column="date">{t('assets.disposal.disposalDate')}</Th>
                  <Th>{t('assets.disposal.reason')}</Th>
                  <Th>{t('assets.disposal.notes')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <Td column="entity">
                      <EntityCell name={getRowAssetName(row, locale)} compact />
                    </Td>
                    <Td>{formatAssetLineLabel(row.assetLineLabel ?? undefined, row.assetLineId, t)}</Td>
                    <Td>{getAssetCategoryLabel(row.category, t)}</Td>
                    <Td dir="ltr" className="table-cell--numeric">{formatDecimalString(row.quantityDisposed)}</Td>
                    <Td dir="ltr" className="table-cell--numeric">{formatDecimalString(row.unitCost)}</Td>
                    <Td dir="ltr" className="table-cell--numeric">{formatDecimalString(row.disposalValue)}</Td>
                    <Td column="date" dir="ltr">{formatDate(row.disposalDate)}</Td>
                    <Td>{getAssetDisposalReasonLabel(row.reason, t)}</Td>
                    <Td>{row.notes?.trim() || t('assets.common.notAvailable')}</Td>
                  </TableRow>
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
            onPageChange={(nextPage) => updateFilters({ page: String(nextPage) }, false)}
            disabled={loading}
            translationPrefix="assets.pagination"
          />
        ) : null}
      </ListCard>

      <AssetDisposalForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => void loadRows()}
      />
    </ListPage>
  )
}
