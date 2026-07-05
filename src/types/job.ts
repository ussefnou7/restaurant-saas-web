export type JobResponse = {
  id: number
  name: string
  code: string
  description?: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export type CreateJobRequest = {
  name: string
  code: string
  description?: string
  active: boolean
}

export type UpdateJobRequest = {
  name: string
  code: string
  description?: string
  active: boolean
}

export type UpdateActiveStatusRequest = {
  active: boolean
}
