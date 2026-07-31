export const TABLE_ENDPOINTS = {
  base: '/api/tables',
  byId: (id: number | string) => `/api/tables/${id}`,
  activate: (id: number | string) => `/api/tables/${id}/activate`,
  deactivate: (id: number | string) => `/api/tables/${id}/deactivate`,
  layout: (id: number | string) => `/api/tables/${id}/layout`,
}
