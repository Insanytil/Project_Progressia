import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import type { SchoolClass } from '../model/class.types'
import { ClassActions } from './class-actions'
import { ClassMembersDropdown } from './class-members-dropdown'

export function ClassTable({ classes, isLoading, onManageMembers }: {
  classes: SchoolClass[]
  isLoading: boolean
  onManageMembers: (schoolClass: SchoolClass) => void
}) {
  return (
    <div className="h-full overflow-auto rounded-xl border bg-card [&>[data-slot=table-container]]:overflow-visible">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted">
          <TableRow>
            <TableHead className="pl-4">Classe</TableHead>
            <TableHead>Année scolaire</TableHead>
            <TableHead>Professeurs titulaires</TableHead>
            <TableHead>Élèves</TableHead>
            <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && Array.from({ length: 6 }).map((_, index) => (
            <TableRow key={index}>{Array.from({ length: 5 }).map((__, cell) => <TableCell key={cell}><Skeleton className="h-5 w-24" /></TableCell>)}</TableRow>
          ))}
          {!isLoading && classes.length === 0 && (
            <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Aucune classe ne correspond aux filtres.</TableCell></TableRow>
          )}
          {!isLoading && classes.map((schoolClass, index) => (
            <TableRow key={schoolClass.id} className={index % 2 === 1 ? 'bg-muted/60 hover:bg-primary/15' : 'hover:bg-primary/10'}>
              <TableCell className="pl-4 font-medium">{schoolClass.name}</TableCell>
              <TableCell>{schoolClass.academic_year}</TableCell>
              <TableCell><ClassMembersDropdown members={schoolClass.teachers} label="Professeurs titulaires" /></TableCell>
              <TableCell><ClassMembersDropdown members={schoolClass.students} label="Élèves" /></TableCell>
              <TableCell><ClassActions schoolClass={schoolClass} onManageMembers={onManageMembers} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
