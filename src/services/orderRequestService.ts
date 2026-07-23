import type { IncomingOrderRequestView, OrderRequestListParams } from '../types/orderRequest'
import type { PageResult, SpringPageResponse } from '../types/pagination'
import { api } from './api'
import { normalizePageResult, toSearchParams } from '../utils/pagination'

const DEFAULT_PAGE_SIZE = 20

export async function getOrderRequests(
  params: OrderRequestListParams = {},
): Promise<PageResult<IncomingOrderRequestView>> {
  const page = params.page ?? 0
  const size = params.size ?? DEFAULT_PAGE_SIZE

  const response = await api.get<
    IncomingOrderRequestView[] | SpringPageResponse<IncomingOrderRequestView>
  >(
    `/api/order-requests${toSearchParams({
      source: params.source,
      status: params.status,
      branchId: params.branchId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      page,
      size,
    })}`,
  )

  return normalizePageResult(response.data, page, size)
}

export async function getOrderRequest(id: number | string): Promise<IncomingOrderRequestView> {
  const response = await api.get<IncomingOrderRequestView>(`/api/order-requests/${id}`)
  return response.data
}
