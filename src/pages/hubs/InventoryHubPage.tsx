import { useMemo } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Calculator,
  ClipboardList,
  Columns3,
  Package,
  RotateCcw,
  Ruler,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Warehouse,
} from 'lucide-react'
import {
  ModuleHubPage,
  type HubNavCardConfig,
  type HubNavChipConfig,
  type HubPanelConfig,
} from '../../components/hub/ModuleHubPage'
import { useTranslation } from '../../i18n/useTranslation'
import {
  canManageInventoryStock,
  canViewInventorySetup,
  canViewInventoryStock,
} from '../../utils/inventoryAccess'
import { InventoryAccessDenied } from '../inventory/InventoryAccessDenied'
import { buildInventoryHubUserPermissions } from './inventoryHubPermissions'

export function InventoryHubPage() {
  const { t } = useTranslation()
  const canView = canViewInventorySetup()
  const canViewStock = canViewInventoryStock()
  const canManageStock = canManageInventoryStock()
  const userPermissions = useMemo(() => buildInventoryHubUserPermissions(), [])

  if (!canView) return <InventoryAccessDenied />

  const cards: HubNavCardConfig[] = []

  if (userPermissions.materials.canView) {
    cards.push({
      id: 'materials',
      icon: Package,
      title: t('hubs.inventory.materials.title'),
      description: t('hubs.inventory.materials.description'),
      to: '/inventory/materials',
    })
  }

  cards.push({
    id: 'warehouses',
    icon: Warehouse,
    title: t('hubs.inventory.warehouses.title'),
    description: t('hubs.inventory.warehouses.description'),
    to: '/inventory/warehouses',
  })

  if (canViewStock) {
    cards.push({
      id: 'physical-counts',
      icon: ClipboardList,
      title: t('inventory.nav.physicalCounts'),
      description: t('hubs.inventory.physicalCounts.description'),
      to: '/inventory/physical-counts',
    })
  }

  if (canManageStock) {
    cards.push({
      id: 'order-consumption',
      icon: RotateCcw,
      title: t('orderConsumption.nav'),
      description: t('hubs.inventory.orderConsumption.description'),
      to: '/inventory/order-consumption',
    })
  }

  if (canViewStock) {
    cards.push({
      id: 'waste-documents',
      icon: Trash2,
      title: t('inventory.nav.wasteDocuments'),
      description: t('hubs.inventory.wasteDocuments.description'),
      to: '/inventory/waste-documents',
    })
  }

  cards.push({
    id: 'reports',
    icon: BarChart3,
    title: t('reports.hub.title'),
    description: t('hubs.inventory.reports.description'),
    to: '/inventory/reports',
  })

  const setupChips: HubNavChipConfig[] = []

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

  const panels: HubPanelConfig[] = [
    {
      id: 'reports',
      label: t('hubs.section.reports'),
      viewAll: { label: t('hubs.viewAll'), to: '/inventory/reports' },
      chips: [
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
          id: 'loss-comparison',
          icon: Columns3,
          title: t('reports.lossComparison'),
          to: '/inventory/reports/loss-comparison',
        },
        {
          id: 'purchase-price-drift',
          icon: TrendingUp,
          title: t('reports.purchasePriceDrift'),
          to: '/inventory/reports/purchase-price-drift',
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
          tone: 'warning',
        },
      ],
    },
    {
      id: 'setup',
      label: t('hubs.inventory.setupSection.title'),
      chips: setupChips,
    },
  ]

  return (
    <ModuleHubPage
      className="inventory-hub-page"
      title={t('hubs.inventory.title')}
      subtitle={t('hubs.inventory.subtitle')}
      cardsLabel={t('hubs.inventory.dailySection.title')}
      cards={cards}
      panels={panels}
    />
  )
}
