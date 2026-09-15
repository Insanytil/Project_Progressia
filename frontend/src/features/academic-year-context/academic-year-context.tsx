import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { useOrganizationContext } from '@/features/organization-context'
import {
  getStoredAcademicYearId,
  storeAcademicYearId,
} from '@/lib/academic-year-scope-storage'

import type { AcademicYear } from './model/academic-year.types'
import { academicYearsQueryOptions } from './queries/academic-year-queries'

type AcademicYearContextValue = {
  currentAcademicYear?: AcademicYear
  academicYears: AcademicYear[]
  isLoading: boolean
  selectAcademicYear: (academicYearId: string) => void
}

const AcademicYearContext = createContext<AcademicYearContextValue | null>(null)

export function AcademicYearProvider({ children }: { children: React.ReactNode }) {
  const { currentOrganization } = useOrganizationContext()
  const organizationId = currentOrganization?.id ?? ''
  const query = useQuery({
    ...academicYearsQueryOptions(organizationId),
    enabled: Boolean(organizationId),
  })
  const academicYears = query.data ?? []
  const [selectedByOrganization, setSelectedByOrganization] = useState<
    Record<string, string | null>
  >({})
  const storedId = organizationId
    ? selectedByOrganization[organizationId]
      ?? getStoredAcademicYearId(organizationId)
    : null
  const resolvedId = academicYears.some((year) => year.id === storedId)
    ? storedId
    : academicYears.find((year) => year.is_active)?.id
      ?? academicYears[0]?.id
      ?? null
  const currentAcademicYear = academicYears.find(
    (year) => year.id === resolvedId,
  )

  useEffect(() => {
    if (!organizationId) return
    setSelectedByOrganization((current) => (
      current[organizationId] === resolvedId
        ? current
        : { ...current, [organizationId]: resolvedId }
    ))
    storeAcademicYearId(organizationId, resolvedId)
  }, [organizationId, resolvedId])

  const value = useMemo<AcademicYearContextValue>(() => ({
    currentAcademicYear,
    academicYears,
    isLoading: query.isPending,
    selectAcademicYear: (academicYearId) => {
      if (!organizationId || !academicYears.some((year) => year.id === academicYearId)) return
      setSelectedByOrganization((current) => ({
        ...current,
        [organizationId]: academicYearId,
      }))
      storeAcademicYearId(organizationId, academicYearId)
    },
  }), [academicYears, currentAcademicYear, organizationId, query.isPending])

  return (
    <AcademicYearContext.Provider value={value}>
      {children}
    </AcademicYearContext.Provider>
  )
}

export function useAcademicYearContext() {
  const context = useContext(AcademicYearContext)
  if (!context) {
    throw new Error('useAcademicYearContext must be used within AcademicYearProvider')
  }
  return context
}
