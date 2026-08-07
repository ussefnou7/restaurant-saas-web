import {
  AlertTriangle,
  BarChart3,
  Calculator,
  ClipboardList,
  Package,
  RotateCcw,
  Ruler,
  Tag,
  Trash2,
  TrendingDown,
  Warehouse,
} from 'lucide-react'
import { HubNavCard } from '../../components/hub/HubNavCard'
import { HubNavChip } from '../../components/hub/HubNavChip'
import { useTranslation } from '../../i18n/useTranslation'
import { canManageInventoryStock, canViewInventoryStock } from '../../utils/inventoryAccess'
import type { InventoryHubUserPermissions } from './inventoryHubPermissions'

export interface InventoryHubSectionsProps {
  userPermissions: InventoryHubUserPermissions
}

export function InventoryHubSections({ userPermissions }: InventoryHubSectionsProps) {
  const { t } = useTranslation()
  const canViewStock = canViewInventoryStock()
  const canManageStock = canManageInventoryStock()

  const setupChips = []

  if (userPermissions.categories.canEdit) {
    setupChips.push({
      id: 'categories',
      icon: Tag,
      title: t('hubs.inventory.categories.title'),
      to: '/inventory/material-categories',
    })
  }

  if (userPermissions.uom.canEdit) {
    setupChips.push({
      id: 'uoms',
      icon: Ruler,
      title: t('hubs.inventory.uoms.title'),
      to: '/inventory/settings/uom',
    })
  }

  const reportChips = [
    {
      id: 'shrinkage',
      icon: TrendingDown,
      title: t('reports.shrinkage'),
      to: '/inventory/reports/shrinkage',
    },
    {
      id: 'waste-analysis',
      icon: Trash2,
      title: t('reports.wasteAnalysis'),
      to: '/inventory/reports/waste-analysis',
    },
    {
      id: 'stock-valuation',
      icon: Calculator,
      title: t('reports.stockValuation'),
      to: '/inventory/reports/stock-valuation',
    },
    {
      id: 'low-stock',
      icon: AlertTriangle,
      title: t('reports.lowStock'),
      to: '/inventory/reports/low-stock',
    },
  ]

  return (
    <div className="hub-sections">
      <div className="hub-nav-card-grid hub-nav-card-grid--inventory">
        {userPermissions.materials.canView ? (
          <HubNavCard
            id="materials"
            icon={Package}
            title={t('hubs.inventory.materials.title')}
            to="/inventory/materials"
          />
        ) : null}
        <HubNavCard
          id="warehouses"
          icon={Warehouse}
          title={t('hubs.inventory.warehouses.title')}
          to="/inventory/warehouses"
        />
        {canViewStock ? (
          <HubNavCard
            id="physical-counts"
            icon={ClipboardList}
            title={t('inventory.nav.physicalCounts')}
            to="/inventory/physical-counts"
          />
        ) : null}
        {canManageStock ? (
          <HubNavCard
            id="order-consumption"
            icon={RotateCcw}
            title={t('orderConsumption.nav')}
            to="/inventory/order-consumption"
          />
        ) : null}
        {canViewStock ? (
          <HubNavCard
            id="waste-documents"
            icon={Trash2}
            title={t('inventory.nav.wasteDocuments')}
            to="/inventory/waste-documents"
          />
        ) : null}
        <HubNavCard
          id="reports"
          icon={BarChart3}
          title={t('reports.hub.title')}
          to="/inventory/reports"
        />
      </div>

      {setupChips.length > 0 ? (
        <section
          className="hub-setup-section"
          aria-labelledby="inventory-hub-setup-heading"
        >
          <div className="hub-setup-section__divider">
            <h2 id="inventory-hub-setup-heading" className="hub-setup-section__label">
              {t('hubs.inventory.setupSection.title')}
            </h2>
          </div>
          <div className="hub-nav-chip-row">
            {setupChips.map((chip) => (
              <HubNavChip key={chip.id} {...chip} />
            ))}
          </div>
        </section>
      ) : null}

      <section
        className="hub-setup-section"
        aria-labelledby="inventory-hub-reports-heading"
      >
        <div className="hub-setup-section__divider">
          <h2 id="inventory-hub-reports-heading" className="hub-setup-section__label">
            {t('reports.hub.title')}
          </h2>
        </div>
        <div className="hub-nav-chip-row">
          {reportChips.map((chip) => (
            <HubNavChip key={chip.id} {...chip} />
          ))}
        </div>
      </section>
    </div>
  )
}

