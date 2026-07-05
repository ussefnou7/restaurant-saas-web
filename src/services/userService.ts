import type { CreateUserRequest, UpdateUserRequest, UserResponse } from '../types/user'
import { api } from './api'

export async function getUsers(): Promise<UserResponse[]> {
  const response = await api.get<UserResponse[]>('/api/users')
  return response.data
}

export async function getUser(userId: number | string): Promise<UserResponse> {
  const response = await api.get<UserResponse>(`/api/users/${userId}`)
  return response.data
}

export async function createUser(payload: CreateUserRequest): Promise<UserResponse> {
  const response = await api.post<UserResponse>('/api/users', payload)
  return response.data
}

export async function updateUser(
  userId: number | string,
  payload: UpdateUserRequest,
): Promise<UserResponse> {
  const response = await api.put<UserResponse>(`/api/users/${userId}`, payload)
  return response.data
}

export async function updateUserStatus(
  userId: number | string,
  active: boolean,
): Promise<UserResponse> {
  const response = await api.patch<UserResponse>(`/api/users/${userId}/status`, {
    active,
  })
  return response.data
}

export async function deleteUser(userId: number | string): Promise<void> {
  await api.delete(`/api/users/${userId}`)
}
