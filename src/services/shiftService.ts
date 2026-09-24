import { SHIFTS_API } from '../api/shiftsApi'
import type {
  CloseShiftRequest,
  ShiftDetailResponse,
  ShiftListItemResponse,
  ShiftListParams,
  ShiftPageResponse,
} from '../types/shift'
import { api } from './api'

export async function getShifts(params?: ShiftListParams): Promise<ShiftPageResponse> {
  const queryParams: Record<string, unknown> = {}

  if (params) {
    if (params.branchId != null) {
      queryParams.branchId = params.branchId
    }
    if (params.deviceId != null) {
      queryParams.deviceId = params.deviceId
    }
    if (params.cashierUserId != null) {
      queryParams.cashierUserId = params.cashierUserId
    }
    if (params.dateFrom) {
      queryParams.dateFrom = params.dateFrom
    }
    if (params.dateTo) {
      queryParams.dateTo = params.dateTo
    }
    if (params.status) {
      queryParams.status = params.status
    }
    if (params.forcedClose != null) {
      queryParams.forcedClose = params.forcedClose
    }
    if (params.page != null) {
      queryParams.page = params.page
    }
    if (params.size != null) {
      queryParams.size = params.size
    }
  }

  const response = await api.get<ShiftPageResponse>(SHIFTS_API.base, {
    params: queryParams,
  })
  return response.data
}

export async function getShift(id: number | string): Promise<ShiftDetailResponse> {
  const response = await api.get<ShiftDetailResponse>(SHIFTS_API.byId(id))
  return response.data
}

export async function closeShift(
  id: number | string,
  payload: CloseShiftRequest,
): Promise<ShiftListItemResponse> {
  const response = await api.post<ShiftListItemResponse>(SHIFTS_API.close(id), payload)
  return response.data
}
