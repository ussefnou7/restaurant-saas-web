export type TableSection = {
  id: number
  branchId: number
  name: string
  nameAr?: string | null
  active: boolean
}

export type TableSectionRequest = {
  branchId: number
  name: string
  nameAr?: string | null
}
