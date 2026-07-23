import { ASSETS_API } from '../api/assetsApi'
import type { PageResult, SpringPageResponse } from '../types/pagination'
import type {
  AssetDisposalReportRow,
  AssetDisposalResponse,
  AssetLineResponse,
  AssetMaintenanceResponse,
  AssetResponse,
  AssetSummaryReportResponse,
  CreateAssetDisposalRequest,
  CreateAssetLineRequest,
  CreateAssetMaintenanceRequest,
  CreateAssetRequest,
  UpdateAssetRequest,
} from '../types/assets'
import { normalizePageResult, toSearchParams } from '../utils/pagination'
import { api } from './api'

export async function getAssets(): Promise<AssetResponse[]> {
  const response = await api.get<AssetResponse[]>(ASSETS_API.base)
  return response.data
}

export async function getAsset(id: number | string): Promise<AssetResponse> {
  const response = await api.get<AssetResponse>(ASSETS_API.byId(id))
  return response.data
}

export async function createAsset(payload: CreateAssetRequest): Promise<AssetResponse> {
  const response = await api.post<AssetResponse>(ASSETS_API.base, payload)
  return response.data
}

export async function updateAsset(
  id: number | string,
  payload: UpdateAssetRequest,
): Promise<AssetResponse> {
  const response = await api.put<AssetResponse>(ASSETS_API.byId(id), payload)
  return response.data
}

export async function deleteAsset(id: number | string): Promise<void> {
  await api.delete(ASSETS_API.byId(id))
}

export async function getAssetLines(assetId: number | string): Promise<AssetLineResponse[]> {
  const response = await api.get<AssetLineResponse[]>(ASSETS_API.lines(assetId))
  return response.data
}

export async function getAssetLine(
  assetId: number | string,
  lineId: number | string,
): Promise<AssetLineResponse> {
  const response = await api.get<AssetLineResponse>(ASSETS_API.lineById(assetId, lineId))
  return response.data
}

export async function createAssetLine(
  assetId: number | string,
  payload: CreateAssetLineRequest,
): Promise<AssetLineResponse> {
  const response = await api.post<AssetLineResponse>(ASSETS_API.lines(assetId), payload)
  return response.data
}

export async function deleteAssetLine(
  assetId: number | string,
  lineId: number | string,
): Promise<void> {
  await api.delete(ASSETS_API.lineById(assetId, lineId))
}

export async function getAssetDisposals(
  assetId: number | string,
  lineId: number | string,
): Promise<AssetDisposalResponse[]> {
  const response = await api.get<AssetDisposalResponse[]>(ASSETS_API.disposals(assetId, lineId))
  return response.data
}

export async function createAssetDisposal(
  payload: CreateAssetDisposalRequest,
): Promise<AssetDisposalResponse> {
  const response = await api.post<AssetDisposalResponse>(
    ASSETS_API.disposals(payload.assetId, payload.assetLineId),
    payload,
  )
  return response.data
}

export async function getAssetMaintenance(
  assetId: number | string,
  lineId: number | string,
): Promise<AssetMaintenanceResponse[]> {
  const response = await api.get<AssetMaintenanceResponse[]>(
    ASSETS_API.maintenance(assetId, lineId),
  )
  return response.data
}

export async function createAssetMaintenance(
  payload: CreateAssetMaintenanceRequest,
): Promise<AssetMaintenanceResponse> {
  const response = await api.post<AssetMaintenanceResponse>(
    ASSETS_API.maintenance(payload.assetId, payload.assetLineId),
    payload,
  )
  return response.data
}

export async function getAssetSummaryReport(): Promise<AssetSummaryReportResponse> {
  const response = await api.get<AssetSummaryReportResponse>(ASSETS_API.summaryReport)
  return response.data
}

export async function getAssetDisposalsReport(
  page: number,
  size: number,
): Promise<PageResult<AssetDisposalReportRow>> {
  const response = await api.get<AssetDisposalReportRow[] | SpringPageResponse<AssetDisposalReportRow>>(
    `${ASSETS_API.disposalsReport}${toSearchParams({ page, size })}`,
  )
  return normalizePageResult(response.data, page, size)
}
