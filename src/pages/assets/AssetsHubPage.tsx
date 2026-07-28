import { BarChart3, Landmark, Package, Wrench } from 'lucide-react'
import { HubNavCard } from '../../components/hub/HubNavCard'
import { HubNavChip } from '../../components/hub/HubNavChip'
import { ListPage } from '../../components/ui/ListPage'
import { PageHeader } from '../../components/ui/PageHeader'
import { useTranslation } from '../../i18n/useTranslation'

export function AssetsHubPage() {
  const { t } = useTranslation()

  const cards = [
    {
      id: 'assets',
      icon: Landmark,
      title: t('assets.hub.assets'),
      to: '/assets/list',
    },
    {
      id: 'disposals',
      icon: Package,
      title: t('assets.disposals.nav'),
      to: '/assets/disposals',
    },
    {
      id: 'maintenance',
      icon: Wrench,
      title: t('assets.maintenanceList.nav'),
      to: '/assets/maintenance',
    },
  ]

  const reportChip = {
    id: 'reports',
    icon: BarChart3,
    title: t('assets.list.reports'),
    to: '/assets/reports',
  }

  return (
    <ListPage className="assets-page assets-hub-page">
      <PageHeader title={t('assets.list.title')} description={t('assets.list.subtitle')} />

      <div className="hub-sections">
        <div className="hub-nav-card-grid hub-nav-card-grid--assets">
          {cards.map((card) => (
            <HubNavCard key={card.id} {...card} />
          ))}
        </div>

        <section
          className="hub-setup-section"
          aria-labelledby="assets-hub-reports-heading"
        >
          <div className="hub-setup-section__divider">
            <h2 id="assets-hub-reports-heading" className="hub-setup-section__label">
              {t('assets.hub.reportsSection')}
            </h2>
          </div>
          <div className="hub-nav-chip-row">
            <HubNavChip {...reportChip} />
          </div>
        </section>
      </div>
    </ListPage>
  )
}
