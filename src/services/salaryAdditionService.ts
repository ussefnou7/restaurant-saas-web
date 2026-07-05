import type {
  CreateSalaryAdditionRequest,
  SalaryAdditionResponse,
  UpdateSalaryAdditionRequest,
} from '../types/salaryAddition'
import { api } from './api'

export async function getSalaryAdditions(): Promise<SalaryAdditionResponse[]> {
  const response = await api.get<SalaryAdditionResponse[]>('/api/hr/salary-additions')
  return response.data
}

export async function createSalaryAddition(
  payload: CreateSalaryAdditionRequest,
): Promise<SalaryAdditionResponse> {
  const response = await api.post<SalaryAdditionResponse>('/api/hr/salary-additions', payload)
  return response.data
}

export async function updateSalaryAddition(
  id: number | string,
  payload: UpdateSalaryAdditionRequest,
): Promise<SalaryAdditionResponse> {
  const response = await api.put<SalaryAdditionResponse>(`/api/hr/salary-additions/${id}`, payload)
  return response.data
}

export async function updateSalaryAdditionStatus(
  id: number | string,
  active: boolean,
): Promise<SalaryAdditionResponse> {
  const response = await api.patch<SalaryAdditionResponse>(`/api/hr/salary-additions/${id}/status`, {
    active,
  })
  return response.data
}
