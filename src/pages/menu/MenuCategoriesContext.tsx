import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import * as menuService from '../../services/menuService'
import type { MenuCategory } from '../../types/menu'
import { translateApiError } from '../../utils/errors'
import { MenuCategoriesContext } from './useMenuCategories'

export function MenuCategoriesProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshCategories = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await menuService.getMenuCategories()
      setCategories(data)
      return data
    } catch (err) {
      const message = translateApiError(err, t).message
      setError(message)
      setCategories([])
      return []
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void refreshCategories()
  }, [refreshCategories])

  const value = useMemo(
    () => ({ categories, loading, error, refreshCategories }),
    [categories, loading, error, refreshCategories],
  )

  return <MenuCategoriesContext.Provider value={value}>{children}</MenuCategoriesContext.Provider>
}
