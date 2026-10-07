export const DASHBOARD_ENDPOINTS = {
  summary: '/api/dashboard/summary',
  /** No date range — alerts describe now, which is why they are a separate endpoint. */
  alerts: '/api/dashboard/alerts',
} as const
