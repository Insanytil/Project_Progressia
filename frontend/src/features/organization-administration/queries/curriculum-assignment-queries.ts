import { queryOptions } from '@tanstack/react-query'

import { getStudentStudyOptionEnrollment, getTeacherCourseAuthorizations } from '../api/curriculum-assignment-api'

export const curriculumAssignmentQueryKeys = {
  all: ['organization-administration', 'curriculum-assignments'] as const,
  teacher: (organizationId: string, teacherId: string, academicYearId: string) => [...curriculumAssignmentQueryKeys.all, 'teacher', organizationId, teacherId, academicYearId] as const,
  student: (organizationId: string, studentId: string, academicYearId: string) => [...curriculumAssignmentQueryKeys.all, 'student', organizationId, studentId, academicYearId] as const,
}

export function teacherCourseAuthorizationsQueryOptions(organizationId: string, teacherId: string, academicYearId: string) {
  return queryOptions({
    queryKey: curriculumAssignmentQueryKeys.teacher(organizationId, teacherId, academicYearId),
    queryFn: () => getTeacherCourseAuthorizations(organizationId, teacherId, academicYearId),
  })
}

export function studentStudyOptionEnrollmentQueryOptions(organizationId: string, studentId: string, academicYearId: string) {
  return queryOptions({
    queryKey: curriculumAssignmentQueryKeys.student(organizationId, studentId, academicYearId),
    queryFn: () => getStudentStudyOptionEnrollment(organizationId, studentId, academicYearId),
  })
}
