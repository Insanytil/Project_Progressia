import { queryOptions } from '@tanstack/react-query'

import { getCurrentUser, getInvitation, getPasswordReset } from '../api/auth-api'
import { isUnauthorizedError } from '../api/auth-errors'

export const authQueryKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authQueryKeys.all, 'current-user'] as const,
  invitation: (token: string) => [...authQueryKeys.all, 'invitation', token] as const,
  passwordReset: (token: string) => [...authQueryKeys.all, 'password-reset', token] as const,
}

export const currentUserQueryOptions = queryOptions({
  queryKey: authQueryKeys.currentUser(),
  queryFn: getCurrentUser,
  retry: (failureCount, error) => !isUnauthorizedError(error) && failureCount < 1,
})

export function invitationQueryOptions(token: string) {
  return queryOptions({
    queryKey: authQueryKeys.invitation(token),
    queryFn: () => getInvitation(token),
    retry: false,
  })
}

export function passwordResetQueryOptions(token: string) {
  return queryOptions({
    queryKey: authQueryKeys.passwordReset(token),
    queryFn: () => getPasswordReset(token),
    retry: false,
  })
}
