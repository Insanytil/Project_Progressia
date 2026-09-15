import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createStudyOption, updateStudyOptionCourses, updateStudyOptionPathway, updateStudyOptionPathways } from '../api/study-option-api'
import type { CreateStudyOptionInput, UpdateStudyOptionCoursesInput, UpdateStudyOptionPathwayInput, UpdateStudyOptionPathwaysInput } from '../model/study-option.types'
import { studyOptionQueryKeys } from '../queries/study-option-queries'

export function useCreateStudyOptionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, input }: {
      organizationId: string
      input: CreateStudyOptionInput
    }) => createStudyOption(organizationId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studyOptionQueryKeys.all }),
  })
}

export function useUpdateStudyOptionPathwaysMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, studyOptionId, input }: {
      organizationId: string
      studyOptionId: string
      input: UpdateStudyOptionPathwaysInput
    }) => updateStudyOptionPathways(organizationId, studyOptionId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studyOptionQueryKeys.all }),
  })
}

export function useUpdateStudyOptionPathwayMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, studyOptionId, pathwayId, input }: {
      organizationId: string
      studyOptionId: string
      pathwayId: string
      input: UpdateStudyOptionPathwayInput
    }) => updateStudyOptionPathway(organizationId, studyOptionId, pathwayId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studyOptionQueryKeys.all }),
  })
}

export function useUpdateStudyOptionCoursesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, studyOptionId, input }: {
      organizationId: string
      studyOptionId: string
      input: UpdateStudyOptionCoursesInput
    }) => updateStudyOptionCourses(organizationId, studyOptionId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studyOptionQueryKeys.all }),
  })
}
