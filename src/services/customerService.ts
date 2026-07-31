import type { CustomerListParams, CustomerResponse } from '../types/customer'
import type { PageResult, SpringPageResponse } from '../types/pagination'
import { normalizePageResult, toSearchParams } from '../utils/pagination'
import { api } from './api'

const DEFAULT_PAGE_SIZE = 20

export async function getCustomers(
  params: CustomerListParams = {},
): Promise<PageResult<CustomerResponse>> {
  const page = params.page ?? 0
  const size = params.size ?? DEFAULT_PAGE_SIZE

  const response = await api.get<CustomerResponse[] | SpringPageResponse<CustomerResponse>>(
    `/api/loyalty/customers${toSearchParams({
      search: params.search,
      page,
      size,
    })}`,
  )

  return normalizePageResult(response.data, page, size)
}
