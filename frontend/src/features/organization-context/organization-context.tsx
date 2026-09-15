import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import {
  currentUserQueryOptions,
  type AuthenticatedOrganization,
} from '@/features/auth'
import { getStoredOrganizationId, storeOrganizationId } from '@/lib/organization-scope-storage'

type OrganizationContextValue = {
  currentOrganization?: AuthenticatedOrganization
  organizations: AuthenticatedOrganization[]
  selectOrganization: (organizationId: string) => void
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null)

function resolveOrganizationId(
  organizations: AuthenticatedOrganization[],
  selectedOrganizationId: string | null,
  defaultOrganizationId: string | null,
) {
  if (organizations.some((organization) => organization.id === selectedOrganizationId)) {
    return selectedOrganizationId
  }

  if (organizations.some((organization) => organization.id === defaultOrganizationId)) {
    return defaultOrganizationId
  }

  return organizations[0]?.id ?? null
}

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = useQuery(currentUserQueryOptions)
  const organizations = user?.is_superuser ? [] : user?.organizations ?? []
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(
    getStoredOrganizationId,
  )
  const resolvedOrganizationId = resolveOrganizationId(
    organizations,
    selectedOrganizationId,
    user?.default_organization_id ?? null,
  )
  const currentOrganization = organizations.find(
    (organization) => organization.id === resolvedOrganizationId,
  )

  useEffect(() => {
    if (selectedOrganizationId !== resolvedOrganizationId) {
      setSelectedOrganizationId(resolvedOrganizationId)
    }
    storeOrganizationId(resolvedOrganizationId)
  }, [resolvedOrganizationId, selectedOrganizationId])

  const value = useMemo<OrganizationContextValue>(() => ({
    currentOrganization,
    organizations,
    selectOrganization: (organizationId) => {
      if (!organizations.some((organization) => organization.id === organizationId)) return
      setSelectedOrganizationId(organizationId)
      storeOrganizationId(organizationId)
    },
  }), [currentOrganization, organizations])

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error('useOrganizationContext must be used within OrganizationProvider')
  }
  return context
}
