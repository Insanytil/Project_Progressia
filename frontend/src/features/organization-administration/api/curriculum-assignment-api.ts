import { apiClient } from '@/lib/api/client'

import type { StudentStudyOptionEnrollment, TeacherCourseAuthorizations, UpdateStudentEnrollmentInput } from '../model/curriculum-assignment.types'

const scopeHeaders = (organizationId: string) => ({ 'X-Organization-ID': organizationId })

export async function getTeacherCourseAuthorizations(organizationId: string, teacherId: string, academicYearId: string) {
  const { data } = await apiClient.get<TeacherCourseAuthorizations>(`/organization-administration/members/${teacherId}/teaching-authorizations`, {
    headers: scopeHeaders(organizationId),
    params: { academic_year_id: academicYearId },
  })
  return data
}

export async function updateTeacherCourseAuthorizations(organizationId: string, teacherId: string, academicYearId: string, courseIds: string[]) {
  const { data } = await apiClient.put<TeacherCourseAuthorizations>(`/organization-administration/members/${teacherId}/teaching-authorizations`, {
    academic_year_id: academicYearId,
    course_ids: courseIds,
  }, { headers: scopeHeaders(organizationId) })
  return data
}

export async function getStudentStudyOptionEnrollment(organizationId: string, studentId: string, academicYearId: string) {
  const { data } = await apiClient.get<StudentStudyOptionEnrollment | null>(`/organization-administration/members/${studentId}/study-option-enrollment`, {
    headers: scopeHeaders(organizationId),
    params: { academic_year_id: academicYearId },
  })
  return data
}

export async function updateStudentStudyOptionEnrollment(organizationId: string, studentId: string, input: UpdateStudentEnrollmentInput) {
  const { data } = await apiClient.put<StudentStudyOptionEnrollment>(`/organization-administration/members/${studentId}/study-option-enrollment`, input, {
    headers: scopeHeaders(organizationId),
  })
  return data
}
