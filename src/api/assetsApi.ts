export const ASSETS_API = {
  base: '/api/assets',
  byId: (id: number | string) => `/api/assets/${id}`,
  lines: (assetId: number | string) => `/api/assets/${assetId}/lines`,
  lineById: (assetId: number | string, lineId: number | string) =>
    `/api/assets/${assetId}/lines/${lineId}`,
  disposals: (assetId: number | string, lineId: number | string) =>
    `/api/assets/${assetId}/lines/${lineId}/disposals`,
  maintenance: (assetId: number | string, lineId: number | string) =>
    `/api/assets/${assetId}/lines/${lineId}/maintenance`,
  summaryReport: '/api/assets/reports/summary',
  disposalsReport: '/api/assets/reports/disposals',
} as const
