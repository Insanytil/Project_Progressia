import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import type { OrganizationMember } from '../model/member.types'
import { MemberActions } from './member-actions'

const roleLabels: Record<OrganizationMember['role'], string> = {
  organization_admin: 'Administrateur',
  teacher: 'Enseignant',
  student: 'Étudiant',
}

type MemberTableProps = {
  members: OrganizationMember[]
  isLoading: boolean
  pendingUserId?: string
  onManage: (member: OrganizationMember) => void
  onPasswordReset: (member: OrganizationMember) => void
}

export function MemberTable({ members, isLoading, pendingUserId, onManage, onPasswordReset }: MemberTableProps) {
  return (
    <div className="h-full overflow-auto rounded-xl border bg-card [&>[data-slot=table-container]]:overflow-visible">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted">
          <TableRow>
            <TableHead className="pl-4">Utilisateur</TableHead>
            <TableHead>Compte</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Accès</TableHead>
            <TableHead>Vérification</TableHead>
            <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>{Array.from({ length: 6 }).map((__, cell) => <TableCell key={cell}><Skeleton className="h-5 w-24" /></TableCell>)}</TableRow>
          ))}
          {!isLoading && members.length === 0 && (
            <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Aucun membre ne correspond à cette recherche.</TableCell></TableRow>
          )}
          {!isLoading && members.map((member, index) => (
            <TableRow key={member.id} className={index % 2 === 1 ? 'bg-muted/60 hover:bg-primary/15' : 'hover:bg-primary/10'}>
              <TableCell className="pl-4 font-medium">{member.email}</TableCell>
              <TableCell><Badge variant={member.is_active ? 'secondary' : 'outline'}>{member.is_active ? 'Actif' : 'Désactivé globalement'}</Badge></TableCell>
              <TableCell>{roleLabels[member.role]}</TableCell>
              <TableCell><Badge variant={member.membership_is_active ? 'secondary' : 'outline'}>{member.membership_is_active ? 'Actif' : 'Désactivé'}</Badge></TableCell>
              <TableCell><Badge variant={member.is_verified ? 'secondary' : 'outline'}>{member.is_verified ? 'Vérifié' : 'En attente'}</Badge></TableCell>
              <TableCell><MemberActions member={member} isPending={pendingUserId === member.id} onManage={() => onManage(member)} onPasswordReset={() => onPasswordReset(member)} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
