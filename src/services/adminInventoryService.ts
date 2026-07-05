import { adminInventoryEndpoints } from '../api/adminInventoryEndpoints'
import type {
  AdminMaterialCatalogListParams,
  AdminMaterialCategoryResponse,
  AdminUomListParams,
  CreateAdminMaterialCatalogRequest,
  CreateAdminMaterialCategoryRequest,
  CreateUomRequest,
  InventorySeedSummaryResponse,
  MaterialCatalogResponse,
  UomResponse,
  UpdateAdminMaterialCatalogRequest,
  UpdateAdminMaterialCategoryRequest,
  UpdateUomRequest,
  InventoryListParams,
} from '../types/inventory'
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

/** GET /uoms?type=&active= (search is client-side only) */
export async function getAdminUoms(params: AdminUomListParams = {}): Promise<UomResponse[]> {
  const response = await api.get<UomResponse[]>(
    `${adminInventoryEndpoints.uoms.list}${toSearchParams({
      type: params.type,
      active: params.active,
    })}`,
  )
  return response.data
}

export async function createAdminUom(payload: CreateUomRequest): Promise<UomResponse> {
  const response = await api.post<UomResponse>(adminInventoryEndpoints.uoms.create, payload)
  return response.data
}

export async function updateAdminUom(
  id: number | string,
  payload: UpdateUomRequest,
): Promise<UomResponse> {
  const response = await api.put<UomResponse>(adminInventoryEndpoints.uoms.update(id), payload)
  return response.data
}

export async function activateAdminUom(id: number | string): Promise<UomResponse> {
  const response = await api.patch<UomResponse>(adminInventoryEndpoints.uoms.activate(id))
  return response.data
}

export async function deactivateAdminUom(id: number | string): Promise<UomResponse> {
  const response = await api.patch<UomResponse>(adminInventoryEndpoints.uoms.deactivate(id))
  return response.data
}

/** GET /global-material-categories?search=&active= */
export async function getAdminMaterialCategories(
  params: InventoryListParams = {},
): Promise<AdminMaterialCategoryResponse[]> {
  const response = await api.get<AdminMaterialCategoryResponse[]>(
    `${adminInventoryEndpoints.globalMaterialCategories.list}${toSearchParams({
      search: params.search,
      active: params.active,
    })}`,
  )
  return response.data
}

export async function createAdminMaterialCategory(
  payload: CreateAdminMaterialCategoryRequest,
): Promise<AdminMaterialCategoryResponse> {
  const response = await api.post<AdminMaterialCategoryResponse>(
    adminInventoryEndpoints.globalMaterialCategories.create,
    payload,
  )
  return response.data
}

export async function updateAdminMaterialCategory(
  id: number | string,
  payload: UpdateAdminMaterialCategoryRequest,
): Promise<AdminMaterialCategoryResponse> {
  const response = await api.put<AdminMaterialCategoryResponse>(
    adminInventoryEndpoints.globalMaterialCategories.update(id),
    payload,
  )
  return response.data
}

export async function activateAdminMaterialCategory(
  id: number | string,
): Promise<AdminMaterialCategoryResponse> {
  const response = await api.patch<AdminMaterialCategoryResponse>(
    adminInventoryEndpoints.globalMaterialCategories.activate(id),
  )
  return response.data
}

export async function deactivateAdminMaterialCategory(
  id: number | string,
): Promise<AdminMaterialCategoryResponse> {
  const response = await api.patch<AdminMaterialCategoryResponse>(
    adminInventoryEndpoints.globalMaterialCategories.deactivate(id),
  )
  return response.data
}

/** GET /global-materials?categoryId=&uomId=&search=&active= */
export async function getAdminMaterialCatalog(
  params: AdminMaterialCatalogListParams = {},
): Promise<MaterialCatalogResponse[]> {
  const response = await api.get<MaterialCatalogResponse[]>(
    `${adminInventoryEndpoints.globalMaterials.list}${toSearchParams({
      search: params.search,
      categoryId: params.categoryId,
      uomId: params.uomId,
      active: params.active,
    })}`,
  )
  return response.data
}

function toCatalogWritePayload(payload: CreateAdminMaterialCatalogRequest) {
  return {
    ...payload,
    defaultUomId: payload.stockUomId,
  }
}

export async function createAdminMaterialCatalog(
  payload: CreateAdminMaterialCatalogRequest,
): Promise<MaterialCatalogResponse> {
  const response = await api.post<MaterialCatalogResponse>(
    adminInventoryEndpoints.globalMaterials.create,
    toCatalogWritePayload(payload),
  )
  return response.data
}

export async function updateAdminMaterialCatalog(
  id: number | string,
  payload: UpdateAdminMaterialCatalogRequest,
): Promise<MaterialCatalogResponse> {
  const response = await api.put<MaterialCatalogResponse>(
    adminInventoryEndpoints.globalMaterials.update(id),
    toCatalogWritePayload(payload),
  )
  return response.data
}

export async function activateAdminMaterialCatalog(
  id: number | string,
): Promise<MaterialCatalogResponse> {
  const response = await api.patch<MaterialCatalogResponse>(
    adminInventoryEndpoints.globalMaterials.activate(id),
  )
  return response.data
}

export async function deactivateAdminMaterialCatalog(
  id: number | string,
): Promise<MaterialCatalogResponse> {
  const response = await api.patch<MaterialCatalogResponse>(
    adminInventoryEndpoints.globalMaterials.deactivate(id),
  )
  return response.data
}

/** POST /seed-global-catalog */
export async function seedGlobalCatalog(): Promise<InventorySeedSummaryResponse> {
  const response = await api.post<InventorySeedSummaryResponse>(
    adminInventoryEndpoints.seed.globalCatalog,
  )
  return response.data
}

/** POST /seed-demo-tenant-data/{tenantId} */
export async function seedDemoTenantData(
  tenantId: number | string,
): Promise<InventorySeedSummaryResponse> {
  const response = await api.post<InventorySeedSummaryResponse>(
    adminInventoryEndpoints.seed.demoTenantData(tenantId),
  )
  return response.data
}
