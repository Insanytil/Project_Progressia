import { BookOpen } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import type { StudyOptionCourse } from '../model/study-option.types'

export function StudyOptionCoursesDropdown({ courses }: { courses: StudyOptionCourse[] }) {
  if (courses.length === 0) return <span className="text-muted-foreground">Aucun</span>
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}><BookOpen />{courses.length}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Cours du tronc commun</DropdownMenuLabel>
          {courses.map((course) => <DropdownMenuItem key={course.course_id}>{course.course_name}<span className="ml-auto text-muted-foreground">{course.weekly_hours} h</span></DropdownMenuItem>)}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
