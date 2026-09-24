import { useTranslation } from '../i18n/useTranslation'
import { PageHeader } from './ui/PageHeader'

interface AccessDeniedProps {
  /** `checking` covers the moment before a restored session has been verified against `/me`. */
  variant: 'denied' | 'checking'
}

/**
 * What a route renders instead of a screen the user may not open. Deliberately a full page rather
 * than a redirect: a redirect to the dashboard looks like the navigation simply failed, and the
 * user retries it.
 */
export function AccessDenied({ variant }: AccessDeniedProps) {
  const { t } = useTranslation()

  if (variant === 'checking') {
    return (
      <div className="page">
        <div className="card list-page-card">
          <div className="list-card-body">
            <p className="empty-state-text">{t('access.checking')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader title={t('access.denied.title')} description={t('access.denied.subtitle')} />
      <div className="card list-page-card">
        <div className="list-card-body">
          <p className="empty-state-text">{t('access.denied.message')}</p>
        </div>
      </div>
    </div>
  )
}
