import type {
  CreateMaterialCategoryRequest,
  CreateMaterialRequest,
  CreateSupplierRequest,
  CreateWarehouseRequest,
  ImportMaterialsRequest,
  ImportMaterialsResponse,
  MaterialCatalogListParams,
  MaterialCatalogResponse,
  MaterialCategoryResponse,
  MaterialListParams,
  MaterialResponse,
  SupplierResponse,
  UomResponse,
  UpdateMaterialCategoryRequest,
  UpdateMaterialRequest,
  UpdateSupplierRequest,
  UpdateWarehouseRequest,
  WarehouseListParams,
  WarehouseResponse,
  InventoryListParams,
} from '../types/inventory'
import type {
  AddMaterialToWarehouseRequest,
  UpdateStockSettingsRequest,
  WarehouseStockListParams,
  WarehouseStockResponse,
} from '../types/inventoryStock'
import { api } from './api'
import { authService } from './authService'

function toSearchParams(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

// UOMs — tenant global + custom (GET /api/uom)
export async function getUoms(activeOnly = true): Promise<UomResponse[]> {
  const response = await api.get<UomResponse[]>('/api/uom')
  const data = response.data
  return activeOnly ? data.filter((uom) => uom.active) : data
}

// Material categories (tenant-accessible: global + custom)
export async function getMaterialCategories(
  params: InventoryListParams = {},
): Promise<MaterialCategoryResponse[]> {
  const response = await api.get<MaterialCategoryResponse[]>(
    `/api/inventory/material-categories${toSearchParams({
      search: params.search,
      active: params.active,
    })}`,
  )
  return response.data
}

// Global material categories (for catalog import filters)
export async function getGlobalMaterialCategories(
  params: InventoryListParams = {},
): Promise<MaterialCategoryResponse[]> {
  const response = await api.get<MaterialCategoryResponse[]>(
    `/api/inventory/global-material-categories${toSearchParams({
      search: params.search,
      active: params.active,
    })}`,
  )
  return response.data
}

export async function createMaterialCategory(
  payload: CreateMaterialCategoryRequest,
): Promise<MaterialCategoryResponse> {
  const response = await api.post<MaterialCategoryResponse>(
    '/api/inventory/material-categories',
    payload,
  )
  return response.data
}

export async function updateMaterialCategory(
  id: number | string,
  payload: UpdateMaterialCategoryRequest,
): Promise<MaterialCategoryResponse> {
  const response = await api.put<MaterialCategoryResponse>(
    `/api/inventory/material-categories/${id}`,
    payload,
  )
  return response.data
}

export async function activateMaterialCategory(
  id: number | string,
): Promise<MaterialCategoryResponse> {
  const response = await api.patch<MaterialCategoryResponse>(
    `/api/inventory/material-categories/${id}/activate`,
  )
  return response.data
}

export async function deactivateMaterialCategory(
  id: number | string,
): Promise<MaterialCategoryResponse> {
  const response = await api.patch<MaterialCategoryResponse>(
    `/api/inventory/material-categories/${id}/deactivate`,
  )
  return response.data
}

// Global material catalog (ready-made materials for tenant import)
export async function getMaterialCatalog(
  params: MaterialCatalogListParams = {},
): Promise<MaterialCatalogResponse[]> {
  const response = await api.get<MaterialCatalogResponse[]>(
    `/api/inventory/global-materials${toSearchParams({
      search: params.search,
      categoryId: params.categoryId,
      uomId: params.uomId,
      active: params.active ?? true,
    })}`,
  )
  return response.data
}

export async function importMaterials(
  payload: ImportMaterialsRequest,
): Promise<ImportMaterialsResponse> {
  const response = await api.post<ImportMaterialsResponse>(
    '/api/inventory/materials/import',
    payload,
  )
  return response.data
}

// Materials
export async function getMaterials(
  params: MaterialListParams = {},
): Promise<MaterialResponse[]> {
  const response = await api.get<MaterialResponse[]>(
    `/api/inventory/materials${toSearchParams({
      search: params.search,
      categoryId: params.categoryId,
      defaultUomId: params.defaultUomId,
      catalogId: params.catalogId,
      active: params.active,
    })}`,
  )
  return response.data
}

export async function getMaterial(id: number | string): Promise<MaterialResponse> {
  const response = await api.get<MaterialResponse>(`/api/inventory/materials/${id}`)
  return response.data
}

function toMaterialWritePayload(payload: CreateMaterialRequest) {
  return {
    ...payload,
    defaultUomId: payload.stockUomId,
  }
}

export async function createMaterial(payload: CreateMaterialRequest): Promise<MaterialResponse> {
  const response = await api.post<MaterialResponse>(
    '/api/inventory/materials',
    toMaterialWritePayload(payload),
  )
  return response.data
}

export async function updateMaterial(
  id: number | string,
  payload: UpdateMaterialRequest,
): Promise<MaterialResponse> {
  const response = await api.put<MaterialResponse>(
    `/api/inventory/materials/${id}`,
    toMaterialWritePayload(payload),
  )
  return response.data
}

export async function activateMaterial(id: number | string): Promise<MaterialResponse> {
  const response = await api.patch<MaterialResponse>(`/api/inventory/materials/${id}/activate`)
  return response.data
}

export async function deactivateMaterial(id: number | string): Promise<MaterialResponse> {
  const response = await api.patch<MaterialResponse>(`/api/inventory/materials/${id}/deactivate`)
  return response.data
}

// Warehouses
export async function getWarehouses(
  params: WarehouseListParams = {},
): Promise<WarehouseResponse[]> {
  const response = await api.get<WarehouseResponse[]>(
    `/api/inventory/warehouses${toSearchParams({
      search: params.search,
      branchId: params.branchId,
      type: params.type,
      active: params.active,
    })}`,
  )
  return response.data
}

export async function getWarehouse(id: number | string): Promise<WarehouseResponse> {
  const response = await api.get<WarehouseResponse>(`/api/inventory/warehouses/${id}`)
  return response.data
}

export async function createWarehouse(payload: CreateWarehouseRequest): Promise<WarehouseResponse> {
  const response = await api.post<WarehouseResponse>('/api/inventory/warehouses', payload)
  return response.data
}

export async function updateWarehouse(
  id: number | string,
  payload: UpdateWarehouseRequest,
): Promise<WarehouseResponse> {
  const response = await api.put<WarehouseResponse>(`/api/inventory/warehouses/${id}`, payload)
  return response.data
}

export async function activateWarehouse(id: number | string): Promise<WarehouseResponse> {
  const response = await api.patch<WarehouseResponse>(`/api/inventory/warehouses/${id}/activate`)
  return response.data
}

export async function deactivateWarehouse(id: number | string): Promise<WarehouseResponse> {
  const response = await api.patch<WarehouseResponse>(
    `/api/inventory/warehouses/${id}/deactivate`,
  )
  return response.data
}

export async function getWarehouseStocks(
  warehouseId: string | number,
  params: WarehouseStockListParams = {},
): Promise<WarehouseStockResponse[]> {
  const response = await api.get<WarehouseStockResponse[]>(
    `/api/inventory/warehouses/${warehouseId}/stocks${toSearchParams({
      search: params.search,
      categoryId: params.categoryId,
      belowMinimum: params.belowMinimum,
    })}`,
  )
  return response.data
}

export async function addMaterialToWarehouse(
  warehouseId: string | number,
  data: AddMaterialToWarehouseRequest,
): Promise<WarehouseStockResponse> {
  const authUser = authService.getAuthUser()
  if (authUser?.tenantId == null || authUser.id == null) {
    throw new Error('Authenticated tenant and user context are required to add warehouse stock.')
  }

  const response = await api.post<WarehouseStockResponse>(
    `/api/inventory/warehouses/${warehouseId}/stocks`,
    data,
    {
      headers: {
        'X-Tenant-Id': String(authUser.tenantId),
        'X-User-Id': String(authUser.id),
      },
    },
  )
  return response.data
}

export async function updateStockSettings(
  warehouseId: string | number,
  materialId: number,
  data: UpdateStockSettingsRequest,
): Promise<WarehouseStockResponse> {
  const response = await api.put<WarehouseStockResponse>(
    `/api/inventory/warehouses/${warehouseId}/stocks/${materialId}`,
    data,
  )
  return response.data
}

// Suppliers
export async function getSuppliers(params: InventoryListParams = {}): Promise<SupplierResponse[]> {
  const response = await api.get<SupplierResponse[]>(
    `/api/inventory/suppliers${toSearchParams({
      search: params.search,
      active: params.active,
    })}`,
  )
  return response.data
}

export async function getSupplier(id: number | string): Promise<SupplierResponse> {
  const response = await api.get<SupplierResponse>(`/api/inventory/suppliers/${id}`)
  return response.data
}

export async function createSupplier(payload: CreateSupplierRequest): Promise<SupplierResponse> {
  const response = await api.post<SupplierResponse>('/api/inventory/suppliers', payload)
  return response.data
}

export async function updateSupplier(
  id: number | string,
  payload: UpdateSupplierRequest,
): Promise<SupplierResponse> {
  const response = await api.put<SupplierResponse>(`/api/inventory/suppliers/${id}`, payload)
  return response.data
}

export async function activateSupplier(id: number | string): Promise<SupplierResponse> {
  const response = await api.patch<SupplierResponse>(`/api/inventory/suppliers/${id}/activate`)
  return response.data
}

export async function deactivateSupplier(id: number | string): Promise<SupplierResponse> {
  const response = await api.patch<SupplierResponse>(`/api/inventory/suppliers/${id}/deactivate`)
  return response.data
}
