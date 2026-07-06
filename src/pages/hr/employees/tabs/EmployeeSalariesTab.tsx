import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../../../components/ui/Button'
import { CompactDateCell } from '../../../../components/ui/CompactDateCell'
import { LoadingState } from '../../../../components/ui/LoadingState'
import { useTranslation } from '../../../../i18n/useTranslation'
import * as employeeHrService from '../../../../services/employeeHrService'
import type { EmployeeResponse } from '../../../../types/employee'
import type { EmployeeSalaryRecord } from '../../../../types/employeeSalary'
import { canManageHrPayroll } from '../../../../utils/hrAccess'
import { formatMoney } from '../../../../utils/format'
import { ChangeSalaryModal } from './ChangeSalaryModal'

interface EmployeeSalariesTabProps {
  employee: EmployeeResponse
  onEmployeeUpdated: (employee: EmployeeResponse) => void
}

export function EmployeeSalariesTab({ employee, onEmployeeUpdated }: EmployeeSalariesTabProps) {
  const { t } = useTranslation()
  const canManage = canManageHrPayroll()

  const [currentSalary, setCurrentSalary] = useState(employee.salary)
  const [history, setHistory] = useState<EmployeeSalaryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [changeSalaryOpen, setChangeSalaryOpen] = useState(false)

  const loadSalaries = useCallback(async () => {
    setLoading(true)

    try {
      const [current, records] = await Promise.all([
        employeeHrService.getEmployeeCurrentSalary(employee.id),
        employeeHrService.getEmployeeSalaries(employee.id),
      ])
      setCurrentSalary(current.amount)
      setHistory(
        records.sort(
          (a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime(),
        ),
      )
    } catch {
      setCurrentSalary(employee.salary)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }, [employee.id, employee.salary])

  useEffect(() => {
    void loadSalaries()
  }, [loadSalaries])

  function handleSalaryChanged(updated: EmployeeResponse) {
    onEmployeeUpdated(updated)
    setCurrentSalary(updated.salary)
    void loadSalaries()
  }

  return (
    <div className="employee-module-tab">
      <section className="employee-module-card employee-module-card--highlight">
        <div className="employee-payroll-tab__section-head">
          <h3 className="employee-module-card__title">{t('payroll.currentSalary')}</h3>
          {canManage ? (
            <Button variant="secondary" size="sm" onClick={() => setChangeSalaryOpen(true)}>
              {t('payroll.actions.changeSalary')}
            </Button>
          ) : null}
        </div>
        {loading ? (
          <LoadingState message={t('payroll.currentSalary')} />
        ) : (
          <p className="employee-payroll-tab__salary-value" dir="ltr">
            {formatMoney(currentSalary)}
          </p>
        )}
      </section>

      <section className="employee-module-card">
        <h3 className="employee-module-card__title">{t('payroll.salaryHistory')}</h3>
        {loading ? (
          <LoadingState message={t('payroll.salaryHistory')} />
        ) : history.length === 0 ? (
          <div className="detail-empty-state detail-empty-state--compact">
            <p className="detail-empty-state__title">{t('payroll.empty.noRecords')}</p>
            {canManage ? (
              <Button variant="secondary" size="sm" onClick={() => setChangeSalaryOpen(true)}>
                {t('payroll.actions.changeSalary')}
              </Button>
            ) : null}
          </div>
        ) : (
          <table className="detail-mini-table">
            <thead>
              <tr>
                <th className="table-cell--numeric">{t('payroll.fields.salaryAmount')}</th>
                <th>{t('payroll.fields.effectiveFrom')}</th>
                <th>{t('payroll.fields.notes')}</th>
                <th>{t('common.createdAt')}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => (
                <tr key={record.id}>
                  <td dir="ltr" className="table-cell--numeric">{formatMoney(record.amount)}</td>
                  <td>
                    <CompactDateCell value={record.effectiveFrom} />
                  </td>
                  <td>{record.notes?.trim() || t('common.empty.dash')}</td>
                  <td>
                    <CompactDateCell value={record.createdAt} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <ChangeSalaryModal
        open={changeSalaryOpen}
        employee={employee}
        onClose={() => setChangeSalaryOpen(false)}
        onSuccess={handleSalaryChanged}
      />
    </div>
  )
}
