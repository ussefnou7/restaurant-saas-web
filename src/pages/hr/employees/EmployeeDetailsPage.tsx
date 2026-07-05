import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  EntityDetailModulePanel,
  EntityDetailModules,
  EntityDetailScreen,
  EntityOverviewActions,
  useEntityDetailTab,
} from '../../../components/entity-detail'
import { ConfirmModal } from '../../../components/ui/ConfirmModal'
import { useTranslation } from '../../../i18n/useTranslation'
import * as employeeService from '../../../services/employeeService'
import type { EmployeeResponse } from '../../../types/employee'
import { translateApiError } from '../../../utils/errors'
import { EmployeeOverviewPanel } from './EmployeeOverviewPanel'
import { EmployeeAdjustmentsTab } from './tabs/EmployeeAdjustmentsTab'
import { EmployeeLeaveAssignTab } from './tabs/EmployeeLeaveAssignTab'
import { EmployeeLeaveRequestsTab } from './tabs/EmployeeLeaveRequestsTab'
import { EmployeeSalariesTab } from './tabs/EmployeeSalariesTab'

const TAB_SALARIES = 'salaries'
const TAB_ADJUSTMENTS = 'adjustments'
const TAB_LEAVE_ASSIGN = 'leave-assign'
const TAB_LEAVE_REQUESTS = 'leave-requests'

export function EmployeeDetailsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { employeeId } = useParams<{ employeeId: string }>()

  const [employee, setEmployee] = useState<EmployeeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusBusy, setStatusBusy] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const tabs = useMemo(
    () => [
      { id: TAB_SALARIES, label: t('employees.tabs.salaries') },
      { id: TAB_ADJUSTMENTS, label: t('employees.tabs.adjustments') },
      { id: TAB_LEAVE_ASSIGN, label: t('employees.tabs.leaveAssign') },
      { id: TAB_LEAVE_REQUESTS, label: t('employees.tabs.leaveRequests') },
    ],
    [t],
  )

  const { activeTab, setTab } = useEntityDetailTab(tabs, TAB_SALARIES)

  const loadEmployee = useCallback(async () => {
    if (!employeeId) return

    setLoading(true)
    setError('')

    try {
      const found = await employeeService.getEmployee(employeeId)
      setEmployee(found)
    } catch (err) {
      setEmployee(null)
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [employeeId, t])

  useEffect(() => {
    void loadEmployee()
  }, [loadEmployee])

  function handleStartEdit() {
    setIsEditing(true)
    setError('')
  }

  function handleCancelEdit() {
    setIsEditing(false)
  }

  function handleSaved(updated: EmployeeResponse) {
    setEmployee(updated)
    setIsEditing(false)
    setError('')
  }

  async function handleToggleStatus() {
    if (!employee || isEditing) return

    setStatusBusy(true)
    try {
      const updated = await employeeService.updateEmployeeStatus(employee.id, !employee.active)
      setEmployee(updated)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setStatusBusy(false)
    }
  }

  async function confirmDelete() {
    if (!employee) return

    setDeleting(true)
    try {
      await employeeService.deleteEmployee(employee.id)
      navigate('/hr/employees')
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
      setDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  const overviewActions =
    employee && !isEditing ? (
      <EntityOverviewActions
        editLabel={t('employees.details.actions.edit')}
        deleteLabel={t('employees.details.actions.delete')}
        statusLabel={
          employee.active
            ? t('employees.details.actions.deactivate')
            : t('employees.details.actions.activate')
        }
        active={employee.active}
        statusBusy={statusBusy}
        onEdit={handleStartEdit}
        onDelete={() => setDeleteOpen(true)}
        onToggleStatus={() => void handleToggleStatus()}
      />
    ) : null

  return (
    <>
      <EntityDetailScreen
        backTo="/hr/employees"
        backLabel={t('employees.details.back')}
        loading={loading}
        loadingMessage={t('employees.loading')}
        notFound={!loading && !employee}
        notFoundTitle={t('employees.details.notFoundTitle')}
        notFoundMessage={error || t('employees.details.notFound')}
        error={employee ? error : undefined}
        overview={
          employee ? (
            <EmployeeOverviewPanel
              employee={employee}
              editing={isEditing}
              onCancel={handleCancelEdit}
              onSaved={handleSaved}
              toolbarActions={overviewActions}
            />
          ) : null
        }
        modules={
          employee ? (
            <EntityDetailModules tabs={tabs} activeTab={activeTab} onTabChange={setTab}>
              <EntityDetailModulePanel id={TAB_SALARIES} activeTab={activeTab}>
                <EmployeeSalariesTab employee={employee} onEmployeeUpdated={setEmployee} />
              </EntityDetailModulePanel>

              <EntityDetailModulePanel id={TAB_ADJUSTMENTS} activeTab={activeTab}>
                <EmployeeAdjustmentsTab employeeId={employee.id} />
              </EntityDetailModulePanel>

              <EntityDetailModulePanel id={TAB_LEAVE_ASSIGN} activeTab={activeTab}>
                <EmployeeLeaveAssignTab employeeId={employee.id} />
              </EntityDetailModulePanel>

              <EntityDetailModulePanel id={TAB_LEAVE_REQUESTS} activeTab={activeTab}>
                <EmployeeLeaveRequestsTab employeeId={employee.id} />
              </EntityDetailModulePanel>
            </EntityDetailModules>
          ) : null
        }
      />

      <ConfirmModal
        open={deleteOpen}
        title={t('employees.deleteConfirm.title')}
        message={t('employees.deleteConfirm.message')}
        confirmLabel={t('employees.deleteConfirm.confirm')}
        loading={deleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  )
}
