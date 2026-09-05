import api from './api'
import { EXPENSES_API } from '../api/expensesApi'
import type {
  CreateExpenseRequest,
  ExpenseCategoryRequest,
  ExpenseCategoryResponse,
  ExpenseListParams,
  ExpensePageResponse,
  ExpenseResponse,
  VoidExpenseRequest,
} from '../types/expense'

export async function getExpenses(params?: ExpenseListParams): Promise<ExpensePageResponse> {
  const queryParams: Record<string, unknown> = {}

  if (params) {
    if (params.unbranchedOnly) {
      queryParams.unbranchedOnly = true
    } else if (params.branchId != null) {
      queryParams.branchId = params.branchId
    }

    if (params.categoryId != null) {
      queryParams.categoryId = params.categoryId
    }
    if (params.dateFrom) {
      queryParams.dateFrom = params.dateFrom
    }
    if (params.dateTo) {
      queryParams.dateTo = params.dateTo
    }
    if (params.paymentSource) {
      queryParams.paymentSource = params.paymentSource
    }
    if (params.status) {
      queryParams.status = params.status
    }
    if (params.search && params.search.trim()) {
      queryParams.search = params.search.trim()
    }
    if (params.page != null) {
      queryParams.page = params.page
    }
    if (params.size != null) {
      queryParams.size = params.size
    }
    if (params.sort) {
      queryParams.sort = params.sort
    }
  }

  const { data } = await api.get<ExpensePageResponse>(EXPENSES_API.base, {
    params: queryParams,
  })
  return data
}

export async function getExpenseById(id: number | string): Promise<ExpenseResponse> {
  const { data } = await api.get<ExpenseResponse>(EXPENSES_API.byId(id))
  return data
}

export async function createExpense(payload: CreateExpenseRequest): Promise<ExpenseResponse> {
  const { data } = await api.post<ExpenseResponse>(EXPENSES_API.base, payload)
  return data
}

export async function voidExpense(
  id: number | string,
  payload: VoidExpenseRequest,
): Promise<ExpenseResponse> {
  const { data } = await api.post<ExpenseResponse>(EXPENSES_API.void(id), payload)
  return data
}

export async function getExpenseCategories(): Promise<ExpenseCategoryResponse[]> {
  const { data } = await api.get<ExpenseCategoryResponse[]>(EXPENSES_API.categories)
  return data
}

export async function createExpenseCategory(
  payload: ExpenseCategoryRequest,
): Promise<ExpenseCategoryResponse> {
  const { data } = await api.post<ExpenseCategoryResponse>(EXPENSES_API.categories, payload)
  return data
}

export async function updateExpenseCategory(
  id: number | string,
  payload: ExpenseCategoryRequest,
): Promise<ExpenseCategoryResponse> {
  const { data } = await api.put<ExpenseCategoryResponse>(EXPENSES_API.categoryById(id), payload)
  return data
}

export async function activateExpenseCategory(
  id: number | string,
): Promise<ExpenseCategoryResponse> {
  const { data } = await api.patch<ExpenseCategoryResponse>(EXPENSES_API.activateCategory(id))
  return data
}

export async function deactivateExpenseCategory(
  id: number | string,
): Promise<ExpenseCategoryResponse> {
  const { data } = await api.patch<ExpenseCategoryResponse>(EXPENSES_API.deactivateCategory(id))
  return data
}
