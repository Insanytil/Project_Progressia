import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import { getOrganizationMembers } from '../api/member-api'
import type { OrganizationMemberListParams } from '../model/member.types'

export const organizationMemberQueryKeys = {
  all: ['organization-administration', 'members'] as const,
  list: (organizationId: string, params: OrganizationMemberListParams) => [
    ...organizationMemberQueryKeys.all,
    organizationId,
    params,
  ] as const,
}

export function organizationMembersQueryOptions(
  organizationId: string,
  params: OrganizationMemberListParams,
) {
  return queryOptions({
    queryKey: organizationMemberQueryKeys.list(organizationId, params),
    queryFn: () => getOrganizationMembers(organizationId, params),
    placeholderData: keepPreviousData,
  })
}
