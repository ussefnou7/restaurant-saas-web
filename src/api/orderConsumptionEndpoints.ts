export const ORDER_CONSUMPTION_BASE = '/api/inventory/order-consumption-docs'

export const orderConsumptionEndpoints = {
  list: ORDER_CONSUMPTION_BASE,
  byId: (id: number | string) => `${ORDER_CONSUMPTION_BASE}/${id}`,
  materialsSummary: (id: number | string) => `${ORDER_CONSUMPTION_BASE}/${id}/materials-summary`,
  recalculate: (id: number | string) => `${ORDER_CONSUMPTION_BASE}/${id}/recalculate`,
} as const
