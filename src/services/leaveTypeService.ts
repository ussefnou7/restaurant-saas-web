import type {
  CreateLeaveTypeRequest,
  LeaveTypeResponse,
  UpdateLeaveTypeRequest,
} from '../types/leaveType'
import { api } from './api'

export async function getLeaveTypes(): Promise<LeaveTypeResponse[]> {
  const response = await api.get<LeaveTypeResponse[]>('/api/hr/leave-types')
  return response.data
}

export async function createLeaveType(payload: CreateLeaveTypeRequest): Promise<LeaveTypeResponse> {
  const response = await api.post<LeaveTypeResponse>('/api/hr/leave-types', payload)
  return response.data
}

export async function updateLeaveType(
  id: number | string,
  payload: UpdateLeaveTypeRequest,
): Promise<LeaveTypeResponse> {
  const response = await api.put<LeaveTypeResponse>(`/api/hr/leave-types/${id}`, payload)
  return response.data
}

export async function updateLeaveTypeStatus(
  id: number | string,
  active: boolean,
): Promise<LeaveTypeResponse> {
  const response = await api.patch<LeaveTypeResponse>(`/api/hr/leave-types/${id}/status`, {
    active,
  })
  return response.data
}
