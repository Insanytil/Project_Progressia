import { Eye, LoaderCircle, MoreHorizontal, Pencil, Power, PowerOff, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { Organization } from '../model/organization.types'

type OrganizationActionsProps = {
  organization: Organization
  onView: (organization: Organization) => void
  onEdit: (organization: Organization) => void
  onToggleActive: (organization: Organization) => void
  onDelete: (organization: Organization) => void
  isToggling: boolean
}

export function OrganizationActions({
  organization,
  onView,
  onEdit,
  onToggleActive,
  onDelete,
  isToggling,
}: OrganizationActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <MoreHorizontal />
        <span className="sr-only">Actions pour {organization.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onView(organization)}>
            <Eye />
            Consulter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(organization)}>
            <Pencil />
            Éditer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={isToggling} onClick={() => onToggleActive(organization)}>
            {isToggling
              ? <LoaderCircle className="animate-spin" />
              : organization.is_active ? <PowerOff /> : <Power />}
            {organization.is_active ? 'Désactiver' : 'Activer'}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(organization)}>
            <Trash2 />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
