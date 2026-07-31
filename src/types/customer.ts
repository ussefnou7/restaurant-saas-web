export interface CustomerResponse {
  id: number
  name: string
  phone: string
}

export interface CustomerListParams {
  search?: string
  page?: number
  size?: number
}
