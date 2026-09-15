import { useQuery } from '@tanstack/react-query'

import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import type { JobActionTarget, JobScope } from '../model/job.types'
import { jobBatchQueryOptions } from '../queries/job-queries'
import { JobActions } from './job-actions'
import { JobStatusBadge } from './job-status-badge'

type JobBatchDetailsProps = {
  batchId: string
  scope: JobScope
  pendingJobId?: string
  onRetry: (job: JobActionTarget) => void
  onCancel: (job: JobActionTarget) => void
}

export function JobBatchDetails(props: JobBatchDetailsProps) {
  const query = useQuery(jobBatchQueryOptions(props.scope, props.batchId))

  if (query.isPending) {
    return <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-8 w-full" />)}</div>
  }

  if (query.isError) {
    return <p className="p-4 text-sm text-destructive">Impossible de charger le détail de ce lot.</p>
  }

  return (
    <div className="p-3">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/70 hover:bg-muted/70">
            <TableHead>Destinataire</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Tentatives</TableHead>
            <TableHead>Dernière erreur</TableHead>
            <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.data.map((job, index) => (
            <TableRow key={job.id} className={index % 2 === 1 ? 'bg-muted/50 hover:bg-primary/15' : 'hover:bg-primary/10'}>
              <TableCell className="font-medium">{job.recipient_email ?? '—'}</TableCell>
              <TableCell><JobStatusBadge status={job.status} /></TableCell>
              <TableCell>{job.attempts} / {job.max_attempts}</TableCell>
              <TableCell className="max-w-80 truncate text-muted-foreground" title={job.last_error ?? undefined}>{job.last_error ?? '—'}</TableCell>
              <TableCell><JobActions job={job} isPending={props.pendingJobId === job.id} onRetry={() => props.onRetry(job)} onCancel={() => props.onCancel(job)} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
