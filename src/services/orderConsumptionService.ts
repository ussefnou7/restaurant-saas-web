import { orderConsumptionEndpoints } from '../api/orderConsumptionEndpoints'
import type {
  OrderConsumptionDocDetailResponse,
  OrderConsumptionDocListResponse,
  OrderConsumptionListParams,
  OrderConsumptionMaterialsSummaryResponse,
} from '../types/orderConsumption'
import type { PageResult, SpringPageResponse } from '../types/pagination'
import { normalizePageResult, toSearchParams } from '../utils/pagination'
import { api } from './api'

const DEFAULT_PAGE_SIZE = 20

export async function getOrderConsumptionDocs(
  params: OrderConsumptionListParams = {},
): Promise<PageResult<OrderConsumptionDocListResponse>> {
  const page = params.page ?? 0
  const size = params.size ?? DEFAULT_PAGE_SIZE
  const response = await api.get<SpringPageResponse<OrderConsumptionDocListResponse>>(
    `${orderConsumptionEndpoints.list}${toSearchParams({
      warehouseId: params.warehouseId,
      status: params.status,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      page,
      size,
    })}`,
  )
  return normalizePageResult(response.data, page, size)
}

export async function getOrderConsumptionDoc(
  id: number | string,
): Promise<OrderConsumptionDocDetailResponse> {
  const response = await api.get<OrderConsumptionDocDetailResponse>(orderConsumptionEndpoints.byId(id))
  return response.data
}

export async function getOrderConsumptionMaterialsSummary(
  id: number | string,
): Promise<OrderConsumptionMaterialsSummaryResponse> {
  const response = await api.get<OrderConsumptionMaterialsSummaryResponse>(
    orderConsumptionEndpoints.materialsSummary(id),
  )
  return response.data
}

export async function recalculateOrderConsumptionDoc(
  id: number | string,
): Promise<void> {
  await api.post(orderConsumptionEndpoints.recalculate(id))
}
