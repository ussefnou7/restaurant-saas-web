import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../../../../components/ui/Button'
import { CompactDateCell } from '../../../../components/ui/CompactDateCell'
import { ConfirmModal } from '../../../../components/ui/ConfirmModal'
import { LoadingState } from '../../../../components/ui/LoadingState'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { useTranslation } from '../../../../i18n/useTranslation'
import * as employeeHrService from '../../../../services/employeeHrService'
import * as salaryAdditionService from '../../../../services/salaryAdditionService'
import type { SalaryAdjustmentResponse } from '../../../../types/salaryAdjustment'
import type { SalaryAdditionResponse } from '../../../../types/salaryAddition'
import { translateApiError } from '../../../../utils/errors'
import { canManageHrPayroll } from '../../../../utils/hrAccess'
import { formatMoney } from '../../../../utils/format'
import { SalaryAdjustmentModal } from './SalaryAdjustmentModal'

interface EmployeeAdjustmentsTabProps {
  employeeId: number
}

function isActiveAdjustment(item: SalaryAdjustmentResponse): boolean {
  const status = item.status?.toUpperCase?.() ?? ''
  if (status === 'CANCELLED' || status === 'INACTIVE') return false
  if (item.active === false) return false
  return true
}

function mapLegacyAddition(item: SalaryAdditionResponse): SalaryAdjustmentResponse {
  return {
    id: item.id,
    employeeId: item.employeeId,
    type: 'ADDITION',
    amount: item.amount,
    adjustmentDate: item.salaryMonth,
    reason: item.title,
    notes: item.notes ?? null,
    status: item.active ? 'ACTIVE' : 'CANCELLED',
    active: item.active,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export function EmployeeAdjustmentsTab({ employeeId }: EmployeeAdjustmentsTabProps) {
  const { t } = useTranslation()
  const canManage = canManageHrPayroll()

  const [adjustments, setAdjustments] = useState<SalaryAdjustmentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<SalaryAdjustmentResponse | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [usingLegacyApi, setUsingLegacyApi] = useState(false)

  const loadAdjustments = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await employeeHrService.getEmployeeSalaryAdjustments(employeeId)
      setAdjustments(
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      )
      setUsingLegacyApi(false)
    } catch {
      try {
        const legacy = await salaryAdditionService.getSalaryAdditions()
        setAdjustments(
          legacy
            .filter((item) => item.employeeId === employeeId)
            .map(mapLegacyAddition)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        )
        setUsingLegacyApi(true)
      } catch (err) {
        setAdjustments([])
        setError(translateApiError(err, t).message)
      }
    } finally {
      setLoading(false)
    }
  }, [employeeId, t])

  useEffect(() => {
    void loadAdjustments()
  }, [loadAdjustments])

  const visibleAdjustments = useMemo(
    () => adjustments.filter(isActiveAdjustment),
    [adjustments],
  )

  async function confirmCancelAdjustment() {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      if (usingLegacyApi) {
        await salaryAdditionService.updateSalaryAdditionStatus(cancelTarget.id, false)
      } else {
        await employeeHrService.cancelSalaryAdjustment(cancelTarget.id)
      }
      setCancelTarget(null)
      await loadAdjustments()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
      setCancelTarget(null)
    } finally {
      setCancelling(false)
    }
  }

  function formatAdjustmentType(type: string) {
    const normalized = type.toUpperCase()
    if (normalized === 'DEDUCTION') return t('payroll.types.deduction')
    return t('payroll.types.addition')
  }

  return (
    <div className="employee-module-tab">
      <section className="employee-module-card">
        <div className="employee-payroll-tab__section-head">
          <h3 className="employee-module-card__title">{t('employees.tabs.adjustments')}</h3>
          {canManage ? (
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              {t('payroll.actions.addAdjustment')}
            </Button>
          ) : null}
        </div>

        {error ? <div className="alert-error">{error}</div> : null}

        {loading ? (
          <LoadingState message={t('payroll.adjustments')} />
        ) : visibleAdjustments.length === 0 ? (
          <p className="detail-empty-state__text">{t('payroll.empty.additions')}</p>
        ) : (
          <table className="detail-mini-table">
            <thead>
              <tr>
                <th>{t('payroll.fields.adjustmentType')}</th>
                <th className="table-cell--numeric">{t('payroll.fields.amount')}</th>
                <th>{t('payroll.fields.adjustmentDate')}</th>
                <th>{t('payroll.fields.reason')}</th>
                <th>{t('payroll.fields.notes')}</th>
                <th>{t('common.status')}</th>
                {canManage ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {visibleAdjustments.map((item) => (
                <tr key={item.id}>
                  <td>{formatAdjustmentType(item.type)}</td>
                  <td dir="ltr" className="table-cell--numeric">{formatMoney(item.amount)}</td>
                  <td>
                    <CompactDateCell value={item.adjustmentDate} />
                  </td>
                  <td>{item.reason?.trim() || t('common.empty.dash')}</td>
                  <td>{item.notes?.trim() || t('common.empty.dash')}</td>
                  <td>
                    <StatusBadge active={isActiveAdjustment(item)} />
                  </td>
                  {canManage ? (
                    <td>
                      <Button variant="secondary" size="sm" onClick={() => setCancelTarget(item)}>
                        {t('payroll.actions.cancelAdjustment')}
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <SalaryAdjustmentModal
        open={createOpen}
        employeeId={employeeId}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => void loadAdjustments()}
      />

      <ConfirmModal
        open={cancelTarget !== null}
        title={t('payroll.cancelConfirm.title')}
        message={t('payroll.cancelConfirm.message')}
        confirmLabel={t('payroll.actions.cancelAdjustment')}
        loading={cancelling}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => void confirmCancelAdjustment()}
      />
    </div>
  )
}
