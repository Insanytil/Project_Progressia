import { useMutation, useQueryClient } from '@tanstack/react-query'

import { academicYearQueryKeys } from '@/features/academic-year-context'
import { createSchoolClass, updateSchoolClassMembers } from '../api/class-api'
import type { CreateSchoolClassInput, UpdateSchoolClassMembersInput } from '../model/class.types'
import { schoolClassQueryKeys } from '../queries/class-queries'

export function useCreateSchoolClassMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, input }: {
      organizationId: string
      input: CreateSchoolClassInput
    }) => createSchoolClass(organizationId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: schoolClassQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: academicYearQueryKeys.all }),
      ])
    },
  })
}

export function useUpdateSchoolClassMembersMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, schoolClassId, input }: {
      organizationId: string
      schoolClassId: string
      input: UpdateSchoolClassMembersInput
    }) => updateSchoolClassMembers(organizationId, schoolClassId, input),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: schoolClassQueryKeys.all,
    }),
  })
}
