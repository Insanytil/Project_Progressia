export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'
export type JobType = 'account_verification_email' | 'password_reset_email'

export type Job = {
  id: string
  organization_id: string | null
  organization_name: string | null
  triggered_by_user_id: string | null
  triggered_by_email: string | null
  batch_id: string | null
  recipient_email: string | null
  type: JobType
  status: JobStatus
  attempts: number
  max_attempts: number
  last_error: string | null
  created_at: string
  started_at: string | null
  finished_at: string | null
}

export type JobGroup = {
  id: string
  batch_id: string | null
  organization_id: string | null
  organization_name: string | null
  triggered_by_user_id: string | null
  triggered_by_email: string | null
  recipient_email: string | null
  type: JobType
  total_jobs: number
  queued_jobs: number
  running_jobs: number
  succeeded_jobs: number
  failed_jobs: number
  cancelled_jobs: number
  attempts: number
  max_attempts: number
  last_error: string | null
  created_at: string
  latest_activity_at: string
}

export type JobActionTarget = Pick<Job, 'id' | 'recipient_email' | 'status'>

export type JobListParams = {
  page: number
  pageSize: number
  search?: string
  status?: JobStatus
  type?: JobType
  organizationId?: string
}

export type PaginatedJobs = {
  items: JobGroup[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

export type JobScope =
  | { kind: 'platform' }
  | { kind: 'organization'; organizationId: string }
