export type UomType = 'WEIGHT' | 'VOLUME' | 'COUNT' | 'LENGTH'

export type UomResponse = {
  id: number
  code: string
  name: string
  nameEn?: string | null
  nameAr?: string | null
  symbol?: string
  type?: UomType
  baseCode?: string
  baseUomId?: number | null
  factorToBase?: number
  active: boolean
  sortOrder?: number | null
  tenantId?: number | null
}

export type CreateTenantUomRequest = {
  code: string
  name: string
  nameAr?: string | null
  symbol: string
  type: UomType
  baseUom: number
  factorToBase: number
}

export type MaterialCategoryResponse = {
  id: number
  code: string
  name: string
  nameEn?: string | null
  nameAr?: string | null
  global: boolean
  active: boolean
  sortOrder?: number | null
  createdAt?: string
  updatedAt?: string
}

export type CreateMaterialCategoryRequest = {
  code: string
  name: string
  nameAr?: string | null
  active: boolean
  sortOrder?: number | null
}

export type UpdateMaterialCategoryRequest = CreateMaterialCategoryRequest

export type MaterialCatalogResponse = {
  id: number
  code: string
  name: string
  nameAr?: string | null
  categoryId: number
  categoryName?: string | null
  stockUomId?: number
  stockUomName?: string | null
  stockUomCode?: string | null
  stockUomSymbol?: string | null
  displayUomId?: number
  displayUomName?: string | null
  displayUomCode?: string | null
  displayUomSymbol?: string | null
  /** Legacy API field; treated as stock UOM when stockUomId is absent */
  defaultUomId?: number
  defaultUomName?: string | null
  defaultUomCode?: string | null
  defaultUomSymbol?: string | null
  active: boolean
  alreadyImported?: boolean
  importedMaterialId?: number | null
}

export type MaterialResponse = {
  id: number
  code: string
  name: string
  nameAr?: string | null
  categoryId: number
  categoryName?: string | null
  stockUomId?: number
  stockUomName?: string | null
  stockUomCode?: string | null
  stockUomSymbol?: string | null
  displayUomId?: number
  displayUomName?: string | null
  displayUomCode?: string | null
  displayUomSymbol?: string | null
  /** Legacy API field; treated as stock UOM when stockUomId is absent */
  defaultUomId?: number
  defaultUomName?: string | null
  defaultUomCode?: string | null
  defaultUomSymbol?: string | null
  minimumStockLevel?: number | null
  catalogId?: number | null
  active: boolean
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export type CreateMaterialRequest = {
  code: string
  name: string
  nameAr?: string | null
  categoryId: number
  stockUomId: number
  displayUomId: number
  minimumStockLevel?: number | null
  active: boolean
  notes?: string | null
}

export type UpdateMaterialRequest = CreateMaterialRequest

export type ImportMaterialsRequest = {
  catalogIds: number[]
}

export type ImportMaterialsSkippedItem = {
  catalogId: number
  code?: string | null
  name?: string | null
  reason: string
}

export type ImportMaterialsResponse = {
  requestedCount: number
  createdCount: number
  skippedCount: number
  skippedMaterials: ImportMaterialsSkippedItem[]
}

export type WarehouseType =
  | 'CENTRAL'
  | 'BRANCH'
  | 'KITCHEN'
  | 'FREEZER'
  | 'BAR'
  | 'OTHER'

export type WarehouseResponse = {
  id: number
  code: string
  name: string
  nameAr?: string | null
  type: WarehouseType
  branchId?: number | null
  branchName?: string | null
  active: boolean
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export type CreateWarehouseRequest = {
  code: string
  name: string
  nameAr?: string | null
  type: WarehouseType
  branchId?: number | null
  active: boolean
  notes?: string | null
}

export type UpdateWarehouseRequest = CreateWarehouseRequest

export type SupplierResponse = {
  id: number
  code: string
  name: string
  nameAr?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  taxNumber?: string | null
  active: boolean
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export type CreateSupplierRequest = {
  code: string
  name: string
  nameAr?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  taxNumber?: string | null
  active: boolean
  notes?: string | null
}

export type UpdateSupplierRequest = CreateSupplierRequest

export type InventoryListParams = {
  search?: string
  active?: boolean
}

export type MaterialCatalogListParams = {
  search?: string
  categoryId?: number | string
  uomId?: number | string
  active?: boolean
}

export type MaterialListParams = InventoryListParams & {
  categoryId?: number | string
  defaultUomId?: number | string
  stockUomId?: number | string
  displayUomId?: number | string
  catalogId?: number | string
}

export type WarehouseListParams = InventoryListParams & {
  branchId?: number | string
  type?: WarehouseType | ''
}

// Admin inventory types (AdminInventoryCatalogController /uoms)
export type CreateUomRequest = {
  code: string
  name: string
  nameAr?: string | null
  symbol: string
  type: UomType
  baseCode: string
  factorToBase: number
  active?: boolean
  sortOrder?: number | null
}

export type UpdateUomRequest = CreateUomRequest

export type AdminMaterialCategoryResponse = MaterialCategoryResponse

export type CreateAdminMaterialCategoryRequest = {
  code: string
  name: string
  nameAr?: string | null
  active: boolean
  sortOrder?: number | null
}

export type UpdateAdminMaterialCategoryRequest = CreateAdminMaterialCategoryRequest

export type AdminMaterialCatalogListParams = {
  search?: string
  categoryId?: number | string
  uomId?: number | string
  active?: boolean
}

export type CreateAdminMaterialCatalogRequest = {
  code: string
  name: string
  nameAr?: string | null
  categoryId: number
  stockUomId: number
  displayUomId: number
  active: boolean
}

export type UpdateAdminMaterialCatalogRequest = CreateAdminMaterialCatalogRequest

/** Matches backend {@code InventorySeedSummaryResponse} */
export type InventorySeedSummaryResponse = {
  createdCount: number
  updatedCount: number
  skippedCount: number
  messages: string[]
}

/** @deprecated Use InventorySeedSummaryResponse */
export type InventorySeedResponse = InventorySeedSummaryResponse

export type AdminUomListParams = {
  type?: 'WEIGHT' | 'VOLUME' | 'COUNT'
  active?: boolean
}
