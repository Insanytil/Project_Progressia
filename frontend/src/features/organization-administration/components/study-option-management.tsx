import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { PaginationControls } from '@/components/data-display/pagination-controls'
import { useAcademicYearContext } from '@/features/academic-year-context'
import { useOrganizationContext } from '@/features/organization-context'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

import type { StudyOption, StudyOptionPathway } from '../model/study-option.types'
import { studyOptionsQueryOptions } from '../queries/study-option-queries'
import { CourseFilters } from './course-filters'
import { CreateStudyOptionDialog } from './create-study-option-dialog'
import { ManageStudyOptionDialog } from './manage-study-option-dialog'
import { ManageStudyOptionPathwaysDialog } from './manage-study-option-pathways-dialog'
import { StudyOptionTable } from './study-option-table'
import { EditStudyOptionPathwayDialog } from './edit-study-option-pathway-dialog'

export function StudyOptionManagement() {
  const { currentOrganization } = useOrganizationContext()
  const { academicYears, currentAcademicYear, isLoading: yearsLoading } = useAcademicYearContext()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchInput, setSearchInput] = useState('')
  const [localYear, setLocalYear] = useState<{ organizationId: string; contextYearId: string; selectedYearId: string } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [itemToManage, setItemToManage] = useState<StudyOption | null>(null)
  const [itemToManagePathways, setItemToManagePathways] = useState<StudyOption | null>(null)
  const [pathwayToEdit, setPathwayToEdit] = useState<{ studyOption: StudyOption; pathway: StudyOptionPathway } | null>(null)
  const search = useDebouncedValue(searchInput.trim())
  const organizationId = currentOrganization?.id ?? ''
  const contextYearId = currentAcademicYear?.id ?? ''
  const selectedYearId = localYear?.organizationId === organizationId && localYear.contextYearId === contextYearId ? localYear.selectedYearId : contextYearId
  const selectedYear = academicYears.find((year) => year.id === selectedYearId)
  const params = useMemo(() => ({ page, pageSize, academicYearId: selectedYearId, search: search || undefined }), [page, pageSize, search, selectedYearId])
  const query = useQuery({ ...studyOptionsQueryOptions(organizationId, params), enabled: Boolean(organizationId) && Boolean(selectedYearId) && !yearsLoading })

  useEffect(() => { setPage(1); setItemToManage(null); setItemToManagePathways(null); setPathwayToEdit(null) }, [organizationId, search, selectedYearId])

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-semibold tracking-tight">Options</h2><p className="mt-1 text-sm text-muted-foreground">Composez les parcours de l’organisation à partir des horaires de cours.</p></div><Button disabled={!selectedYear} onClick={() => setCreateOpen(true)}><Plus />Nouvelle option</Button></div>
      <CourseFilters search={searchInput} searchPlaceholder="Rechercher une option…" academicYearId={selectedYearId} currentAcademicYearId={contextYearId} academicYears={academicYears} pageSize={pageSize} onSearchChange={setSearchInput} onAcademicYearChange={(yearId) => setLocalYear({ organizationId, contextYearId, selectedYearId: yearId })} onResetAcademicYear={() => setLocalYear(null)} onPageSizeChange={(value) => { setPage(1); setPageSize(value) }} />
      {!yearsLoading && !selectedYear ? <Alert><AlertTitle>Aucune année scolaire</AlertTitle><AlertDescription>Créez d’abord une année scolaire.</AlertDescription></Alert> : query.isError ? <Alert variant="destructive"><AlertTitle>Chargement impossible</AlertTitle><AlertDescription>Les options n’ont pas pu être récupérées.</AlertDescription></Alert> : <div className={`min-h-0 flex-1 ${query.isFetching && !query.isPending ? 'opacity-65' : ''}`}><StudyOptionTable items={query.data?.items ?? []} isLoading={query.isPending} onManage={setItemToManage} onManagePathways={setItemToManagePathways} onEditPathway={(studyOption, pathway) => setPathwayToEdit({ studyOption, pathway })} /></div>}
      {query.data && <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground"><p>{query.data.pagination.total} option{query.data.pagination.total > 1 ? 's' : ''}</p><PaginationControls page={query.data.pagination.page} totalPages={query.data.pagination.total_pages} onPageChange={setPage} /></div>}
      {currentOrganization && selectedYear && <CreateStudyOptionDialog key={`${organizationId}-${selectedYear.id}`} open={createOpen} organizationId={organizationId} academicYearId={selectedYear.id} academicYearLabel={selectedYear.label} onOpenChange={setCreateOpen} />}
      {currentOrganization && selectedYear && itemToManage && <ManageStudyOptionDialog key={itemToManage.id} studyOption={itemToManage} organizationId={organizationId} academicYearLabel={selectedYear.label} onClose={() => setItemToManage(null)} />}
      {currentOrganization && selectedYear && itemToManagePathways && <ManageStudyOptionPathwaysDialog key={itemToManagePathways.id} studyOption={itemToManagePathways} organizationId={organizationId} academicYearLabel={selectedYear.label} onClose={() => setItemToManagePathways(null)} />}
      {currentOrganization && selectedYear && pathwayToEdit && <EditStudyOptionPathwayDialog key={pathwayToEdit.pathway.id} studyOption={pathwayToEdit.studyOption} pathway={pathwayToEdit.pathway} organizationId={organizationId} academicYearLabel={selectedYear.label} onClose={() => setPathwayToEdit(null)} />}
    </div>
  )
}
