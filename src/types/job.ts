export type JobResponse = {
  id: number
  name: string
  nameEn?: string | null
  nameAr?: string | null
  code: string
  description?: string | null
  descriptionEn?: string | null
  descriptionAr?: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export type CreateJobRequest = {
  name: string
  nameAr?: string | null
  description?: string
  active: boolean
}

export type UpdateJobRequest = {
  name: string
  nameAr?: string | null
  description?: string
  active: boolean
}

export type UpdateActiveStatusRequest = {
  active: boolean
}
