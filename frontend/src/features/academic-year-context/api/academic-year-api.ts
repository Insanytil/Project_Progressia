import { apiClient } from '@/lib/api/client'

import type { AcademicYear } from '../model/academic-year.types'

export async function getAcademicYears(
  organizationId: string,
): Promise<AcademicYear[]> {
  const { data } = await apiClient.get<AcademicYear[]>('/academic-years', {
    headers: { 'X-Organization-ID': organizationId },
  })
  return data
}

export async function activateAcademicYear(
  organizationId: string,
  academicYearId: string,
): Promise<AcademicYear> {
  const { data } = await apiClient.put<AcademicYear>(
    `/academic-years/${academicYearId}/activate`,
    undefined,
    { headers: { 'X-Organization-ID': organizationId } },
  )
  return data
}

export async function createAcademicYear(
  organizationId: string,
  input: { start_year: number; end_year: number },
): Promise<AcademicYear> {
  const { data } = await apiClient.post<AcademicYear>(
    '/academic-years',
    input,
    { headers: { 'X-Organization-ID': organizationId } },
  )
  return data
}
