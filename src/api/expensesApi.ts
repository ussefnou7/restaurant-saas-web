export const EXPENSES_API = {
  base: '/api/expenses',
  selectableShifts: '/api/expenses/selectable-shifts',
  byId: (id: number | string) => `/api/expenses/${id}`,
  void: (id: number | string) => `/api/expenses/${id}/void`,
  categories: '/api/expense-categories',
  categoryById: (id: number | string) => `/api/expense-categories/${id}`,
  activateCategory: (id: number | string) => `/api/expense-categories/${id}/activate`,
  deactivateCategory: (id: number | string) => `/api/expense-categories/${id}/deactivate`,
} as const
