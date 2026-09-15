import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PaginationControls } from '@/components/data-display/pagination-controls'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

import { useCancelJobMutation, useRetryJobMutation } from '../mutations/use-job-mutations'
import type { JobActionTarget, JobScope, JobStatus, JobType } from '../model/job.types'
import { jobsQueryOptions } from '../queries/job-queries'
import { JobCancelDialog } from './job-cancel-dialog'
import { JobFilters } from './job-filters'
import { JobTable } from './job-table'

type OrganizationOption = { id: string; name: string }

type JobManagementProps = {
  scope: JobScope
  organizations?: OrganizationOption[]
}

export function JobManagement({ scope, organizations }: JobManagementProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<JobType | 'all'>('all')
  const [organizationId, setOrganizationId] = useState('all')
  const [jobToCancel, setJobToCancel] = useState<JobActionTarget | null>(null)
  const search = useDebouncedValue(searchInput.trim())
  const params = useMemo(() => ({
    page,
    pageSize,
    search: search || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    type: typeFilter === 'all' ? undefined : typeFilter,
    organizationId: organizationId === 'all' ? undefined : organizationId,
  }), [organizationId, page, pageSize, search, statusFilter, typeFilter])
  const jobsQuery = useQuery(jobsQueryOptions(scope, params))
  const retryMutation = useRetryJobMutation()
  const cancelMutation = useCancelJobMutation()

  const scopedOrganizationId = scope.kind === 'organization' ? scope.organizationId : null
  useEffect(() => setPage(1), [search, statusFilter, typeFilter, organizationId, scope.kind, scopedOrganizationId])

  async function retry(job: JobActionTarget) {
    try {
      const result = await retryMutation.mutateAsync({ scope, jobId: job.id })
      result.queued
        ? toast.success('Job remis en file d’attente.')
        : toast.warning('Job réinitialisé, mais Redis est indisponible.')
    } catch {
      toast.error('Ce job ne peut pas être relancé.')
    }
  }

  async function cancel(job: JobActionTarget) {
    try {
      await cancelMutation.mutateAsync({ scope, jobId: job.id })
      toast.success('Job annulé.')
      setJobToCancel(null)
    } catch {
      toast.error('Seul un job en attente peut être annulé.')
    }
  }

  const pendingJobId = retryMutation.isPending
    ? retryMutation.variables?.jobId
    : cancelMutation.isPending ? cancelMutation.variables?.jobId : undefined

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Suivez les traitements asynchrones et intervenez en cas d’échec.</p>
      </div>
      <JobFilters
        search={searchInput}
        status={statusFilter}
        type={typeFilter}
        organizationId={organizationId}
        organizations={organizations}
        pageSize={pageSize}
        onSearchChange={setSearchInput}
        onStatusChange={setStatusFilter}
        onTypeChange={setTypeFilter}
        onOrganizationChange={setOrganizationId}
        onPageSizeChange={(value) => { setPage(1); setPageSize(value) }}
      />
      {jobsQuery.isError ? (
        <Alert variant="destructive"><AlertTitle>Chargement impossible</AlertTitle><AlertDescription>Les jobs n’ont pas pu être récupérés.</AlertDescription></Alert>
      ) : (
        <div className={`min-h-0 flex-1 ${jobsQuery.isFetching && !jobsQuery.isPending ? 'opacity-65' : ''}`}>
          <JobTable scope={scope} jobs={jobsQuery.data?.items ?? []} isLoading={jobsQuery.isPending} showOrganization={scope.kind === 'platform'} pendingJobId={pendingJobId} onRetry={(job) => void retry(job)} onCancel={setJobToCancel} />
        </div>
      )}
      {jobsQuery.data && (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>{jobsQuery.data.pagination.total} traitement{jobsQuery.data.pagination.total > 1 ? 's' : ''}</p>
          <PaginationControls page={jobsQuery.data.pagination.page} totalPages={jobsQuery.data.pagination.total_pages} onPageChange={setPage} />
        </div>
      )}
      <JobCancelDialog
        job={jobToCancel}
        isPending={cancelMutation.isPending}
        onOpenChange={(open) => { if (!open) setJobToCancel(null) }}
        onConfirm={() => { if (jobToCancel) void cancel(jobToCancel) }}
      />
    </div>
  )
}
