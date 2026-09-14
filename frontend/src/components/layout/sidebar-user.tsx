import { useNavigate } from '@tanstack/react-router'
import { LoaderCircle, LogOut } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useLogoutMutation } from '@/features/auth'
import type { AuthenticatedUser } from '@/features/auth'

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase()
}

type SidebarUserProps = {
  user?: AuthenticatedUser
}

export function SidebarUser({ user }: SidebarUserProps) {
  const logoutMutation = useLogoutMutation()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync()
      await navigate({ to: '/login' })
    } catch {
      // The error remains visible in the sidebar so the user can retry.
    }
  }

  return (
    <SidebarFooter className="border-t border-sidebar-border p-2">
      <div className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <Avatar className="ring-2 ring-sidebar-border">
          <AvatarFallback className="bg-secondary font-semibold text-primary">
            {user ? getInitials(user.email) : 'PR'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
          <p className="truncate text-sm font-medium">Mon compte</p>
          <p className="truncate text-xs text-sidebar-foreground/60">{user?.email}</p>
        </div>
      </div>

      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Se déconnecter"
            disabled={logoutMutation.isPending}
            onClick={() => void handleLogout()}
            className="h-9 text-sidebar-foreground/75 hover:text-destructive"
          >
            {logoutMutation.isPending ? <LoaderCircle className="animate-spin" /> : <LogOut />}
            <span>{logoutMutation.isPending ? 'Déconnexion…' : 'Se déconnecter'}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      {logoutMutation.isError && (
        <p role="alert" className="px-2 pb-1 text-xs text-destructive group-data-[collapsible=icon]:hidden">
          La déconnexion a échoué. Réessayez.
        </p>
      )}
    </SidebarFooter>
  )
}
