import { apiClient } from '@/lib/api/client'

import type {
  CreateStudyOptionInput,
  PaginatedStudyOptions,
  StudyOption,
  StudyOptionListParams,
  UpdateStudyOptionCoursesInput,
  UpdateStudyOptionPathwaysInput,
  UpdateStudyOptionPathwayInput,
} from '../model/study-option.types'

const scopeHeaders = (organizationId: string) => ({
  'X-Organization-ID': organizationId,
})

export async function getStudyOptions(
  organizationId: string,
  params: StudyOptionListParams,
): Promise<PaginatedStudyOptions> {
  const { data } = await apiClient.get<PaginatedStudyOptions>(
    '/organization-administration/study-options',
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

export async function updateStudyOptionPathways(
  organizationId: string,
  studyOptionId: string,
  input: UpdateStudyOptionPathwaysInput,
): Promise<StudyOption> {
  const { data } = await apiClient.put<StudyOption>(
    `/organization-administration/study-options/${studyOptionId}/pathways`,
    input,
    { headers: scopeHeaders(organizationId) },
  )
  return data
}

export async function updateStudyOptionPathway(
  organizationId: string,
  studyOptionId: string,
  pathwayId: string,
  input: UpdateStudyOptionPathwayInput,
): Promise<StudyOption> {
  const { data } = await apiClient.put<StudyOption>(
    `/organization-administration/study-options/${studyOptionId}/pathways/${pathwayId}`,
    input,
    { headers: scopeHeaders(organizationId) },
  )
  return data
}

export async function createStudyOption(
  organizationId: string,
  input: CreateStudyOptionInput,
): Promise<StudyOption> {
  const { data } = await apiClient.post<StudyOption>(
    '/organization-administration/study-options',
    input,
    { headers: scopeHeaders(organizationId) },
  )
  return data
}

export async function updateStudyOptionCourses(
  organizationId: string,
  studyOptionId: string,
  input: UpdateStudyOptionCoursesInput,
): Promise<StudyOption> {
  const { data } = await apiClient.put<StudyOption>(
    `/organization-administration/study-options/${studyOptionId}/courses`,
    input,
    { headers: scopeHeaders(organizationId) },
  )
  return data
}
