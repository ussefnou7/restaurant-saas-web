export type BranchResponse = {
  id: number
  name: string
  nameEn?: string | null
  nameAr?: string | null
  code: string
  address?: string | null
  addressEn?: string | null
  addressAr?: string | null
  phone?: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export type CreateBranchRequest = {
  name: string
  code: string
  nameAr?: string | null
  address?: string
  phone?: string
  active: boolean
}

export type UpdateBranchRequest = {
  name: string
  code: string
  nameAr?: string | null
  address?: string
  phone?: string
  active: boolean
}

export type UpdateBranchStatusRequest = {
  active: boolean
}
