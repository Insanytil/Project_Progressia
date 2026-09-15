import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  createOrganizationMember,
  sendOrganizationMemberPasswordReset,
  updateOrganizationMember,
} from '../api/member-api'
import { organizationMemberQueryKeys } from '../queries/member-queries'

export function useCreateOrganizationMemberMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, email, role }: {
      organizationId: string
      email: string
      role: Parameters<typeof createOrganizationMember>[1]['role']
    }) => createOrganizationMember(organizationId, { email, role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: organizationMemberQueryKeys.all }),
  })
}

export function useUpdateOrganizationMemberMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, userId, role, isActive }: {
      organizationId: string
      userId: string
      role: Parameters<typeof updateOrganizationMember>[2]['role']
      isActive: boolean
    }) => updateOrganizationMember(organizationId, userId, {
      role,
      is_active: isActive,
    }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: organizationMemberQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['auth'] }),
      ])
    },
  })
}

export function useOrganizationMemberPasswordResetMutation() {
  return useMutation({
    mutationFn: ({ organizationId, userId }: { organizationId: string; userId: string }) =>
      sendOrganizationMemberPasswordReset(organizationId, userId),
  })
}
