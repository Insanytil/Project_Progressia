import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import type { Organization } from '../model/organization.types'

export type UserAccountStatusFilter = 'all' | 'active' | 'inactive'

type PlatformUserFiltersProps = {
  search: string
  organizationId: string
  accountStatus: UserAccountStatusFilter
  pageSize: number
  organizations: Organization[]
  onSearchChange: (value: string) => void
  onOrganizationChange: (value: string) => void
  onAccountStatusChange: (value: UserAccountStatusFilter) => void
  onPageSizeChange: (value: number) => void
}

export function PlatformUserFilters({
  search,
  organizationId,
  accountStatus,
  pageSize,
  organizations,
  onSearchChange,
  onOrganizationChange,
  onAccountStatusChange,
  onPageSizeChange,
}: PlatformUserFiltersProps) {
  const selectedOrganizationLabel = organizationId === 'all'
    ? 'Toutes les organisations'
    : organizations.find((organization) => organization.id === organizationId)?.name
      ?? 'Organisation inconnue'
  const accountStatusLabels: Record<UserAccountStatusFilter, string> = {
    all: 'Tous les comptes',
    active: 'Comptes actifs',
    inactive: 'Comptes désactivés',
  }

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Rechercher par e-mail…"
          className="h-9 pl-9"
        />
      </div>
      <Select value={organizationId} onValueChange={(value) => onOrganizationChange(String(value))}>
        <SelectTrigger className="h-9 w-52">
          <SelectValue>{selectedOrganizationLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les organisations</SelectItem>
          {organizations.map((organization) => (
            <SelectItem key={organization.id} value={organization.id}>{organization.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={accountStatus} onValueChange={(value) => onAccountStatusChange(value as UserAccountStatusFilter)}>
        <SelectTrigger className="h-9 w-40">
          <SelectValue>{accountStatusLabels[accountStatus]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les comptes</SelectItem>
          <SelectItem value="active">Comptes actifs</SelectItem>
          <SelectItem value="inactive">Comptes désactivés</SelectItem>
        </SelectContent>
      </Select>
      <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
        <SelectTrigger className="h-9 min-w-24" aria-label="Utilisateurs par page">
          <SelectValue>{pageSize} / page</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10 / page</SelectItem>
          <SelectItem value="20">20 / page</SelectItem>
          <SelectItem value="50">50 / page</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
