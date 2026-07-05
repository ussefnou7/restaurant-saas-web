export const INVENTORY_STOCK_REFRESH_EVENT = 'inventory:stock-refresh'

export function notifyStockBalancesRefresh(): void {
  window.dispatchEvent(new CustomEvent(INVENTORY_STOCK_REFRESH_EVENT))
}
