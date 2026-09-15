import { useMutation, useQueryClient } from '@tanstack/react-query'

import { storeOrganizationId } from '@/lib/organization-scope-storage'

import {
  acceptInvitation,
  getCurrentUser,
  login,
  logout,
  updateAccountPreferences,
} from '../api/auth-api'
import { isUnauthorizedError } from '../api/auth-errors'
import { authQueryKeys } from '../queries/auth-queries'

export function useLoginMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: Parameters<typeof login>[0]) => {
      await login(credentials)
      return getCurrentUser()
    },
    onSuccess: (user) => {
      const organization = user.organizations.find(
        (candidate) => candidate.id === user.default_organization_id,
      ) ?? user.organizations[0]
      storeOrganizationId(organization?.id ?? null)
      queryClient.setQueryData(authQueryKeys.currentUser(), user)
    },
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      try {
        await logout()
      } catch (error) {
        // An expired server session is already effectively logged out.
        if (!isUnauthorizedError(error)) throw error
      }
    },
    onSuccess: () => {
      storeOrganizationId(null)
      queryClient.removeQueries({ queryKey: authQueryKeys.all })
    },
  })
}

export function useUpdateAccountPreferencesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAccountPreferences,
    onSuccess: (_, preferences) => {
      queryClient.setQueryData(
        authQueryKeys.currentUser(),
        (user: Awaited<ReturnType<typeof getCurrentUser>> | undefined) => (
          user
            ? { ...user, default_organization_id: preferences.default_organization_id }
            : user
        ),
      )
    },
  })
}

export function useAcceptInvitationMutation() {
  return useMutation({ mutationFn: acceptInvitation })
}
