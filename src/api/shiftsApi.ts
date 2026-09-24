export const SHIFTS_API = {
  base: '/api/shifts',
  byId: (id: number | string) => `/api/shifts/${id}`,
  close: (id: number | string) => `/api/shifts/${id}/close`,
} as const
