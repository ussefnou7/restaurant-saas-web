import { Plus, Trash2, Wrench } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import {
  DataTable,
  StopPropagationCell,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../components/ui/Table'
import { ListCard, ListCardHeader, ListPage, ListPageStates } from '../../components/ui/ListPage'
import { PageHeader } from '../../components/ui/PageHeader'
import { useTranslation } from '../../i18n/useTranslation'
import * as assetService from '../../services/assetService'
import type { AssetLineResponse, AssetResponse } from '../../types/assets'
import {
  formatAssetLineLabel,
  formatDecimalString,
  getAssetCategoryLabel,
} from '../../utils/assetDisplay'
import { translateApiError } from '../../utils/errors'
import { formatDate } from '../../utils/format'
import { getInventoryLocalizedName } from '../../utils/inventoryDisplay'
import { AssetStatusBadge } from './AssetBadges'
import { AssetDisposalForm, AssetMaintenanceForm } from './AssetOperationForms'
import { AssetFormModal } from './AssetFormModal'
import { AssetLineFormModal } from './AssetLineFormModal'

type LineAction =
  | { kind: 'dispose'; line: AssetLineResponse }
  | { kind: 'maintenance'; line: AssetLineResponse }
  | null

export function AssetDetailPage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const { assetId } = useParams()
  const numericAssetId = Number(assetId)
  const [asset, setAsset] = useState<AssetResponse | null>(null)
  const [lines, setLines] = useState<AssetLineResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [lineOpen, setLineOpen] = useState(false)
  const [lineAction, setLineAction] = useState<LineAction>(null)

  const loadDetail = useCallback(async () => {
    if (!assetId) return
    setLoading(true)
    setError('')
    try {
      const [assetData, lineData] = await Promise.all([
        assetService.getAsset(assetId),
        assetService.getAssetLines(assetId),
      ])
      setAsset(assetData)
      setLines(lineData)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setAsset(null)
      setLines([])
    } finally {
      setLoading(false)
    }
  }, [assetId, t])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDetail(), 0)
    return () => window.clearTimeout(timer)
  }, [loadDetail])

  const showEmpty = !loading && !error && lines.length === 0
  const showTable = !loading && !error && lines.length > 0

  return (
    <ListPage className="assets-page asset-detail-page">
      <PageHeader
        title={asset ? getInventoryLocalizedName(asset, locale) : t('assets.detail.title')}
        description={asset ? getAssetCategoryLabel(asset.category, t) : t('assets.detail.subtitle')}
        action={
          <div className="page-header__actions">
            <Button variant="secondary" onClick={() => navigate('/assets')}>
              {t('assets.actions.back')}
            </Button>
            {asset ? (
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                {t('common.edit')}
              </Button>
            ) : null}
            <Button onClick={() => setLineOpen(true)} disabled={!asset}>
              <Plus size={16} aria-hidden />
              {t('assets.lines.add')}
            </Button>
          </div>
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      {asset ? (
        <section className="asset-detail-summary">
          <div className="asset-detail-summary__item">
            <span>{t('assets.columns.category')}</span>
            <strong>{getAssetCategoryLabel(asset.category, t)}</strong>
          </div>
          <div className="asset-detail-summary__item">
            <span>{t('common.status')}</span>
            <strong><AssetStatusBadge status={asset.status} /></strong>
          </div>
          <div className="asset-detail-summary__item">
            <span>{t('assets.columns.lineCount')}</span>
            <strong>{asset.lineCount}</strong>
          </div>
          <div className="asset-detail-summary__item">
            <span>{t('assets.columns.currentValue')}</span>
            <strong dir="ltr">{formatDecimalString(asset.totalCurrentValue)}</strong>
          </div>
        </section>
      ) : null}

      <ListCard>
        <ListCardHeader title={t('assets.lines.tableTitle')} />
        <ListPageStates
          loading={loading}
          loadingMessage={t('assets.detail.loading')}
          loadingColumns={7}
          showEmpty={showEmpty}
          emptyTitle={t('assets.lines.empty.title')}
          emptyDescription={t('assets.lines.empty.description')}
          emptyActionLabel={t('assets.lines.add')}
          onEmptyAction={() => setLineOpen(true)}
          showFilterEmpty={false}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th>{t('assets.lines.label')}</Th>
                  <Th className="table-cell--numeric">{t('assets.lines.quantity')}</Th>
                  <Th className="table-cell--numeric">{t('assets.lines.remainingQuantity')}</Th>
                  <Th className="table-cell--numeric">{t('assets.lines.unitCost')}</Th>
                  <Th column="date">{t('assets.lines.purchaseDate')}</Th>
                  <Th column="status">{t('common.status')}</Th>
                  <Th column="actions">{t('assets.columns.actions')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id} className="asset-line-row">
                    <Td>{formatAssetLineLabel(line.label, line.id, t)}</Td>
                    <Td dir="ltr" className="table-cell--numeric">{formatDecimalString(line.quantity)}</Td>
                    <Td dir="ltr" className="table-cell--numeric">{formatDecimalString(line.remainingQuantity)}</Td>
                    <Td dir="ltr" className="table-cell--numeric">{formatDecimalString(line.unitCost)}</Td>
                    <Td column="date">{formatDate(line.purchaseDate)}</Td>
                    <Td column="status"><AssetStatusBadge status={line.status} /></Td>
                    <StopPropagationCell className="asset-line-row__actions">
                      <Button size="sm" variant="secondary" onClick={() => setLineAction({ kind: 'dispose', line })}>
                        <Trash2 size={16} aria-hidden />
                        {t('assets.disposal.action')}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setLineAction({ kind: 'maintenance', line })}>
                        <Wrench size={16} aria-hidden />
                        {t('assets.maintenance.action')}
                      </Button>
                    </StopPropagationCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>

      <AssetFormModal
        open={editOpen}
        asset={asset}
        onClose={() => setEditOpen(false)}
        onSaved={() => void loadDetail()}
      />
      {asset ? (
        <AssetLineFormModal
          open={lineOpen}
          assetId={numericAssetId}
          onClose={() => setLineOpen(false)}
          onSaved={() => void loadDetail()}
        />
      ) : null}
      {asset && lineAction?.kind === 'dispose' ? (
        <AssetDisposalForm
          open
          initialAssetId={numericAssetId}
          initialLineId={lineAction.line.id}
          onClose={() => setLineAction(null)}
          onSaved={() => void loadDetail()}
        />
      ) : null}
      {asset && lineAction?.kind === 'maintenance' ? (
        <AssetMaintenanceForm
          open
          initialAssetId={numericAssetId}
          initialLineId={lineAction.line.id}
          onClose={() => setLineAction(null)}
          onSaved={() => void loadDetail()}
        />
      ) : null}
    </ListPage>
  )
}
