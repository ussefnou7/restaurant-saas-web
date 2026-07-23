import { useCallback, useEffect, useState } from 'react'
import {
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../components/ui/Table'
import { ListCard, ListCardHeader, ListPage, ListPageStates } from '../../components/ui/ListPage'
import { ListPagination } from '../../components/ui/ListPagination'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { useTranslation } from '../../i18n/useTranslation'
import * as assetService from '../../services/assetService'
import type { AssetDisposalReportRow, AssetSummaryReportResponse } from '../../types/assets'
import type { PageResult } from '../../types/pagination'
import {
  formatDecimalString,
  getAssetDisposalReasonLabel,
} from '../../utils/assetDisplay'
import { translateApiError } from '../../utils/errors'
import { formatDate } from '../../utils/format'

const pageSize = 20

export function AssetsReportPage() {
  const { t } = useTranslation()
  const [summary, setSummary] = useState<AssetSummaryReportResponse | null>(null)
  const [page, setPage] = useState(0)
  const [history, setHistory] = useState<PageResult<AssetDisposalReportRow>>({
    content: [],
    totalElements: 0,
    totalPages: 1,
    page: 0,
    size: pageSize,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [summaryData, historyData] = await Promise.all([
        assetService.getAssetSummaryReport(),
        assetService.getAssetDisposalsReport(page, pageSize),
      ])
      setSummary(summaryData)
      setHistory(historyData)
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [page, t])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReport(), 0)
    return () => window.clearTimeout(timer)
  }, [loadReport])

  return (
    <ListPage className="assets-page assets-report-page">
      <PageHeader title={t('assets.reports.title')} description={t('assets.reports.subtitle')} />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <div className="asset-report-stats">
        <StatCard
          title={t('assets.reports.totalOriginalInvestment')}
          value={formatDecimalString(summary?.totalOriginalInvestment, t('common.empty.dash'))}
        />
        <StatCard
          title={t('assets.reports.totalCurrentValue')}
          value={formatDecimalString(summary?.totalCurrentValue, t('common.empty.dash'))}
        />
      </div>

      <ListCard>
        <ListCardHeader title={t('assets.reports.disposalsTitle')} />
        <ListPageStates
          loading={loading}
          loadingMessage={t('assets.reports.loading')}
          loadingColumns={6}
          showEmpty={!loading && !error && history.content.length === 0}
          emptyTitle={t('assets.reports.empty.title')}
          emptyDescription={t('assets.reports.empty.description')}
          showFilterEmpty={false}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={!loading && !error && history.content.length > 0}
          table={
            <>
              <DataTable>
                <TableHead>
                  <TableRow>
                    <Th>{t('assets.reports.assetName')}</Th>
                    <Th>{t('assets.reports.lineLabel')}</Th>
                    <Th className="table-cell--numeric">{t('assets.reports.quantityDisposed')}</Th>
                    <Th>{t('assets.reports.reason')}</Th>
                    <Th column="date">{t('assets.reports.disposalDate')}</Th>
                    <Th className="table-cell--numeric">{t('assets.reports.value')}</Th>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.content.map((row, index) => (
                    <TableRow key={`${row.assetName}-${row.assetLineLabel ?? index}-${row.disposalDate}`}>
                      <Td>{row.assetName}</Td>
                      <Td>{row.assetLineLabel || t('common.empty.dash')}</Td>
                      <Td dir="ltr" className="table-cell--numeric">{formatDecimalString(row.quantityDisposed)}</Td>
                      <Td>{getAssetDisposalReasonLabel(row.reason, t)}</Td>
                      <Td column="date">{formatDate(row.disposalDate)}</Td>
                      <Td dir="ltr" className="table-cell--numeric">{formatDecimalString(row.value)}</Td>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
              <ListPagination
                page={history.page}
                totalPages={history.totalPages}
                totalElements={history.totalElements}
                pageSize={history.size}
                onPageChange={setPage}
                disabled={loading}
                translationPrefix="assets.pagination"
              />
            </>
          }
        />
      </ListCard>
    </ListPage>
  )
}
