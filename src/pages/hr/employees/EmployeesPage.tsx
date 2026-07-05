import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { SelectFilter } from '../../../components/ui/SelectFilter'
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
import * as branchService from '../../../services/branchService'
import * as employeeService from '../../../services/employeeService'
import * as jobService from '../../../services/jobService'
import type { BranchResponse } from '../../../types/branch'
import type { EmployeeResponse } from '../../../types/employee'
import type { JobResponse } from '../../../types/job'
import { translateApiError } from '../../../utils/errors'
import { formatMoney } from '../../../utils/format'
import {
  getEmployeeBranchName,
  getEmployeeDisplayName,
  getEmployeeJobName,
} from '../../../utils/employeeDisplay'
import { EmployeeFormModal } from './EmployeeFormModal'

type StatusFilter = 'all' | 'active' | 'inactive'

function matchesSearch(employee: EmployeeResponse, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  return [
    employee.employeeCode,
    employee.fullName,
    employee.fullNameAr ?? '',
    employee.fullNameEn ?? '',
    employee.phone ?? '',
    employee.email ?? '',
    employee.nationalId ?? '',
    employee.branchName,
    employee.branchCode,
    employee.jobName,
    employee.jobCode,
  ]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(q))
}

export function EmployeesPage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<EmployeeResponse[]>([])
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [jobs, setJobs] = useState<JobResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [jobFilter, setJobFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [rowActionId, setRowActionId] = useState<number | null>(null)

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await employeeService.getEmployees()
      setEmployees(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [t])

  const loadFilters = useCallback(async () => {
    try {
      const [branchData, jobData] = await Promise.all([
        branchService.getBranches(),
        jobService.getJobs(),
      ])
      setBranches(branchData)
      setJobs(jobData)
    } catch {
      // Filters are optional; list still works from employee data.
    }
  }, [])

  useEffect(() => {
    void loadEmployees()
    void loadFilters()
  }, [loadEmployees, loadFilters])

  const branchFilterOptions = useMemo(() => {
    if (branches.length > 0) return branches
    const map = new Map<number, BranchResponse>()
    employees.forEach((employee) => {
      map.set(employee.branchId, {
        id: employee.branchId,
        name: employee.branchName,
        code: employee.branchCode,
        active: true,
        createdAt: '',
        updatedAt: '',
      })
    })
    return Array.from(map.values())
  }, [branches, employees])

  const jobFilterOptions = useMemo(() => {
    if (jobs.length > 0) return jobs
    const map = new Map<number, JobResponse>()
    employees.forEach((employee) => {
      map.set(employee.jobId, {
        id: employee.jobId,
        name: employee.jobName,
        code: employee.jobCode,
        active: true,
        createdAt: '',
        updatedAt: '',
      })
    })
    return Array.from(map.values())
  }, [jobs, employees])

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      if (!matchesSearch(employee, search)) return false
      if (statusFilter === 'active' && !employee.active) return false
      if (statusFilter === 'inactive' && employee.active) return false
      if (branchFilter !== 'all' && employee.branchId !== Number(branchFilter)) return false
      if (jobFilter !== 'all' && employee.jobId !== Number(jobFilter)) return false
      return true
    })
  }, [employees, search, statusFilter, branchFilter, jobFilter])

  const stats = useMemo(() => {
    const total = employees.length
    const activeEmployees = employees.filter((employee) => employee.active)
    const active = activeEmployees.length
    const monthlySalaries = activeEmployees.reduce((sum, employee) => sum + employee.salary, 0)
    return {
      total,
      active,
      inactive: total - active,
      monthlySalaries,
    }
  }, [employees])

  function openCreateModal() {
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  async function handleToggleStatus(employee: EmployeeResponse) {
    setRowActionId(employee.id)
    try {
      await employeeService.updateEmployeeStatus(employee.id, !employee.active)
      await loadEmployees()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setRowActionId(null)
    }
  }

  const showEmpty = !loading && !error && employees.length === 0
  const showFilterEmpty = !loading && !error && employees.length > 0 && filteredEmployees.length === 0
  const showTable = !loading && !error && filteredEmployees.length > 0

  return (
    <ListPage className="employees-page">
      <PageHeader
        title={t('employees.title')}
        description={t('employees.subtitle')}
        action={<ListPrimaryAction label={t('employees.add')} onClick={openCreateModal} />}
      />

      {!loading && !error ? (
        <ListStatsGrid>
          <CompactStatCard title={t('employees.stat.total')} value={stats.total} dotVariant="primary" />
          <CompactStatCard title={t('common.active')} value={stats.active} dotVariant="success" />
          <CompactStatCard title={t('common.inactive')} value={stats.inactive} dotVariant="warning" />
          <CompactStatCard
            title={t('employees.stat.salaries')}
            value={formatMoney(stats.monthlySalaries)}
            dotVariant="accent"
          />
        </ListStatsGrid>
      ) : null}

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('employees.listTitle')}
          subtitle={t('employees.listSubtitle')}
          toolbar={
            !showEmpty ? (
              <>
                <ListToolbarSearch
                  value={search}
                  onChange={setSearch}
                  placeholder={t('employees.searchPlaceholder')}
                  ariaLabel={t('common.search')}
                />
                <StatusFilterSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  ariaLabel={t('employees.filterStatus')}
                />
                <SelectFilter
                  value={branchFilter}
                  onChange={setBranchFilter}
                  ariaLabel={t('employees.filterBranch')}
                  options={[
                    { value: 'all', label: t('common.allBranches') },
                    ...branchFilterOptions.map((branch) => ({
                      value: String(branch.id),
                      label: branch.name,
                    })),
                  ]}
                />
                <SelectFilter
                  value={jobFilter}
                  onChange={setJobFilter}
                  ariaLabel={t('employees.filterJob')}
                  options={[
                    { value: 'all', label: t('common.allJobs') },
                    ...jobFilterOptions.map((job) => ({
                      value: String(job.id),
                      label: job.name,
                    })),
                  ]}
                />
              </>
            ) : undefined
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('employees.loading')}
          loadingColumns={5}
          showEmpty={showEmpty}
          emptyTitle={t('employees.emptyTitle')}
          emptyDescription={t('employees.emptyText')}
          emptyActionLabel={t('employees.add')}
          onEmptyAction={openCreateModal}
          showFilterEmpty={showFilterEmpty}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="entity">{t('employees.col.employee')}</Th>
                  <Th>{t('employees.col.job')}</Th>
                  <Th>{t('employees.col.branch')}</Th>
                  <Th column="status">{t('common.status')}</Th>
                  <Th column="date">{t('employees.col.hireDate')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmployees.map((employee) => {
                  const busy = rowActionId === employee.id
                  const displayName = getEmployeeDisplayName(employee, locale)
                  return (
                    <ClickableTableRow
                      key={employee.id}
                      onClick={() => navigate(`/hr/employees/${employee.id}`)}
                    >
                      <Td column="entity">
                        <EntityCell name={displayName} code={employee.employeeCode} compact />
                      </Td>
                      <Td>
                        <span className="role-cell-name">
                          {getEmployeeJobName(employee, locale)}
                        </span>
                      </Td>
                      <Td>
                        <span className="branch-cell-name">
                          {getEmployeeBranchName(employee, locale)}
                        </span>
                      </Td>
                      <StopPropagationCell column="status">
                        <StatusToggle
                          active={employee.active}
                          disabled={busy}
                          entityName={displayName}
                          onToggle={() => void handleToggleStatus(employee)}
                        />
                      </StopPropagationCell>
                      <Td column="date">
                        <CompactDateCell value={employee.hireDate} />
                      </Td>
                    </ClickableTableRow>
                  )
                })}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>

      <EmployeeFormModal
        open={modalOpen}
        mode="create"
        employee={null}
        onClose={closeModal}
        onSuccess={() => void loadEmployees()}
      />
    </ListPage>
  )
}
