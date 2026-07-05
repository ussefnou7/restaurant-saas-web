import { Button } from '../../../components/ui/Button'
import { DetailsField, DetailsSection } from '../../../components/ui/DetailsSection'
import { SideDrawer } from '../../../components/ui/SideDrawer'
import { CompactDateCell } from '../../../components/ui/CompactDateCell'
import { useTranslation } from '../../../i18n/useTranslation'
import type { LeaveRequestResponse } from '../../../types/leaveRequest'
import { formatDate } from '../../../utils/format'
import { LeaveStatusBadge } from './LeaveStatusBadge'

interface LeaveRequestDetailsDrawerProps {
  open: boolean
  request: LeaveRequestResponse | null
  onClose: () => void
  onApprove?: () => void
  onReject?: () => void
  onCancel?: () => void
  busy?: boolean
}

export function LeaveRequestDetailsDrawer({
  open,
  request,
  onClose,
  onApprove,
  onReject,
  onCancel,
  busy,
}: LeaveRequestDetailsDrawerProps) {
  const { t } = useTranslation()

  if (!request) return null

  const isPending = request.status === 'PENDING'

  const footer = isPending ? (
    <div className="entity-details-actions">
      {onApprove ? (
        <Button variant="primary" onClick={onApprove} disabled={busy}>
          {t('leaveRequests.approve')}
        </Button>
      ) : null}
      {onReject ? (
        <Button variant="secondary" onClick={onReject} disabled={busy}>
          {t('leaveRequests.reject')}
        </Button>
      ) : null}
      {onCancel ? (
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          {t('leaveRequests.cancel')}
        </Button>
      ) : null}
    </div>
  ) : undefined

  return (
    <SideDrawer
      open={open}
      title={request.employeeName ?? t('leaveRequests.col.employee')}
      subtitle={request.leaveTypeName ?? request.leaveTypeCode ?? ''}
      onClose={onClose}
      headerExtra={<LeaveStatusBadge status={request.status} />}
      footer={footer}
    >
      <DetailsSection title={t('common.information')}>
        <DetailsField
          label={t('leaveRequests.col.employee')}
          value={request.employeeName ?? t('common.empty.dash')}
        />
        {request.employeeCode ? (
          <DetailsField label={t('common.fields.code')} value={request.employeeCode} ltr />
        ) : null}
        <DetailsField
          label={t('leaveRequests.col.leaveType')}
          value={request.leaveTypeName ?? request.leaveTypeCode ?? t('common.empty.dash')}
        />
        <DetailsField
          label={t('leaveRequests.col.period')}
          value={`${formatDate(request.fromDate)} – ${formatDate(request.toDate)}`}
        />
        <DetailsField label={t('leaveRequests.col.days')} value={String(request.daysCount)} />
        <DetailsField label={t('common.status')} value={<LeaveStatusBadge status={request.status} />} />
        <DetailsField
          label={t('common.description')}
          value={request.reason?.trim() || t('common.empty.dash')}
        />
        {request.statusNote?.trim() ? (
          <DetailsField label={t('leaveRequests.statusNote')} value={request.statusNote} />
        ) : null}
        <DetailsField label={t('common.createdAt')} value={<CompactDateCell value={request.createdAt} />} />
        <DetailsField label={t('common.updatedAt')} value={<CompactDateCell value={request.updatedAt} />} />
      </DetailsSection>
    </SideDrawer>
  )
}
