import type { CreateJobRequest, JobResponse, UpdateJobRequest } from '../types/job'
import { api } from './api'

export async function getJobs(): Promise<JobResponse[]> {
  const response = await api.get<JobResponse[]>('/api/jobs')
  return response.data
}

export async function createJob(payload: CreateJobRequest): Promise<JobResponse> {
  const response = await api.post<JobResponse>('/api/jobs', payload)
  return response.data
}

export async function updateJob(
  id: number | string,
  payload: UpdateJobRequest,
): Promise<JobResponse> {
  const response = await api.put<JobResponse>(`/api/jobs/${id}`, payload)
  return response.data
}

export async function updateJobStatus(
  id: number | string,
  active: boolean,
): Promise<JobResponse> {
  const response = await api.patch<JobResponse>(`/api/jobs/${id}/status`, { active })
  return response.data
}
