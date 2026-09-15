import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { PaginationControls } from '@/components/data-display/pagination-controls'
import { useAcademicYearContext } from '@/features/academic-year-context'
import { useOrganizationContext } from '@/features/organization-context'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

import { schoolClassesQueryOptions } from '../queries/class-queries'
import type { SchoolClass } from '../model/class.types'
import { ClassFilters } from './class-filters'
import { ClassTable } from './class-table'
import { CreateClassDialog } from './create-class-dialog'
import { ManageClassMembersDialog } from './manage-class-members-dialog'

export function ClassManagement() {
  const { currentOrganization } = useOrganizationContext()
  const {
    academicYears,
    currentAcademicYear,
    isLoading: academicYearsLoading,
  } = useAcademicYearContext()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchInput, setSearchInput] = useState('')
  const [localAcademicYearFilter, setLocalAcademicYearFilter] = useState<{
    organizationId: string
    contextAcademicYearId: string | null
    label: string
  } | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [classToManage, setClassToManage] = useState<SchoolClass | null>(null)
  const search = useDebouncedValue(searchInput.trim())
  const organizationId = currentOrganization?.id ?? ''
  const contextAcademicYearId = currentAcademicYear?.id ?? null
  const academicYearFilter = (
    localAcademicYearFilter?.organizationId === organizationId
    && localAcademicYearFilter.contextAcademicYearId === contextAcademicYearId
  )
    ? localAcademicYearFilter.label
    : currentAcademicYear?.label ?? ''
  const params = useMemo(() => ({
    page,
    pageSize,
    search: search || undefined,
    academicYear: academicYearFilter || undefined,
  }), [academicYearFilter, page, pageSize, search])
  const classesQuery = useQuery({
    ...schoolClassesQueryOptions(organizationId, params),
    enabled: Boolean(currentOrganization) && !academicYearsLoading,
  })

  useEffect(() => {
    setPage(1)
    setClassToManage(null)
  }, [academicYearFilter, currentOrganization?.id, search])

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="text-xl font-semibold tracking-tight">Classes</h2><p className="mt-1 text-sm text-muted-foreground">Gérez les classes, leurs titulaires et leurs élèves.</p></div>
        <Button onClick={() => setCreateDialogOpen(true)}><Plus />Nouvelle classe</Button>
      </div>
      <ClassFilters
        search={searchInput}
        academicYear={academicYearFilter}
        currentAcademicYear={currentAcademicYear?.label ?? ''}
        pageSize={pageSize}
        academicYears={academicYears.map((academicYear) => academicYear.label)}
        academicYearsLoading={academicYearsLoading}
        onSearchChange={setSearchInput}
        onAcademicYearChange={(label) => setLocalAcademicYearFilter({
          organizationId,
          contextAcademicYearId,
          label,
        })}
        onResetAcademicYear={() => setLocalAcademicYearFilter(null)}
        onPageSizeChange={(value) => { setPage(1); setPageSize(value) }}
      />
      {classesQuery.isError ? (
        <Alert variant="destructive"><AlertTitle>Chargement impossible</AlertTitle><AlertDescription>Les classes n’ont pas pu être récupérées.</AlertDescription></Alert>
      ) : (
        <div className={`min-h-0 flex-1 ${classesQuery.isFetching && !classesQuery.isPending ? 'opacity-65' : ''}`}>
          <ClassTable classes={classesQuery.data?.items ?? []} isLoading={classesQuery.isPending} onManageMembers={setClassToManage} />
        </div>
      )}
      {classesQuery.data && (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>{classesQuery.data.pagination.total} classe{classesQuery.data.pagination.total > 1 ? 's' : ''}</p>
          <PaginationControls page={classesQuery.data.pagination.page} totalPages={classesQuery.data.pagination.total_pages} onPageChange={setPage} />
        </div>
      )}
      {currentOrganization && <CreateClassDialog key={`${currentOrganization.id}-${currentAcademicYear?.id ?? 'default'}`} open={createDialogOpen} organizationId={currentOrganization.id} defaultAcademicYear={currentAcademicYear ? { startYear: currentAcademicYear.start_year, endYear: currentAcademicYear.end_year } : undefined} onOpenChange={setCreateDialogOpen} />}
      {currentOrganization && classToManage && <ManageClassMembersDialog key={classToManage.id} schoolClass={classToManage} organizationId={currentOrganization.id} onClose={() => setClassToManage(null)} />}
    </div>
  )
}
