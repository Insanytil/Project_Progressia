import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import type { PlatformUser, UserMembership } from '../model/user.types'
import { PlatformUserActions } from './platform-user-actions'
import { UserMembershipsDropdown } from './user-memberships-dropdown'

type PlatformUserTableProps = {
  users: PlatformUser[]
  isLoading: boolean
  pendingUserId?: string
  pendingMembershipId?: string
  onResendVerification: (user: PlatformUser) => void
  onSendPasswordReset: (user: PlatformUser) => void
  onToggleActive: (user: PlatformUser) => void
  onAddToOrganization: (user: PlatformUser) => void
  onToggleOrganizationAccess: (user: PlatformUser, membership: UserMembership) => void
}

export function PlatformUserTable({
  users,
  isLoading,
  pendingUserId,
  pendingMembershipId,
  onResendVerification,
  onSendPasswordReset,
  onToggleActive,
  onAddToOrganization,
  onToggleOrganizationAccess,
}: PlatformUserTableProps) {
  return (
    <div className="h-full overflow-auto rounded-xl border bg-card [&>[data-slot=table-container]]:overflow-visible">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted">
          <TableRow>
            <TableHead className="pl-4">Utilisateur</TableHead>
            <TableHead>Compte</TableHead>
            <TableHead>Organisations et rôles</TableHead>
            <TableHead>Vérification</TableHead>
            <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell className="pl-4"><Skeleton className="h-4 w-44" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-8 w-36" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
              <TableCell><Skeleton className="size-8" /></TableCell>
            </TableRow>
          ))}
          {!isLoading && users.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                Aucun utilisateur ne correspond à cette recherche.
              </TableCell>
            </TableRow>
          )}
          {!isLoading && users.map((user, index) => {
            return (
              <TableRow
                key={user.id}
                className={
                  index % 2 === 1
                    ? 'bg-muted/60 hover:bg-primary/15'
                    : 'hover:bg-primary/10'
                }
              >
                <TableCell className="pl-4 font-medium">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? 'secondary' : 'outline'}>
                    {user.is_active ? 'Actif' : 'Désactivé'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <UserMembershipsDropdown
                    memberships={user.memberships}
                    disabled={Boolean(pendingMembershipId)}
                    onToggleAccess={(membership) => onToggleOrganizationAccess(user, membership)}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_verified ? 'secondary' : 'outline'}>
                    {user.is_verified ? 'Vérifié' : 'En attente d’activation'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <PlatformUserActions
                    user={user}
                    isPending={pendingUserId === user.id}
                    onResendVerification={onResendVerification}
                    onSendPasswordReset={onSendPasswordReset}
                    onToggleActive={onToggleActive}
                    onAddToOrganization={onAddToOrganization}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
