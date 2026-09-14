import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

import { getOrganizationDeletionError } from '../api/organization-errors'
import type { Organization, OrganizationListParams } from '../model/organization.types'
import {
  useDeleteOrganizationMutation,
  useUpdateOrganizationMutation,
} from '../mutations/use-organization-mutations'
import { organizationsQueryOptions } from '../queries/organization-queries'
import { OrganizationDetailsSheet } from './organization-details-sheet'
import { OrganizationDeleteDialog } from './organization-delete-dialog'
import {
  OrganizationFilters,
  type OrganizationStatusFilter,
} from './organization-filters'
import { OrganizationFormDialog } from './organization-form-dialog'
import { OrganizationTable } from './organization-table'
import { PaginationControls } from './pagination-controls'

export function OrganizationManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput.trim())
  const [status, setStatus] = useState<OrganizationStatusFilter>('all')
  const [viewedOrganization, setViewedOrganization] = useState<Organization | null>(null)
  const [editedOrganization, setEditedOrganization] = useState<Organization>()
  const [organizationToDelete, setOrganizationToDelete] = useState<Organization | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const statusMutation = useUpdateOrganizationMutation()
  const deleteMutation = useDeleteOrganizationMutation()

  const queryParams = useMemo<OrganizationListParams>(() => ({
    page,
    pageSize,
    search: search || undefined,
    isActive: status === 'all' ? undefined : status === 'active',
  }), [page, pageSize, search, status])
  const organizationsQuery = useQuery(organizationsQueryOptions(queryParams))

  function openCreateDialog() {
    setEditedOrganization(undefined)
    setFormOpen(true)
  }

  function openEditDialog(organization: Organization) {
    setEditedOrganization(organization)
    setFormOpen(true)
  }

  useEffect(() => {
    setPage(1)
  }, [search])

  function changeStatus(nextStatus: OrganizationStatusFilter) {
    setPage(1)
    setStatus(nextStatus)
  }

  function changePageSize(nextPageSize: number) {
    setPage(1)
    setPageSize(nextPageSize)
  }

  async function toggleOrganizationActive(organization: Organization) {
    try {
      await statusMutation.mutateAsync({
        organizationId: organization.id,
        input: { is_active: !organization.is_active },
      })
      toast.success(
        organization.is_active ? 'Organisation désactivée.' : 'Organisation activée.',
      )
    } catch {
      toast.error('Le statut de l’organisation n’a pas pu être modifié.')
    }
  }

  async function deleteSelectedOrganization() {
    if (!organizationToDelete) return

    try {
      await deleteMutation.mutateAsync(organizationToDelete.id)
      toast.success('Organisation supprimée.')
      setOrganizationToDelete(null)

      if (organizationsQuery.data?.items.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1)
      }
    } catch (error) {
      toast.error(getOrganizationDeletionError(error))
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Gestion des organisations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez et administrez les organisations présentes sur Progressia.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus />
          Nouvelle organisation
        </Button>
      </div>

      <OrganizationFilters
        search={searchInput}
        status={status}
        pageSize={pageSize}
        onSearchChange={setSearchInput}
        onStatusChange={changeStatus}
        onPageSizeChange={changePageSize}
      />

      {organizationsQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Chargement impossible</AlertTitle>
          <AlertDescription>
            Impossible de récupérer les organisations.
            <Button variant="link" className="ml-1 h-auto p-0" onClick={() => void organizationsQuery.refetch()}>
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className={`min-h-0 flex-1 ${organizationsQuery.isFetching && !organizationsQuery.isPending ? 'opacity-65 transition-opacity' : ''}`}>
          <OrganizationTable
            organizations={organizationsQuery.data?.items ?? []}
            isLoading={organizationsQuery.isPending}
            onView={setViewedOrganization}
            onEdit={openEditDialog}
            onToggleActive={(organization) => void toggleOrganizationActive(organization)}
            onDelete={setOrganizationToDelete}
            togglingOrganizationId={statusMutation.isPending ? statusMutation.variables?.organizationId : undefined}
          />
        </div>
      )}

      {organizationsQuery.data && (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {organizationsQuery.data.pagination.total} organisation{organizationsQuery.data.pagination.total > 1 ? 's' : ''}
          </p>
          <PaginationControls
            page={organizationsQuery.data.pagination.page}
            totalPages={organizationsQuery.data.pagination.total_pages}
            onPageChange={setPage}
          />
        </div>
      )}

      <OrganizationDetailsSheet
        organization={viewedOrganization}
        onOpenChange={(open) => !open && setViewedOrganization(null)}
      />
      <OrganizationFormDialog
        key={editedOrganization?.id ?? 'new-organization'}
        open={formOpen}
        organization={editedOrganization}
        onOpenChange={setFormOpen}
      />
      <OrganizationDeleteDialog
        organization={organizationToDelete}
        isPending={deleteMutation.isPending}
        onConfirm={() => void deleteSelectedOrganization()}
        onOpenChange={(open) => !open && setOrganizationToDelete(null)}
      />
    </div>
  )
}
