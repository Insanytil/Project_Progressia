import { queryOptions } from '@tanstack/react-query'

import { getCurrentUser } from '../api/auth-api'
import { isUnauthorizedError } from '../api/auth-errors'

export const authQueryKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authQueryKeys.all, 'current-user'] as const,
}

export const currentUserQueryOptions = queryOptions({
  queryKey: authQueryKeys.currentUser(),
  queryFn: getCurrentUser,
  retry: (failureCount, error) => !isUnauthorizedError(error) && failureCount < 1,
})
