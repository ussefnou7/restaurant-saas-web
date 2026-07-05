import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CompactStatCard } from '../../components/ui/StatCard'
import { CompactDateCell } from '../../components/ui/CompactDateCell'
import { EntityCell } from '../../components/ui/EntityCell'
import { StatusToggle } from '../../components/ui/StatusToggle'
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
  ListPrimaryAction,
  ListStatsGrid,
  ListToolbarSearch,
  StatusFilterSelect,
} from '../../components/ui/ListPage'
import { PageHeader } from '../../components/ui/PageHeader'
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
import * as branchService from '../../services/branchService'
import type { BranchResponse } from '../../types/branch'
import { getLocalizedBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'
import { BranchFormModal } from './BranchFormModal'

type StatusFilter = 'all' | 'active' | 'inactive'

function matchesSearch(branch: BranchResponse, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  return [
    branch.name,
    branch.nameEn ?? '',
    branch.nameAr ?? '',
    branch.code,
    branch.address ?? '',
    branch.phone ?? '',
  ]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(q))
}

export function BranchesPage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [rowActionId, setRowActionId] = useState<number | null>(null)

  const loadBranches = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await branchService.getBranches()
      setBranches(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadBranches()
  }, [loadBranches])

  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      if (!matchesSearch(branch, search)) return false
      if (statusFilter === 'active' && !branch.active) return false
      if (statusFilter === 'inactive' && branch.active) return false
      return true
    })
  }, [branches, search, statusFilter])

  const stats = useMemo(() => {
    const total = branches.length
    const active = branches.filter((branch) => branch.active).length
    return { total, active, inactive: total - active }
  }, [branches])

  function openCreateModal() {
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  async function handleToggleStatus(branch: BranchResponse) {
    setRowActionId(branch.id)
    try {
      await branchService.updateBranchStatus(branch.id, !branch.active)
      await loadBranches()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setRowActionId(null)
    }
  }

  const showEmpty = !loading && !error && branches.length === 0
  const showFilterEmpty = !loading && !error && branches.length > 0 && filteredBranches.length === 0
  const showTable = !loading && !error && filteredBranches.length > 0

  return (
    <ListPage className="branches-page">
      <PageHeader
        title={t('branches.title')}
        description={t('branches.subtitle')}
        action={<ListPrimaryAction label={t('branches.add')} onClick={openCreateModal} />}
      />

      {!loading && !error ? (
        <ListStatsGrid>
          <CompactStatCard title={t('branches.stat.total')} value={stats.total} dotVariant="primary" />
          <CompactStatCard title={t('common.active')} value={stats.active} dotVariant="success" />
          <CompactStatCard title={t('common.inactive')} value={stats.inactive} dotVariant="warning" />
        </ListStatsGrid>
      ) : null}

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('branches.listTitle')}
          subtitle={t('branches.listSubtitle')}
          toolbar={
            !showEmpty ? (
              <>
                <ListToolbarSearch
                  value={search}
                  onChange={setSearch}
                  placeholder={t('branches.searchPlaceholder')}
                  ariaLabel={t('common.search')}
                />
                <StatusFilterSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  ariaLabel={t('branches.filterStatus')}
                />
              </>
            ) : undefined
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('branches.loading')}
          loadingColumns={4}
          showEmpty={showEmpty}
          emptyTitle={t('branches.emptyTitle')}
          emptyDescription={t('branches.emptyText')}
          emptyActionLabel={t('branches.add')}
          onEmptyAction={openCreateModal}
          showFilterEmpty={showFilterEmpty}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="entity">{t('branches.col.branch')}</Th>
                  <Th>{t('branches.col.phone')}</Th>
                  <Th column="status">{t('common.status')}</Th>
                  <Th column="date">{t('common.createdAt')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBranches.map((branch) => {
                  const busy = rowActionId === branch.id
                  const displayName = getLocalizedBranchName(branch, locale)
                  return (
                    <ClickableTableRow
                      key={branch.id}
                      onClick={() => navigate(`/branches/${branch.id}`)}
                    >
                      <Td column="entity">
                        <EntityCell name={displayName} code={branch.code} compact />
                      </Td>
                      <Td>
                        {branch.phone?.trim() ? (
                          <span className="cell-text" dir="ltr">
                            {branch.phone}
                          </span>
                        ) : (
                          <span className="text-muted">{t('common.empty.dash')}</span>
                        )}
                      </Td>
                      <StopPropagationCell column="status">
                        <StatusToggle
                          active={branch.active}
                          disabled={busy}
                          entityName={displayName}
                          onToggle={() => void handleToggleStatus(branch)}
                        />
                      </StopPropagationCell>
                      <Td column="date">
                        <CompactDateCell value={branch.createdAt} />
                      </Td>
                    </ClickableTableRow>
                  )
                })}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>

      <BranchFormModal
        open={modalOpen}
        mode="create"
        onClose={closeModal}
        onSuccess={() => void loadBranches()}
      />
    </ListPage>
  )
}
