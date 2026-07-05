import type {
  CreateLeaveRequestRequest,
  LeaveRequestResponse,
  UpdateLeaveRequestStatusRequest,
} from '../types/leaveRequest'
import { api } from './api'

export async function getLeaveRequests(): Promise<LeaveRequestResponse[]> {
  const response = await api.get<LeaveRequestResponse[]>('/api/hr/leave-requests')
  return response.data
}

export async function getLeaveRequest(id: number | string): Promise<LeaveRequestResponse> {
  const response = await api.get<LeaveRequestResponse>(`/api/hr/leave-requests/${id}`)
  return response.data
}

export async function createLeaveRequest(
  payload: CreateLeaveRequestRequest,
): Promise<LeaveRequestResponse> {
  const response = await api.post<LeaveRequestResponse>('/api/hr/leave-requests', payload)
  return response.data
}

export async function updateLeaveRequestStatus(
  id: number | string,
  payload: UpdateLeaveRequestStatusRequest,
): Promise<LeaveRequestResponse> {
  const response = await api.patch<LeaveRequestResponse>(
    `/api/hr/leave-requests/${id}/status`,
    payload,
  )
  return response.data
}
