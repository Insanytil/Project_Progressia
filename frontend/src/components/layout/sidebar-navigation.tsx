import { Link, useMatchRoute } from '@tanstack/react-router'
import { Building2, LayoutDashboard, ListTodo, ShieldCheck } from 'lucide-react'

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
            <>
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
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/jobs" onClick={() => setOpenMobile(false)} />}
                  isActive={Boolean(matchRoute({ to: '/jobs', fuzzy: true }))}
                  tooltip="Jobs"
                  className="h-10 data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
                >
                  <ListTodo />
                  <span>Jobs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          ) : currentOrganization ? (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/dashboard" onClick={() => setOpenMobile(false)} />}
                  isActive={Boolean(matchRoute({ to: '/dashboard', fuzzy: true }))}
                  tooltip="Tableau de bord"
                  className="h-10 data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
                >
                  <LayoutDashboard />
                  <span>Tableau de bord</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {currentOrganization.role === 'organization_admin' && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link to="/administration" onClick={() => setOpenMobile(false)} />}
                      isActive={Boolean(matchRoute({ to: '/administration', fuzzy: true }))}
                      tooltip="Administration"
                      className="h-10 data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
                    >
                      <ShieldCheck />
                      <span>Administration</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link to="/jobs" onClick={() => setOpenMobile(false)} />}
                      isActive={Boolean(matchRoute({ to: '/jobs', fuzzy: true }))}
                      tooltip="Jobs"
                      className="h-10 data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
                    >
                      <ListTodo />
                      <span>Jobs</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </>
          ) : null}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
