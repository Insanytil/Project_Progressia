import { useMutation, useQueryClient } from '@tanstack/react-query'

import { cancelJob, retryJob } from '../api/jobs-api'
import type { JobScope } from '../model/job.types'
import { jobQueryKeys } from '../queries/job-queries'

export function useRetryJobMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ scope, jobId }: { scope: JobScope; jobId: string }) => retryJob(scope, jobId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jobQueryKeys.all }),
  })
}

export function useCancelJobMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ scope, jobId }: { scope: JobScope; jobId: string }) => cancelJob(scope, jobId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jobQueryKeys.all }),
  })
}
