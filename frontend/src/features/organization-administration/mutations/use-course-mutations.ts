import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createCourse, updateCourseOptions } from '../api/course-api'
import type { CreateCourseInput, UpdateCourseOptionsInput } from '../model/course.types'
import { courseQueryKeys } from '../queries/course-queries'

export function useCreateCourseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, input }: {
      organizationId: string
      input: CreateCourseInput
    }) => createCourse(organizationId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: courseQueryKeys.all }),
  })
}

export function useUpdateCourseOptionsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, courseId, input }: {
      organizationId: string
      courseId: string
      input: UpdateCourseOptionsInput
    }) => updateCourseOptions(organizationId, courseId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: courseQueryKeys.all }),
  })
}
