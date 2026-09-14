import { Building2, Users } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { OrganizationManagement } from './organization-management'
import { PlatformUserManagement } from './platform-user-management'

export function PlatformAdministrationTabs() {
  return (
    <Tabs defaultValue="organizations" className="min-h-0 flex-1 gap-5 overflow-hidden">
      <TabsList variant="line" className="h-10 shrink-0">
        <TabsTrigger value="organizations" className="px-3">
          <Building2 />
          Organisations
        </TabsTrigger>
        <TabsTrigger value="users" className="px-3">
          <Users />
          Utilisateurs
        </TabsTrigger>
      </TabsList>
      <TabsContent value="organizations" className="min-h-0 overflow-hidden">
        <OrganizationManagement />
      </TabsContent>
      <TabsContent value="users" className="min-h-0 overflow-hidden">
        <PlatformUserManagement />
      </TabsContent>
    </Tabs>
  )
}
