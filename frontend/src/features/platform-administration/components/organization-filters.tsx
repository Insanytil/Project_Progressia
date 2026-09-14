import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type OrganizationStatusFilter = 'all' | 'active' | 'inactive'

type OrganizationFiltersProps = {
  search: string
  status: OrganizationStatusFilter
  pageSize: number
  onSearchChange: (search: string) => void
  onStatusChange: (status: OrganizationStatusFilter) => void
  onPageSizeChange: (pageSize: number) => void
}

export function OrganizationFilters({
  search,
  status,
  pageSize,
  onSearchChange,
  onStatusChange,
  onPageSizeChange,
}: OrganizationFiltersProps) {
  const statusLabels: Record<OrganizationStatusFilter, string> = {
    all: 'Tous les statuts',
    active: 'Actives',
    inactive: 'Inactives',
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex flex-1 gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Rechercher une organisation…"
            className="h-9 pl-9"
            aria-label="Rechercher une organisation"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Select value={status} onValueChange={(value) => onStatusChange(value as OrganizationStatusFilter)}>
          <SelectTrigger className="h-9 min-w-32">
            <SelectValue>{statusLabels[status]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actives</SelectItem>
            <SelectItem value="inactive">Inactives</SelectItem>
          </SelectContent>
        </Select>

        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger className="h-9 min-w-24" aria-label="Résultats par page">
            <SelectValue>{pageSize} / page</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 / page</SelectItem>
            <SelectItem value="20">20 / page</SelectItem>
            <SelectItem value="50">50 / page</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
