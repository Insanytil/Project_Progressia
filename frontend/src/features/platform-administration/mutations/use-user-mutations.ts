import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  addUserToOrganization,
  createPlatformUser,
  resendVerificationEmail,
  sendPasswordResetEmail,
  updatePlatformUser,
  updateUserOrganizationAccess,
} from '../api/users-api'
import { platformUserQueryKeys } from '../queries/user-queries'

export function useCreatePlatformUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPlatformUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformUserQueryKeys.all }),
  })
}

export function useAddUserToOrganizationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, userId, role }: {
      organizationId: string
      userId: string
      role: Parameters<typeof addUserToOrganization>[1]['role']
    }) => addUserToOrganization(organizationId, { user_id: userId, role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformUserQueryKeys.all }),
  })
}

export function useUpdatePlatformUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      updatePlatformUser(userId, { is_active: isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformUserQueryKeys.all }),
  })
}

export function useUpdateOrganizationAccessMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, organizationId, isActive, role }: {
      userId: string
      organizationId: string
      isActive: boolean
      role: Parameters<typeof updateUserOrganizationAccess>[2]['role']
    }) => updateUserOrganizationAccess(userId, organizationId, {
      is_active: isActive,
      role,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformUserQueryKeys.all }),
  })
}

export function useResendVerificationEmailMutation() {
  return useMutation({ mutationFn: resendVerificationEmail })
}

export function useSendPasswordResetEmailMutation() {
  return useMutation({ mutationFn: sendPasswordResetEmail })
}
