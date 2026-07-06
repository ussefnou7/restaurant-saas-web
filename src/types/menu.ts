export type MenuCategory = {
  id: number
  name: string
  sortOrder: number
  active: boolean
}

export type CreateMenuCategoryRequest = {
  name: string
  sortOrder: number
  active: boolean
}

export type UpdateMenuCategoryRequest = CreateMenuCategoryRequest

export type Product = {
  id: number
  name: string
  description?: string | null
  sellingPrice: number
  active: boolean
  menuCategoryId: number
  menuCategoryName?: string | null
}

export type CreateProductRequest = {
  name: string
  description?: string | null
  sellingPrice: number
  menuCategoryId: number
}

export type UpdateProductRequest = CreateProductRequest

export type RecipeItemView = {
  materialId: number
  materialName: string
  quantity: number
  uomId: number
  uomName: string
}

export type Recipe = {
  id: number
  isActive: boolean
  createdAt: string
  items: RecipeItemView[]
}

export type RecipeItemRequest = {
  materialId: number
  quantity: number
  uomId: number
}

/** @deprecated Use RecipeItemRequest */
export type RecipeItemWrite = RecipeItemRequest

export type ProductListParams = {
  menuCategoryId?: number
}
