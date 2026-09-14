import { KeyRound, LoaderCircle, MailCheck, MoreHorizontal, Power, PowerOff, UserPlus } from 'lucide-react'

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

import type { PlatformUser } from '../model/user.types'

type PlatformUserActionsProps = {
  user: PlatformUser
  isPending: boolean
  onResendVerification: (user: PlatformUser) => void
  onSendPasswordReset: (user: PlatformUser) => void
  onToggleActive: (user: PlatformUser) => void
  onAddToOrganization: (user: PlatformUser) => void
}

export function PlatformUserActions({
  user,
  isPending,
  onResendVerification,
  onSendPasswordReset,
  onToggleActive,
  onAddToOrganization,
}: PlatformUserActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <MoreHorizontal />
        <span className="sr-only">Actions pour {user.email}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem disabled={isPending} onClick={() => onAddToOrganization(user)}>
            <UserPlus />
            Ajouter à une organisation
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={user.is_verified || isPending}
            onClick={() => onResendVerification(user)}
          >
            <MailCheck />
            Renvoyer la vérification
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!user.is_verified || isPending}
            onClick={() => onSendPasswordReset(user)}
          >
            <KeyRound />
            Réinitialiser le mot de passe
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={isPending} onClick={() => onToggleActive(user)}>
            {isPending
              ? <LoaderCircle className="animate-spin" />
              : user.is_active ? <PowerOff /> : <Power />}
            {user.is_active ? 'Désactiver le compte' : 'Activer le compte'}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
