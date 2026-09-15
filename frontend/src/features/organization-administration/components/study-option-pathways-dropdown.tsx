import { GitBranch, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import type { StudyOptionPathway } from '../model/study-option.types'

export function StudyOptionPathwaysDropdown({ pathways, commonWeeklyHours, onEdit }: { pathways: StudyOptionPathway[]; commonWeeklyHours: number; onEdit: (pathway: StudyOptionPathway) => void }) {
  if (pathways.length === 0) return <span className="text-muted-foreground">Aucun</span>
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}><GitBranch />{pathways.length}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Parcours disponibles</DropdownMenuLabel>
          {pathways.map((pathway) => (
            <DropdownMenuSub key={pathway.id}>
              <DropdownMenuSubTrigger><span className="max-w-56 truncate">{pathway.name}</span><span className="ml-auto mr-1 text-xs text-muted-foreground">{Number(commonWeeklyHours) + Number(pathway.weekly_hours)} h</span></DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-72">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Cours propres au parcours</DropdownMenuLabel>
                  {pathway.courses.map((course) => <DropdownMenuItem key={course.course_id}>{course.course_name}<span className="ml-auto text-muted-foreground">{course.weekly_hours} h</span></DropdownMenuItem>)}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => onEdit(pathway)}><Pencil />Modifier ce parcours</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
