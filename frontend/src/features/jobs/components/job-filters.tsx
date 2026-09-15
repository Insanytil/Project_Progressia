import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import type { JobStatus, JobType } from '../model/job.types'

type OrganizationOption = { id: string; name: string }

type JobFiltersProps = {
  search: string
  status: JobStatus | 'all'
  type: JobType | 'all'
  organizationId: string
  organizations?: OrganizationOption[]
  pageSize: number
  onSearchChange: (value: string) => void
  onStatusChange: (value: JobStatus | 'all') => void
  onTypeChange: (value: JobType | 'all') => void
  onOrganizationChange: (value: string) => void
  onPageSizeChange: (value: number) => void
}

const statusLabels: Record<JobStatus | 'all', string> = {
  all: 'Tous les statuts',
  queued: 'En attente',
  running: 'En cours',
  succeeded: 'Terminés',
  failed: 'Échoués',
  cancelled: 'Annulés',
}

const typeLabels: Record<JobType | 'all', string> = {
  all: 'Tous les types',
  account_verification_email: 'Envois de vérification de compte',
  password_reset_email: 'Envois de réinitialisation du mot de passe',
}

export function JobFilters(props: JobFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={props.search} onChange={(event) => props.onSearchChange(event.target.value)} placeholder="Rechercher un déclencheur ou un destinataire…" className="h-9 pl-9" />
      </div>
      {props.organizations && (
        <Select value={props.organizationId} onValueChange={(value) => props.onOrganizationChange(String(value))}>
          <SelectTrigger className="h-9 w-52"><SelectValue>{props.organizationId === 'all' ? 'Toutes les organisations' : props.organizations.find((item) => item.id === props.organizationId)?.name ?? 'Organisation inconnue'}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les organisations</SelectItem>
            {props.organizations.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      <Select value={props.status} onValueChange={(value) => props.onStatusChange(value as JobStatus | 'all')}>
        <SelectTrigger className="h-9 w-40"><SelectValue>{statusLabels[props.status]}</SelectValue></SelectTrigger>
        <SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={props.type} onValueChange={(value) => props.onTypeChange(value as JobType | 'all')}>
        <SelectTrigger className="h-9 w-40"><SelectValue>{typeLabels[props.type]}</SelectValue></SelectTrigger>
        <SelectContent>{Object.entries(typeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={String(props.pageSize)} onValueChange={(value) => props.onPageSizeChange(Number(value))}>
        <SelectTrigger className="h-9 min-w-24"><SelectValue>{props.pageSize} / page</SelectValue></SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10 / page</SelectItem>
          <SelectItem value="20">20 / page</SelectItem>
          <SelectItem value="50">50 / page</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
