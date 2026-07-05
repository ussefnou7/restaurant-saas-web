import { Button } from '../../../components/ui/Button'
import { DetailsField, DetailsSection } from '../../../components/ui/DetailsSection'
import { SideDrawer } from '../../../components/ui/SideDrawer'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { CompactDateCell } from '../../../components/ui/CompactDateCell'
import { useTranslation } from '../../../i18n/useTranslation'
import type { JobResponse } from '../../../types/job'

interface JobDetailsDrawerProps {
  open: boolean
  job: JobResponse | null
  onClose: () => void
  onEdit: () => void
  onToggleStatus: () => void
  statusBusy?: boolean
}

export function JobDetailsDrawer({
  open,
  job,
  onClose,
  onEdit,
  onToggleStatus,
  statusBusy,
}: JobDetailsDrawerProps) {
  const { t } = useTranslation()

  if (!job) return null

  const footer = (
    <div className="entity-details-actions">
      <Button variant="primary" onClick={onEdit}>
        {t('common.edit')}
      </Button>
      <Button variant="secondary" onClick={onToggleStatus} disabled={statusBusy}>
        {job.active ? t('common.deactivate') : t('common.activate')}
      </Button>
    </div>
  )

  return (
    <SideDrawer
      open={open}
      title={job.name}
      subtitle={job.code}
      onClose={onClose}
      headerExtra={<StatusBadge active={job.active} />}
      footer={footer}
    >
      <DetailsSection title={t('common.information')}>
        <DetailsField label={t('common.fields.code')} value={job.code} ltr />
        <DetailsField label={t('common.status')} value={<StatusBadge active={job.active} />} />
        <DetailsField
          label={t('common.description')}
          value={job.description?.trim() || t('common.empty.dash')}
        />
        <DetailsField label={t('common.createdAt')} value={<CompactDateCell value={job.createdAt} />} />
        <DetailsField label={t('common.updatedAt')} value={<CompactDateCell value={job.updatedAt} />} />
      </DetailsSection>
    </SideDrawer>
  )
}
