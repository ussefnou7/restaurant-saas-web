import type { ExpenseCategoryResponse, ExpenseResponse } from '../types/expense'

export function getExpenseCategoryDisplayName(
  category:
    | ExpenseCategoryResponse
    | { name: string; nameAr?: string | null }
    | { categoryName: string; categoryNameAr?: string | null }
    | ExpenseResponse,
  locale: string,
): string {
  if (locale === 'ar') {
    if ('categoryNameAr' in category && category.categoryNameAr?.trim()) {
      return category.categoryNameAr.trim()
    }
    if ('nameAr' in category && category.nameAr?.trim()) {
      return category.nameAr.trim()
    }
  }
  if ('categoryName' in category && category.categoryName) {
    return category.categoryName
  }
  if ('name' in category && category.name) {
    return category.name
  }
  return ''
}
