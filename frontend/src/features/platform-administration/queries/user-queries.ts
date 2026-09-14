import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import { getPlatformUsers, type UserListParams } from '../api/users-api'

export const platformUserQueryKeys = {
  all: ['platform-administration', 'users'] as const,
  list: (params: UserListParams) => [...platformUserQueryKeys.all, 'list', params] as const,
}

export function platformUsersQueryOptions(params: UserListParams) {
  return queryOptions({
    queryKey: platformUserQueryKeys.list(params),
    queryFn: () => getPlatformUsers(params),
    placeholderData: keepPreviousData,
  })
}
