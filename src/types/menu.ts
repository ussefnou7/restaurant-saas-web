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

export type RecipeItem = {
  id: number
  materialId: number
  materialName: string
  quantity: number
  uomId: number
  uomName: string
}

export type RecipeItemWrite = {
  materialId: number
  quantity: number
  uomId: number
}

export type ProductListParams = {
  menuCategoryId?: number
}
