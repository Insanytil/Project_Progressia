import type { ReactNode } from 'react'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AcademicYearProvider } from '@/features/academic-year-context'
import { OrganizationProvider } from '@/features/organization-context'

import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <OrganizationProvider>
      <AcademicYearProvider>
        <TooltipProvider>
          <SidebarProvider className="h-svh min-h-0 overflow-hidden">
            <AppSidebar />
            <SidebarInset className="min-h-0 overflow-hidden">
              <AppHeader />
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </AcademicYearProvider>
    </OrganizationProvider>
  )
}
