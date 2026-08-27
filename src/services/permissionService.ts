import type {
  PermissionResponse,
  ReplaceUserPermissionsRequest,
  UserPermissionsResponse,
} from '../types/permission'
import { api } from './api'

export async function getPermissions(): Promise<PermissionResponse[]> {
  const response = await api.get<PermissionResponse[]>('/api/permissions')
  return response.data
}

export async function getUserPermissions(
  userId: number | string,
): Promise<UserPermissionsResponse> {
  const response = await api.get<UserPermissionsResponse>(`/api/permissions/users/${userId}`)
  return response.data
}

export async function replaceUserPermissions(
  userId: number | string,
  permissionCodes: string[],
): Promise<UserPermissionsResponse | void> {
  const request: ReplaceUserPermissionsRequest = {
    permissionCodes,
  }
  const response = await api.put<UserPermissionsResponse>(`/api/permissions/users/${userId}`, request)
  return response.data
}
