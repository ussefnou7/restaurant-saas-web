import { ClipboardList, Package, RotateCcw, Ruler, Tag, Trash2, Warehouse } from 'lucide-react'
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
    </div>
  )
}
