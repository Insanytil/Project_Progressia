import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import type { Organization } from '../model/organization.types'
import { OrganizationActions } from './organization-actions'

const dateFormatter = new Intl.DateTimeFormat('fr-BE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

type OrganizationTableProps = {
  organizations: Organization[]
  isLoading: boolean
  onView: (organization: Organization) => void
  onEdit: (organization: Organization) => void
  onToggleActive: (organization: Organization) => void
  onDelete: (organization: Organization) => void
  togglingOrganizationId?: string
}

export function OrganizationTable({
  organizations,
  isLoading,
  onView,
  onEdit,
  onToggleActive,
  onDelete,
  togglingOrganizationId,
}: OrganizationTableProps) {
  return (
    <div className="h-full overflow-auto rounded-xl border bg-card [&>[data-slot=table-container]]:overflow-visible">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted">
          <TableRow>
            <TableHead className="pl-4">Organisation</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Créée le</TableHead>
            <TableHead className="w-14 text-right"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell className="pl-4"><Skeleton className="h-4 w-36" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="ml-auto size-8" /></TableCell>
            </TableRow>
          ))}

          {!isLoading && organizations.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                Aucune organisation ne correspond à ces critères.
              </TableCell>
            </TableRow>
          )}

          {!isLoading && organizations.map((organization, index) => (
            <TableRow
              key={organization.id}
              className={
                index % 2 === 1
                  ? 'bg-muted/60 hover:bg-primary/15'
                  : 'hover:bg-primary/10'
              }
            >
              <TableCell className="pl-4 font-medium">{organization.name}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{organization.slug}</TableCell>
              <TableCell>
                <Badge variant={organization.is_active ? 'secondary' : 'outline'}>
                  {organization.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {dateFormatter.format(new Date(organization.created_at))}
              </TableCell>
              <TableCell className="text-right">
                <OrganizationActions
                  organization={organization}
                  onView={onView}
                  onEdit={onEdit}
                  onToggleActive={onToggleActive}
                  onDelete={onDelete}
                  isToggling={togglingOrganizationId === organization.id}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
