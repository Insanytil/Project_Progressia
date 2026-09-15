import { Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { SchoolClassMember } from '../model/class.types'

export function ClassMembersDropdown({
  members,
  label,
}: {
  members: SchoolClassMember[]
  label: string
}) {
  if (members.length === 0) return <span className="text-muted-foreground">Aucun</span>

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <Users />{members.length}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          {members.map((member) => (
            <DropdownMenuItem key={member.id}>{member.email}</DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
