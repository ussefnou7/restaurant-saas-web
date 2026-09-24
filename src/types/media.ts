export type MediaPurpose = 'PRODUCT_IMAGE' | 'EMPLOYEE_PHOTO'

export type MediaOwnerType = 'PRODUCT' | 'EMPLOYEE'

export type MediaVariantType = 'ORIGINAL' | 'LARGE' | 'MEDIUM' | 'THUMB'

export interface MediaVariantResponse {
  variant: MediaVariantType
  width: number | null
  height: number | null
  sizeBytes: number
  /**
   * Relative and built by the server at read time — never stored. Do not persist it, and do not
   * assume it survives a storage-provider change.
   */
  url: string
}

export interface MediaResponse {
  linkId: number
  mediaFileId: number
  ownerType: MediaOwnerType
  ownerId: number
  purpose: MediaPurpose
  sortOrder: number
  originalFilename: string
  contentType: string
  sizeBytes: number
  width: number | null
  height: number | null
  variants: MediaVariantResponse[]
}

/**
 * Mirrors the server's per-purpose ceilings so the picker can refuse an oversize file before
 * spending the upload. The server enforces the same numbers and is the authority — this is a
 * courtesy check, not the guard.
 */
export const MEDIA_MAX_BYTES: Record<MediaPurpose, number> = {
  PRODUCT_IMAGE: 10 * 1024 * 1024,
  EMPLOYEE_PHOTO: 5 * 1024 * 1024,
}

export const MEDIA_ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp'
