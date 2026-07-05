import type {
  CreateMenuCategoryRequest,
  CreateProductRequest,
  MenuCategory,
  Product,
  ProductListParams,
  RecipeItem,
  RecipeItemWrite,
  UpdateMenuCategoryRequest,
  UpdateProductRequest,
} from '../types/menu'
import { api } from './api'

function toSearchParams(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function getMenuCategories(): Promise<MenuCategory[]> {
  const response = await api.get<MenuCategory[]>('/api/menu/categories')
  return response.data
}

export async function createMenuCategory(payload: CreateMenuCategoryRequest): Promise<MenuCategory> {
  const response = await api.post<MenuCategory>('/api/menu/categories', payload)
  return response.data
}

export async function updateMenuCategory(
  id: number | string,
  payload: UpdateMenuCategoryRequest,
): Promise<MenuCategory> {
  const response = await api.put<MenuCategory>(`/api/menu/categories/${id}`, payload)
  return response.data
}

export async function deleteMenuCategory(id: number | string): Promise<void> {
  await api.delete(`/api/menu/categories/${id}`, { notifyOnError: false })
}

export async function getProducts(params: ProductListParams = {}): Promise<Product[]> {
  const response = await api.get<Product[]>(
    `/api/menu/products${toSearchParams({ menuCategoryId: params.menuCategoryId })}`,
  )
  return response.data
}

export async function getProduct(id: number | string): Promise<Product> {
  const response = await api.get<Product>(`/api/menu/products/${id}`)
  return response.data
}

export async function createProduct(payload: CreateProductRequest): Promise<Product> {
  const response = await api.post<Product>('/api/menu/products', payload)
  return response.data
}

export async function updateProduct(
  id: number | string,
  payload: UpdateProductRequest,
): Promise<Product> {
  const response = await api.put<Product>(`/api/menu/products/${id}`, payload)
  return response.data
}

export async function deleteProduct(id: number | string): Promise<void> {
  await api.delete(`/api/menu/products/${id}`)
}

export async function toggleProductActive(id: number | string): Promise<Product> {
  const response = await api.patch<Product>(`/api/menu/products/${id}/toggle-active`)
  return response.data
}

export async function getProductRecipe(productId: number | string): Promise<RecipeItem[]> {
  const response = await api.get<RecipeItem[]>(`/api/menu/products/${productId}/recipe`)
  return response.data
}

export async function replaceProductRecipe(
  productId: number | string,
  items: RecipeItemWrite[],
): Promise<RecipeItem[]> {
  const response = await api.put<RecipeItem[]>(`/api/menu/products/${productId}/recipe`, items)
  return response.data
}
