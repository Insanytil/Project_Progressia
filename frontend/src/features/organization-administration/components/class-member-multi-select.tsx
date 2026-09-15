import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronsUpDown, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

import type { AssignableClassRole, SchoolClassMemberOption } from '../model/class.types'
import { schoolClassMemberOptionsQueryOptions } from '../queries/class-queries'

type ClassMemberMultiSelectProps = {
  organizationId: string
  role: AssignableClassRole
  value: SchoolClassMemberOption[]
  onChange: (value: SchoolClassMemberOption[]) => void
  placeholder: string
  enabled?: boolean
  academicYear?: string
  schoolClassId?: string
}

export function ClassMemberMultiSelect(props: ClassMemberMultiSelectProps) {
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput.trim())
  const query = useQuery({
    ...schoolClassMemberOptionsQueryOptions(
      props.organizationId,
      props.role,
      search,
      props.academicYear,
      props.schoolClassId,
    ),
    enabled: props.enabled ?? true,
  })
  const selectedIds = new Set(props.value.map((member) => member.id))

  function toggle(member: SchoolClassMemberOption) {
    props.onChange(
      selectedIds.has(member.id)
        ? props.value.filter((candidate) => candidate.id !== member.id)
        : [...props.value, member],
    )
  }

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger render={<Button type="button" variant="outline" className="w-full justify-between font-normal" />}>
          <span className={props.value.length === 0 ? 'text-muted-foreground' : ''}>
            {props.value.length > 0
              ? `${props.value.length} sélectionné${props.value.length > 1 ? 's' : ''}`
              : props.placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 opacity-50" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--anchor-width) p-0">
          <Command shouldFilter={false}>
            <CommandInput value={searchInput} onValueChange={setSearchInput} placeholder="Rechercher par e-mail…" />
            <CommandList>
              <CommandEmpty>
                {query.isPending
                  ? 'Chargement…'
                  : query.isError
                    ? 'Chargement impossible.'
                    : 'Aucun membre disponible.'}
              </CommandEmpty>
              <CommandGroup>
                {(query.data?.items ?? []).map((member) => {
                  const selected = selectedIds.has(member.id)
                  return (
                    <CommandItem key={member.id} value={member.id} data-checked={selected} onSelect={() => toggle(member)}>
                      <span className="truncate">{member.email}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              {(query.data?.pagination.total ?? 0) > 100 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">Affinez la recherche pour afficher d’autres membres.</p>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {props.value.length > 0 && (
        <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
          {props.value.map((member) => (
            <Badge key={member.id} variant="secondary" className="gap-1 pl-2">
              <span className="max-w-52 truncate">{member.email}</span>
              <button type="button" className="rounded-sm outline-none hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring" onClick={() => toggle(member)} aria-label={`Retirer ${member.email}`}>
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
