export type TableShape = 'ROUND' | 'SQUARE' | 'RECTANGLE'

export type RestaurantTable = {
  id: number
  branchId: number
  branchName?: string | null
  name: string
  sectionId?: number | null
  sectionName?: string | null
  capacity?: number | null
  shape: TableShape
  posX?: number | null
  posY?: number | null
  rotation?: number | null
  active: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

export type TableRequest = {
  branchId: number
  name: string
  sectionId?: number | null
  capacity?: number | null
  active: boolean
}

export type TableLayoutRequest = {
  posX?: number | null
  posY?: number | null
  rotation?: number | null
  shape: TableShape
}
