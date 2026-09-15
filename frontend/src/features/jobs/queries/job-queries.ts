import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import { getJobBatch, getJobs } from '../api/jobs-api'
import type { JobListParams, JobScope } from '../model/job.types'

export const jobQueryKeys = {
  all: ['background-jobs'] as const,
  list: (scope: JobScope, params: JobListParams) => [
    ...jobQueryKeys.all,
    scope,
    params,
  ] as const,
  batch: (scope: JobScope, batchId: string) => [
    ...jobQueryKeys.all,
    'batch',
    scope,
    batchId,
  ] as const,
}

export function jobBatchQueryOptions(scope: JobScope, batchId: string) {
  return queryOptions({
    queryKey: jobQueryKeys.batch(scope, batchId),
    queryFn: () => getJobBatch(scope, batchId),
  })
}

export function jobsQueryOptions(scope: JobScope, params: JobListParams) {
  return queryOptions({
    queryKey: jobQueryKeys.list(scope, params),
    queryFn: () => getJobs(scope, params),
    placeholderData: keepPreviousData,
  })
}
