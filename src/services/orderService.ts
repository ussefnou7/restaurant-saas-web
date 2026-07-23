import type { OrderListParams, OrderView } from '../types/order'
import type { PageResult, SpringPageResponse } from '../types/pagination'
import { api } from './api'
import { normalizePageResult, toSearchParams } from '../utils/pagination'

const DEFAULT_PAGE_SIZE = 20

export async function getOrders(
  params: OrderListParams = {},
): Promise<PageResult<OrderView>> {
  const page = params.page ?? 0
  const size = params.size ?? DEFAULT_PAGE_SIZE

  const response = await api.get<OrderView[] | SpringPageResponse<OrderView>>(
    `/api/orders${toSearchParams({
      orderType: params.orderType,
      orderSource: params.orderSource,
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

export async function getOrder(id: number | string): Promise<OrderView> {
  const response = await api.get<OrderView>(`/api/orders/${id}`)
  return response.data
}
