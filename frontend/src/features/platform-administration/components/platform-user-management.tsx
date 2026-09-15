import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PaginationControls } from '@/components/data-display/pagination-controls'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { MembershipAccessDialog } from '@/features/memberships/components/membership-access-dialog'
import { MemberImportDialog } from '@/features/member-imports/components/member-import-dialog'

import type { PlatformUser, UserMembership } from '../model/user.types'
import {
  useResendVerificationEmailMutation,
  useSendPasswordResetEmailMutation,
  useUpdateOrganizationAccessMutation,
  useUpdatePlatformUserMutation,
} from '../mutations/use-user-mutations'
import { useOrganizationOptions } from '../hooks/use-organization-options'
import { platformUsersQueryOptions } from '../queries/user-queries'
import { CreatePlatformUserDialog } from './create-platform-user-dialog'
import { AddUserToOrganizationDialog } from './add-user-to-organization-dialog'
import { PlatformUserFilters, type UserAccountStatusFilter } from './platform-user-filters'
import { PlatformUserTable } from './platform-user-table'

export function PlatformUserManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput.trim())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [userToAddToOrganization, setUserToAddToOrganization] = useState<PlatformUser | null>(null)
  const [membershipToManage, setMembershipToManage] = useState<{
    user: PlatformUser
    membership: UserMembership
  } | null>(null)
  const [organizationId, setOrganizationId] = useState('all')
  const [accountStatus, setAccountStatus] = useState<UserAccountStatusFilter>('all')
  const params = useMemo(() => ({
    page,
    pageSize,
    search: search || undefined,
    organizationId: organizationId === 'all' ? undefined : organizationId,
    isActive: accountStatus === 'all' ? undefined : accountStatus === 'active',
  }), [accountStatus, organizationId, page, pageSize, search])
  const usersQuery = useQuery(platformUsersQueryOptions(params))
  const organizationOptions = useOrganizationOptions()
  const userStatusMutation = useUpdatePlatformUserMutation()
  const accessMutation = useUpdateOrganizationAccessMutation()
  const verificationMutation = useResendVerificationEmailMutation()
  const passwordResetMutation = useSendPasswordResetEmailMutation()

  useEffect(() => {
    setPage(1)
  }, [search])

  async function resendVerification(user: PlatformUser) {
    try {
      const result = await verificationMutation.mutateAsync(user.id)
      result.queued
        ? toast.success('E-mail de vérification mis en file d’attente.')
        : toast.warning('Le lien a été renouvelé, mais Redis est indisponible.')
    } catch {
      toast.error('L’e-mail de vérification n’a pas pu être envoyé.')
    }
  }

  async function sendPasswordReset(user: PlatformUser) {
    try {
      const result = await passwordResetMutation.mutateAsync(user.id)
      result.queued
        ? toast.success('E-mail de réinitialisation mis en file d’attente.')
        : toast.warning('Le lien a été créé, mais Redis est indisponible.')
    } catch {
      toast.error('L’e-mail de réinitialisation n’a pas pu être envoyé.')
    }
  }

  async function toggleUserActive(user: PlatformUser) {
    try {
      await userStatusMutation.mutateAsync({ userId: user.id, isActive: !user.is_active })
      toast.success(user.is_active ? 'Compte désactivé.' : 'Compte activé.')
    } catch {
      toast.error('Le statut du compte n’a pas pu être modifié.')
    }
  }

  async function updateMembership(
    user: PlatformUser,
    membership: UserMembership,
    changes: { role: UserMembership['role']; isActive: boolean },
  ) {
    try {
      await accessMutation.mutateAsync({
        userId: user.id,
        organizationId: membership.organization_id,
        isActive: changes.isActive,
        role: changes.role,
      })
      toast.success('Accès à l’organisation mis à jour.')
      setMembershipToManage(null)
    } catch {
      toast.error('L’accès à cette organisation n’a pas pu être modifié.')
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Comptes utilisateurs</h2>
          <p className="mt-1 text-sm text-muted-foreground">Créez les comptes et suivez l’état des invitations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}><Upload />Importer</Button>
          <Button onClick={() => setDialogOpen(true)}><Plus />Nouvel utilisateur</Button>
        </div>
      </div>
      <PlatformUserFilters
        search={searchInput}
        organizationId={organizationId}
        accountStatus={accountStatus}
        pageSize={pageSize}
        organizations={organizationOptions.organizations}
        onSearchChange={setSearchInput}
        onOrganizationChange={(value) => { setPage(1); setOrganizationId(value) }}
        onAccountStatusChange={(value) => { setPage(1); setAccountStatus(value) }}
        onPageSizeChange={(value) => { setPage(1); setPageSize(value) }}
      />
      {usersQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Chargement impossible</AlertTitle>
          <AlertDescription>
            La liste des utilisateurs n’a pas pu être récupérée. Réessayez dans un instant.
          </AlertDescription>
        </Alert>
      ) : (
        <div className={`min-h-0 flex-1 ${usersQuery.isFetching && !usersQuery.isPending ? 'opacity-65' : ''}`}>
          <PlatformUserTable
            users={usersQuery.data?.items ?? []}
            isLoading={usersQuery.isPending}
            pendingUserId={
              userStatusMutation.isPending ? userStatusMutation.variables?.userId
                : verificationMutation.isPending ? verificationMutation.variables
                  : passwordResetMutation.isPending ? passwordResetMutation.variables
                    : undefined
            }
            pendingMembershipId={accessMutation.isPending ? accessMutation.variables?.organizationId : undefined}
            onResendVerification={(user) => void resendVerification(user)}
            onSendPasswordReset={(user) => void sendPasswordReset(user)}
            onToggleActive={(user) => void toggleUserActive(user)}
            onAddToOrganization={setUserToAddToOrganization}
            onManageMembership={(user, membership) => setMembershipToManage({ user, membership })}
          />
        </div>
      )}
      {usersQuery.data && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>{usersQuery.data.pagination.total} utilisateur{usersQuery.data.pagination.total > 1 ? 's' : ''}</p>
          <div className="flex items-center gap-3">
            <span>
              Page {usersQuery.data.pagination.page} sur {Math.max(1, usersQuery.data.pagination.total_pages)}
            </span>
            <PaginationControls page={usersQuery.data.pagination.page} totalPages={usersQuery.data.pagination.total_pages} onPageChange={setPage} />
          </div>
        </div>
      )}
      <CreatePlatformUserDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <MemberImportDialog
        open={importDialogOpen}
        mode="platform"
        organizations={organizationOptions.organizations}
        onOpenChange={setImportDialogOpen}
        onCompleted={() => { void usersQuery.refetch() }}
      />
      <AddUserToOrganizationDialog
        user={userToAddToOrganization}
        organizations={organizationOptions.organizations}
        onOpenChange={(open) => {
          if (!open) setUserToAddToOrganization(null)
        }}
      />
      {membershipToManage && (
        <MembershipAccessDialog
          key={`${membershipToManage.user.id}-${membershipToManage.membership.organization_id}`}
          title={membershipToManage.membership.organization_name}
          description={`Modifiez le rôle et l’accès de ${membershipToManage.user.email}.`}
          role={membershipToManage.membership.role}
          isActive={membershipToManage.membership.is_active}
          isPending={accessMutation.isPending}
          onClose={() => setMembershipToManage(null)}
          onSubmit={(changes) => updateMembership(
            membershipToManage.user,
            membershipToManage.membership,
            changes,
          )}
        />
      )}
    </div>
  )
}
