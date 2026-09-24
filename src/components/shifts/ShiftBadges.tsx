import { Badge } from '../ui/Badge'
import { useTranslation } from '../../i18n/useTranslation'
import type { ShiftExpenseStatus, ShiftStatus } from '../../types/shift'
import {
  getShiftExpenseStatusBadgeVariant,
  getShiftExpenseStatusLabel,
  getShiftStatusBadgeVariant,
  getShiftStatusLabel,
} from '../../utils/shiftDisplay'

export function ShiftStatusBadge({ status }: { status: ShiftStatus }) {
  const { t } = useTranslation()
  return (
    <Badge variant={getShiftStatusBadgeVariant(status)}>
      {getShiftStatusLabel(status, t)}
    </Badge>
  )
}

export function ForcedCloseBadge({ forcedClose }: { forcedClose: boolean }) {
  const { t } = useTranslation()
  return (
    <Badge variant={forcedClose ? 'warning' : 'muted'}>
      {forcedClose ? t('shifts.forcedClose.yes') : t('shifts.forcedClose.no')}
    </Badge>
  )
}

export function ShiftExpenseStatusBadge({ status }: { status: ShiftExpenseStatus }) {
  const { t } = useTranslation()
  return (
    <Badge variant={getShiftExpenseStatusBadgeVariant(status)}>
      {getShiftExpenseStatusLabel(status, t)}
    </Badge>
  )
}
