import { useCallback, useEffect, useMemo, useState } from 'react'
import { CompactDateCell } from '../../../components/ui/CompactDateCell'
import { CompactStatCard } from '../../../components/ui/StatCard'
import { EntityCell } from '../../../components/ui/EntityCell'
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
  ListPrimaryAction,
  ListStatsGrid,
  ListToolbarSearch,
} from '../../../components/ui/ListPage'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SelectFilter } from '../../../components/ui/SelectFilter'
import {
  ClickableTableRow,
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../../components/ui/Table'
import { useTranslation } from '../../../i18n/useTranslation'
import * as employeeService from '../../../services/employeeService'
import * as leaveRequestService from '../../../services/leaveRequestService'
import type { EmployeeResponse } from '../../../types/employee'
import type { LeaveRequestResponse, LeaveRequestStatus } from '../../../types/leaveRequest'
import { translateApiError } from '../../../utils/errors'
import { formatDate } from '../../../utils/format'
import { LeaveRequestDetailsDrawer } from './LeaveRequestDetailsDrawer'
import { LeaveRequestFormModal } from './LeaveRequestFormModal'
import { LeaveStatusBadge } from './LeaveStatusBadge'
import { LeaveRequestStatusModal } from './LeaveRequestStatusModal'

type StatusFilter = 'all' | LeaveRequestStatus
type StatusActionMode = 'approve' | 'reject' | 'cancel'

function matchesSearch(request: LeaveRequestResponse, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  return [
    request.employeeName ?? '',
    request.employeeCode ?? '',
    request.leaveTypeName ?? '',
    request.leaveTypeCode ?? '',
    request.reason ?? '',
    request.status,
    request.statusNote ?? '',
  ]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(q))
}

function EmployeeCell({ request }: { request: LeaveRequestResponse }) {
  return (
    <EntityCell
      name={request.employeeName ?? 'Unknown employee'}
      code={request.employeeCode ?? undefined}
      compact
    />
  )
}

function LeaveTypeCell({ request }: { request: LeaveRequestResponse }) {
  return (
    <EntityCell
      name={request.leaveTypeName ?? 'Unknown type'}
      code={request.leaveTypeCode ?? undefined}
    />
  )
}

function PeriodCell({ request }: { request: LeaveRequestResponse }) {
  const { t } = useTranslation()
  return (
    <div className="leave-request-period-cell">
      <span>{formatDate(request.fromDate)}</span>
      <span className="leave-request-period-separator">{t('leaveRequests.periodTo')}</span>
      <span>{formatDate(request.toDate)}</span>
    </div>
  )
}

export function LeaveRequestsPage() {
  const { t } = useTranslation()
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestResponse[]>([])
  const [employees, setEmployees] = useState<EmployeeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [employeeFilter, setEmployeeFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [viewingRequest, setViewingRequest] = useState<LeaveRequestResponse | null>(null)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [statusModalMode, setStatusModalMode] = useState<StatusActionMode | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestResponse | null>(null)
  const [statusSaving, setStatusSaving] = useState(false)
  const [rowActionId, setRowActionId] = useState<number | null>(null)

  const loadLeaveRequests = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await leaveRequestService.getLeaveRequests()
      setLeaveRequests(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [t])

  const loadEmployees = useCallback(async () => {
    try {
      const data = await employeeService.getEmployees()
      setEmployees(data)
    } catch {
      // Employee filter is optional.
    }
  }, [])

  useEffect(() => {
    void loadLeaveRequests()
    void loadEmployees()
  }, [loadLeaveRequests, loadEmployees])

  const employeeFilterOptions = useMemo(() => {
    if (employees.length > 0) {
      return employees
    }

    const map = new Map<number, EmployeeResponse>()
    leaveRequests.forEach((request) => {
      if (!map.has(request.employeeId)) {
        map.set(request.employeeId, {
          id: request.employeeId,
          branchId: request.branchId,
          branchName: '',
          branchCode: '',
          jobId: 0,
          jobName: '',
          jobCode: '',
          employeeCode: request.employeeCode ?? '',
          fullName: request.employeeName ?? `Employee #${request.employeeId}`,
          hireDate: '',
          salary: 0,
          active: true,
          createdAt: '',
          updatedAt: '',
        })
      }
    })
    return Array.from(map.values())
  }, [employees, leaveRequests])

  const filteredLeaveRequests = useMemo(() => {
    return leaveRequests.filter((request) => {
      if (!matchesSearch(request, search)) return false
      if (statusFilter !== 'all' && request.status !== statusFilter) return false
      if (employeeFilter !== 'all' && request.employeeId !== Number(employeeFilter)) return false
      return true
    })
  }, [leaveRequests, search, statusFilter, employeeFilter])

  const stats = useMemo(() => {
    const total = leaveRequests.length
    const pending = leaveRequests.filter((request) => request.status === 'PENDING').length
    const approved = leaveRequests.filter((request) => request.status === 'APPROVED').length
    const rejected = leaveRequests.filter((request) => request.status === 'REJECTED').length
    return { total, pending, approved, rejected }
  }, [leaveRequests])

  function openCreateModal() {
    setModalOpen(true)
  }

  function closeCreateModal() {
    setModalOpen(false)
  }

  function openStatusModal(request: LeaveRequestResponse, mode: StatusActionMode) {
    setSelectedRequest(request)
    setStatusModalMode(mode)
    setStatusModalOpen(true)
  }

  function closeStatusModal() {
    setStatusModalOpen(false)
    setStatusModalMode(null)
    setSelectedRequest(null)
  }

  async function handleStatusSubmit(statusNote?: string) {
    if (!selectedRequest || !statusModalMode) return

    const statusMap = {
      approve: 'APPROVED',
      reject: 'REJECTED',
      cancel: 'CANCELLED',
    } as const

    setStatusSaving(true)
    setRowActionId(selectedRequest.id)
    try {
      await leaveRequestService.updateLeaveRequestStatus(selectedRequest.id, {
        status: statusMap[statusModalMode],
        statusNote,
      })
      closeStatusModal()
      await loadLeaveRequests()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setStatusSaving(false)
      setRowActionId(null)
    }
  }

  const showEmpty = !loading && !error && leaveRequests.length === 0
  const showFilterEmpty =
    !loading && !error && leaveRequests.length > 0 && filteredLeaveRequests.length === 0
  const showTable = !loading && !error && filteredLeaveRequests.length > 0

  return (
    <ListPage className="leave-requests-page">
      <PageHeader
        title={t('leaveRequests.title')}
        description={t('leaveRequests.subtitle')}
        action={<ListPrimaryAction label={t('leaveRequests.add')} onClick={openCreateModal} />}
      />

      {!loading && !error ? (
        <ListStatsGrid>
          <CompactStatCard title={t('leaveRequests.stat.total')} value={stats.total} dotVariant="primary" />
          <CompactStatCard title={t('leaveRequests.stat.pending')} value={stats.pending} dotVariant="warning" />
          <CompactStatCard title={t('leaveRequests.stat.approved')} value={stats.approved} dotVariant="success" />
          <CompactStatCard title={t('leaveRequests.stat.rejected')} value={stats.rejected} dotVariant="danger" />
        </ListStatsGrid>
      ) : null}

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('leaveRequests.listTitle')}
          subtitle={t('leaveRequests.listSubtitle')}
          toolbar={
            !showEmpty ? (
              <>
                <ListToolbarSearch
                  value={search}
                  onChange={setSearch}
                  placeholder={t('leaveRequests.searchPlaceholder')}
                  ariaLabel={t('common.search')}
                />
                <SelectFilter
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value as StatusFilter)}
                  ariaLabel={t('leaveRequests.filterStatus')}
                  options={[
                    { value: 'all', label: t('common.allStatuses') },
                    { value: 'PENDING', label: t('leaveRequests.status.pending') },
                    { value: 'APPROVED', label: t('leaveRequests.status.approved') },
                    { value: 'REJECTED', label: t('leaveRequests.status.rejected') },
                    { value: 'CANCELLED', label: t('leaveRequests.status.cancelled') },
                  ]}
                />
                <SelectFilter
                  value={employeeFilter}
                  onChange={setEmployeeFilter}
                  ariaLabel={t('leaveRequests.filterEmployee')}
                  options={[
                    { value: 'all', label: t('common.allEmployees') },
                    ...employeeFilterOptions.map((employee) => ({
                      value: String(employee.id),
                      label: employee.fullName,
                    })),
                  ]}
                />
              </>
            ) : undefined
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('leaveRequests.loading')}
          loadingColumns={6}
          showEmpty={showEmpty}
          emptyTitle={t('leaveRequests.emptyTitle')}
          emptyDescription={t('leaveRequests.emptyText')}
          emptyActionLabel={t('leaveRequests.add')}
          onEmptyAction={openCreateModal}
          showFilterEmpty={showFilterEmpty}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="entity">{t('leaveRequests.col.employee')}</Th>
                  <Th>{t('leaveRequests.col.leaveType')}</Th>
                  <Th>{t('leaveRequests.col.period')}</Th>
                  <Th>{t('leaveRequests.col.days')}</Th>
                  <Th column="status">{t('common.status')}</Th>
                  <Th column="date">{t('common.createdAt')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLeaveRequests.map((request) => {
                  return (
                    <ClickableTableRow
                      key={request.id}
                      selected={viewingRequest?.id === request.id}
                      onClick={() => setViewingRequest(request)}
                    >
                      <Td column="entity">
                        <EmployeeCell request={request} />
                      </Td>
                      <Td>
                        <LeaveTypeCell request={request} />
                      </Td>
                      <Td>
                        <PeriodCell request={request} />
                      </Td>
                      <Td>
                        <span className="leave-request-days">{request.daysCount}</span>
                      </Td>
                      <Td column="status">
                        <LeaveStatusBadge status={request.status} />
                      </Td>
                      <Td column="date">
                        <CompactDateCell value={request.createdAt} />
                      </Td>
                    </ClickableTableRow>
                  )
                })}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>

      <LeaveRequestDetailsDrawer
        open={viewingRequest !== null}
        request={viewingRequest}
        onClose={() => setViewingRequest(null)}
        busy={viewingRequest !== null && rowActionId === viewingRequest.id}
        onApprove={
          viewingRequest?.status === 'PENDING'
            ? () => openStatusModal(viewingRequest, 'approve')
            : undefined
        }
        onReject={
          viewingRequest?.status === 'PENDING'
            ? () => openStatusModal(viewingRequest, 'reject')
            : undefined
        }
        onCancel={
          viewingRequest?.status === 'PENDING'
            ? () => openStatusModal(viewingRequest, 'cancel')
            : undefined
        }
      />

      <LeaveRequestFormModal
        open={modalOpen}
        onClose={closeCreateModal}
        onSuccess={() => void loadLeaveRequests()}
      />

      <LeaveRequestStatusModal
        open={statusModalOpen}
        mode={statusModalMode}
        request={selectedRequest}
        loading={statusSaving}
        onClose={closeStatusModal}
        onSubmit={(statusNote) => void handleStatusSubmit(statusNote)}
      />
    </ListPage>
  )
}
