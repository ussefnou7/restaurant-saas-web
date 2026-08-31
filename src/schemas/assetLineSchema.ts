import type { LineSchema, LineSchemaDeps } from '../types/lineSchema'
import type { BranchResponse } from '../types/branch'
import type { AssetStatus } from '../types/assets'
import { formatAssetLineLabel } from '../utils/assetDisplay'

export interface AssetLineFormState {
  id?: number
  label?: string
  quantity: string
  remainingQuantity?: string
  unitCost: string
  purchaseDate: string
  status?: AssetStatus
  hasOperations?: boolean
}

export interface AssetLineLookups {
  branches: BranchResponse[]
}

export function createAssetLineSchema(
  deps: LineSchemaDeps<AssetLineFormState, AssetLineLookups>,
): LineSchema<AssetLineFormState, AssetLineLookups> {
  const { handlers, t } = deps

  return {
    tableClassName: 'asset-lines-table',
    actionsIconOnly: true,
    fields: [
      {
        id: 'label',
        key: 'label',
        labelKey: 'assets.lines.label',
        type: 'text',
        readOnly: (ctx) => !ctx.isNew,
        showIn: ['grid', 'form'],
        tableWidth: '32%',
        columnClass: 'asset-lines-col--label',
        format: (value, ctx) =>
          formatAssetLineLabel(String(value ?? ''), Number(ctx.line.id), t),
      },
      {
        id: 'quantity',
        key: 'quantity',
        labelKey: 'assets.lines.quantity',
        type: 'number',
        readOnly: (ctx) => !ctx.isNew,
        required: true,
        min: 0,
        dir: 'ltr',
        showIn: ['grid', 'form'],
        tableWidth: '10%',
        columnClass: 'asset-lines-col--qty',
        validate: (val) =>
          !String(val ?? '').trim() || Number.isNaN(Number(val)) || Number(val) <= 0
            ? 'assets.lines.validation.quantityRequired'
            : null,
      },
      {
        id: 'remaining-quantity',
        key: 'remainingQuantity',
        labelKey: 'assets.lines.remainingQuantity',
        type: 'display',
        dir: 'ltr',
        showIn: ['grid', 'form'],
        tableWidth: '10%',
        columnClass: 'asset-lines-col--rem',
        format: (value, ctx) =>
          ctx.isNew ? String(ctx.line.quantity || '—') : String(value ?? '—'),
      },
      {
        id: 'unit-cost',
        key: 'unitCost',
        labelKey: 'assets.lines.unitCost',
        type: 'money',
        readOnly: (ctx) => !ctx.isNew,
        required: true,
        dir: 'ltr',
        showIn: ['grid', 'form'],
        tableWidth: '13%',
        columnClass: 'asset-lines-col--cost',
        validate: (val) =>
          !String(val ?? '').trim() || Number.isNaN(Number(val)) || Number(val) <= 0
            ? 'assets.lines.validation.unitCostRequired'
            : null,
      },
      {
        id: 'purchase-date',
        key: 'purchaseDate',
        labelKey: 'assets.lines.purchaseDate',
        type: 'date',
        readOnly: (ctx) => !ctx.isNew,
        required: true,
        showIn: ['grid', 'form'],
        tableWidth: '14%',
        columnClass: 'asset-lines-col--date',
        validate: (val) => (!val ? 'assets.lines.validation.purchaseDateRequired' : null),
      },
      {
        id: 'status',
        key: 'status',
        labelKey: 'common.status',
        type: 'badge',
        showIn: ['grid', 'form'],
        tableWidth: '10%',
      },
    ],
    actions: [
      {
        key: 'maintenance',
        labelKey: 'assets.maintenance.action',
        icon: 'Wrench',
        onClick: (line) => handlers.onMaintenanceLine?.(line),
      },
      {
        key: 'dispose',
        labelKey: 'assets.disposal.action',
        icon: 'PackageX',
        onClick: (line) => handlers.onDisposeLine?.(line),
      },
      {
        key: 'delete',
        labelKey: 'common.delete',
        icon: 'Trash2',
        variant: 'danger',
        disabled: (line) => line.status !== 'ACTIVE' || Boolean(line.hasOperations),
        disabledReasonKey: (line) =>
          line.hasOperations ? 'assets.lines.cannotDeleteWithOperations' : undefined,
        onClick: (line) => handlers.onDeleteLine?.(line),
      },
    ],
  }
}
