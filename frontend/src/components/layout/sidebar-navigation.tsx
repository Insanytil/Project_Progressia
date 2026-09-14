import { Link, useMatchRoute } from '@tanstack/react-router'
import { Building2, LayoutDashboard, RefreshCw } from 'lucide-react'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import type { AuthenticatedOrganization, AuthenticatedUser } from '@/features/auth'

type SidebarNavigationProps = {
  user?: AuthenticatedUser
  currentOrganization?: AuthenticatedOrganization
}

export function SidebarNavigation({ user, currentOrganization }: SidebarNavigationProps) {
  const matchRoute = useMatchRoute()
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {user?.is_superuser ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link to="/platformAdministration" onClick={() => setOpenMobile(false)} />}
                isActive={Boolean(matchRoute({ to: '/platformAdministration', fuzzy: true }))}
                tooltip="Administration"
                className="h-10 data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
              >
                <Building2 />
                <span>Administration</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : currentOrganization ? (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={(
                    <Link
                      to="/organizations/$organizationSlug/dashboard"
                      params={{ organizationSlug: currentOrganization.slug }}
                      onClick={() => setOpenMobile(false)}
                    />
                  )}
                  isActive={Boolean(matchRoute({
                    to: '/organizations/$organizationSlug/dashboard',
                    params: { organizationSlug: currentOrganization.slug },
                    fuzzy: true,
                  }))}
                  tooltip="Tableau de bord"
                  className="h-10 data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
                >
                  <LayoutDashboard />
                  <span>Tableau de bord</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {(user?.organizations.length ?? 0) > 1 && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link to="/organizations" onClick={() => setOpenMobile(false)} />}
                    tooltip="Changer d’organisation"
                  >
                    <RefreshCw />
                    <span>Changer d’organisation</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link to="/organizations" onClick={() => setOpenMobile(false)} />}
                isActive={Boolean(matchRoute({ to: '/organizations', fuzzy: true }))}
                tooltip="Choisir une organisation"
              >
                <Building2 />
                <span>Choisir une organisation</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
