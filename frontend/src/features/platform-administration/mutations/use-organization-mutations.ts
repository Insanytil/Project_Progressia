import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createOrganization, deleteOrganization, updateOrganization } from '../api/organizations-api'
import type { UpdateOrganizationInput } from '../model/organization.types'
import { organizationQueryKeys } from '../queries/organization-queries'

export function useCreateOrganizationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: organizationQueryKeys.lists() }),
  })
}

export function useUpdateOrganizationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ organizationId, input }: { organizationId: string; input: UpdateOrganizationInput }) =>
      updateOrganization(organizationId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all }),
  })
}

export function useDeleteOrganizationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: organizationQueryKeys.lists() }),
  })
}
