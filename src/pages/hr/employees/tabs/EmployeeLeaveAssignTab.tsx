import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { StatusBadgeView } from '../../../../components/fields'
import { Button } from '../../../../components/ui/Button'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { ErrorState } from '../../../../components/ui/ErrorState'
import { LoadingState } from '../../../../components/ui/LoadingState'
import { useNotify } from '../../../../components/ui/NotificationContext'
import { useTranslation } from '../../../../i18n/useTranslation'
import * as employeeHrService from '../../../../services/employeeHrService'
import type { LeaveBalanceResponse } from '../../../../types/leaveBalance'
import {
  getApiErrorCode,
  translateApiError,
} from '../../../../utils/errors'
import { canManageLeaveRequests } from '../../../../utils/hrAccess'
import { formatDecimalDays, getLocalizedLeaveTypeName } from '../../../../utils/leaveDisplay'
import { EditLeaveBalanceModal } from './EditLeaveBalanceModal'

interface EmployeeLeaveAssignTabProps {
  employeeId: number
}

interface LeaveBalanceCardProps {
  balance: LeaveBalanceResponse
  canManage: boolean
  onEdit: (balance: LeaveBalanceResponse) => void
}

function LeaveBalanceCard({ balance, canManage, onEdit }: LeaveBalanceCardProps) {
  const { t, locale } = useTranslation()
  const leaveTypeName = getLocalizedLeaveTypeName(balance, locale)

  return (
    <article className="leave-balance-card">
      <header className="leave-balance-card__head">
        <div className="leave-balance-card__head-main">
          <h4 className="leave-balance-card__title">{leaveTypeName}</h4>
          {balance.leaveTypeCode ? (
            <span className="leave-balance-card__code" dir="ltr">
              {balance.leaveTypeCode}
            </span>
          ) : null}
        </div>
        <div className="leave-balance-card__head-meta">
          <span className="leave-balance-card__year" dir="ltr">
            {balance.year}
          </span>
          <StatusBadgeView active={balance.active} />
          {canManage ? (
            <button
              type="button"
              className="leave-balance-card__edit"
              onClick={() => onEdit(balance)}
              aria-label={t('leaveAssign.actions.edit')}
              title={t('leaveAssign.actions.edit')}
            >
              <Pencil size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </header>

      <div className="leave-balance-card__remaining">
        <span className="leave-balance-card__remaining-label">
          {t('leaveAssign.fields.remainingDays')}
        </span>
        <p className="leave-balance-card__remaining-value" dir="ltr">
          {formatDecimalDays(balance.remainingDays)}
          <span className="leave-balance-card__remaining-unit">
            {t('leaveAssign.units.days')}
          </span>
        </p>
      </div>

      <dl className="leave-balance-card__metrics">
        <div className="leave-balance-card__metric">
          <dt>{t('leaveAssign.fields.openingBalance')}</dt>
          <dd dir="ltr">{formatDecimalDays(balance.openingBalance)}</dd>
        </div>
        <div className="leave-balance-card__metric">
          <dt>{t('leaveAssign.fields.assignedDays')}</dt>
          <dd dir="ltr">{formatDecimalDays(balance.assignedDays)}</dd>
        </div>
        <div className="leave-balance-card__metric">
          <dt>{t('leaveAssign.fields.usedDays')}</dt>
          <dd dir="ltr">{formatDecimalDays(balance.usedDays)}</dd>
        </div>
      </dl>

      {balance.notes?.trim() ? (
        <p className="leave-balance-card__notes">
          <span className="leave-balance-card__notes-label">
            {t('leaveAssign.fields.notes')}:
          </span>{' '}
          {balance.notes.trim()}
        </p>
      ) : null}
    </article>
  )
}

export function EmployeeLeaveAssignTab({ employeeId }: EmployeeLeaveAssignTabProps) {
  const { t } = useTranslation()
  const notify = useNotify()
  const canManage = canManageLeaveRequests()

  const [balances, setBalances] = useState<LeaveBalanceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [noActiveLeaveTypes, setNoActiveLeaveTypes] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [editingBalance, setEditingBalance] = useState<LeaveBalanceResponse | null>(null)

  const loadBalances = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await employeeHrService.getEmployeeLeaveBalances(employeeId)
      setBalances(data)
      setLoadFailed(false)
    } catch (err) {
      setBalances([])
      setLoadFailed(true)
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [employeeId, t])

  useEffect(() => {
    void loadBalances()
  }, [loadBalances])

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    setNoActiveLeaveTypes(false)

    try {
      await employeeHrService.generateEmployeeLeaveBalances(employeeId)
      notify.success(t('leaveAssign.messages.generateSuccess'))
      await loadBalances()
    } catch (err) {
      // Generate opts out of the global toast (notifyOnError: false) so the
      // inline error and leave-types link can show without duplicating a toast.
      setNoActiveLeaveTypes(getApiErrorCode(err) === 'NO_ACTIVE_LEAVE_TYPES')
      setError(translateApiError(err, t).message)
    } finally {
      setGenerating(false)
    }
  }

  function handleEditSuccess() {
    notify.success(t('leaveAssign.messages.updateSuccess'))
    void loadBalances()
  }

  const generateButton = canManage ? (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => void handleGenerate()}
      disabled={generating || loading}
    >
      {generating ? t('common.loading') : t('leaveAssign.actions.generate')}
    </Button>
  ) : null

  const leaveTypesLink = (
    <Link to="/hr/leave-types" className="text-link">
      {noActiveLeaveTypes
        ? t('leaveAssign.actions.goToLeaveTypes')
        : t('leaveAssign.actions.manageLeaveTypes')}
    </Link>
  )

  return (
    <div className="employee-module-tab leave-assign-tab">
      <section className="employee-module-card">
        <div className="leave-assign-tab__head">
          <div className="leave-assign-tab__intro">
            <h3 className="employee-module-card__title">{t('leaveAssign.title')}</h3>
            <p className="leave-assign-tab__subtitle">{t('leaveAssign.subtitle')}</p>
          </div>
          {generateButton}
        </div>

        {error && !(loadFailed && balances.length === 0) ? (
          <div className="alert-error">
            {error}
            {noActiveLeaveTypes ? (
              <p className="alert-error__action">{leaveTypesLink}</p>
            ) : null}
          </div>
        ) : null}

        {loading ? (
          <LoadingState message={t('leaveAssign.title')} />
        ) : loadFailed && balances.length === 0 ? (
          <ErrorState message={error} onRetry={() => void loadBalances()} />
        ) : balances.length === 0 ? (
          <EmptyState
            title={t('leaveAssign.empty.title')}
            description={t('leaveAssign.empty.subtitle')}
            actionLabel={canManage ? t('leaveAssign.actions.generate') : undefined}
            onAction={canManage ? () => void handleGenerate() : undefined}
          >
            <p className="leave-assign-tab__secondary-link">{leaveTypesLink}</p>
          </EmptyState>
        ) : (
          <div className="leave-assign-grid">
            {balances.map((balance) => (
              <LeaveBalanceCard
                key={balance.id}
                balance={balance}
                canManage={canManage}
                onEdit={setEditingBalance}
              />
            ))}
          </div>
        )}
      </section>

      <EditLeaveBalanceModal
        open={editingBalance !== null}
        balance={editingBalance}
        onClose={() => setEditingBalance(null)}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}
