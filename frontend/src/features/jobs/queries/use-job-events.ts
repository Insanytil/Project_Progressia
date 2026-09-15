import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import type { JobScope } from '../model/job.types'
import { jobQueryKeys } from './job-queries'

function eventUrl(scope: JobScope) {
  if (scope.kind === 'platform') return '/api/platform/jobs/events'
  const organizationId = encodeURIComponent(scope.organizationId)
  return `/api/organization-administration/jobs/events?organization_id=${organizationId}`
}

export function useJobEvents(scope: JobScope) {
  const queryClient = useQueryClient()
  const url = eventUrl(scope)

  useEffect(() => {
    const eventSource = new EventSource(url)
    let refreshTimer: ReturnType<typeof setTimeout> | undefined

    const refreshJobs = () => {
      if (refreshTimer) return
      refreshTimer = setTimeout(() => {
        refreshTimer = undefined
        void queryClient.invalidateQueries({ queryKey: jobQueryKeys.all })
      }, 500)
    }

    eventSource.addEventListener('job.updated', refreshJobs)
    eventSource.addEventListener('open', refreshJobs)

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer)
      eventSource.removeEventListener('job.updated', refreshJobs)
      eventSource.removeEventListener('open', refreshJobs)
      eventSource.close()
    }
  }, [queryClient, url])
}
