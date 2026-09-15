import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import type { Course } from '../model/course.types'
import { CourseActions } from './course-actions'

export function CourseTable(props: {
  courses: Course[]
  isLoading: boolean
  onManageOptions: (course: Course) => void
}) {
  return (
    <div className="h-full overflow-auto rounded-xl border bg-card [&>[data-slot=table-container]]:overflow-visible">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted">
          <TableRow>
            <TableHead className="pl-4">Cours</TableHead>
            <TableHead>Horaires pour l’année consultée</TableHead>
            <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.isLoading && Array.from({ length: 6 }).map((_, index) => (
            <TableRow key={index}>{Array.from({ length: 3 }).map((__, cell) => <TableCell key={cell}><Skeleton className="h-5 w-28" /></TableCell>)}</TableRow>
          ))}
          {!props.isLoading && props.courses.length === 0 && (
            <TableRow><TableCell colSpan={3} className="h-32 text-center text-muted-foreground">Aucun cours ne correspond aux filtres.</TableCell></TableRow>
          )}
          {!props.isLoading && props.courses.map((course, index) => (
            <TableRow key={course.id} className={index % 2 === 1 ? 'bg-muted/60 hover:bg-primary/15' : 'hover:bg-primary/10'}>
              <TableCell className="pl-4 font-medium">{course.name}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1.5">
                  {course.options.length > 0
                    ? course.options.map((option) => <Badge key={option.id} variant="secondary">{option.weekly_hours} h / semaine</Badge>)
                    : <span className="text-sm text-muted-foreground">Aucun horaire</span>}
                </div>
              </TableCell>
              <TableCell><CourseActions course={course} onManageOptions={props.onManageOptions} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
