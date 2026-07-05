export type PermissionResponse = {
  id: number
  code: string
  module: string
  /** Legacy single-locale fields; prefer nameEn/nameAr when present. */
  name?: string
  nameEn?: string | null
  nameAr?: string | null
  description?: string
  descriptionEn?: string | null
  descriptionAr?: string | null
  type: string
  active: boolean
}

export type PermissionSelectionResponse = {
  id: number
  code: string
  module: string
  name?: string
  nameEn?: string | null
  nameAr?: string | null
  description?: string
  descriptionEn?: string | null
  descriptionAr?: string | null
  type: string
  active: boolean
  selected: boolean
}

export type UserPermissionsResponse = {
  tenantId: number
  userId: number
  permissions: PermissionSelectionResponse[]
}

export type ReplaceUserPermissionsRequest = {
  permissionCodes: string[]
}
