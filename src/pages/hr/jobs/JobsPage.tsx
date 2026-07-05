import { useCallback, useEffect, useMemo, useState } from 'react'
import { CompactStatCard } from '../../../components/ui/StatCard'
import { CompactDateCell } from '../../../components/ui/CompactDateCell'
import { EntityCell } from '../../../components/ui/EntityCell'
import { StatusToggle } from '../../../components/ui/StatusToggle'
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
  ListPrimaryAction,
  ListStatsGrid,
  ListToolbarSearch,
  StatusFilterSelect,
} from '../../../components/ui/ListPage'
import { PageHeader } from '../../../components/ui/PageHeader'
import {
  ClickableTableRow,
  DataTable,
  StopPropagationCell,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../../components/ui/Table'
import { useTranslation } from '../../../i18n/useTranslation'
import * as jobService from '../../../services/jobService'
import type { JobResponse } from '../../../types/job'
import { translateApiError } from '../../../utils/errors'
import { JobDetailsDrawer } from './JobDetailsDrawer'
import { JobFormModal } from './JobFormModal'

type StatusFilter = 'all' | 'active' | 'inactive'

function matchesSearch(job: JobResponse, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  return [job.name, job.code, job.description ?? '']
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(q))
}

function DescriptionCell({ job }: { job: JobResponse }) {
  const description = job.description?.trim()
  if (!description) {
    return <span className="text-muted">-</span>
  }

  return <span className="cell-text cell-text--truncate">{description}</span>
}

export function JobsPage() {
  const { t } = useTranslation()
  const [jobs, setJobs] = useState<JobResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingJob, setEditingJob] = useState<JobResponse | null>(null)
  const [selectedJob, setSelectedJob] = useState<JobResponse | null>(null)
  const [rowActionId, setRowActionId] = useState<number | null>(null)

  const loadJobs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await jobService.getJobs()
      setJobs(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadJobs()
  }, [loadJobs])

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (!matchesSearch(job, search)) return false
      if (statusFilter === 'active' && !job.active) return false
      if (statusFilter === 'inactive' && job.active) return false
      return true
    })
  }, [jobs, search, statusFilter])

  const stats = useMemo(() => {
    const total = jobs.length
    const active = jobs.filter((job) => job.active).length
    return { total, active, inactive: total - active }
  }, [jobs])

  function openCreateModal() {
    setModalMode('create')
    setEditingJob(null)
    setModalOpen(true)
  }

  function openEditModal(job: JobResponse) {
    setModalMode('edit')
    setEditingJob(job)
    setModalOpen(true)
    setSelectedJob(null)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingJob(null)
  }

  async function handleToggleStatus(job: JobResponse) {
    setRowActionId(job.id)
    try {
      await jobService.updateJobStatus(job.id, !job.active)
      await loadJobs()
      if (selectedJob?.id === job.id) {
        setSelectedJob((current) => (current ? { ...current, active: !current.active } : null))
      }
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setRowActionId(null)
    }
  }

  const showEmpty = !loading && !error && jobs.length === 0
  const showFilterEmpty = !loading && !error && jobs.length > 0 && filteredJobs.length === 0
  const showTable = !loading && !error && filteredJobs.length > 0

  return (
    <ListPage className="jobs-page">
      <PageHeader
        title={t('jobs.title')}
        description={t('jobs.subtitle')}
        action={<ListPrimaryAction label={t('jobs.add')} onClick={openCreateModal} />}
      />

      {!loading && !error ? (
        <ListStatsGrid>
          <CompactStatCard title={t('jobs.stat.total')} value={stats.total} dotVariant="primary" />
          <CompactStatCard title={t('common.active')} value={stats.active} dotVariant="success" />
          <CompactStatCard title={t('common.inactive')} value={stats.inactive} dotVariant="warning" />
        </ListStatsGrid>
      ) : null}

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('jobs.listTitle')}
          subtitle={t('jobs.listSubtitle')}
          toolbar={
            !showEmpty ? (
              <>
                <ListToolbarSearch
                  value={search}
                  onChange={setSearch}
                  placeholder={t('jobs.searchPlaceholder')}
                  ariaLabel={t('common.search')}
                />
                <StatusFilterSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  ariaLabel={t('jobs.filterStatus')}
                />
              </>
            ) : undefined
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('jobs.loading')}
          loadingColumns={4}
          showEmpty={showEmpty}
          emptyTitle={t('jobs.emptyTitle')}
          emptyDescription={t('jobs.emptyText')}
          emptyActionLabel={t('jobs.add')}
          onEmptyAction={openCreateModal}
          showFilterEmpty={showFilterEmpty}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="entity">{t('jobs.col.job')}</Th>
                  <Th>{t('jobs.col.description')}</Th>
                  <Th column="status">{t('common.status')}</Th>
                  <Th column="date">{t('common.createdAt')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredJobs.map((job) => {
                  const busy = rowActionId === job.id
                  return (
                    <ClickableTableRow
                      key={job.id}
                      selected={selectedJob?.id === job.id}
                      onClick={() => setSelectedJob(job)}
                    >
                      <Td column="entity">
                        <EntityCell name={job.name} code={job.code} compact />
                      </Td>
                      <Td>
                        <DescriptionCell job={job} />
                      </Td>
                      <StopPropagationCell column="status">
                        <StatusToggle
                          active={job.active}
                          disabled={busy}
                          entityName={job.name}
                          onToggle={() => void handleToggleStatus(job)}
                        />
                      </StopPropagationCell>
                      <Td column="date">
                        <CompactDateCell value={job.createdAt} />
                      </Td>
                    </ClickableTableRow>
                  )
                })}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>

      <JobDetailsDrawer
        open={selectedJob !== null}
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onEdit={() => selectedJob && openEditModal(selectedJob)}
        onToggleStatus={() => selectedJob && void handleToggleStatus(selectedJob)}
        statusBusy={selectedJob !== null && rowActionId === selectedJob.id}
      />

      <JobFormModal
        open={modalOpen}
        mode={modalMode}
        job={editingJob}
        onClose={closeModal}
        onSuccess={() => void loadJobs()}
      />
    </ListPage>
  )
}
