import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'

import { ProgressiaLogo } from '@/components/brand/progressia-logo'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { currentUserQueryOptions } from '@/features/auth'

import { SidebarNavigation } from './sidebar-navigation'
import { SidebarUser } from './sidebar-user'

export function AppSidebar() {
  const { data: user } = useQuery(currentUserQueryOptions)
  const params = useParams({ strict: false }) as { organizationSlug?: string }
  const currentOrganization = user?.organizations.find(
    (organization) => organization.slug === params.organizationSlug,
  )

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-3 group-data-[collapsible=icon]:p-2">
        <ProgressiaLogo compactOnSidebarCollapse />
        {currentOrganization && (
          <p className="truncate px-1 text-xs font-medium text-sidebar-foreground/65 group-data-[collapsible=icon]:hidden">
            {currentOrganization.name}
          </p>
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
