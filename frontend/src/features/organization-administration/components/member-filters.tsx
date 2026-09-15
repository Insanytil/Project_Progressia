import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type MembershipStatusFilter = 'all' | 'active' | 'inactive'

type MemberFiltersProps = {
  search: string
  status: MembershipStatusFilter
  pageSize: number
  onSearchChange: (value: string) => void
  onStatusChange: (value: MembershipStatusFilter) => void
  onPageSizeChange: (value: number) => void
}

const statusLabels: Record<MembershipStatusFilter, string> = {
  all: 'Tous les accès',
  active: 'Accès actifs',
  inactive: 'Accès désactivés',
}

export function MemberFilters({
  search,
  status,
  pageSize,
  onSearchChange,
  onStatusChange,
  onPageSizeChange,
}: MemberFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Rechercher par e-mail…" className="h-9 pl-9" />
      </div>
      <Select value={status} onValueChange={(value) => onStatusChange(value as MembershipStatusFilter)}>
        <SelectTrigger className="h-9 w-44"><SelectValue>{statusLabels[status]}</SelectValue></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les accès</SelectItem>
          <SelectItem value="active">Accès actifs</SelectItem>
          <SelectItem value="inactive">Accès désactivés</SelectItem>
        </SelectContent>
      </Select>
      <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
        <SelectTrigger className="h-9 min-w-24"><SelectValue>{pageSize} / page</SelectValue></SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10 / page</SelectItem>
          <SelectItem value="20">20 / page</SelectItem>
          <SelectItem value="50">50 / page</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
