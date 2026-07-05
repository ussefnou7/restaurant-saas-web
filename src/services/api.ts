import axios from 'axios'

declare module 'axios' {
  export interface AxiosRequestConfig {
    /**
     * Set to false to suppress the global error toast for this request
     * (e.g. when the caller renders the error inline itself).
     */
    notifyOnError?: boolean
  }
}

/**
 * Registered by the app root (which has access to i18n + the notification
 * context) so the interceptor can surface translated error toasts.
 */
type ApiErrorNotifier = (error: unknown) => void

let apiErrorNotifier: ApiErrorNotifier | null = null

export function setApiErrorNotifier(notifier: ApiErrorNotifier | null): void {
  apiErrorNotifier = notifier
}

const AUTH_USER_KEY = 'authUser'

function getTenantIdHeader(): string | null {
  const raw = localStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null
  try {
    const user = JSON.parse(raw) as { tenantId?: number | null }
    if (user.tenantId != null) return String(user.tenantId)
  } catch {
    return null
  }
  return null
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const tenantId = getTenantIdHeader()
  if (tenantId) {
    config.headers['X-Tenant-Id'] = tenantId
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('authUser')
      localStorage.removeItem('tenantCode')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    // Toast mutation failures globally; GET/load failures are rendered inline
    // by the pages themselves (ErrorState banners), so they are excluded.
    const method = (error.config?.method ?? 'get').toLowerCase()
    if (method !== 'get' && error.config?.notifyOnError !== false) {
      apiErrorNotifier?.(error)
    }

    return Promise.reject(error)
  },
)

export { api }
export default api
