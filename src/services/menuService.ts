import axios from 'axios'
import type {
  CreateMenuCategoryRequest,
  CreateProductAddOnRequest,
  CreateProductRequest,
  MenuCategory,
  Product,
  ProductAddOn,
  ProductListParams,
  Recipe,
  RecipeItemRequest,
  UpdateMenuCategoryRequest,
  UpdateProductRequest,
} from '../types/menu'
import { getApiErrorCode } from '../utils/errors'
import { api } from './api'

function isRecipeNotFound(error: unknown): boolean {
  if (axios.isAxiosError(error) && error.response?.status === 404) return true
  return getApiErrorCode(error) === 'RECIPE_NOT_FOUND'
}

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

export async function getProductVariants(parentProductId: number | string): Promise<Product[]> {
  const response = await api.get<Product[]>(`/api/menu/products/${parentProductId}/variants`)
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

export async function getProductRecipes(productId: number | string): Promise<Recipe[]> {
  const response = await api.get<Recipe[]>(`/api/menu/products/${productId}/recipes`)
  return response.data
}

export async function getActiveProductRecipe(productId: number | string): Promise<Recipe | null> {
  try {
    const response = await api.get<Recipe>(`/api/menu/products/${productId}/recipes/active`, {
      notifyOnError: false,
    })
    return response.data
  } catch (error) {
    if (isRecipeNotFound(error)) return null
    throw error
  }
}

export async function getRecipe(recipeId: number | string): Promise<Recipe> {
  const response = await api.get<Recipe>(`/api/menu/recipes/${recipeId}`)
  return response.data
}

export async function createProductRecipe(
  productId: number | string,
  items: RecipeItemRequest[],
): Promise<Recipe> {
  const response = await api.post<Recipe>(`/api/menu/products/${productId}/recipes`, items)
  return response.data
}

export async function getProductAddOns(productId: number | string): Promise<ProductAddOn[]> {
  const response = await api.get<ProductAddOn[]>(`/api/menu/products/${productId}/add-ons`)
  return response.data
}

export async function createProductAddOn(
  productId: number | string,
  payload: CreateProductAddOnRequest,
): Promise<ProductAddOn> {
  const response = await api.post<ProductAddOn>(`/api/menu/products/${productId}/add-ons`, payload)
  return response.data
}

export async function deleteProductAddOn(
  productId: number | string,
  addOnProductId: number | string,
): Promise<void> {
  await api.delete(`/api/menu/products/${productId}/add-ons/${addOnProductId}`)
}
