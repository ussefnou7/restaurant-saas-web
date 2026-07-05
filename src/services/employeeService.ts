import type {
  CreateEmployeeRequest,
  EmployeeResponse,
  UpdateEmployeeRequest,
} from '../types/employee'
import { api } from './api'

export async function getEmployees(): Promise<EmployeeResponse[]> {
  const response = await api.get<EmployeeResponse[]>('/api/hr/employees')
  return response.data
}

export async function getEmployee(id: number | string): Promise<EmployeeResponse> {
  const response = await api.get<EmployeeResponse>(`/api/hr/employees/${id}`)
  return response.data
}

export async function createEmployee(
  payload: CreateEmployeeRequest,
): Promise<EmployeeResponse> {
  const response = await api.post<EmployeeResponse>('/api/hr/employees', payload)
  return response.data
}

export async function updateEmployee(
  id: number | string,
  payload: UpdateEmployeeRequest,
): Promise<EmployeeResponse> {
  const response = await api.put<EmployeeResponse>(`/api/hr/employees/${id}`, payload)
  return response.data
}

export async function updateEmployeeStatus(
  id: number | string,
  active: boolean,
): Promise<EmployeeResponse> {
  const response = await api.patch<EmployeeResponse>(`/api/hr/employees/${id}/status`, {
    active,
  })
  return response.data
}

export async function deleteEmployee(id: number | string): Promise<void> {
  await api.delete(`/api/hr/employees/${id}`)
}
