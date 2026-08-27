import { uomEndpoints } from '../api/uomEndpoints'
import type {
  CreateTenantUomRequest,
  UomLookupItemResponse,
  UomLookupResponse,
  UomResponse,
} from '../types/inventory'
import { api } from './api'

export type UomLookupResult = {
  version: string
  items: UomLookupItemResponse[]
  notModified?: boolean
}

export async function getUomLookup(ifNoneMatch?: string): Promise<UomLookupResult> {
  const headers: Record<string, string> = {}
  if (ifNoneMatch) {
    headers['If-None-Match'] = ifNoneMatch.startsWith('"') ? ifNoneMatch : `"${ifNoneMatch}"`
  }

  const response = await api.get<UomLookupResponse>(uomEndpoints.lookup, {
    headers,
    validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
    notifyOnError: false,
  })

  if (response.status === 304) {
    const etag = (response.headers?.etag || response.headers?.ETag || ifNoneMatch || '')
      .replace(/^W\//, '')
      .replace(/^"|"$/g, '')
    return {
      version: etag,
      items: [],
      notModified: true,
    }
  }

  return {
    version: response.data.version,
    items: response.data.items,
    notModified: false,
  }
}

export async function getUomById(id: number | string): Promise<UomLookupItemResponse> {
  const response = await api.get<UomLookupItemResponse>(uomEndpoints.byId(id), {
    notifyOnError: false,
  })
  return response.data
}

export async function getTenantUoms(): Promise<UomResponse[]> {
  const response = await api.get<UomResponse[]>(uomEndpoints.base)
  return response.data
}

export async function createTenantUom(payload: CreateTenantUomRequest): Promise<UomResponse> {
  const response = await api.post<UomResponse>(uomEndpoints.create, payload)
  return response.data
}

export async function deactivateTenantUom(id: number | string): Promise<UomResponse> {
  const response = await api.patch<UomResponse>(uomEndpoints.deactivate(id))
  return response.data
}

export async function deleteTenantUom(id: number | string): Promise<void> {
  // The UOM page shows a tailored "in use" hint on failure; skip the global toast.
  await api.delete(uomEndpoints.delete(id), { notifyOnError: false })
}

