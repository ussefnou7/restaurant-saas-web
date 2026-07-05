import type { AuthUser, LoginRequest, LoginResponse } from '../types/auth'
import api from './api'

const ACCESS_TOKEN_KEY = 'accessToken'
const AUTH_USER_KEY = 'authUser'
const TENANT_CODE_KEY = 'tenantCode'

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    // The login page renders the error inline; skip the global error toast.
    const { data } = await api.post<LoginResponse>('/api/auth/login', payload, {
      notifyOnError: false,
    })
    return data
  },

  async getCurrentUser(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>('/api/auth/me')
    return data
  },

  saveAuthData(data: LoginResponse, tenantCode: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))
    localStorage.setItem(TENANT_CODE_KEY, tenantCode.trim().toUpperCase())
  },

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  getTenantCode(): string | null {
    return localStorage.getItem(TENANT_CODE_KEY)
  },

  getAuthUser(): AuthUser | null {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthUser
    } catch {
      return null
    }
  },

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    localStorage.removeItem(TENANT_CODE_KEY)
  },
}
