import { KeyRound, MoreHorizontal, Settings2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { OrganizationMember } from '../model/member.types'

type MemberActionsProps = {
  member: OrganizationMember
  isPending: boolean
  onManage: () => void
  onPasswordReset: () => void
}

export function MemberActions({ member, isPending, onManage, onPasswordReset }: MemberActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <MoreHorizontal />
        <span className="sr-only">Actions pour {member.email}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem disabled={isPending} onClick={onManage}>
            <Settings2 />Modifier le rôle et l’accès
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!member.is_verified || isPending}
            onClick={onPasswordReset}
          >
            <KeyRound />Réinitialiser le mot de passe
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
