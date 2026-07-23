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
  secretKey: string
}
