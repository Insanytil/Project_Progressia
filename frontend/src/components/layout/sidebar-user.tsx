import { useNavigate } from '@tanstack/react-router'
import { ChevronsUpDown, LoaderCircle, LogOut, Settings } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
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
  const { isMobile, setOpenMobile } = useSidebar()

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
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<SidebarMenuButton size="lg" tooltip="Mon compte" />}
            >
              <Avatar className="size-8 ring-2 ring-sidebar-border">
                <AvatarFallback className="bg-secondary text-xs font-semibold text-primary">
                  {user ? getInitials(user.email) : 'PR'}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-sm font-medium">Mon compte</span>
                <span className="block truncate text-xs text-sidebar-foreground/60">
                  {user?.email}
                </span>
              </span>
              <ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side={isMobile ? 'top' : 'right'}
              align="end"
              className="min-w-64"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <span className="block truncate font-medium">Mon compte</span>
                  <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => {
                    setOpenMobile(false)
                    void navigate({ to: '/settings' })
                  }}
                >
                  <Settings />
                  Paramètres
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  disabled={logoutMutation.isPending}
                  variant="destructive"
                  onClick={() => void handleLogout()}
                >
                  {logoutMutation.isPending
                    ? <LoaderCircle className="animate-spin" />
                    : <LogOut />}
                  {logoutMutation.isPending ? 'Déconnexion…' : 'Se déconnecter'}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
