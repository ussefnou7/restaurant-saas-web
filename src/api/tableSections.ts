export const TABLE_SECTION_ENDPOINTS = {
  base: '/api/table-sections',
  byId: (id: number | string) => `/api/table-sections/${id}`,
  activate: (id: number | string) => `/api/table-sections/${id}/activate`,
  deactivate: (id: number | string) => `/api/table-sections/${id}/deactivate`,
}
