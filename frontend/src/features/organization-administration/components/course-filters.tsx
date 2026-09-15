import { CalendarDays, RotateCcw, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import type { AcademicYear } from '@/features/academic-year-context'

export function CourseFilters(props: {
  search: string
  academicYearId: string
  currentAcademicYearId: string
  academicYears: AcademicYear[]
  pageSize: number
  searchPlaceholder?: string
  onSearchChange: (value: string) => void
  onAcademicYearChange: (value: string) => void
  onResetAcademicYear: () => void
  onPageSizeChange: (value: number) => void
}) {
  const selectedYear = props.academicYears.find((year) => year.id === props.academicYearId)
  const currentYear = props.academicYears.find((year) => year.id === props.currentAcademicYearId)
  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={props.search} onChange={(event) => props.onSearchChange(event.target.value)} placeholder={props.searchPlaceholder ?? 'Rechercher un cours…'} className="h-9 pl-9" />
      </div>
      <Select value={props.academicYearId} onValueChange={(value) => props.onAcademicYearChange(String(value))}>
        <SelectTrigger className="h-9 w-52"><CalendarDays className="text-muted-foreground" /><SelectValue>{selectedYear?.label ?? 'Aucune année'}</SelectValue></SelectTrigger>
        <SelectContent>
          {props.academicYears.map((year) => <SelectItem key={year.id} value={year.id}>{year.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {props.academicYearId && props.academicYearId !== props.currentAcademicYearId && (
        <Button type="button" variant="outline" size="sm" className="h-9" onClick={props.onResetAcademicYear}><RotateCcw />Revenir à {currentYear?.label}</Button>
      )}
      <Select value={String(props.pageSize)} onValueChange={(value) => props.onPageSizeChange(Number(value))}>
        <SelectTrigger className="h-9 min-w-24"><SelectValue>{props.pageSize} / page</SelectValue></SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10 / page</SelectItem>
          <SelectItem value="20">20 / page</SelectItem>
          <SelectItem value="50">50 / page</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
