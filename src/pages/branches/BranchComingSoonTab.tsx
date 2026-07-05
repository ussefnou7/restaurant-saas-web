import { useTranslation } from '../../i18n/useTranslation'

export function BranchComingSoonTab() {
  const { t } = useTranslation()

  return (
    <div className="detail-empty-state">
      <p className="detail-empty-state__title">{t('branchDetails.comingSoon.title')}</p>
      <p className="detail-empty-state__text">{t('branchDetails.comingSoon.text')}</p>
    </div>
  )
}
