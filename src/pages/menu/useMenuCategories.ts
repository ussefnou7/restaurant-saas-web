import { createContext, useContext } from 'react'
import type { MenuCategory } from '../../types/menu'

export type MenuCategoriesContextValue = {
  categories: MenuCategory[]
  loading: boolean
  error: string
  refreshCategories: () => Promise<MenuCategory[]>
}

export const MenuCategoriesContext = createContext<MenuCategoriesContextValue | null>(null)

export function useMenuCategories() {
  const context = useContext(MenuCategoriesContext)
  if (!context) {
    throw new Error('useMenuCategories must be used within MenuCategoriesProvider')
  }
  return context
}
