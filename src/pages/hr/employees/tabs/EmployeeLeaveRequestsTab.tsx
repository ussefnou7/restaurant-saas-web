import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../../../../components/ui/Button'
import { ConfirmModal } from '../../../../components/ui/ConfirmModal'
import { LoadingState } from '../../../../components/ui/LoadingState'
import { useTranslation } from '../../../../i18n/useTranslation'
import * as employeeHrService from '../../../../services/employeeHrService'
import * as leaveRequestService from '../../../../services/leaveRequestService'
import type { LeaveRequestResponse } from '../../../../types/leaveRequest'
import { translateApiError } from '../../../../utils/errors'
import { canManageLeaveRequests } from '../../../../utils/hrAccess'
import { formatDate } from '../../../../utils/format'
import { LeaveStatusBadge } from '../../leave-requests/LeaveStatusBadge'
import { EmployeeLeaveRequestModal } from './EmployeeLeaveRequestModal'

interface EmployeeLeaveRequestsTabProps {
  employeeId: number
}

export function EmployeeLeaveRequestsTab({ employeeId }: EmployeeLeaveRequestsTabProps) {
  const { t } = useTranslation()
  const canManage = canManageLeaveRequests()

  const [requests, setRequests] = useState<LeaveRequestResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<LeaveRequestResponse | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await employeeHrService.getEmployeeLeaveRequests(employeeId)
      setRequests(
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      )
    } catch {
      try {
        const legacy = await leaveRequestService.getLeaveRequests()
        setRequests(
          legacy
            .filter((item) => item.employeeId === employeeId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        )
      } catch (err) {
        setRequests([])
        setError(translateApiError(err, t).message)
      }
    } finally {
      setLoading(false)
    }
  }, [employeeId, t])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  const sortedRequests = useMemo(() => requests, [requests])

  async function confirmCancelRequest() {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      try {
        await employeeHrService.cancelEmployeeLeaveRequest(cancelTarget.id)
      } catch {
        await leaveRequestService.updateLeaveRequestStatus(cancelTarget.id, {
          status: 'CANCELLED',
        })
      }
      setCancelTarget(null)
      await loadRequests()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
      setCancelTarget(null)
    } finally {
      setCancelling(false)
    }
  }

  const canCancel = (request: LeaveRequestResponse) =>
    request.status !== 'CANCELLED' && request.status !== 'REJECTED'

  return (
    <div className="employee-module-tab">
      <section className="employee-module-card">
        <div className="employee-payroll-tab__section-head">
          <h3 className="employee-module-card__title">{t('leaves.requests')}</h3>
          {canManage ? (
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              {t('leaves.actions.createRequest')}
            </Button>
          ) : null}
        </div>

        {error ? <div className="alert-error">{error}</div> : null}

        {loading ? (
          <LoadingState message={t('leaves.requests')} />
        ) : sortedRequests.length === 0 ? (
          <div className="detail-empty-state">
            <p className="detail-empty-state__title">{t('leaves.empty.noRequests')}</p>
          </div>
        ) : (
          <table className="detail-mini-table">
            <thead>
              <tr>
                <th>{t('leaves.fields.leaveType')}</th>
                <th>{t('leaves.fields.fromDate')}</th>
                <th>{t('leaves.fields.toDate')}</th>
                <th>{t('leaves.fields.daysCount')}</th>
                <th>{t('common.status')}</th>
                <th>{t('leaves.fields.reason')}</th>
                <th>{t('leaves.fields.notes')}</th>
                {canManage ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {sortedRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.leaveTypeName ?? request.leaveTypeCode ?? t('common.empty.dash')}</td>
                  <td dir="ltr">{formatDate(request.fromDate)}</td>
                  <td dir="ltr">{formatDate(request.toDate)}</td>
                  <td>{request.daysCount}</td>
                  <td>
                    <LeaveStatusBadge status={request.status} />
                  </td>
                  <td>{request.reason?.trim() || t('common.empty.dash')}</td>
                  <td>{request.statusNote?.trim() || t('common.empty.dash')}</td>
                  {canManage ? (
                    <td>
                      {canCancel(request) ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setCancelTarget(request)}
                        >
                          {t('leaves.actions.cancelRequest')}
                        </Button>
                      ) : (
                        t('common.empty.dash')
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <EmployeeLeaveRequestModal
        open={createOpen}
        employeeId={employeeId}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => void loadRequests()}
      />

      <ConfirmModal
        open={cancelTarget !== null}
        title={t('leaves.cancelConfirm.title')}
        message={t('leaves.cancelConfirm.message')}
        confirmLabel={t('leaves.actions.cancelRequest')}
        loading={cancelling}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => void confirmCancelRequest()}
      />
    </div>
  )
}
