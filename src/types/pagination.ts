export interface PageResult<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface SpringPageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
