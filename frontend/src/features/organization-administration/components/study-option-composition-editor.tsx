import { useQuery } from '@tanstack/react-query'
import { ChevronsUpDown, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { studyOptionCourseChoicesQueryOptions } from '../queries/study-option-queries'

export type StudyOptionCourseDraft = {
  courseId: string
  courseName: string
  courseOptionId: string
  weeklyHours: number
}

export function StudyOptionCompositionEditor(props: {
  organizationId: string
  academicYearId: string
  value: StudyOptionCourseDraft[]
  onChange: (value: StudyOptionCourseDraft[]) => void
  excludedCourseIds?: string[]
}) {
  const query = useQuery(studyOptionCourseChoicesQueryOptions(
    props.organizationId,
    props.academicYearId,
  ))
  const courses = query.data?.items ?? []
  const selectedIds = new Set([
    ...props.value.map((item) => item.courseId),
    ...(props.excludedCourseIds ?? []),
  ])
  const available = courses.filter((course) => course.options.length > 0 && !selectedIds.has(course.id))

  return (
    <div className="space-y-3">
      {props.value.map((item) => {
        const course = courses.find((candidate) => candidate.id === item.courseId)
        const hourChoices = course?.options ?? [{ id: item.courseOptionId, weekly_hours: item.weeklyHours }]
        return (
          <div key={item.courseId} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_11rem_auto] sm:items-center">
            <span className="truncate text-sm font-medium">{item.courseName}</span>
            <Select value={item.courseOptionId} onValueChange={(value) => {
              const selected = hourChoices.find((option) => option.id === String(value))
              if (!selected) return
              props.onChange(props.value.map((candidate) => candidate.courseId === item.courseId
                ? { ...candidate, courseOptionId: selected.id, weeklyHours: selected.weekly_hours }
                : candidate))
            }}>
              <SelectTrigger className="w-full"><SelectValue>{item.weeklyHours} h / semaine</SelectValue></SelectTrigger>
              <SelectContent>{hourChoices.map((option) => <SelectItem key={option.id} value={option.id}>{option.weekly_hours} h / semaine</SelectItem>)}</SelectContent>
            </Select>
            <Button type="button" variant="ghost" size="icon" onClick={() => props.onChange(props.value.filter((candidate) => candidate.courseId !== item.courseId))}>
              <Trash2 /><span className="sr-only">Retirer {item.courseName}</span>
            </Button>
          </div>
        )
      })}
      <Popover>
        <PopoverTrigger render={<Button type="button" variant="outline" size="sm" disabled={available.length === 0} />}>
          <Plus />Ajouter un cours<ChevronsUpDown className="ml-1" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0">
          <Command>
            <CommandInput placeholder="Rechercher un cours…" />
            <CommandList>
              <CommandEmpty>Aucun cours avec un horaire disponible.</CommandEmpty>
              <CommandGroup>
                {available.map((course) => (
                  <CommandItem key={course.id} value={course.name} onSelect={() => {
                    const option = course.options[0]
                    if (!option) return
                    props.onChange([...props.value, {
                      courseId: course.id,
                      courseName: course.name,
                      courseOptionId: option.id,
                      weeklyHours: option.weekly_hours,
                    }])
                  }}>
                    {course.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {props.value.length > 0 && (
        <p className="text-sm font-medium">Total : {props.value.reduce((total, item) => total + Number(item.weeklyHours), 0)} h / semaine</p>
      )}
    </div>
  )
}
