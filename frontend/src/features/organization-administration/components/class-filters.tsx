import { CalendarDays, RotateCcw, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function ClassFilters(props: {
  search: string
  academicYear: string
  currentAcademicYear: string
  pageSize: number
  academicYears: string[]
  academicYearsLoading: boolean
  onSearchChange: (value: string) => void
  onAcademicYearChange: (value: string) => void
  onPageSizeChange: (value: number) => void
  onResetAcademicYear: () => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={props.search} onChange={(event) => props.onSearchChange(event.target.value)} placeholder="Rechercher une classe…" className="h-9 pl-9" />
      </div>
      <Select value={props.academicYear || 'all'} onValueChange={(value) => props.onAcademicYearChange(value === 'all' ? '' : String(value))}>
        <SelectTrigger className="h-9 w-52">
          <CalendarDays className="text-muted-foreground" />
          <SelectValue>
            {props.academicYear || (props.academicYearsLoading ? 'Chargement…' : 'Aucune année')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {props.academicYears.length === 0 && (
            <SelectItem value="all">Aucune année disponible</SelectItem>
          )}
          {props.academicYears.map((academicYear) => (
            <SelectItem key={academicYear} value={academicYear}>{academicYear}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {props.academicYear && props.academicYear !== props.currentAcademicYear && (
        <Button type="button" variant="outline" size="sm" className="h-9" onClick={props.onResetAcademicYear}>
          <RotateCcw />Revenir à {props.currentAcademicYear}
        </Button>
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
