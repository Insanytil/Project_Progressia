import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { PaginationControls } from '@/components/data-display/pagination-controls'
import { useAcademicYearContext } from '@/features/academic-year-context'
import { useOrganizationContext } from '@/features/organization-context'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

import type { Course } from '../model/course.types'
import { coursesQueryOptions } from '../queries/course-queries'
import { CourseFilters } from './course-filters'
import { CourseTable } from './course-table'
import { CreateCourseDialog } from './create-course-dialog'
import { ManageCourseOptionsDialog } from './manage-course-options-dialog'

export function CourseManagement() {
  const { currentOrganization } = useOrganizationContext()
  const { academicYears, currentAcademicYear, isLoading: yearsLoading } = useAcademicYearContext()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchInput, setSearchInput] = useState('')
  const [localYear, setLocalYear] = useState<{ organizationId: string; contextYearId: string; selectedYearId: string } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [courseToManage, setCourseToManage] = useState<Course | null>(null)
  const search = useDebouncedValue(searchInput.trim())
  const organizationId = currentOrganization?.id ?? ''
  const contextYearId = currentAcademicYear?.id ?? ''
  const selectedYearId = localYear?.organizationId === organizationId && localYear.contextYearId === contextYearId
    ? localYear.selectedYearId
    : contextYearId
  const selectedYear = academicYears.find((year) => year.id === selectedYearId)
  const params = useMemo(() => ({
    page,
    pageSize,
    academicYearId: selectedYearId,
    search: search || undefined,
  }), [page, pageSize, search, selectedYearId])
  const coursesQuery = useQuery({
    ...coursesQueryOptions(organizationId, params),
    enabled: Boolean(currentOrganization) && Boolean(selectedYearId) && !yearsLoading,
  })

  useEffect(() => {
    setPage(1)
    setCourseToManage(null)
  }, [currentOrganization?.id, search, selectedYearId])

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="text-xl font-semibold tracking-tight">Cours</h2><p className="mt-1 text-sm text-muted-foreground">Gérez le catalogue et les horaires proposés pour chaque année scolaire.</p></div>
        <Button disabled={!selectedYear} onClick={() => setCreateOpen(true)}><Plus />Nouveau cours</Button>
      </div>
      <CourseFilters
        search={searchInput}
        academicYearId={selectedYearId}
        currentAcademicYearId={contextYearId}
        academicYears={academicYears}
        pageSize={pageSize}
        onSearchChange={setSearchInput}
        onAcademicYearChange={(yearId) => setLocalYear({ organizationId, contextYearId, selectedYearId: yearId })}
        onResetAcademicYear={() => setLocalYear(null)}
        onPageSizeChange={(value) => { setPage(1); setPageSize(value) }}
      />
      {!yearsLoading && !selectedYear ? (
        <Alert><AlertTitle>Aucune année scolaire</AlertTitle><AlertDescription>Créez d’abord une année scolaire avant d’ajouter des cours.</AlertDescription></Alert>
      ) : coursesQuery.isError ? (
        <Alert variant="destructive"><AlertTitle>Chargement impossible</AlertTitle><AlertDescription>Les cours n’ont pas pu être récupérés.</AlertDescription></Alert>
      ) : (
        <div className={`min-h-0 flex-1 ${coursesQuery.isFetching && !coursesQuery.isPending ? 'opacity-65' : ''}`}>
          <CourseTable courses={coursesQuery.data?.items ?? []} isLoading={coursesQuery.isPending} onManageOptions={setCourseToManage} />
        </div>
      )}
      {coursesQuery.data && (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>{coursesQuery.data.pagination.total} cours</p>
          <PaginationControls page={coursesQuery.data.pagination.page} totalPages={coursesQuery.data.pagination.total_pages} onPageChange={setPage} />
        </div>
      )}
      {currentOrganization && selectedYear && <CreateCourseDialog key={`${organizationId}-${selectedYear.id}`} open={createOpen} organizationId={organizationId} academicYearId={selectedYear.id} academicYearLabel={selectedYear.label} onOpenChange={setCreateOpen} />}
      {currentOrganization && selectedYear && courseToManage && <ManageCourseOptionsDialog key={`${courseToManage.id}-${selectedYear.id}`} course={courseToManage} organizationId={organizationId} academicYearId={selectedYear.id} academicYearLabel={selectedYear.label} onClose={() => setCourseToManage(null)} />}
    </div>
  )
}
