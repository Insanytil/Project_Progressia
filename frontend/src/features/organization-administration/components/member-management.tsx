import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { PaginationControls } from '@/components/data-display/pagination-controls'
import { MembershipAccessDialog } from '@/features/memberships/components/membership-access-dialog'
import { MemberImportDialog } from '@/features/member-imports/components/member-import-dialog'
import { useOrganizationContext } from '@/features/organization-context'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

import {
  useOrganizationMemberPasswordResetMutation,
  useUpdateOrganizationMemberMutation,
} from '../mutations/use-member-mutations'
import type { OrganizationMember } from '../model/member.types'
import { organizationMembersQueryOptions } from '../queries/member-queries'
import { MemberFilters, type MembershipStatusFilter } from './member-filters'
import { MemberTable } from './member-table'
import { CreateMemberDialog } from './create-member-dialog'

export function MemberManagement() {
  const { currentOrganization } = useOrganizationContext()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<MembershipStatusFilter>('all')
  const [memberToManage, setMemberToManage] = useState<OrganizationMember | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const search = useDebouncedValue(searchInput.trim())
  const params = useMemo(() => ({
    page,
    pageSize,
    search: search || undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
  }), [page, pageSize, search, statusFilter])
  const membersQuery = useQuery({
    ...organizationMembersQueryOptions(currentOrganization?.id ?? '', params),
    enabled: Boolean(currentOrganization),
  })
  const updateMutation = useUpdateOrganizationMemberMutation()
  const resetMutation = useOrganizationMemberPasswordResetMutation()

  useEffect(() => {
    setPage(1)
    setMemberToManage(null)
  }, [search, currentOrganization?.id])

  async function updateMember(changes: { role: OrganizationMember['role']; isActive: boolean }) {
    if (!currentOrganization || !memberToManage) return
    try {
      await updateMutation.mutateAsync({ organizationId: currentOrganization.id, userId: memberToManage.id, role: changes.role, isActive: changes.isActive })
      toast.success('Rôle et accès mis à jour.')
      setMemberToManage(null)
    } catch {
      toast.error('Le membre n’a pas pu être modifié.')
    }
  }

  async function sendPasswordReset(member: OrganizationMember) {
    if (!currentOrganization) return
    try {
      const result = await resetMutation.mutateAsync({ organizationId: currentOrganization.id, userId: member.id })
      result.queued ? toast.success('E-mail de réinitialisation mis en file d’attente.') : toast.warning('Le lien a été créé, mais Redis est indisponible.')
    } catch {
      toast.error('L’e-mail de réinitialisation n’a pas pu être envoyé.')
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="text-xl font-semibold tracking-tight">Utilisateurs</h2><p className="mt-1 text-sm text-muted-foreground">Gérez les rôles et les accès à {currentOrganization?.name}.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}><Upload />Importer</Button>
          <Button onClick={() => setCreateDialogOpen(true)}><Plus />Nouvel utilisateur</Button>
        </div>
      </div>
      <MemberFilters search={searchInput} status={statusFilter} pageSize={pageSize} onSearchChange={setSearchInput} onStatusChange={(value) => { setPage(1); setStatusFilter(value) }} onPageSizeChange={(value) => { setPage(1); setPageSize(value) }} />
      {membersQuery.isError ? (
        <Alert variant="destructive"><AlertTitle>Chargement impossible</AlertTitle><AlertDescription>Les membres n’ont pas pu être récupérés.</AlertDescription></Alert>
      ) : (
        <div className={`min-h-0 flex-1 ${membersQuery.isFetching && !membersQuery.isPending ? 'opacity-65' : ''}`}>
          <MemberTable members={membersQuery.data?.items ?? []} isLoading={membersQuery.isPending} pendingUserId={updateMutation.isPending ? updateMutation.variables?.userId : resetMutation.isPending ? resetMutation.variables?.userId : undefined} onManage={setMemberToManage} onPasswordReset={(member) => void sendPasswordReset(member)} />
        </div>
      )}
      {membersQuery.data && <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground"><p>{membersQuery.data.pagination.total} membre{membersQuery.data.pagination.total > 1 ? 's' : ''}</p><PaginationControls page={membersQuery.data.pagination.page} totalPages={membersQuery.data.pagination.total_pages} onPageChange={setPage} /></div>}
      {memberToManage && <MembershipAccessDialog key={memberToManage.id} title={memberToManage.email} description={`Modifiez son rôle et son accès à ${currentOrganization?.name}.`} role={memberToManage.role} isActive={memberToManage.membership_is_active} isPending={updateMutation.isPending} onClose={() => setMemberToManage(null)} onSubmit={updateMember} />}
      {currentOrganization && <CreateMemberDialog open={createDialogOpen} organizationId={currentOrganization.id} organizationName={currentOrganization.name} onOpenChange={setCreateDialogOpen} />}
      <MemberImportDialog
        open={importDialogOpen}
        mode="organization"
        organization={currentOrganization ?? undefined}
        onOpenChange={setImportDialogOpen}
        onCompleted={() => { void membersQuery.refetch() }}
      />
    </div>
  )
}
