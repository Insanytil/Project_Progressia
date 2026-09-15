import { apiClient } from '@/lib/api/client'

import type {
  Course,
  CourseListParams,
  CreateCourseInput,
  PaginatedCourses,
  UpdateCourseOptionsInput,
} from '../model/course.types'

const scopeHeaders = (organizationId: string) => ({
  'X-Organization-ID': organizationId,
})

export async function getCourses(
  organizationId: string,
  params: CourseListParams,
): Promise<PaginatedCourses> {
  const { data } = await apiClient.get<PaginatedCourses>(
    '/organization-administration/courses',
    {
      headers: scopeHeaders(organizationId),
      params: {
        page: params.page,
        page_size: params.pageSize,
        academic_year_id: params.academicYearId,
        search: params.search,
      },
    },
  )
  return data
}

export async function createCourse(
  organizationId: string,
  input: CreateCourseInput,
): Promise<Course> {
  const { data } = await apiClient.post<Course>(
    '/organization-administration/courses',
    input,
    { headers: scopeHeaders(organizationId) },
  )
  return data
}

export async function updateCourseOptions(
  organizationId: string,
  courseId: string,
  input: UpdateCourseOptionsInput,
): Promise<Course> {
  const { data } = await apiClient.put<Course>(
    `/organization-administration/courses/${courseId}/options`,
    input,
    { headers: scopeHeaders(organizationId) },
  )
  return data
}
