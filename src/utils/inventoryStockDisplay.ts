import type { TranslationKey } from '../i18n/types'
import type {
  InventoryTransactionDirection,
  InventoryTransactionType,
  ManualTransactionType,
} from '../types/inventoryStock'

const TRANSACTION_TYPE_KEYS: Partial<Record<InventoryTransactionType, TranslationKey>> = {
  OPENING_BALANCE: 'inventory.stock.transactionType.OPENING_BALANCE',
  MANUAL_IN: 'inventory.stock.transactionType.MANUAL_IN',
  MANUAL_OUT: 'inventory.stock.transactionType.MANUAL_OUT',
  PURCHASE_IN: 'inventory.stock.transactionType.PURCHASE_IN',
  WASTE: 'inventory.stock.transactionType.WASTE',
  TRANSFER_IN: 'inventory.stock.transactionType.TRANSFER_IN',
  TRANSFER_OUT: 'inventory.stock.transactionType.TRANSFER_OUT',
  ORDER_CONSUMPTION: 'inventory.stock.transactionType.ORDER_CONSUMPTION',
  RETURN_TO_SUPPLIER: 'inventory.stock.transactionType.RETURN_TO_SUPPLIER',
  STOCKTAKE_ADJUSTMENT: 'inventory.stock.transactionType.STOCKTAKE_ADJUSTMENT',
}

const DIRECTION_KEYS: Record<InventoryTransactionDirection, TranslationKey> = {
  IN: 'inventory.stock.direction.IN',
  OUT: 'inventory.stock.direction.OUT',
}

export const MANUAL_TRANSACTION_TYPES: ManualTransactionType[] = [
  'OPENING_BALANCE',
  'MANUAL_IN',
  'MANUAL_OUT',
]

export function getTransactionTypeLabel(
  type: InventoryTransactionType,
  t: (key: TranslationKey) => string,
): string {
  const key = TRANSACTION_TYPE_KEYS[type]
  return key ? t(key) : type
}

export function getTransactionDirectionLabel(
  direction: InventoryTransactionDirection,
  t: (key: TranslationKey) => string,
): string {
  return t(DIRECTION_KEYS[direction])
}

/** ISO local datetime for API (no timezone suffix). */
export function toLocalDateTimeInputValue(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatStockQuantity(value: number, symbol?: string | null): string {
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
  return symbol ? `${formatted} ${symbol}` : formatted
}
