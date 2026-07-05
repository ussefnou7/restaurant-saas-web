import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../../../../components/ui/Button'
import { CompactDateCell } from '../../../../components/ui/CompactDateCell'
import { ConfirmModal } from '../../../../components/ui/ConfirmModal'
import { LoadingState } from '../../../../components/ui/LoadingState'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { useTranslation } from '../../../../i18n/useTranslation'
import * as salaryAdditionService from '../../../../services/salaryAdditionService'
import type { EmployeeResponse } from '../../../../types/employee'
import type { SalaryAdditionResponse } from '../../../../types/salaryAddition'
import { translateApiError } from '../../../../utils/errors'
import { canManageHrPayroll } from '../../../../utils/hrAccess'
import { formatMoney } from '../../../../utils/format'
import { ChangeSalaryModal } from './ChangeSalaryModal'
import { SalaryAdditionModal } from './SalaryAdditionModal'

interface EmployeePayrollTabProps {
  employee: EmployeeResponse
  onEmployeeUpdated: (employee: EmployeeResponse) => void
}

export function EmployeePayrollTab({ employee, onEmployeeUpdated }: EmployeePayrollTabProps) {
  const { t } = useTranslation()
  const canManage = canManageHrPayroll()

  const [additions, setAdditions] = useState<SalaryAdditionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [changeSalaryOpen, setChangeSalaryOpen] = useState(false)
  const [additionOpen, setAdditionOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<SalaryAdditionResponse | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const loadAdditions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await salaryAdditionService.getSalaryAdditions()
      setAdditions(
        data
          .filter((item) => item.employeeId === employee.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      )
    } catch (err) {
      setAdditions([])
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [employee.id, t])

  useEffect(() => {
    void loadAdditions()
  }, [loadAdditions])

  const activeAdditions = useMemo(
    () => additions.filter((item) => item.active),
    [additions],
  )

  async function confirmCancelAddition() {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await salaryAdditionService.updateSalaryAdditionStatus(cancelTarget.id, false)
      setCancelTarget(null)
      await loadAdditions()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
      setCancelTarget(null)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="employee-payroll-tab">
      <section className="overview-card">
        <div className="employee-payroll-tab__section-head">
          <h3 className="overview-card__title">{t('payroll.currentSalary')}</h3>
          {canManage ? (
            <Button variant="secondary" size="sm" onClick={() => setChangeSalaryOpen(true)}>
              {t('payroll.actions.changeSalary')}
            </Button>
          ) : null}
        </div>
        <div className="detail-summary-card">
          <p className="employee-payroll-tab__salary-value" dir="ltr">
            {formatMoney(employee.salary)}
          </p>
        </div>
      </section>

      <section className="overview-card">
        <h3 className="overview-card__title">{t('payroll.salaryHistory')}</h3>
        <p className="detail-empty-state__text">{t('payroll.empty.history')}</p>
      </section>

      <section className="overview-card">
        <div className="employee-payroll-tab__section-head">
          <h3 className="overview-card__title">{t('payroll.additions')}</h3>
          {canManage ? (
            <Button variant="primary" size="sm" onClick={() => setAdditionOpen(true)}>
              {t('payroll.actions.addAdjustment')}
            </Button>
          ) : null}
        </div>

        {error ? <div className="alert-error">{error}</div> : null}

        {loading ? (
          <LoadingState message={t('payroll.title')} />
        ) : activeAdditions.length === 0 ? (
          <p className="detail-empty-state__text">{t('payroll.empty.additions')}</p>
        ) : (
          <table className="detail-mini-table">
            <thead>
              <tr>
                <th>{t('payroll.fields.title')}</th>
                <th>{t('payroll.fields.amount')}</th>
                <th>{t('payroll.fields.salaryMonth')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.createdAt')}</th>
                {canManage ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {activeAdditions.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td dir="ltr">{formatMoney(item.amount)}</td>
                  <td>
                    <CompactDateCell value={item.salaryMonth} />
                  </td>
                  <td>
                    <StatusBadge active={item.active} />
                  </td>
                  <td>
                    <CompactDateCell value={item.createdAt} />
                  </td>
                  {canManage ? (
                    <td>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCancelTarget(item)}
                      >
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

      <section className="overview-card">
        <h3 className="overview-card__title">{t('payroll.deductions')}</h3>
        <p className="detail-empty-state__text">{t('payroll.empty.deductions')}</p>
      </section>

      <ChangeSalaryModal
        open={changeSalaryOpen}
        employee={employee}
        onClose={() => setChangeSalaryOpen(false)}
        onSuccess={(updated) => {
          onEmployeeUpdated(updated)
          setChangeSalaryOpen(false)
        }}
      />

      <SalaryAdditionModal
        open={additionOpen}
        employeeId={employee.id}
        onClose={() => setAdditionOpen(false)}
        onSuccess={() => void loadAdditions()}
      />

      <ConfirmModal
        open={cancelTarget !== null}
        title={t('payroll.cancelConfirm.title')}
        message={t('payroll.cancelConfirm.message')}
        confirmLabel={t('payroll.actions.cancelAdjustment')}
        loading={cancelling}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => void confirmCancelAddition()}
      />
    </div>
  )
}
