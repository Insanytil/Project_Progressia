import type { QueryClient } from '@tanstack/react-query'
import { redirect } from '@tanstack/react-router'

import { isUnauthorizedError } from '../api/auth-errors'
import { currentUserQueryOptions } from '../queries/auth-queries'

export async function requireGuest(queryClient: QueryClient) {
  try {
    await queryClient.ensureQueryData(currentUserQueryOptions)
  } catch {
    // The login screen must stay reachable when the session check is unavailable.
    return
  }

  throw redirect({ to: '/dashboard' })
}

export async function requireAuthentication(queryClient: QueryClient) {
  try {
    await queryClient.ensureQueryData(currentUserQueryOptions)
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw redirect({ to: '/login' })
    }

    throw error
  }
}
