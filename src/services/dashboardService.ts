import { DASHBOARD_ENDPOINTS } from '../api/dashboard'
import { rangeForMode } from '../pages/dashboard/dashboardDisplay'
import type {
  DashboardAlertsResponse,
  DashboardMode,
  DashboardSummaryResponse,
} from '../types/dashboard'
import { api } from './api'

export async function getDashboardSummary(
  mode: DashboardMode,
  branchId?: number | null,
): Promise<DashboardSummaryResponse> {
  const { from, to } = rangeForMode(mode)
  const response = await api.get<DashboardSummaryResponse>(DASHBOARD_ENDPOINTS.summary, {
    params: { from, to, branchId: branchId ?? undefined },
  })
  return response.data
}

/**
 * The attention strip.
 *
 * Takes no range on purpose — switching the page between today, this month and this year does not
 * change which conditions hold right now, so this is not refetched when the mode changes.
 */
export async function getDashboardAlerts(
  branchId?: number | null,
): Promise<DashboardAlertsResponse> {
  const response = await api.get<DashboardAlertsResponse>(DASHBOARD_ENDPOINTS.alerts, {
    params: { branchId: branchId ?? undefined },
  })
  return response.data
}
