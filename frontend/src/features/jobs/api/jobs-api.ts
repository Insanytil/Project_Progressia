import { apiClient } from '@/lib/api/client'

import type { Job, JobListParams, JobScope, PaginatedJobs } from '../model/job.types'

function endpoint(scope: JobScope) {
  return scope.kind === 'platform' ? '/platform/jobs' : '/organization-administration/jobs'
}

function headers(scope: JobScope) {
  return scope.kind === 'organization'
    ? { 'X-Organization-ID': scope.organizationId }
    : undefined
}

export async function getJobs(scope: JobScope, params: JobListParams): Promise<PaginatedJobs> {
  const { data } = await apiClient.get<PaginatedJobs>(endpoint(scope), {
    headers: headers(scope),
    params: {
      page: params.page,
      page_size: params.pageSize,
      search: params.search,
      status: params.status,
      type: params.type,
      organization_id: scope.kind === 'platform' ? params.organizationId : undefined,
    },
  })
  return data
}

export async function getJobBatch(scope: JobScope, batchId: string): Promise<Job[]> {
  const { data } = await apiClient.get<Job[]>(
    `${endpoint(scope)}/batches/${batchId}`,
    { headers: headers(scope) },
  )
  return data
}

export async function retryJob(scope: JobScope, jobId: string): Promise<{ queued: boolean }> {
  const { data } = await apiClient.post<{ queued: boolean }>(
    `${endpoint(scope)}/${jobId}/retry`,
    undefined,
    { headers: headers(scope) },
  )
  return data
}

export async function cancelJob(scope: JobScope, jobId: string): Promise<void> {
  await apiClient.post(
    `${endpoint(scope)}/${jobId}/cancel`,
    undefined,
    { headers: headers(scope) },
  )
}
