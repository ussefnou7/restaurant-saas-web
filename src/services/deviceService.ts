import type {
  Device,
  DeviceCreateRequest,
  DeviceCreateResponse,
  DevicePairingCodeResponse,
} from '../types/device'
import { api } from './api'

export async function getDevices(): Promise<Device[]> {
  const response = await api.get<Device[]>('/api/devices')
  return response.data
}

export async function createDevice(payload: DeviceCreateRequest): Promise<DeviceCreateResponse> {
  const response = await api.post<DeviceCreateResponse>('/api/devices', payload, {
    notifyOnError: false,
  })
  return response.data
}

export async function deactivateDevice(id: number | string): Promise<void> {
  await api.patch(`/api/devices/${id}/deactivate`, undefined, {
    notifyOnError: false,
  })
}

export async function regeneratePairingCode(
  id: number | string,
): Promise<DevicePairingCodeResponse> {
  const response = await api.post<DevicePairingCodeResponse>(
    `/api/devices/${id}/pairing-code`,
    undefined,
    { notifyOnError: false },
  )
  return response.data
}
