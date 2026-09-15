import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import { getSchoolClassMemberOptions, getSchoolClasses } from '../api/class-api'
import type { AssignableClassRole, SchoolClassListParams } from '../model/class.types'

export const schoolClassQueryKeys = {
  all: ['organization-administration', 'classes'] as const,
  list: (organizationId: string, params: SchoolClassListParams) => [
    ...schoolClassQueryKeys.all,
    organizationId,
    params,
  ] as const,
  memberOptions: (
    organizationId: string,
    role: AssignableClassRole,
    search: string,
    academicYear?: string,
    schoolClassId?: string,
  ) => [
    ...schoolClassQueryKeys.all,
    'member-options',
    organizationId,
    role,
    search,
    academicYear,
    schoolClassId,
  ] as const,
}

export function schoolClassesQueryOptions(
  organizationId: string,
  params: SchoolClassListParams,
) {
  return queryOptions({
    queryKey: schoolClassQueryKeys.list(organizationId, params),
    queryFn: () => getSchoolClasses(organizationId, params),
    placeholderData: keepPreviousData,
  })
}

export function schoolClassMemberOptionsQueryOptions(
  organizationId: string,
  role: AssignableClassRole,
  search: string,
  academicYear?: string,
  schoolClassId?: string,
) {
  return queryOptions({
    queryKey: schoolClassQueryKeys.memberOptions(
      organizationId,
      role,
      search,
      academicYear,
      schoolClassId,
    ),
    queryFn: () => getSchoolClassMemberOptions(
      organizationId,
      role,
      search || undefined,
      academicYear,
      schoolClassId,
    ),
  })
}
