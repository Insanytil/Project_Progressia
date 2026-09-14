import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

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
import { PaginationControls } from './pagination-controls'
import { PlatformUserFilters, type UserAccountStatusFilter } from './platform-user-filters'
import { PlatformUserTable } from './platform-user-table'

export function PlatformUserManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput.trim())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [userToAddToOrganization, setUserToAddToOrganization] = useState<PlatformUser | null>(null)
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
      result.sent
        ? toast.success('E-mail de vérification envoyé.')
        : toast.warning('Le lien a été renouvelé, mais l’e-mail n’a pas pu être envoyé.')
    } catch {
      toast.error('L’e-mail de vérification n’a pas pu être envoyé.')
    }
  }

  async function sendPasswordReset(user: PlatformUser) {
    try {
      const result = await passwordResetMutation.mutateAsync(user.id)
      result.sent
        ? toast.success('E-mail de réinitialisation envoyé.')
        : toast.warning('Le lien a été créé, mais l’e-mail n’a pas pu être envoyé.')
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

  async function toggleOrganizationAccess(user: PlatformUser, membership: UserMembership) {
    try {
      await accessMutation.mutateAsync({
        userId: user.id,
        organizationId: membership.organization_id,
        isActive: !membership.is_active,
      })
      toast.success(membership.is_active ? 'Accès à l’organisation suspendu.' : 'Accès à l’organisation réactivé.')
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
        <Button onClick={() => setDialogOpen(true)}><Plus />Nouvel utilisateur</Button>
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
            onToggleOrganizationAccess={(user, membership) => void toggleOrganizationAccess(user, membership)}
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
      <AddUserToOrganizationDialog
        user={userToAddToOrganization}
        organizations={organizationOptions.organizations}
        onOpenChange={(open) => {
          if (!open) setUserToAddToOrganization(null)
        }}
      />
    </div>
  )
}
