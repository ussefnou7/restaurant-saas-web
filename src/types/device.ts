export interface Device {
  id: number
  name: string
  branchId: number
  branchName?: string
  active: boolean
  lastLoginAt: string | null
}

export interface DeviceCreateRequest {
  name: string
  branchId: number
}

export interface DeviceCreateResponse extends Device {
  pairingCode: string
  pairingCodeExpiresAt: string
}

export interface DevicePairingCodeResponse {
  deviceId: number
  pairingCode: string
  expiresAt: string
}
