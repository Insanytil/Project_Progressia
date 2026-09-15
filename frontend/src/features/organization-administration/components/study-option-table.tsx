import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import type { StudyOption, StudyOptionPathway } from '../model/study-option.types'
import { StudyOptionActions } from './study-option-actions'
import { StudyOptionCoursesDropdown } from './study-option-courses-dropdown'
import { StudyOptionPathwaysDropdown } from './study-option-pathways-dropdown'

export function StudyOptionTable(props: { items: StudyOption[]; isLoading: boolean; onManage: (item: StudyOption) => void; onManagePathways: (item: StudyOption) => void; onEditPathway: (studyOption: StudyOption, pathway: StudyOptionPathway) => void }) {
  return (
    <div className="h-full overflow-auto rounded-xl border bg-card [&>[data-slot=table-container]]:overflow-visible">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted"><TableRow><TableHead className="pl-4">Option</TableHead><TableHead>Tronc commun</TableHead><TableHead>Parcours</TableHead><TableHead>Total commun</TableHead><TableHead className="w-12"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
        <TableBody>
          {props.isLoading && Array.from({ length: 6 }).map((_, index) => <TableRow key={index}>{Array.from({ length: 5 }).map((__, cell) => <TableCell key={cell}><Skeleton className="h-5 w-28" /></TableCell>)}</TableRow>)}
          {!props.isLoading && props.items.length === 0 && <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Aucune option ne correspond aux filtres.</TableCell></TableRow>}
          {!props.isLoading && props.items.map((item, index) => (
            <TableRow key={item.id} className={index % 2 === 1 ? 'bg-muted/60 hover:bg-primary/15' : 'hover:bg-primary/10'}>
              <TableCell className="pl-4 font-medium">{item.name}</TableCell>
              <TableCell><StudyOptionCoursesDropdown courses={item.courses} /></TableCell>
              <TableCell><StudyOptionPathwaysDropdown pathways={item.pathways} commonWeeklyHours={item.total_weekly_hours} onEdit={(pathway) => props.onEditPathway(item, pathway)} /></TableCell>
              <TableCell className="whitespace-nowrap font-medium">{item.total_weekly_hours} h / semaine</TableCell>
              <TableCell><StudyOptionActions studyOption={item} onManage={props.onManage} onManagePathways={props.onManagePathways} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
