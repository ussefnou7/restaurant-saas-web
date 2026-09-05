import { BarChart3, Package, Plus, Wrench } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { ClearFiltersButton } from '../../components/ui/ClearFiltersButton'
import { EntityCell } from '../../components/ui/EntityCell'
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
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
  ListToolbarSearch,
} from '../../components/ui/ListPage'
import { PageHeader } from '../../components/ui/PageHeader'
import { useTranslation } from '../../i18n/useTranslation'
import * as assetService from '../../services/assetService'
import * as branchService from '../../services/branchService'
import type { AssetCategory, AssetResponse } from '../../types/assets'
import type { BranchResponse } from '../../types/branch'
import { formatDecimalString, getAssetCategoryLabel } from '../../utils/assetDisplay'
import { getLocalizedBranchName, resolveBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'
import { getInventoryLocalizedName } from '../../utils/inventoryDisplay'
import { AssetStatusBadge } from './AssetBadges'

const ASSET_CATEGORIES: Array<AssetCategory | ''> = [
  '',
  'FURNITURE',
  'KITCHEN_EQUIPMENT',
  'FINISHING',
  'ELECTRONICS',
  'OTHER',
]

export function AssetsListPage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const [assets, setAssets] = useState<AssetResponse[]>([])
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [branchId, setBranchId] = useState('')
  const [category, setCategory] = useState<AssetCategory | ''>('')

  const loadAssets = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [assetData, branchData] = await Promise.all([
        assetService.getAssets(),
        branchService.getBranches().catch(() => []),
      ])
      setAssets(assetData)
      setBranches(branchData)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setAssets([])
      setBranches([])
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAssets(), 0)
    return () => window.clearTimeout(timer)
  }, [loadAssets])

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase()
    return assets.filter((asset) => {
      if (branchId && String(asset.branchId) !== branchId) {
        return false
      }
      if (category && asset.category !== category) {
        return false
      }
      if (!query) return true

      const localizedBranch = resolveBranchName(asset.branchId, branches, locale, asset)
      const categoryLabel = getAssetCategoryLabel(asset.category, t)
      return [asset.name, asset.nameAr ?? '', categoryLabel, localizedBranch].some((value) =>
        value.toLowerCase().includes(query),
      )
    })
  }, [assets, branchId, category, branches, locale, search, t])

  const showEmpty = !loading && !error && assets.length === 0
  const showFilterEmpty = !loading && !error && assets.length > 0 && filteredAssets.length === 0
  const showTable = !loading && !error && filteredAssets.length > 0

  return (
    <ListPage className="assets-page assets-list-page">
      <PageHeader
        title={t('assets.list.title')}
        description={t('assets.list.subtitle')}
        action={
          <div className="page-header__actions">
            <Button variant="secondary" onClick={() => navigate('/assets/disposals')}>
              <Package size={16} aria-hidden />
              {t('assets.disposals.nav')}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/assets/maintenance')}>
              <Wrench size={16} aria-hidden />
              {t('assets.maintenanceList.nav')}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/assets/reports')}>
              <BarChart3 size={16} aria-hidden />
              {t('assets.list.reports')}
            </Button>
            <Button onClick={() => navigate('/assets/new')}>
              <Plus size={16} aria-hidden />
              {t('assets.list.newAsset')}
            </Button>
          </div>
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('assets.list.tableTitle')}
          toolbar={
            <>
              <ListToolbarSearch
                value={search}
                onChange={setSearch}
                placeholder={t('common.search')}
                ariaLabel={t('common.search')}
              />
              <SelectFilter
                value={category}
                onChange={(val) => setCategory(val as AssetCategory | '')}
                options={ASSET_CATEGORIES.map((cat) => ({
                  value: cat,
                  label: cat ? getAssetCategoryLabel(cat, t) : t('assets.filters.allCategories'),
                }))}
                ariaLabel={t('assets.filters.category')}
              />
              <SelectFilter
                value={branchId}
                onChange={setBranchId}
                options={[
                  { value: '', label: t('assets.filters.allBranches') },
                  ...branches.map((b) => ({
                    value: String(b.id),
                    label: getLocalizedBranchName(b, locale),
                  })),
                ]}
                ariaLabel={t('assets.filters.branch')}
              />
              {search || category || branchId ? (
                <ClearFiltersButton
                  onClick={() => {
                    setSearch('')
                    setCategory('')
                    setBranchId('')
                  }}
                />
              ) : null}
            </>
          }
        />
        <ListPageStates
          loading={loading}
          loadingMessage={t('assets.list.loading')}
          loadingColumns={6}
          showEmpty={showEmpty}
          emptyTitle={t('assets.list.empty.title')}
          emptyDescription={t('assets.list.empty.description')}
          emptyActionLabel={t('assets.list.newAsset')}
          onEmptyAction={() => navigate('/assets/new')}
          showFilterEmpty={showFilterEmpty}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="entity">{t('assets.columns.name')}</Th>
                  <Th>{t('assets.form.branch')}</Th>
                  <Th>{t('assets.columns.category')}</Th>
                  <Th column="status">{t('common.status')}</Th>
                  <Th className="table-cell--numeric">{t('assets.columns.lineCount')}</Th>
                  <Th className="table-cell--numeric">{t('assets.columns.currentValue')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <ClickableTableRow key={asset.id} onClick={() => navigate(`/assets/${asset.id}`)}>
                    <Td column="entity">
                      <EntityCell name={getInventoryLocalizedName(asset, locale)} compact />
                    </Td>
                    <Td>{resolveBranchName(asset.branchId, branches, locale, asset)}</Td>
                    <Td>{getAssetCategoryLabel(asset.category, t)}</Td>
                    <Td column="status">
                      <AssetStatusBadge status={asset.status} />
                    </Td>
                    <Td dir="ltr" className="table-cell--numeric">
                      {asset.lineCount}
                    </Td>
                    <Td dir="ltr" className="table-cell--numeric">
                      {formatDecimalString(asset.totalCurrentValue)}
                    </Td>
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
