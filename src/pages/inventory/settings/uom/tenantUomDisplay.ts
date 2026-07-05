import type { UomType } from '../../../../types/inventory'

const UOM_TYPE_LABELS: Record<UomType, string> = {
  WEIGHT: 'وزن',
  VOLUME: 'حجم',
  COUNT: 'عدد',
  LENGTH: 'طول',
}

export function getTenantUomTypeLabel(type?: UomType | null): string {
  if (!type) return '—'
  return UOM_TYPE_LABELS[type] ?? type
}

export function isGlobalUom(tenantId?: number | null): boolean {
  return tenantId == null
}

export const TENANT_UOM_TYPES: UomType[] = ['WEIGHT', 'VOLUME', 'COUNT', 'LENGTH']
