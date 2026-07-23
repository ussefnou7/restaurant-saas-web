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
  descriptionAr?: string | null
  sellingPrice: number
  active: boolean
  menuCategoryId: number
  menuCategoryName?: string | null
  parentProductId?: number | null
  variantLabel?: string | null
  variantLabelAr?: string | null
  isMenu: boolean
  /** Derived server-side: true iff another product references this one via parentProductId. */
  parent: boolean
  /** Older DTO name retained as optional compatibility for local fixtures/docs. */
  isParent?: boolean
  variantCount?: number | null
}

export type CreateProductRequest = {
  name: string
  description?: string | null
  descriptionAr?: string | null
  sellingPrice: number
  menuCategoryId: number
  parentProductId?: number | null
  variantLabel?: string | null
  variantLabelAr?: string | null
  isMenu?: boolean | null
}

export type UpdateProductRequest = CreateProductRequest

export type ProductAddOn = {
  id: number
  productId: number
  addOnProductId: number
  addOnProductName?: string | null
  addOnSellingPrice?: number | null
}

export type CreateProductAddOnRequest = {
  addOnProductId: number
}

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
