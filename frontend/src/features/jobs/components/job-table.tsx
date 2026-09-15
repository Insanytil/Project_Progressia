import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import type { JobActionTarget, JobGroup, JobScope, JobType } from '../model/job.types'
import { JobActions } from './job-actions'
import { JobBatchDetails } from './job-batch-details'
import { groupActionStatus, JobGroupStatusBadge } from './job-status-badge'

const typeLabels: Record<JobType, string> = {
  account_verification_email: 'Envoi d’un e-mail de vérification du compte',
  password_reset_email: 'Envoi d’un e-mail de réinitialisation du mot de passe',
}

const dateTimeFormatter = new Intl.DateTimeFormat('fr-BE', {
  dateStyle: 'short',
  timeStyle: 'short',
})

type JobTableProps = {
  scope: JobScope
  jobs: JobGroup[]
  isLoading: boolean
  showOrganization: boolean
  pendingJobId?: string
  onRetry: (job: JobActionTarget) => void
  onCancel: (job: JobActionTarget) => void
}

type JobGroupRowsProps = Omit<JobTableProps, 'jobs' | 'isLoading'> & {
  group: JobGroup
  index: number
  columnCount: number
}

function JobGroupRows({ group, index, columnCount, ...props }: JobGroupRowsProps) {
  const [open, setOpen] = useState(false)
  const isBatch = group.batch_id !== null
  const actionTarget: JobActionTarget = {
    id: group.id,
    recipient_email: group.recipient_email,
    status: groupActionStatus(group),
  }

  return (
    <Collapsible render={<tbody />} open={open} onOpenChange={setOpen}>
      <TableRow className={index % 2 === 1 ? 'bg-muted/60 hover:bg-primary/15' : 'hover:bg-primary/10'}>
        <TableCell className="pl-4 font-medium">{group.triggered_by_email ?? 'Système'}</TableCell>
        <TableCell>
          {isBatch ? (
            <div className="flex flex-col gap-0.5">
              <span>{group.total_jobs} destinataire{group.total_jobs > 1 ? 's' : ''}</span>
              <span className="font-mono text-xs text-muted-foreground" title={group.batch_id ?? undefined}>Lot {group.batch_id?.slice(0, 8)}</span>
            </div>
          ) : group.recipient_email ?? '—'}
        </TableCell>
        {props.showOrganization && <TableCell>{group.organization_name ?? 'Plateforme'}</TableCell>}
        <TableCell>{typeLabels[group.type]}</TableCell>
        <TableCell><JobGroupStatusBadge group={group} /></TableCell>
        <TableCell>
          {isBatch
            ? `${group.succeeded_jobs + group.failed_jobs + group.cancelled_jobs} / ${group.total_jobs} traités`
            : `${group.attempts} / ${group.max_attempts} tentatives`}
        </TableCell>
        <TableCell>{dateTimeFormatter.format(new Date(group.created_at))}</TableCell>
        <TableCell className="max-w-64 truncate text-muted-foreground" title={group.last_error ?? undefined}>
          {isBatch && group.failed_jobs > 0 ? `${group.failed_jobs} job${group.failed_jobs > 1 ? 's' : ''} en échec` : group.last_error ?? '—'}
        </TableCell>
        <TableCell>
          {isBatch ? (
            <CollapsibleTrigger
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={open ? 'Masquer le détail du lot' : 'Afficher le détail du lot'}
            >
              <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
          ) : (
            <JobActions job={actionTarget} isPending={props.pendingJobId === group.id} onRetry={() => props.onRetry(actionTarget)} onCancel={() => props.onCancel(actionTarget)} />
          )}
        </TableCell>
      </TableRow>
      {isBatch && (
        <CollapsibleContent render={<tr className="border-b bg-muted/20" />}>
          <TableCell colSpan={columnCount} className="p-0 whitespace-normal">
            {open && (
              <JobBatchDetails
                batchId={group.batch_id!}
                scope={props.scope}
                pendingJobId={props.pendingJobId}
                onRetry={props.onRetry}
                onCancel={props.onCancel}
              />
            )}
          </TableCell>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}

export function JobTable(props: JobTableProps) {
  const columnCount = props.showOrganization ? 9 : 8
  return (
    <div className="h-full overflow-auto rounded-xl border bg-card [&>[data-slot=table-container]]:overflow-visible">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted">
          <TableRow>
            <TableHead className="pl-4">Déclenché par</TableHead>
            <TableHead>Cible</TableHead>
            {props.showOrganization && <TableHead>Organisation</TableHead>}
            <TableHead>Type</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Exécution</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead>Dernière erreur</TableHead>
            <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        {props.isLoading && (
          <TableBody>{Array.from({ length: 6 }).map((_, index) => (
            <TableRow key={index}>{Array.from({ length: columnCount }).map((__, cell) => <TableCell key={cell}><Skeleton className="h-5 w-24" /></TableCell>)}</TableRow>
          ))}</TableBody>
        )}
        {!props.isLoading && props.jobs.length === 0 && (
          <TableBody><TableRow><TableCell colSpan={columnCount} className="h-32 text-center text-muted-foreground">Aucun job ne correspond aux filtres.</TableCell></TableRow></TableBody>
        )}
        {!props.isLoading && props.jobs.map((group, index) => (
          <JobGroupRows key={group.id} {...props} group={group} index={index} columnCount={columnCount} />
        ))}
      </Table>
    </div>
  )
}
