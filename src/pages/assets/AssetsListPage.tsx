import { BarChart3, Package, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { EntityCell } from '../../components/ui/EntityCell'
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
import type { AssetResponse } from '../../types/assets'
import { formatDecimalString, getAssetCategoryLabel } from '../../utils/assetDisplay'
import { translateApiError } from '../../utils/errors'
import { getInventoryLocalizedName } from '../../utils/inventoryDisplay'
import { AssetStatusBadge } from './AssetBadges'
import { AssetFormModal } from './AssetFormModal'

export function AssetsListPage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const [assets, setAssets] = useState<AssetResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const loadAssets = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setAssets(await assetService.getAssets())
    } catch (err) {
      setError(translateApiError(err, t).message)
      setAssets([])
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
    if (!query) return assets
    return assets.filter((asset) =>
      [asset.name, asset.nameAr ?? '', asset.category]
        .some((value) => value.toLowerCase().includes(query)),
    )
  }, [assets, search])

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
            <Button variant="secondary" onClick={() => navigate('/assets/disposals/new')}>
              <Package size={16} aria-hidden />
              {t('assets.disposal.record')}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/assets/reports')}>
              <BarChart3 size={16} aria-hidden />
              {t('assets.list.reports')}
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
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
            <ListToolbarSearch
              value={search}
              onChange={setSearch}
              placeholder={t('common.search')}
              ariaLabel={t('common.search')}
            />
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
          onEmptyAction={() => setCreateOpen(true)}
          showFilterEmpty={showFilterEmpty}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="entity">{t('assets.columns.name')}</Th>
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

      <AssetFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => void loadAssets()}
      />
    </ListPage>
  )
}
