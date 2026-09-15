import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import { getCourses } from '../api/course-api'
import type { CourseListParams } from '../model/course.types'

export const courseQueryKeys = {
  all: ['organization-administration', 'courses'] as const,
  list: (organizationId: string, params: CourseListParams) => [
    ...courseQueryKeys.all,
    organizationId,
    params,
  ] as const,
}

export function coursesQueryOptions(
  organizationId: string,
  params: CourseListParams,
) {
  return queryOptions({
    queryKey: courseQueryKeys.list(organizationId, params),
    queryFn: () => getCourses(organizationId, params),
    placeholderData: keepPreviousData,
  })
}
