import type { CreateLeaveRequestRequest, LeaveRequestResponse } from '../types/leaveRequest'
import type { LeaveBalanceResponse, UpdateLeaveBalanceRequest } from '../types/leaveBalance'
import type {
  CreateEmployeeSalaryRequest,
  EmployeeCurrentSalaryResponse,
  EmployeeSalaryRecord,
} from '../types/employeeSalary'
import type {
  CreateSalaryAdjustmentRequest,
  SalaryAdjustmentResponse,
} from '../types/salaryAdjustment'
import { api } from './api'

export async function getEmployeeCurrentSalary(
  employeeId: number | string,
): Promise<EmployeeCurrentSalaryResponse> {
  const response = await api.get<EmployeeCurrentSalaryResponse>(
    `/api/hr/employees/${employeeId}/salary/current`,
  )
  return response.data
}

export async function getEmployeeSalaries(
  employeeId: number | string,
): Promise<EmployeeSalaryRecord[]> {
  const response = await api.get<EmployeeSalaryRecord[]>(
    `/api/hr/employees/${employeeId}/salaries`,
  )
  return response.data
}

export async function createEmployeeSalary(
  employeeId: number | string,
  payload: CreateEmployeeSalaryRequest,
): Promise<EmployeeSalaryRecord> {
  // The caller falls back to a legacy API when this fails; suppress the global
  // toast so a successful fallback doesn't show a false error.
  const response = await api.post<EmployeeSalaryRecord>(
    `/api/hr/employees/${employeeId}/salaries`,
    payload,
    { notifyOnError: false },
  )
  return response.data
}

export async function getEmployeeSalaryAdjustments(
  employeeId: number | string,
): Promise<SalaryAdjustmentResponse[]> {
  const response = await api.get<SalaryAdjustmentResponse[]>(
    `/api/hr/employees/${employeeId}/salary-adjustments`,
  )
  return response.data
}

export async function createEmployeeSalaryAdjustment(
  employeeId: number | string,
  payload: CreateSalaryAdjustmentRequest,
): Promise<SalaryAdjustmentResponse> {
  // The caller falls back to a legacy API when this fails; suppress the global
  // toast so a successful fallback doesn't show a false error.
  const response = await api.post<SalaryAdjustmentResponse>(
    `/api/hr/employees/${employeeId}/salary-adjustments`,
    payload,
    { notifyOnError: false },
  )
  return response.data
}

export async function cancelSalaryAdjustment(
  id: number | string,
): Promise<SalaryAdjustmentResponse> {
  const response = await api.patch<SalaryAdjustmentResponse>(
    `/api/hr/salary-adjustments/${id}/cancel`,
  )
  return response.data
}

export async function getEmployeeLeaveBalances(
  employeeId: number | string,
): Promise<LeaveBalanceResponse[]> {
  const response = await api.get<LeaveBalanceResponse[]>(
    `/api/hr/employees/${employeeId}/leave-balances`,
  )
  return response.data
}

export async function generateEmployeeLeaveBalances(
  employeeId: number | string,
): Promise<void> {
  // The leave-assign tab shows tailored inline errors (e.g. "no active leave
  // types" with a link); skip the generic global toast.
  await api.post(`/api/hr/employees/${employeeId}/leave-balances/generate`, undefined, {
    notifyOnError: false,
  })
}

export async function updateLeaveBalance(
  id: number | string,
  payload: UpdateLeaveBalanceRequest,
): Promise<LeaveBalanceResponse> {
  const response = await api.put<LeaveBalanceResponse>(`/api/hr/leave-balances/${id}`, payload)
  return response.data
}

export async function getEmployeeLeaveRequests(
  employeeId: number | string,
): Promise<LeaveRequestResponse[]> {
  const response = await api.get<LeaveRequestResponse[]>(
    `/api/hr/employees/${employeeId}/leave-requests`,
  )
  return response.data
}

export async function createEmployeeLeaveRequest(
  employeeId: number | string,
  payload: Omit<CreateLeaveRequestRequest, 'employeeId'>,
): Promise<LeaveRequestResponse> {
  // The caller falls back to a legacy API when this fails; suppress the global
  // toast so a successful fallback doesn't show a false error.
  const response = await api.post<LeaveRequestResponse>(
    `/api/hr/employees/${employeeId}/leave-requests`,
    payload,
    { notifyOnError: false },
  )
  return response.data
}

export async function cancelEmployeeLeaveRequest(
  id: number | string,
): Promise<LeaveRequestResponse> {
  const response = await api.patch<LeaveRequestResponse>(`/api/hr/leave-requests/${id}/cancel`)
  return response.data
}
