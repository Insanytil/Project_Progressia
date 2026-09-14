import { ProgressiaLogo } from '@/components/brand/progressia-logo'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'

import { SidebarNavigation } from './sidebar-navigation'
import { SidebarUser } from './sidebar-user'

export function AppSidebar() {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-3 group-data-[collapsible=icon]:p-2">
        <ProgressiaLogo compactOnSidebarCollapse />
      </SidebarHeader>
      <SidebarContent className="py-2">
        <SidebarNavigation />
      </SidebarContent>
      <SidebarUser />
      <SidebarRail />
    </Sidebar>
  )
}
