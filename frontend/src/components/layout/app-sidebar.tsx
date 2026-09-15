import { useQuery } from '@tanstack/react-query'

import { ProgressiaLogo } from '@/components/brand/progressia-logo'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { currentUserQueryOptions } from '@/features/auth'
import { useOrganizationContext } from '@/features/organization-context'

import { OrganizationSwitcher } from './organization-switcher'
import { SidebarNavigation } from './sidebar-navigation'
import { SidebarUser } from './sidebar-user'

export function AppSidebar() {
  const { data: user } = useQuery(currentUserQueryOptions)
  const { currentOrganization } = useOrganizationContext()

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-3 group-data-[collapsible=icon]:p-2">
        <ProgressiaLogo compactOnSidebarCollapse />
        {user && !user.is_superuser && (
          <OrganizationSwitcher />
        )}
      </SidebarHeader>
      <SidebarContent className="py-2">
        <SidebarNavigation user={user} currentOrganization={currentOrganization} />
      </SidebarContent>
      <SidebarUser user={user} />
      <SidebarRail />
    </Sidebar>
  )
}
