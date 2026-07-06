import { Banknote, Briefcase, CalendarDays, UserRound } from 'lucide-react'
import { ModuleHubPage } from '../../components/hub/ModuleHubPage'
import { useTranslation } from '../../i18n/useTranslation'

export function HrHubPage() {
  const { t } = useTranslation()

  return (
    <ModuleHubPage
      className="hr-hub-page"
      title={t('hubs.hr.title')}
      subtitle={t('hubs.hr.subtitle')}
      cards={[
        {
          id: 'employees',
          icon: UserRound,
          title: t('hubs.hr.employees.title'),
          to: '/hr/employees',
        },
        {
          id: 'jobs',
          icon: Briefcase,
          title: t('hubs.hr.jobs.title'),
          to: '/hr/jobs',
        },
        {
          id: 'payroll',
          icon: Banknote,
          title: t('hubs.hr.payroll.title'),
          to: '/hr/employees',
        },
        {
          id: 'leaves',
          icon: CalendarDays,
          title: t('hubs.hr.leaves.title'),
          to: '/hr/leave-requests',
        },
      ]}
    />
  )
}
