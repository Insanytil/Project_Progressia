import { useMutation, useQueryClient } from '@tanstack/react-query'

import { acceptInvitation, getCurrentUser, login, logout } from '../api/auth-api'
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
      queryClient.removeQueries({ queryKey: authQueryKeys.all })
    },
  })
}

export function useAcceptInvitationMutation() {
  return useMutation({ mutationFn: acceptInvitation })
}
