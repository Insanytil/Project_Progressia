import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateStudentStudyOptionEnrollment, updateTeacherCourseAuthorizations } from '../api/curriculum-assignment-api'
import type { UpdateStudentEnrollmentInput } from '../model/curriculum-assignment.types'
import { curriculumAssignmentQueryKeys } from '../queries/curriculum-assignment-queries'

export function useUpdateTeacherCourseAuthorizationsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, teacherId, academicYearId, courseIds }: { organizationId: string; teacherId: string; academicYearId: string; courseIds: string[] }) => updateTeacherCourseAuthorizations(organizationId, teacherId, academicYearId, courseIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: curriculumAssignmentQueryKeys.all }),
  })
}

export function useUpdateStudentStudyOptionEnrollmentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, studentId, input }: { organizationId: string; studentId: string; input: UpdateStudentEnrollmentInput }) => updateStudentStudyOptionEnrollment(organizationId, studentId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: curriculumAssignmentQueryKeys.all }),
  })
}
