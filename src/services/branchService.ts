import type {
  BranchResponse,
  CreateBranchRequest,
  UpdateBranchRequest,
} from '../types/branch'
import { api } from './api'

export async function getBranches(): Promise<BranchResponse[]> {
  const response = await api.get<BranchResponse[]>('/api/branches')
  return response.data
}

export async function createBranch(payload: CreateBranchRequest): Promise<BranchResponse> {
  const response = await api.post<BranchResponse>('/api/branches', payload)
  return response.data
}

export async function updateBranch(
  branchId: number | string,
  payload: UpdateBranchRequest,
): Promise<BranchResponse> {
  const response = await api.put<BranchResponse>(`/api/branches/${branchId}`, payload)
  return response.data
}

export async function updateBranchStatus(
  branchId: number | string,
  active: boolean,
): Promise<BranchResponse> {
  const response = await api.patch<BranchResponse>(`/api/branches/${branchId}/status`, {
    active,
  })
  return response.data
}
