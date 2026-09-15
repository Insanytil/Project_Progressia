import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import { getCourses } from '../api/course-api'
import { getStudyOptions } from '../api/study-option-api'
import type { StudyOptionListParams } from '../model/study-option.types'

export const studyOptionQueryKeys = {
  all: ['organization-administration', 'study-options'] as const,
  list: (organizationId: string, params: StudyOptionListParams) => [
    ...studyOptionQueryKeys.all,
    organizationId,
    params,
  ] as const,
  courseChoices: (organizationId: string, academicYearId: string) => [
    ...studyOptionQueryKeys.all,
    'course-choices',
    organizationId,
    academicYearId,
  ] as const,
}

export function studyOptionsQueryOptions(
  organizationId: string,
  params: StudyOptionListParams,
) {
  return queryOptions({
    queryKey: studyOptionQueryKeys.list(organizationId, params),
    queryFn: () => getStudyOptions(organizationId, params),
    placeholderData: keepPreviousData,
  })
}

export function studyOptionCourseChoicesQueryOptions(
  organizationId: string,
  academicYearId: string,
) {
  return queryOptions({
    queryKey: studyOptionQueryKeys.courseChoices(organizationId, academicYearId),
    queryFn: () => getCourses(organizationId, {
      page: 1,
      pageSize: 100,
      academicYearId,
    }),
  })
}
