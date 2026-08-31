import type { Locale } from '../i18n/types'

export type MenuCategoryNameFields = {
  name: string
  nameAr?: string | null
}

export function getLocalizedMenuCategoryName(
  category: MenuCategoryNameFields,
  locale: Locale,
): string {
  if (locale === 'ar') {
    return category.nameAr?.trim() || category.name
  }
  return category.name
}
