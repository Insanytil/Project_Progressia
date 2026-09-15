import { useMutation, useQueryClient } from '@tanstack/react-query'

import { activateAcademicYear, createAcademicYear } from '../api/academic-year-api'
import { academicYearQueryKeys } from '../queries/academic-year-queries'

export function useActivateAcademicYearMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, academicYearId }: {
      organizationId: string
      academicYearId: string
    }) => activateAcademicYear(organizationId, academicYearId),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: academicYearQueryKeys.all,
    }),
  })
}

export function useCreateAcademicYearMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, startYear, endYear }: {
      organizationId: string
      startYear: number
      endYear: number
    }) => createAcademicYear(organizationId, {
      start_year: startYear,
      end_year: endYear,
    }),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: academicYearQueryKeys.all,
    }),
  })
}
