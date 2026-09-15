import type { QueryClient } from '@tanstack/react-query'
import { redirect } from '@tanstack/react-router'

import { getStoredOrganizationId } from '@/lib/organization-scope-storage'

import { isUnauthorizedError } from '../api/auth-errors'
import { currentUserQueryOptions } from '../queries/auth-queries'
import type { AuthenticatedUser } from '../model/auth.types'

function redirectToUserHome(user: AuthenticatedUser): never {
  if (user.is_superuser) {
    throw redirect({ to: '/platformAdministration' })
  }

  throw redirect({ to: '/dashboard' })
}

export async function requireGuest(queryClient: QueryClient) {
  let user: AuthenticatedUser
  try {
    user = await queryClient.ensureQueryData(currentUserQueryOptions)
  } catch {
    // The login screen must stay reachable when the session check is unavailable.
    return
  }

  redirectToUserHome(user)
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

export async function requireSuperuser(queryClient: QueryClient) {
  const user = await queryClient.ensureQueryData(currentUserQueryOptions)

  if (!user.is_superuser) {
    throw redirect({ to: '/dashboard' })
  }
}

export async function requireCurrentOrganizationAdmin(queryClient: QueryClient) {
  const user = await queryClient.ensureQueryData(currentUserQueryOptions)
  if (user.is_superuser) {
    throw redirect({ to: '/platformAdministration' })
  }

  const storedOrganizationId = getStoredOrganizationId()
  const organization = user.organizations.find(
    (candidate) => candidate.id === storedOrganizationId,
  ) ?? user.organizations.find(
    (candidate) => candidate.id === user.default_organization_id,
  ) ?? user.organizations[0]

  if (organization?.role !== 'organization_admin') {
    throw redirect({ to: '/dashboard' })
  }
}

export async function requireJobsAdmin(queryClient: QueryClient) {
  const user = await queryClient.ensureQueryData(currentUserQueryOptions)
  if (user.is_superuser) return

  const storedOrganizationId = getStoredOrganizationId()
  const organization = user.organizations.find(
    (candidate) => candidate.id === storedOrganizationId,
  ) ?? user.organizations.find(
    (candidate) => candidate.id === user.default_organization_id,
  ) ?? user.organizations[0]

  if (organization?.role !== 'organization_admin') {
    throw redirect({ to: '/dashboard' })
  }
}

export async function redirectToAuthenticatedHome(queryClient: QueryClient): Promise<never> {
  const user = await queryClient.ensureQueryData(currentUserQueryOptions)
  return redirectToUserHome(user)
}
