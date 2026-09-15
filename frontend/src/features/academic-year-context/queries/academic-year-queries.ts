import { queryOptions } from '@tanstack/react-query'

import { getAcademicYears } from '../api/academic-year-api'

export const academicYearQueryKeys = {
  all: ['academic-years'] as const,
  list: (organizationId: string) => [
    ...academicYearQueryKeys.all,
    organizationId,
  ] as const,
}

export function academicYearsQueryOptions(organizationId: string) {
  return queryOptions({
    queryKey: academicYearQueryKeys.list(organizationId),
    queryFn: () => getAcademicYears(organizationId),
  })
}
