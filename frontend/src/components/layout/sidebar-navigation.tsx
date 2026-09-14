import { Link, useMatchRoute } from '@tanstack/react-router'
import { LayoutDashboard } from 'lucide-react'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

const navigationItems = [
  {
    label: 'Tableau de bord',
    to: '/dashboard' as const,
    icon: LayoutDashboard,
  },
]

export function SidebarNavigation() {
  const matchRoute = useMatchRoute()
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton
                render={<Link to={item.to} onClick={() => setOpenMobile(false)} />}
                isActive={Boolean(matchRoute({ to: item.to, fuzzy: true }))}
                tooltip={item.label}
                className="h-10 data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
