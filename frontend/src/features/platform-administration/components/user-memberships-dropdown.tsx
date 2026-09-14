import { Building2, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { OrganizationRole, UserMembership } from '../model/user.types'

const roleLabels: Record<OrganizationRole, string> = {
  organization_admin: 'Administrateur',
  teacher: 'Enseignant',
  student: 'Étudiant',
}

type UserMembershipsDropdownProps = {
  memberships: UserMembership[]
  disabled: boolean
  onToggleAccess: (membership: UserMembership) => void
}

export function UserMembershipsDropdown({
  memberships,
  disabled,
  onToggleAccess,
}: UserMembershipsDropdownProps) {
  if (memberships.length === 0) return <span className="text-muted-foreground">Aucune</span>

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <Building2 />
        {memberships.length} organisation{memberships.length > 1 ? 's' : ''}
        <ChevronDown />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Accès aux organisations</DropdownMenuLabel>
          {memberships.map((membership) => (
            <DropdownMenuCheckboxItem
              key={membership.organization_id}
              checked={membership.is_active}
              disabled={disabled}
              onCheckedChange={() => onToggleAccess(membership)}
              className="items-start py-2"
            >
              <span className="grid gap-0.5">
                <span className="font-medium">{membership.organization_name}</span>
                <span className="text-xs text-muted-foreground">
                  {roleLabels[membership.role]} · {membership.is_active ? 'Accès actif' : 'Accès suspendu'}
                </span>
              </span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
