import { apiClient } from '@/lib/api/client'

import type {
  AssignableClassRole,
  CreateSchoolClassInput,
  PaginatedSchoolClassMemberOptions,
  PaginatedSchoolClasses,
  SchoolClass,
  SchoolClassListParams,
  UpdateSchoolClassMembersInput,
} from '../model/class.types'

const scopeHeaders = (organizationId: string) => ({
  'X-Organization-ID': organizationId,
})

export async function getSchoolClasses(
  organizationId: string,
  params: SchoolClassListParams,
): Promise<PaginatedSchoolClasses> {
  const { data } = await apiClient.get<PaginatedSchoolClasses>(
    '/organization-administration/classes',
    {
      headers: scopeHeaders(organizationId),
      params: {
        page: params.page,
        page_size: params.pageSize,
        search: params.search,
        academic_year: params.academicYear,
      },
    },
  )
  return data
}

export async function createSchoolClass(
  organizationId: string,
  input: CreateSchoolClassInput,
): Promise<SchoolClass> {
  const { data } = await apiClient.post<SchoolClass>(
    '/organization-administration/classes',
    input,
    { headers: scopeHeaders(organizationId) },
  )
  return data
}

export async function updateSchoolClassMembers(
  organizationId: string,
  schoolClassId: string,
  input: UpdateSchoolClassMembersInput,
): Promise<SchoolClass> {
  const { data } = await apiClient.put<SchoolClass>(
    `/organization-administration/classes/${schoolClassId}/members`,
    input,
    { headers: scopeHeaders(organizationId) },
  )
  return data
}

export async function getSchoolClassMemberOptions(
  organizationId: string,
  role: AssignableClassRole,
  search?: string,
  academicYear?: string,
  schoolClassId?: string,
): Promise<PaginatedSchoolClassMemberOptions> {
  const { data } = await apiClient.get<PaginatedSchoolClassMemberOptions>(
    '/organization-administration/classes/member-options',
    {
      headers: scopeHeaders(organizationId),
      params: {
        role,
        search,
        academic_year: academicYear,
        school_class_id: schoolClassId,
        page: 1,
        page_size: 100,
      },
    },
  )
  return data
}
