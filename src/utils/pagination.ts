import type { PageResult, SpringPageResponse } from '../types/pagination'

export function toSearchParams(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

export function normalizePageResult<T>(
  data: T[] | SpringPageResponse<T>,
  page: number,
  size: number,
): PageResult<T> {
  if (Array.isArray(data)) {
    const totalElements = data.length
    const totalPages = Math.max(1, Math.ceil(totalElements / size))
    const start = page * size
    const content = data.slice(start, start + size)
    return {
      content,
      totalElements,
      totalPages,
      page,
      size,
    }
  }

  return {
    content: data.content,
    totalElements: data.totalElements,
    totalPages: data.totalPages,
    page: data.number,
    size: data.size,
  }
}
