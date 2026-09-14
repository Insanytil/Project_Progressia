import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import { getOrganizations } from '../api/organizations-api'
import type { OrganizationListParams } from '../model/organization.types'

export const organizationQueryKeys = {
  all: ['platform-administration', 'organizations'] as const,
  lists: () => [...organizationQueryKeys.all, 'list'] as const,
  list: (params: OrganizationListParams) => [...organizationQueryKeys.lists(), params] as const,
}

export function organizationsQueryOptions(params: OrganizationListParams) {
  return queryOptions({
    queryKey: organizationQueryKeys.list(params),
    queryFn: () => getOrganizations(params),
    placeholderData: keepPreviousData,
  })
}
