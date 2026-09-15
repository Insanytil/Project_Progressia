import { ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import type { Course } from '../model/course.types'

export function CourseAuthorizationMultiSelect(props: { courses: Course[]; value: string[]; onChange: (value: string[]) => void }) {
  const selected = new Set(props.value)
  return (
    <Popover>
      <PopoverTrigger render={<Button type="button" variant="outline" className="w-full justify-between font-normal" />}>
        {props.value.length === 0 ? 'Sélectionner les cours…' : `${props.value.length} cours autorisé${props.value.length > 1 ? 's' : ''}`}
        <ChevronsUpDown className="opacity-60" />
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un cours…" />
          <CommandList>
            <CommandEmpty>Aucun cours disponible pour cette année.</CommandEmpty>
            <CommandGroup>
              {props.courses.map((course) => (
                <CommandItem key={course.id} value={course.name} data-checked={selected.has(course.id)} onSelect={() => props.onChange(selected.has(course.id) ? props.value.filter((id) => id !== course.id) : [...props.value, course.id])}>
                  {course.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
