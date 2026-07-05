import { Badge } from '../../../components/ui/Badge'
import { useTranslation } from '../../../i18n/useTranslation'
import type { LeaveRequestStatus } from '../../../types/leaveRequest'

export function LeaveStatusBadge({ status }: { status: LeaveRequestStatus }) {
  const { t } = useTranslation()
  switch (status) {
    case 'PENDING':
      return <Badge variant="warning">{t('leaveRequests.status.pending')}</Badge>
    case 'APPROVED':
      return <Badge variant="success">{t('leaveRequests.status.approved')}</Badge>
    case 'REJECTED':
      return <Badge variant="danger">{t('leaveRequests.status.rejected')}</Badge>
    case 'CANCELLED':
      return <Badge variant="muted">{t('leaveRequests.status.cancelled')}</Badge>
    default:
      return <Badge variant="muted">{status}</Badge>
  }
}
