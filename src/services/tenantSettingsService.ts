import type { TenantSettingsResponse, UpdateTenantSettingsRequest } from '../types/tenantSettings'
import { api } from './api'

const TENANT_SETTINGS_PATH = '/api/tenant-settings'

export async function getTenantSettings(): Promise<TenantSettingsResponse> {
  const response = await api.get<TenantSettingsResponse>(TENANT_SETTINGS_PATH)
  return response.data
}

export async function updateTenantSettings(
  payload: UpdateTenantSettingsRequest,
): Promise<TenantSettingsResponse> {
  const response = await api.put<TenantSettingsResponse>(TENANT_SETTINGS_PATH, payload)
  return response.data
}
