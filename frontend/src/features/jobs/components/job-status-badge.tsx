import { Badge } from '@/components/ui/badge'

import type { JobGroup, JobStatus } from '../model/job.types'

const statusLabels: Record<JobStatus, string> = {
  queued: 'En attente',
  running: 'En cours',
  succeeded: 'Terminé',
  failed: 'Échoué',
  cancelled: 'Annulé',
}

function statusVariant(status: JobStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'failed') return 'destructive'
  if (status === 'succeeded') return 'secondary'
  if (status === 'running') return 'default'
  return 'outline'
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <Badge variant={statusVariant(status)}>{statusLabels[status]}</Badge>
}

export function JobGroupStatusBadge({ group }: { group: JobGroup }) {
  if (group.running_jobs > 0) return <Badge>En cours</Badge>
  if (group.queued_jobs > 0) return <Badge variant="outline">En attente</Badge>
  if (group.failed_jobs === group.total_jobs) return <Badge variant="destructive">Échoué</Badge>
  if (group.failed_jobs > 0) return <Badge variant="destructive">Partiellement échoué</Badge>
  if (group.cancelled_jobs === group.total_jobs) return <Badge variant="outline">Annulé</Badge>
  if (group.succeeded_jobs === group.total_jobs) return <Badge variant="secondary">Terminé</Badge>
  return <Badge variant="outline">Partiellement terminé</Badge>
}

export function groupActionStatus(group: JobGroup): JobStatus {
  if (group.running_jobs > 0) return 'running'
  if (group.queued_jobs > 0) return 'queued'
  if (group.failed_jobs > 0) return 'failed'
  if (group.cancelled_jobs > 0) return 'cancelled'
  return 'succeeded'
}
